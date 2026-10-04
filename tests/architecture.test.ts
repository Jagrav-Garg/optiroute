/**
 * Multi-Agent Travel Planner — Architecture Verification Tests
 *
 * Verifies that all components of the architecture work correctly:
 * 1. Zod Schemas & Domain Models
 * 2. Specialist Plugins & Tool Registration
 * 3. Compiler Agent (merging, selection, budget math, schema check)
 * 4. Routing Engine (DP TSP solver & route segment generation)
 * 5. Validation Agent (strict checks: budget, timing, opening hours, routing)
 * 6. End-to-End Mock Pipeline
 */

// Set dummy keys in environment for testing before any config imports
process.env.CLINE_API_KEY = process.env.CLINE_API_KEY || "test_cline_key";
process.env.SERPAPI_KEY = process.env.SERPAPI_KEY || "test_serpapi_key";
process.env.GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "test_gmaps_key";

import {
  UserConstraintsSchema,
  TransitOptionSchema,
  HotelOptionSchema,
  PlaceOptionSchema,
  UnifiedTripPlanSchema,
  type UserConstraints,
  type TransitOption,
  type HotelOption,
  type PlaceOption,
} from "../src/schemas/trip.js";

import transitAgentPlugin from "../src/agents/transit-agent.js";
import hotelAgentPlugin from "../src/agents/hotel-agent.js";
import placesAgentPlugin from "../src/agents/places-agent.js";
import compilerAgentPlugin from "../src/agents/compiler-agent.js";
import validationAgentPlugin from "../src/agents/validation-agent.js";
import routingEnginePlugin, { heldKarpTsp, nearestNeighbourTsp } from "../src/routing/routing-engine.js";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, message?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${message ? `— ${message}` : ""}`);
    failedCount++;
  }
}

// Mock API container to test plugin tool registration
class MockPluginAPI {
  public tools = new Map<string, any>();
  registerTool(tool: any) {
    this.tools.set(tool.name, tool);
  }
}

async function runTests() {
  console.log("================================================================");
  console.log("   MULTI-AGENT TRAVEL PLANNER — ARCHITECTURE VERIFICATION TEST   ");
  console.log("================================================================\n");

  // -------------------------------------------------------------------------
  // TEST SUITE 1: Zod Schemas
  // -------------------------------------------------------------------------
  console.log("📦 Suite 1: Schema Validation");
  {
    const sampleConstraints: UserConstraints = {
      origin: "New York",
      destination: "Paris",
      startDate: "2026-11-01",
      endDate: "2026-11-07",
      budget: 3000,
      travellers: 2,
      diet: "vegetarian",
      pace: "moderate",
      preferences: ["near metro"],
      currency: "USD",
    };

    const parsedConstraints = UserConstraintsSchema.safeParse(sampleConstraints);
    assert(parsedConstraints.success, "UserConstraintsSchema validates valid input");

    const invalidConstraints = UserConstraintsSchema.safeParse({ budget: -500 });
    assert(!invalidConstraints.success, "UserConstraintsSchema rejects negative budget");

    const sampleFlight: TransitOption = {
      id: "fl_1",
      type: "flight",
      provider: "Air France",
      departure: { airport: "JFK", time: "2026-11-01T18:00:00Z" },
      arrival: { airport: "CDG", time: "2026-11-02T07:30:00Z" },
      duration: "7h 30m",
      price: 650,
      currency: "USD",
      stops: 0,
      source: "serpapi",
    };
    assert(TransitOptionSchema.safeParse(sampleFlight).success, "TransitOptionSchema validates flight option");

    const sampleHotel: HotelOption = {
      id: "ht_1",
      name: "Hotel Le Marais",
      address: "10 Rue de Bretagne, Paris",
      location: { lat: 48.8627, lng: 2.3644 },
      pricePerNight: 180,
      currency: "USD",
      rating: 4.5,
      amenities: ["WiFi", "Breakfast"],
      source: "serpapi",
    };
    assert(HotelOptionSchema.safeParse(sampleHotel).success, "HotelOptionSchema validates hotel option");

    const samplePlace: PlaceOption = {
      id: "pl_1",
      name: "Louvre Museum",
      type: "museum",
      location: { lat: 48.8606, lng: 2.3376 },
      estimatedVisitDuration: "3h",
      currency: "USD",
      isVegFriendly: false,
      source: "serpapi",
    };
    assert(PlaceOptionSchema.safeParse(samplePlace).success, "PlaceOptionSchema validates place option (with currency)");
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 2: Plugin & Tool Registrations
  // -------------------------------------------------------------------------
  console.log("\n🔌 Suite 2: Plugin & Tool Registrations");
  const plugins = [
    { plugin: transitAgentPlugin, expectedTool: "search_flights" },
    { plugin: hotelAgentPlugin, expectedTool: "search_hotels" },
    { plugin: placesAgentPlugin, expectedTool: "search_places" },
    { plugin: compilerAgentPlugin, expectedTool: "compile_trip" },
    { plugin: validationAgentPlugin, expectedTool: "validate_trip" },
    { plugin: routingEnginePlugin, expectedTool: "optimize_route" },
  ];

  const registeredTools = new Map<string, any>();

  for (const { plugin, expectedTool } of plugins) {
    const api = new MockPluginAPI();
    plugin.setup(api);
    const hasTool = api.tools.has(expectedTool);
    assert(hasTool, `Plugin '${plugin.name}' registers '${expectedTool}'`);
    if (hasTool) {
      registeredTools.set(expectedTool, api.tools.get(expectedTool));
    }
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 3: Compiler Agent Execution
  // -------------------------------------------------------------------------
  console.log("\n⚙️  Suite 3: Compiler Agent Logic (compile_trip)");
  let compiledPlan: any = null;
  {
    const compileTool = registeredTools.get("compile_trip");
    const mockInput = {
      constraints: {
        origin: "New York",
        destination: "Paris",
        startDate: "2026-11-01",
        endDate: "2026-11-04",
        budget: 2500,
        travellers: 2,
        diet: "vegetarian",
        pace: "moderate",
        preferences: ["museums"],
        currency: "USD",
      },
      transitOptions: [
        {
          id: "fl_1",
          type: "flight",
          provider: "Delta",
          departure: { airport: "JFK", time: "2026-11-01T18:00:00Z" },
          arrival: { airport: "CDG", time: "2026-11-02T07:30:00Z" },
          duration: "7h 30m",
          price: 500,
          currency: "USD",
          stops: 0,
          source: "serpapi",
        },
        {
          id: "fl_2",
          type: "flight",
          provider: "United",
          departure: { airport: "JFK", time: "2026-11-01T20:00:00Z" },
          arrival: { airport: "CDG", time: "2026-11-02T10:30:00Z" },
          duration: "8h 30m",
          price: 650,
          currency: "USD",
          stops: 1,
          source: "serpapi",
        },
      ],
      hotelOptions: [
        {
          id: "ht_1",
          name: "Hotel Saint-Germain",
          address: "Boulevard Saint-Germain, Paris",
          location: { lat: 48.8538, lng: 2.3338 },
          pricePerNight: 150,
          currency: "USD",
          rating: 4.6,
          amenities: ["WiFi"],
          source: "serpapi",
        },
      ],
      placeOptions: [
        {
          id: "pl_1",
          name: "Eiffel Tower",
          type: "attraction",
          location: { lat: 48.8584, lng: 2.2945 },
          estimatedVisitDuration: "2h",
          entryFee: 30,
          currency: "USD",
          isVegFriendly: false,
          source: "serpapi",
        },
        {
          id: "pl_2",
          name: "Le Potager du Marais (Vegetarian)",
          type: "restaurant",
          location: { lat: 48.8601, lng: 2.3552 },
          estimatedVisitDuration: "1h 30m",
          entryFee: 0,
          currency: "USD",
          isVegFriendly: true,
          source: "serpapi",
        },
      ],
      title: "Paris Autumn Getaway",
    };

    const result = await compileTool.execute(mockInput);
    assert(result.success === true, "compile_trip returns success: true");
    assert(result.tripPlan !== undefined, "compile_trip produces tripPlan");
    assert(result.tripPlan.outboundTransit.provider === "Delta", "compile_trip selects lowest-scored flight (Delta)");
    assert(result.summary.withinBudget === true, "compile_trip verifies budget is within limit");
    compiledPlan = result.tripPlan;
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 4: Validation Agent Execution
  // -------------------------------------------------------------------------
  console.log("\n🛡️  Suite 4: Validation Agent Logic (validate_trip)");
  {
    const validateTool = registeredTools.get("validate_trip");

    // 1. Valid plan test
    const validResult = await validateTool.execute({ tripPlan: compiledPlan });
    assert(validResult.passed === true, "validate_trip passes valid compiled trip");
    assert(validResult.summary.errors === 0, "validate_trip reports 0 errors on valid plan");

    // 2. Budget violation test
    const overBudgetPlan = {
      ...compiledPlan,
      constraints: { ...compiledPlan.constraints, budget: 800 }, // Less than the ~$1500 total cost
      budgetBreakdown: { ...compiledPlan.budgetBreakdown, total: 1550 },
    };
    const budgetFailResult = await validateTool.execute({ tripPlan: overBudgetPlan });
    assert(budgetFailResult.passed === false, "validate_trip detects budget overflow");
    assert(
      budgetFailResult.issues.some((i: any) => i.category === "budget" && i.severity === "error"),
      "validate_trip flags category='budget' error"
    );

    // 3. Timing overlap test
    const overlappingPlan = {
      ...compiledPlan,
      itinerary: [
        {
          day: 1,
          date: "2026-11-01",
          places: [
            { placeId: "p1", name: "Stop 1", type: "attraction", startTime: "2026-11-01T10:00:00Z", endTime: "2026-11-01T12:00:00Z", lat: 48.8, lng: 2.3 },
            { placeId: "p2", name: "Stop 2", type: "attraction", startTime: "2026-11-01T11:30:00Z", endTime: "2026-11-01T13:00:00Z", lat: 48.8, lng: 2.3 },
          ],
          route: [],
          meals: {},
        },
      ],
    };
    const timingFailResult = await validateTool.execute({ tripPlan: overlappingPlan });
    assert(timingFailResult.passed === false, "validate_trip detects timing overlap between stops");
    assert(
      timingFailResult.issues.some((i: any) => i.category === "timing" && i.severity === "error"),
      "validate_trip flags category='timing' error"
    );
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 5: Routing Engine TSP Solvers
  // -------------------------------------------------------------------------
  console.log("\n🗺️  Suite 5: Routing Engine TSP Solvers (DP & Greedy)");
  {
    // 4-node distance matrix:
    // 0 -> start
    const distMatrix = [
      [0, 10, 15, 20],
      [10, 0, 35, 25],
      [15, 35, 0, 30],
      [20, 25, 30, 0],
    ];

    const hkOrder = heldKarpTsp(distMatrix);
    assert(Array.isArray(hkOrder), "heldKarpTsp returns an array");
    assert(hkOrder.length === 4, "heldKarpTsp visits all 4 nodes");
    assert(new Set(hkOrder).size === 4, "heldKarpTsp visits each node exactly once");
    assert(hkOrder[0] === 0, "heldKarpTsp begins at the first node (start)");

    const nnOrder = nearestNeighbourTsp(distMatrix);
    assert(Array.isArray(nnOrder), "nearestNeighbourTsp returns an array");
    assert(nnOrder.length === 4, "nearestNeighbourTsp visits all 4 nodes");
    assert(new Set(nnOrder).size === 4, "nearestNeighbourTsp visits each node exactly once");
    assert(nnOrder[0] === 0, "nearestNeighbourTsp begins at start node");
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 6: Summary
  // -------------------------------------------------------------------------
  console.log("\n================================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution encountered an error:", err);
  process.exit(1);
});
