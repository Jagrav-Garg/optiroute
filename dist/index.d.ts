/**
 * Multi-Agent Travel Planner — Entry Point
 *
 * Architecture:
 *   1. Spawn Transit, Hotel, and Places agents in parallel
 *   2. Feed results to the Compiler Agent
 *   3. Run the Routing Engine to optimize place order
 *   4. Validate the final plan with the Validation Agent
 *   5. Return the UnifiedTripPlan JSON
 */
import transitAgentPlugin from "./agents/transit-agent.js";
import hotelAgentPlugin from "./agents/hotel-agent.js";
import placesAgentPlugin from "./agents/places-agent.js";
import compilerAgentPlugin from "./agents/compiler-agent.js";
import validationAgentPlugin from "./agents/validation-agent.js";
import routingEnginePlugin from "./routing/routing-engine.js";
import type { UserConstraints } from "./schemas/trip.js";
export { transitAgentPlugin, hotelAgentPlugin, placesAgentPlugin, compilerAgentPlugin, validationAgentPlugin, routingEnginePlugin, };
export * from "./schemas/trip.js";
export * from "./config.js";
declare function runTravelPlanner(constraints: UserConstraints): Promise<{
    constraints: {
        currency: string;
        origin: string;
        destination: string;
        startDate: string;
        endDate: string;
        budget: number;
        travellers: number;
        diet: "pure-veg" | "vegetarian" | "vegan" | "any";
        pace: "relaxed" | "moderate" | "packed";
        preferences: string[];
    };
    transit: any;
    hotel: any;
    places: any;
    compiled: any;
    validated: any;
}>;
export { runTravelPlanner };
//# sourceMappingURL=index.d.ts.map