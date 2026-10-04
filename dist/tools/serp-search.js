/**
 * SerpAPI Tool — raw HTTP fetch wrapper for SerpAPI.
 *
 * Registered as `serp_search` via createTool.  The specialist agents
 * (transit, hotel, places) call this tool internally through their
 * own higher-level search tools, or the LLM can invoke it directly.
 *
 * SerpAPI endpoints used:
 *   - Google Flights  → engine=google_flights
 *   - Google Hotels   → engine=google_hotels
 *   - Google Places   → engine=google_maps  (or google_places)
 *   - Generic search  → engine=google
 */
import { createTool } from "@cline/core";
import { z } from "zod";
import { config } from "../config.js";
/**
 * Execute a raw SerpAPI request.  Throws on HTTP or API-level errors.
 */
export async function callSerpApi(params) {
    const url = new URL(config.serpapi.baseUrl);
    url.searchParams.set("api_key", config.serpapi.apiKey);
    url.searchParams.set("output", "json");
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value));
        }
    }
    const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(30_000),
    });
    const text = await response.text();
    let json;
    try {
        json = JSON.parse(text);
    }
    catch {
        throw new Error(`SerpAPI returned non-JSON (HTTP ${response.status}): ${text.slice(0, 500)}`);
    }
    if (!response.ok) {
        throw new Error(`SerpAPI HTTP ${response.status}: ${json.error ?? text.slice(0, 300)}`);
    }
    if (json.error)
        throw new Error(`SerpAPI: ${json.error}`);
    return json;
}
// ---------------------------------------------------------------------------
// createTool: serp_search — generic SerpAPI query
// ---------------------------------------------------------------------------
export const serpSearchTool = createTool({
    name: "serp_search",
    description: "Execute a raw SerpAPI search. Supports engines: google_flights, google_hotels, " +
        "google_maps, google_places, or generic google. Returns the full JSON response. " +
        "Requires SERPAPI_KEY in the environment.",
    inputSchema: z.object({
        engine: z
            .enum(["google_flights", "google_hotels", "google_maps", "google_places", "google"])
            .describe("SerpAPI engine to use"),
        query: z.string().optional().describe("Search query (for google / google_places engines)"),
        departure_id: z.string().optional().describe("Departure airport IATA code (google_flights)"),
        arrival_id: z.string().optional().describe("Arrival airport IATA code (google_flights)"),
        outbound_date: z.string().optional().describe("Outbound date YYYY-MM-DD (google_flights)"),
        return_date: z.string().optional().describe("Return date YYYY-MM-DD (google_flights)"),
        adults: z.number().optional().describe("Number of adults (google_flights / google_hotels)"),
        currency: z.string().optional().describe("Currency code, e.g. USD (google_flights / google_hotels)"),
        type: z.string().optional().describe("Search type, e.g. 'search' for hotels (google_hotels)"),
        q: z.string().optional().describe("Query string for hotel search (google_hotels)"),
        check_in_date: z.string().optional().describe("Check-in date YYYY-MM-DD (google_hotels)"),
        check_out_date: z.string().optional().describe("Check-out date YYYY-MM-DD (google_hotels)"),
        hotel_id: z.string().optional().describe("Hotel ID for details lookup (google_hotels)"),
        ll: z.string().optional().describe("Latitude,longitude for google_maps engine"),
        location: z.string().optional().describe("Location name for google_places engine"),
    }),
    timeoutMs: 30_000,
    retryable: true,
    maxRetries: 1,
    async execute(input) {
        const params = {
            engine: input.engine,
        };
        // Forward all optional fields that were provided
        if (input.query)
            params.q = input.query;
        if (input.departure_id)
            params.departure_id = input.departure_id;
        if (input.arrival_id)
            params.arrival_id = input.arrival_id;
        if (input.outbound_date)
            params.outbound_date = input.outbound_date;
        if (input.return_date)
            params.return_date = input.return_date;
        if (input.adults)
            params.adults = input.adults;
        if (input.currency)
            params.currency = input.currency;
        if (input.type)
            params.type = input.type;
        if (input.q)
            params.q = input.q;
        if (input.check_in_date)
            params.check_in_date = input.check_in_date;
        if (input.check_out_date)
            params.check_out_date = input.check_out_date;
        if (input.hotel_id)
            params.hotel_id = input.hotel_id;
        if (input.ll)
            params.ll = input.ll;
        if (input.location)
            params.location = input.location;
        return callSerpApi(params);
    },
});
//# sourceMappingURL=serp-search.js.map