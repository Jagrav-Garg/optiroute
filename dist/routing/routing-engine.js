/**
 * Routing Engine
 *
 * Registers an `optimize_route` tool that:
 *   1. Calls Google Maps Distance Matrix API to get travel times
 *   2. Uses Held-Karp DP TSP for ≤ 10 stops (exact optimal)
 *   3. Falls back to nearest-neighbour greedy for larger sets
 */
import { createTool } from "@cline/core";
import { z } from "zod";
import { getDistanceMatrix } from "../tools/google-maps.js";
function formatSeconds(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
/**
 * Build a full N×N duration matrix via Google Maps Distance Matrix.
 * Splits into batches of 25 (API limit).
 */
async function buildDurationMatrix(places, mode) {
    const n = places.length;
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));
    const coords = places.map((p) => `${p.lat},${p.lng}`);
    const BATCH = 25;
    for (let i = 0; i < n; i += BATCH) {
        const originBatch = coords.slice(i, i + BATCH);
        for (let j = 0; j < n; j += BATCH) {
            const destBatch = coords.slice(j, j + BATCH);
            const resp = await getDistanceMatrix({ origins: originBatch, destinations: destBatch, mode });
            for (let oi = 0; oi < resp.rows.length; oi++) {
                for (let di = 0; di < resp.rows[oi].elements.length; di++) {
                    matrix[i + oi][j + di] = resp.rows[oi].elements[di].duration?.value ?? 99999;
                }
            }
        }
    }
    return matrix;
}
/** Held-Karp TSP solver — exact, O(n²·2ⁿ), feasible for n ≤ 12 */
export function heldKarpTsp(dist) {
    const n = dist.length;
    if (n <= 1)
        return Array.from({ length: n }, (_, i) => i);
    const INF = Number.MAX_SAFE_INTEGER;
    const allMask = (1 << n) - 1;
    const dp = Array.from({ length: 1 << n }, () => Array(n).fill(INF));
    const parent = Array.from({ length: 1 << n }, () => Array(n).fill(-1));
    dp[1 << 0][0] = 0;
    for (let mask = 1; mask <= allMask; mask++) {
        for (let u = 0; u < n; u++) {
            if (!(mask & (1 << u)) || dp[mask][u] === INF)
                continue;
            for (let v = 0; v < n; v++) {
                if (mask & (1 << v))
                    continue;
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
        if (dp[allMask][u] < bestCost) {
            bestCost = dp[allMask][u];
            bestEnd = u;
        }
    }
    const path = [];
    let mask = allMask, curr = bestEnd;
    while (curr !== -1) {
        path.unshift(curr);
        const prev = parent[mask][curr];
        mask ^= (1 << curr);
        curr = prev;
    }
    return path;
}
/** Nearest-neighbour fallback for n > 12 */
export function nearestNeighbourTsp(dist) {
    const n = dist.length;
    const visited = new Set([0]);
    const path = [0];
    for (let step = 1; step < n; step++) {
        const last = path[path.length - 1];
        let best = -1, bestDist = Infinity;
        for (let j = 0; j < n; j++) {
            if (!visited.has(j) && dist[last][j] < bestDist) {
                bestDist = dist[last][j];
                best = j;
            }
        }
        if (best === -1)
            break;
        path.push(best);
        visited.add(best);
    }
    return path;
}
function buildSegments(order, places, dist) {
    const segments = [];
    for (let i = 0; i < order.length - 1; i++) {
        const from = places[order[i]], to = places[order[i + 1]];
        const durSec = dist[order[i]][order[i + 1]];
        segments.push({
            from: { placeId: from.placeId, name: from.name, lat: from.lat, lng: from.lng },
            to: { placeId: to.placeId, name: to.name, lat: to.lat, lng: to.lng },
            distanceMeters: 0,
            durationSeconds: durSec,
            durationText: formatSeconds(durSec),
            mode: "driving",
        });
    }
    return segments;
}
// ---------------------------------------------------------------------------
// Plugin: routing-engine
// ---------------------------------------------------------------------------
const routingEnginePlugin = {
    name: "routing-engine",
    manifest: { capabilities: ["tools"] },
    setup(api) {
        api.registerTool(createTool({
            name: "optimize_route",
            description: "Optimize the visit order for a set of places to minimize total travel time. " +
                "Uses Google Maps Distance Matrix + Held-Karp DP (≤10 stops) or " +
                "nearest-neighbour greedy (>10 stops). Returns optimized order and segments.",
            inputSchema: z.object({
                places: z.array(z.object({
                    placeId: z.string(),
                    name: z.string(),
                    lat: z.number(),
                    lng: z.number(),
                })).min(2).describe("Array of places to visit (min 2)"),
                mode: z.enum(["driving", "walking", "transit"]).default("driving"),
            }),
            timeoutMs: 45_000,
            retryable: true,
            maxRetries: 1,
            async execute(input) {
                const places = input.places;
                const n = places.length;
                const dist = await buildDurationMatrix(places, input.mode ?? "driving");
                const order = n <= 12 ? heldKarpTsp(dist) : nearestNeighbourTsp(dist);
                const segments = buildSegments(order, places, dist);
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
                    totalTravelTime: { seconds: totalSeconds, text: formatSeconds(totalSeconds) },
                    solver: n <= 12 ? "held-karp-dp" : "nearest-neighbour",
                    placeCount: n,
                };
            },
        }));
    },
};
export { routingEnginePlugin };
export default routingEnginePlugin;
//# sourceMappingURL=routing-engine.js.map