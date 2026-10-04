/**
 * Places Agent Plugin
 *
 * Registers a `search_places` tool that combines SerpAPI Google Places
 * and Google Maps Places API to discover attractions and veg-friendly
 * restaurants at a destination.
 *
 * Responsibilities: Attractions, veg food, hours
 */

import { type AgentPlugin, createTool } from "@cline/core";
import { z } from "zod";
import { callSerpApi } from "../tools/serp-search.js";
import { searchNearbyPlaces } from "../tools/google-maps.js";
import type { PlaceOption } from "../schemas/trip.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function categorizePlaceType(raw: string): PlaceOption["type"] {
  const lower = raw.toLowerCase();
  if (lower.includes("restaurant") || lower.includes("food") || lower.includes("cafe")) return "restaurant";
  if (lower.includes("museum") || lower.includes("gallery")) return "museum";
  if (lower.includes("park") || lower.includes("garden")) return "park";
  if (lower.includes("shopping") || lower.includes("mall") || lower.includes("market")) return "shopping";
  if (lower.includes("temple") || lower.includes("church") || lower.includes("mosque")) return "religious";
  if (lower.includes("attraction") || lower.includes("tourist")) return "attraction";
  return "other";
}

function estimateDuration(types: string): string {
  const lower = types.toLowerCase();
  if (lower.includes("museum")) return "2h";
  if (lower.includes("park")) return "1h 30m";
  if (lower.includes("restaurant") || lower.includes("food")) return "1h";
  if (lower.includes("shopping")) return "1h 30m";
  return "1h";
}

async function fetchCommonsImage(query: string): Promise<string | undefined> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      query
    )}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return undefined;
    const data: any = await res.json();
    const pages = Object.values(data?.query?.pages || {});
    for (const page of pages as any[]) {
      const imgUrl = page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url;
      if (
        imgUrl &&
        (imgUrl.endsWith(".jpg") ||
          imgUrl.endsWith(".jpeg") ||
          imgUrl.endsWith(".png") ||
          imgUrl.includes(".jpg?") ||
          imgUrl.includes(".jpeg?"))
      ) {
        return imgUrl;
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

async function geocodePlace(name: string, destination: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      `${name} ${destination}`
    )}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MultiAgentTravelPlanner/1.0" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {
    // ignore
  }
  return null;
}

function parseSerpPlaces(raw: Record<string, unknown>): PlaceOption[] {
  const places: PlaceOption[] = [];
  let idx = 0;

  // 1. Google Search Top Sights (tourist attractions with real thumbnails)
  const topSights = (raw.top_sights as Record<string, unknown> | undefined)?.sights as
    | Array<Record<string, unknown>>
    | undefined;
  if (Array.isArray(topSights)) {
    for (const sight of topSights) {
      const name = String(sight.title ?? sight.name ?? "Attraction");
      const thumb = sight.thumbnail as string | undefined;
      const images = thumb ? [thumb] : [];

      places.push({
        id: `place_sight_${idx++}`,
        name,
        type: "attraction",
        description: sight.description as string | undefined,
        location: { lat: 0, lng: 0, address: name },
        rating: typeof sight.rating === "number" ? sight.rating : 4.8,
        estimatedVisitDuration: "2h",
        entryFee: typeof sight.extracted_price === "number" ? sight.extracted_price : undefined,
        currency: "USD",
        isVegFriendly: false,
        imageUrl: thumb,
        images: images.length > 0 ? images : undefined,
        url: sight.link as string | undefined,
        source: "serpapi_sights",
      });
    }
  }

  // 2. Google Places / Local Results (attractions & restaurants)
  let results: Array<Record<string, unknown>> = [];
  if (Array.isArray(raw.local_results)) {
    results = raw.local_results;
  } else if (raw.local_results && typeof raw.local_results === "object" && Array.isArray((raw.local_results as any).places)) {
    results = (raw.local_results as any).places;
  } else if (Array.isArray(raw.places)) {
    results = raw.places;
  }

  for (const place of results) {
    const gps = place.gps_coordinates as Record<string, number> | undefined;
    const lat = gps?.latitude ?? gps?.lat ?? 0;
    const lng = gps?.longitude ?? gps?.lng ?? 0;

    const types = (place.type ?? "other") as string;
    const isRestaurant = types.toLowerCase().includes("restaurant") || types.toLowerCase().includes("food") || types.toLowerCase().includes("cafe");
    const isVeg = isRestaurant && (
      String(place.category ?? "").toLowerCase().includes("veg") ||
      String(place.type ?? "").toLowerCase().includes("veg") ||
      String(place.title ?? "").toLowerCase().includes("veg") ||
      String(place.description ?? "").toLowerCase().includes("veg")
    );

    const thumb = (place.thumbnail_large || place.thumbnail || place.image) as string | undefined;
    const photos = Array.isArray(place.photos)
      ? (place.photos as Array<Record<string, unknown>>)
          .map((p) => String(p.image || p.thumbnail || p))
          .filter(Boolean)
      : [];
    const imageList = [thumb, ...photos].filter((u): u is string => typeof u === "string" && u.length > 0);

    places.push({
      id: `place_serp_${idx++}`,
      name: String(place.title ?? place.name ?? "Unknown"),
      type: categorizePlaceType(types),
      description: place.description as string | undefined,
      location: { lat, lng, address: place.address as string | undefined },
      rating: typeof place.rating === "number" ? place.rating : 4.6,
      openingHours: place.hours ? String(place.hours) : (place.operating_hours as string | undefined),
      estimatedVisitDuration: estimateDuration(types),
      currency: "USD",
      cuisineType: isRestaurant ? (place.type as string | undefined) : undefined,
      isVegFriendly: isVeg,
      imageUrl: imageList[0],
      images: imageList.length > 0 ? imageList : undefined,
      url: place.link as string | undefined,
      source: "serpapi",
    });
  }

  return places;
}

