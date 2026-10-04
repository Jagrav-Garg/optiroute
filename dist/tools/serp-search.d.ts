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
export interface SerpApiParams {
    engine: string;
    q?: string;
    departure_id?: string;
    arrival_id?: string;
    outbound_date?: string;
    return_date?: string;
    type?: string;
    adults?: number;
    currency?: string;
    check_in_date?: string;
    check_out_date?: string;
    hotel_id?: string;
    ll?: string;
    [key: string]: unknown;
}
interface SerpApiResponse {
    [key: string]: unknown;
    search_metadata?: {
        id?: string;
        status?: string;
        total_time_taken?: number;
    };
    error?: string;
}
/**
 * Execute a raw SerpAPI request.  Throws on HTTP or API-level errors.
 */
export declare function callSerpApi(params: SerpApiParams): Promise<SerpApiResponse>;
export declare const serpSearchTool: any;
export {};
//# sourceMappingURL=serp-search.d.ts.map