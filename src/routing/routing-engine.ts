/**
 * Routing Engine
 *
 * Registers an `optimize_route` tool that:
 *   1. Calls Google Maps Distance Matrix API to get travel times
 *   2. Uses Held-Karp DP TSP for ≤ 10 stops (exact optimal)
 *   3. Falls back to nearest-neighbour greedy for larger sets
 */

import { type AgentPlugin, createTool } from "@cline/core";
import { z } from "zod";
import { getDistanceMatrix } from "../tools/google-maps.js";
import type { RouteSegment } from "../schemas/trip.js";

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

interface PlaceCoord {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
}

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Build a full N×N duration matrix via Google Maps Distance Matrix.
 * Splits into batches of 25 (API limit).
 */
async function buildDurationMatrix(
  places: PlaceCoord[],
  mode: "driving" | "walking" | "transit",
): Promise<{ durations: number[][]; distances: number[][] }> {
  const n = places.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const distances = Array.from({ length: n }, () => Array(n).fill(0));
  const coords = places.map((p) => `${p.lat},${p.lng}`);
  const BATCH = 25;
  for (let i = 0; i < n; i += BATCH) {
    const originBatch = coords.slice(i, i + BATCH);
    for (let j = 0; j < n; j += BATCH) {
      const destBatch = coords.slice(j, j + BATCH);
      const resp = await getDistanceMatrix({ origins: originBatch, destinations: destBatch, mode });
      if (resp.rows.length !== originBatch.length || resp.rows.some(row => row.elements.length !== destBatch.length)) throw new Error("Incomplete routing matrix");
      for (let oi = 0; oi < resp.rows.length; oi++) {
        for (let di = 0; di < resp.rows[oi].elements.length; di++) {
          const element = resp.rows[oi].elements[di];
          if (element.status !== "OK" || !Number.isFinite(element.duration?.value) || !Number.isFinite(element.distance?.value)) throw new Error("A route leg is unavailable");
          matrix[i + oi][j + di] = element.duration!.value;
          distances[i + oi][j + di] = element.distance!.value;
        }
      }
    }
  }
  return { durations: matrix, distances };
}

