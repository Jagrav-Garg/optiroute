/**
 * Places Agent Plugin
 *
 * Registers a `search_places` tool that combines SerpAPI Google Places
 * and Google Maps Places API to discover attractions and veg-friendly
 * restaurants at a destination.
 *
 * Responsibilities: Attractions, veg food, hours
 */
import { type AgentPlugin } from "@cline/core";
import type { PlaceOption } from "../schemas/trip.js";
export declare function parseSerpPlaces(raw: Record<string, unknown>): PlaceOption[];
export declare function placeIdentity(place: {
    name: string;
    location?: {
        address?: string;
        lat?: number;
        lng?: number;
    };
}): string;
declare const placesAgentPlugin: AgentPlugin;
export { placesAgentPlugin };
export default placesAgentPlugin;
//# sourceMappingURL=places-agent.d.ts.map