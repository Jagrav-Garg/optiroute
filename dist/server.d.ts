/**
 * OptiRoute Backend Bridge Server
 *
 * Exposes REST API endpoints for the OptiRoute frontend:
 * - POST /api/trips             -> Triggers Multi-Agent planning pipeline
 * - GET  /api/agents/:id/status -> Returns live agent fleet states
 * - POST /api/chat              -> Coordinates interactive chat messages
 */
import { runSpecialist, type Progress } from "./agents/live-runner.js";
import { runPlanner } from "./agents/planner-agent.js";
export declare function planLiveTrip(input: any, emit?: Progress, research?: typeof runSpecialist, planner?: typeof runPlanner): Promise<{
    id: string;
    title: string;
    destination: any;
    origin: any;
    country: string;
    cityCenter: any;
    dates: {
        startDate: any;
        endDate: any;
        totalDays: number;
    };
    travelers: {
        adults: number;
        children: number;
        type: "couple";
    };
    transportation: never[];
    budget: {
        currency: any;
        totalCap: number;
        spentTotal: any;
        breakdown: {
            flights: any;
            hotels: any;
            food: any;
            activities: any;
            buffer: number;
        };
        status: string;
    };
    constraints: {
        id: string;
        type: string;
        title: string;
        description: string;
        isHardConstraint: boolean;
        status: string;
        confidence: number;
    }[];
    preferences: {
        pace: any;
        diet: any;
        mobility: string;
        interests: string[];
    };
    hotels: {
        id: any;
        name: any;
        rating: any;
        stars: number;
        pricePerNight: any;
        totalPrice: number;
        address: any;
        coordinates: any;
        imageUrl: string;
        images: string[];
        amenities: any;
        pureVegBreakfast: boolean;
        transitProximityScore: number;
        selected: boolean;
    }[];
    restaurants: any;
    attractions: any;
    itinerary: {
        dayNumber: number;
        date: string;
        title: string;
        theme: string;
        totalDistanceKm: number;
        totalTransitMinutes: number;
        estimatedCost: number;
        stops: any[];
    }[];
    route: {
        totalDistanceKm: number;
        totalTransitHours: number;
        zigzagReductionPercent: number;
        stopsCount: number;
        engineName: string;
        algorithm: string;
    };
    routeMetrics: {
        totalDistanceKm: number;
        totalTransitHours: number;
        zigzagReductionPercent: number;
        stopsCount: number;
        engineName: string;
        algorithm: string;
    };
    validation: {
        passed: any;
        totalChecks: number;
        passedChecks: number;
        autoRepairsApplied: number;
        violations: never[];
        lastValidatedTimestamp: string;
    };
    validationReport: {
        passed: any;
        totalChecks: number;
        passedChecks: number;
        autoRepairsApplied: number;
        violations: never[];
        lastValidatedTimestamp: string;
    };
    agentStatus: {
        isOrchestrating: boolean;
        overallStatusText: string;
        coordinator: {
            agent: string;
            displayName: string;
            packageName: string;
            status: string;
            currentAction: string;
            progressPercent: number;
            tokensUsed: number;
            latencyMs: number;
            lastUpdated: string;
        };
        transit: {
            agent: string;
            displayName: string;
            packageName: string;
            status: string;
            currentAction: string;
            progressPercent: number;
            tokensUsed: number;
            latencyMs: number;
            lastUpdated: string;
        };
        hotel: {
            agent: string;
            displayName: string;
            packageName: string;
            status: string;
            currentAction: string;
            progressPercent: number;
            tokensUsed: number;
            latencyMs: number;
            lastUpdated: string;
        };
        places: {
            agent: string;
            displayName: string;
            packageName: string;
            status: string;
            currentAction: string;
            progressPercent: number;
            tokensUsed: number;
            latencyMs: number;
            lastUpdated: string;
        };
        compiler: {
            agent: string;
            displayName: string;
            packageName: string;
            status: string;
            currentAction: string;
            progressPercent: number;
            tokensUsed: number;
            latencyMs: number;
            lastUpdated: string;
        };
        routing: {
            agent: string;
            displayName: string;
            packageName: string;
            status: string;
            currentAction: string;
            progressPercent: number;
            tokensUsed: number;
            latencyMs: number;
            lastUpdated: string;
        };
        validator: {
            agent: string;
            displayName: string;
            packageName: string;
            status: string;
            currentAction: string;
            progressPercent: number;
            tokensUsed: number;
            latencyMs: number;
            lastUpdated: string;
        };
    };
    agentFleetState: {
        isOrchestrating: boolean;
        overallStatusText: string;
        coordinator: {
            agent: string;
            displayName: string;
            packageName: string;
            status: string;
            currentAction: string;
            progressPercent: number;
            tokensUsed: number;
            latencyMs: number;
            lastUpdated: string;
        };
        transit: {
            agent: string;
            displayName: string;
            packageName: string;
            status: string;
            currentAction: string;
            progressPercent: number;
            tokensUsed: number;
            latencyMs: number;
            lastUpdated: string;
        };
        hotel: {
            agent: string;
            displayName: string;
            packageName: string;
            status: string;
            currentAction: string;
            progressPercent: number;
            tokensUsed: number;
            latencyMs: number;
            lastUpdated: string;
        };
        places: {
            agent: string;
            displayName: string;
            packageName: string;
            status: string;
            currentAction: string;
            progressPercent: number;
            tokensUsed: number;
            latencyMs: number;
            lastUpdated: string;
        };
        compiler: {
            agent: string;
            displayName: string;
            packageName: string;
            status: string;
            currentAction: string;
            progressPercent: number;
            tokensUsed: number;
            latencyMs: number;
            lastUpdated: string;
        };
        routing: {
            agent: string;
            displayName: string;
            packageName: string;
            status: string;
            currentAction: string;
            progressPercent: number;
            tokensUsed: number;
            latencyMs: number;
            lastUpdated: string;
        };
        validator: {
            agent: string;
            displayName: string;
            packageName: string;
            status: string;
            currentAction: string;
            progressPercent: number;
            tokensUsed: number;
            latencyMs: number;
            lastUpdated: string;
        };
    };
}>;
//# sourceMappingURL=server.d.ts.map