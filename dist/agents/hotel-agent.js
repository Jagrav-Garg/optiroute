/**
 * Hotel Agent Plugin
 *
 * Registers a `search_hotels` tool that queries SerpAPI's Google Hotels engine
 * and returns structured HotelOption results.
 *
 * Responsibilities: Stays, check-in, location
 */
import { createTool } from "@cline/core";
import { z } from "zod";
import { callSerpApi } from "../tools/serp-search.js";
// ---------------------------------------------------------------------------
// SerpAPI Google Hotels response parser
// ---------------------------------------------------------------------------
function parseHotelResults(raw) {
    const properties = (raw.properties ?? []);
    const hotels = [];
    let idx = 0;
    for (const prop of properties) {
        const gps = prop.gps_coordinates;
        const ratePerNight = prop.rate_per_night;
        const imageList = [];
        if (Array.isArray(prop.images)) {
            for (const img of prop.images) {
                const url = (img.original_image || img.thumbnail);
                if (url && !imageList.includes(url))
                    imageList.push(url);
            }
        }
        if (typeof prop.thumbnail === "string" && !imageList.includes(prop.thumbnail)) {
            imageList.unshift(prop.thumbnail);
        }
        hotels.push({
            id: `hotel_${idx++}`,
            name: String(prop.name ?? "Unknown Hotel"),
            rating: typeof prop.overall_rating === "number" ? prop.overall_rating : undefined,
            address: String(prop.address ?? ""),
            location: {
                lat: gps?.latitude ?? 0,
                lng: gps?.longitude ?? 0,
            },
            pricePerNight: Number(ratePerNight?.extracted_lowest ?? prop.extracted_price ?? 0),
            currency: "USD",
            amenities: Array.isArray(prop.amenities)
                ? prop.amenities.map((a) => String(a.name ?? a))
                : [],
            proximity: prop.nearby_places
                ? String(prop.nearby_places[0] ?? "")
                : undefined,
            imageUrl: imageList[0],
            images: imageList.length > 0 ? imageList : undefined,
            url: prop.link,
            source: "serpapi",
        });
    }
    return hotels;
}
// ---------------------------------------------------------------------------
// Plugin: hotel-agent
// ---------------------------------------------------------------------------
const hotelAgentPlugin = {
    name: "hotel-agent",
    manifest: {
        capabilities: ["tools"],
    },
    setup(api) {
        api.registerTool(createTool({
            name: "search_hotels",
            description: "Search for hotels in a destination city using SerpAPI Google Hotels. " +
                "Returns a list of hotel options with name, rating, location, price per night, and amenities. " +
                "Use city name or address as the query.",
            inputSchema: z.object({
                destination: z.string().describe("Destination city or area to search hotels in"),
                check_in_date: z.string().describe("Check-in date in YYYY-MM-DD format"),
                check_out_date: z.string().describe("Check-out date in YYYY-MM-DD format"),
                adults: z.number().optional().default(2).describe("Number of guests"),
                currency: z.string().optional().default("USD").describe("Currency code"),
                sort_by: z.enum(["price", "rating", "relevance"]).optional()
                    .describe("Sort order for results"),
            }),
            timeoutMs: 30_000,
            retryable: true,
            maxRetries: 1,
            async execute(input) {
                const params = {
                    engine: "google_hotels",
                    q: input.destination,
                    check_in_date: input.check_in_date,
                    check_out_date: input.check_out_date,
                    adults: input.adults ?? 2,
                    currency: input.currency ?? "USD",
                };
                if (input.sort_by === "price") {
                    params.sort_by = "lowest_price";
                }
                else if (input.sort_by === "rating") {
                    params.sort_by = "highest_rating";
                }
                const raw = await callSerpApi(params);
                const options = parseHotelResults(raw);
                return {
                    agent: "hotel",
                    query: `${input.destination} (${input.check_in_date} → ${input.check_out_date})`,
                    options,
                    raw_metadata: {
                        search_id: raw.search_metadata?.id,
                        total_results: options.length,
                    },
                };
            },
        }));
    },
};
export { hotelAgentPlugin };
export default hotelAgentPlugin;
//# sourceMappingURL=hotel-agent.js.map