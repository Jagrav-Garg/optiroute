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

import { Agent } from "@cline/sdk";
import { getAgentConfig } from "./config.js";
import transitAgentPlugin from "./agents/transit-agent.js";
import hotelAgentPlugin from "./agents/hotel-agent.js";
import placesAgentPlugin from "./agents/places-agent.js";
import compilerAgentPlugin from "./agents/compiler-agent.js";
import validationAgentPlugin from "./agents/validation-agent.js";
import routingEnginePlugin from "./routing/routing-engine.js";
import type { UserConstraints } from "./schemas/trip.js";

// Re-export all plugins and schemas for external use
export {
  transitAgentPlugin, hotelAgentPlugin, placesAgentPlugin,
  compilerAgentPlugin, validationAgentPlugin, routingEnginePlugin,
};
export * from "./schemas/trip.js";
export * from "./config.js";

// ---------------------------------------------------------------------------
// runTravelPlanner — full multi-agent pipeline
// ---------------------------------------------------------------------------

async function runTravelPlanner(constraints: UserConstraints) {
  console.log("🗺️  Multi-Agent Travel Planner");
  console.log(`   ${constraints.origin} → ${constraints.destination}`);
  console.log(`   ${constraints.startDate} to ${constraints.endDate}`);
  console.log(`   Budget: $${constraints.budget} | ${constraints.travellers} traveller(s)\n`);

  const cfg = getAgentConfig();

  // Phase 1: Parallel specialist searches
  console.log("📡 Phase 1: Specialist agents searching in parallel...");

  const transitAgent = new Agent({ ...cfg, plugins: [transitAgentPlugin], maxIterations: 3 });
  const hotelAgent = new Agent({ ...cfg, plugins: [hotelAgentPlugin], maxIterations: 3 });
  const placesAgent = new Agent({ ...cfg, plugins: [placesAgentPlugin], maxIterations: 3 });

  const [transitResult, hotelResult, placesResult] = await Promise.all([
    transitAgent.run(
      `Search for flights from ${constraints.origin} to ${constraints.destination}. ` +
      `Departure: ${constraints.startDate}, Return: ${constraints.endDate}. ` +
      `${constraints.travellers} adult(s). Use the search_flights tool.`,
    ),
    hotelAgent.run(
      `Search for hotels in ${constraints.destination}. ` +
      `Check-in: ${constraints.startDate}, Check-out: ${constraints.endDate}. ` +
      `Use the search_hotels tool.`,
    ),
    placesAgent.run(
      `Search for attractions and restaurants in ${constraints.destination}. ` +
      `${constraints.diet !== "any" ? `Diet: ${constraints.diet}. ` : ""}` +
      `Use the search_places tool.`,
    ),
  ]);

  console.log(`   ✓ Transit: ${transitResult.status}`);
  console.log(`   ✓ Hotel: ${hotelResult.status}`);
  console.log(`   ✓ Places: ${placesResult.status}`);

  // Phase 2: Compile results
  console.log("\n🔧 Phase 2: Compiler agent merging results...");

  const compilerAgent = new Agent({ ...cfg, plugins: [compilerAgentPlugin], maxIterations: 2 });
  const compileResult = await compilerAgent.run(
    `Compile these agent results into a unified trip plan using compile_trip:\n\n` +
    `Constraints: ${JSON.stringify(constraints, null, 2)}\n\n` +
    `Transit: ${transitResult.outputText}\n\n` +
    `Hotel: ${hotelResult.outputText}\n\n` +
    `Places: ${placesResult.outputText}`,
  );
  console.log(`   ✓ Compiled: ${compileResult.status}`);

  // Phase 3: Validate
  console.log("\n✅ Phase 3: Validation agent checking plan...");

  const validationAgent = new Agent({ ...cfg, plugins: [validationAgentPlugin], maxIterations: 2 });
  const validationResult = await validationAgent.run(
    `Validate this trip plan using validate_trip:\n\n${compileResult.outputText}`,
  );
  console.log(`   ✓ Validation: ${validationResult.status}`);

  // Done
  console.log("\n📋 Results ready.");

  return {
    constraints,
    transit: transitResult.outputText,
    hotel: hotelResult.outputText,
    places: placesResult.outputText,
    compiled: compileResult.outputText,
    validated: validationResult.outputText,
  };
}

// ---------------------------------------------------------------------------
// CLI entry point (if run directly)
// ---------------------------------------------------------------------------

if (process.argv[1]?.endsWith("index.js") || process.argv[1]?.endsWith("index.ts")) {
  const sampleConstraints: UserConstraints = {
    origin: "New York",
    destination: "Paris",
    startDate: "2026-11-01",
    endDate: "2026-11-07",
    budget: 3000,
    travellers: 2,
    diet: "vegetarian",
    pace: "moderate",
    preferences: ["near metro", "no red-eye flights"],
    currency: "USD",
  };

  runTravelPlanner(sampleConstraints)
    .then((result) => {
      console.log("\n✅ Trip planning complete!");
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((err) => {
      console.error("\n❌ Error:", err);
      process.exit(1);
    });
}

export { runTravelPlanner };