async function roadRoute(places: PlaceCoord[]) {
  const coordinates = places.map(p => `${p.lng},${p.lat}`).join(";");
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Road routing service returned HTTP ${response.status}`);
  const body: any = await response.json();
  const route = body.routes?.[0];
  if (body.code !== "Ok" || route?.legs?.length !== places.length - 1 || !route.geometry?.coordinates?.length) throw new Error("Road route unavailable for these places");
  for (const leg of route.legs) if (!Number.isFinite(leg.duration) || !Number.isFinite(leg.distance)) throw new Error("Incomplete road route");
  // A distant snap is not the requested place; report it instead of moving pins.
  if (body.waypoints?.some((point: any) => point.distance > 500)) throw new Error("A place is too far from a drivable road; refine the location");
  return route;
}

/** Held-Karp TSP solver — exact, O(n²·2ⁿ), feasible for n ≤ 12 */
export function heldKarpTsp(dist: number[][], returnToStart = false): number[] {
  const n = dist.length;
  if (n <= 1) return Array.from({ length: n }, (_, i) => i);
  const INF = Number.MAX_SAFE_INTEGER;
  const allMask = (1 << n) - 1;
  const dp: number[][] = Array.from({ length: 1 << n }, () => Array(n).fill(INF));
  const parent: number[][] = Array.from({ length: 1 << n }, () => Array(n).fill(-1));
  dp[1 << 0][0] = 0;
  for (let mask = 1; mask <= allMask; mask++) {
    for (let u = 0; u < n; u++) {
      if (!(mask & (1 << u)) || dp[mask][u] === INF) continue;
      for (let v = 0; v < n; v++) {
        if (mask & (1 << v)) continue;
        const newMask = mask | (1 << v);
        const newCost = dp[mask][u] + dist[u][v];
        if (newCost < dp[newMask][v]) {
          dp[newMask][v] = newCost;
          parent[newMask][v] = u;
        }
      }
    }
  }
  let bestCost = INF, bestEnd = 0;
  for (let u = 0; u < n; u++) {
    const cost = dp[allMask][u] + (returnToStart ? dist[u][0] : 0);
    if (cost < bestCost) { bestCost = cost; bestEnd = u; }
  }
  const path: number[] = [];
  let mask = allMask, curr = bestEnd;
  while (curr !== -1) { path.unshift(curr); const prev = parent[mask][curr]; mask ^= (1 << curr); curr = prev; }
  return path;
}

/** Nearest-neighbour fallback for n > 12 */
export function nearestNeighbourTsp(dist: number[][]): number[] {
  const n = dist.length;
  const visited = new Set<number>([0]);
  const path: number[] = [0];
  for (let step = 1; step < n; step++) {
    const last = path[path.length - 1];
    let best = -1, bestDist = Infinity;
    for (let j = 0; j < n; j++) {
      if (!visited.has(j) && dist[last][j] < bestDist) { bestDist = dist[last][j]; best = j; }
    }
    if (best === -1) break;
    path.push(best);
    visited.add(best);
  }
  return path;
}

function buildSegments(order: number[], places: PlaceCoord[], dist: number[][], distances: number[][], mode: "driving" | "walking" | "transit"): RouteSegment[] {
  const segments: RouteSegment[] = [];
  for (let i = 0; i < order.length - 1; i++) {
    const from = places[order[i]], to = places[order[i + 1]];
    const durSec = dist[order[i]][order[i + 1]];
    segments.push({
      from: { placeId: from.placeId, name: from.name, lat: from.lat, lng: from.lng },
      to: { placeId: to.placeId, name: to.name, lat: to.lat, lng: to.lng },
      distanceMeters: distances[order[i]][order[i + 1]],
      durationSeconds: durSec,
      durationText: formatSeconds(durSec),
      mode,
    });
  }
  return segments;
}

// ---------------------------------------------------------------------------
// Plugin: routing-engine
// ---------------------------------------------------------------------------

const routingEnginePlugin: AgentPlugin = {
  name: "routing-engine",
  manifest: { capabilities: ["tools"] },

  setup(api: any) {
    api.registerTool(
      createTool({
        name: "optimize_route",
        description:
          "Optimize the visit order for a set of places to minimize total travel time. " +
          "Uses Google Maps Distance Matrix + Held-Karp DP (≤10 stops) or " +
          "nearest-neighbour greedy (>10 stops). Returns optimized order and segments.",
        inputSchema: z.object({
          places: z.array(z.object({
            placeId: z.string(),
            name: z.string(),
            lat: z.number(),
            lng: z.number(),
          })).min(2).describe("Array of places to visit (min 2)"),
          returnToStart: z.boolean().optional().default(false),
          mode: z.enum(["driving", "walking", "transit"]).default("driving"),
        }),
        timeoutMs: 45_000,
        retryable: true,
        maxRetries: 1,

        async execute(input: {
          places: PlaceCoord[];
          mode?: "driving" | "walking" | "transit";
          returnToStart?: boolean;
        }) {
          const places: PlaceCoord[] = input.places;
          if (new Set(places.map(p => p.placeId)).size !== places.length) throw new Error("Route stops need unique IDs");
          const n = places.length;
          const mode = input.mode ?? "driving";
          const { durations: dist, distances } = await buildDurationMatrix(places, mode);
          const order = n <= 12 ? heldKarpTsp(dist, input.returnToStart) : nearestNeighbourTsp(dist);
          const segmentOrder = input.returnToStart ? [...order, 0] : order;
          const segments = buildSegments(segmentOrder, places, dist, distances, mode);
          const road = mode === "driving" ? await roadRoute(segmentOrder.map(index => places[index])) : undefined;
          if (road) segments.forEach((segment, index) => {
            segment.distanceMeters = road.legs[index].distance;
            segment.durationSeconds = road.legs[index].duration;
            segment.durationText = formatSeconds(segment.durationSeconds);
          });
          const originalOrder = Array.from({ length: n }, (_, i) => i);
          if (input.returnToStart) originalOrder.push(0);
          const originalTravelSeconds = originalOrder.slice(1).reduce((sum, to, i) => sum + dist[originalOrder[i]][to], 0);
          const totalSeconds = segments.reduce((sum, s) => sum + s.durationSeconds, 0);

          return {
            optimizedOrder: order.map((idx, pos) => ({
              position: pos,
              placeId: places[idx].placeId,
              name: places[idx].name,
              lat: places[idx].lat,
              lng: places[idx].lng,
            })),
            routeSegments: segments,
            routePolyline: road?.geometry.coordinates.map(([lng, lat]: number[]) => ({ lat, lng })) || segmentOrder.map(index => ({ lat: places[index].lat, lng: places[index].lng })),
            routeSource: road ? "osrm" : "matrix",
            originalTravelSeconds,
            totalTravelTime: { seconds: totalSeconds, text: formatSeconds(totalSeconds) },
            solver: n <= 12 ? "held-karp-dp" : "nearest-neighbour",
            placeCount: n,
          };
        },
      }),
    );
  },
};

export { routingEnginePlugin };
export default routingEnginePlugin;