function parseGooglePlaces(raw: { results: Array<Record<string, unknown>> }): PlaceOption[] {
  const places: PlaceOption[] = [];
  let idx = 0;
  for (const place of raw.results) {
    const location = place.geometry as Record<string, unknown>;
    const coords = location?.location as Record<string, number> | undefined;
    const types = (place.types ?? []) as string[];
    const isRestaurant = types.includes("restaurant") || types.includes("food");
    const oh = place.opening_hours as Record<string, unknown> | undefined;
    const weekdayText = oh?.weekday_text as string[] | undefined;
    places.push({
      id: `place_gmaps_${idx++}`,
      name: String(place.name ?? "Unknown"),
      type: categorizePlaceType(types.join(",")),
      location: { lat: coords?.lat ?? 0, lng: coords?.lng ?? 0, address: place.vicinity as string | undefined },
      rating: typeof place.rating === "number" ? place.rating : undefined,
      openingHours: weekdayText?.join("; ") ?? undefined,
      estimatedVisitDuration: estimateDuration(types.join(",")),
      currency: "USD",
      isVegFriendly: isRestaurant,
      source: "google_maps",
    });
  }
  return places;
}

// ---------------------------------------------------------------------------
// Plugin: places-agent
// ---------------------------------------------------------------------------

const placesAgentPlugin: AgentPlugin = {
  name: "places-agent",
  manifest: { capabilities: ["tools"] },

  setup(api: any) {
    api.registerTool(
      createTool({
        name: "search_places",
        description:
          "Search for attractions and restaurants at a destination. " +
          "Combines SerpAPI Google Places and Google Maps Places API. " +
          "Returns places with name, type, location, rating, hours, and veg-friendliness.",
        inputSchema: z.object({
          destination: z.string().describe("City or area name"),
          query: z.string().optional().describe("Search query, e.g. 'best museums'"),
          include_veg_filter: z.boolean().optional().default(false)
            .describe("Prioritize vegetarian-friendly restaurants"),
          lat: z.number().optional().describe("Center latitude for Google Maps search"),
          lng: z.number().optional().describe("Center longitude for Google Maps search"),
          radius: z.number().optional().default(10000).describe("Search radius in meters"),
        }),
        timeoutMs: 30_000,
        retryable: true,
        maxRetries: 1,

        async execute(input: {
          destination: string;
          query?: string;
          include_veg_filter?: boolean;
          lat?: number;
          lng?: number;
          radius?: number;
        }) {
          const allPlaces: PlaceOption[] = [];
          const errors: string[] = [];

          // 1. Dual SerpAPI searches in parallel: Top Sights + Dining
          try {
            const sightsPromise = callSerpApi({
              engine: "google",
              q: `top sights in ${input.destination}`,
            });
            const diningPromise = callSerpApi({
              engine: "google",
              q: input.include_veg_filter
                ? `vegetarian restaurants in ${input.destination}`
                : `top restaurants in ${input.destination}`,
            });

            const [sightsSettled, diningSettled] = await Promise.allSettled([sightsPromise, diningPromise]);

            if (sightsSettled.status === "fulfilled") {
              allPlaces.push(...parseSerpPlaces(sightsSettled.value));
            } else {
              errors.push(`Sights: ${sightsSettled.reason.message}`);
            }

            if (diningSettled.status === "fulfilled") {
              allPlaces.push(...parseSerpPlaces(diningSettled.value));
            } else {
              errors.push(`Dining: ${diningSettled.reason.message}`);
            }
          } catch (err) {
            errors.push(`SerpAPI: ${(err as Error).message}`);
          }

          // 2. Google Maps search
          if (input.lat && input.lng) {
            try {
              const gmaps = await searchNearbyPlaces({
                location: `${input.lat},${input.lng}`,
                radius: input.radius ?? 10000,
                type: input.include_veg_filter ? "restaurant" : "tourist_attraction",
                keyword: input.include_veg_filter ? "vegetarian" : undefined,
              });
              allPlaces.push(...parseGooglePlaces(gmaps as { results: Array<Record<string, unknown>> }));
            } catch (err) {
              errors.push(`Google Maps: ${(err as Error).message}`);
            }
          }

          // Deduplicate
          const seen = new Set<string>();
          const deduped = allPlaces.filter((p) => {
            const key = p.name.toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          // Enrich top places with coordinates & real Wikimedia Commons photos if missing
          const enriched = await Promise.all(
            deduped.slice(0, 10).map(async (p) => {
              // 1. Geocode if coordinates are 0
              if (p.location.lat === 0 && p.location.lng === 0) {
                const geo = await geocodePlace(p.name, input.destination);
                if (geo) {
                  p.location.lat = geo.lat;
                  p.location.lng = geo.lng;
                }
              }
              // 2. Fetch real Wikimedia photo if missing
              if (!p.imageUrl) {
                const img = await fetchCommonsImage(`${p.name} ${input.destination}`);
                if (img) {
                  p.imageUrl = img;
                  p.images = [img];
                }
              }
              return p;
            })
          );

          const finalPlaces = [...enriched, ...deduped.slice(10)];

          return {
            agent: "places",
            query: `${input.query ?? "places"} in ${input.destination}`,
            options: finalPlaces,
            raw_metadata: {
              total_results: finalPlaces.length,
              errors: errors.length > 0 ? errors : undefined,
            },
          };
        },
      }),
    );
  },
};

export { placesAgentPlugin };
export default placesAgentPlugin;
