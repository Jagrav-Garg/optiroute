/**
 * Compiler Agent Plugin
 *
 * Registers a `compile_trip` tool that merges outputs from Transit, Hotel,
 * and Places agents into a UnifiedTripPlan JSON with schema validation.
 */

import { type AgentPlugin, createTool } from "@cline/core";
import { z } from "zod";
import {
  type UserConstraints,
  type TransitOption,
  type HotelOption,
  type PlaceOption,
  type DayItinerary,
  UnifiedTripPlanSchema,
} from "../schemas/trip.js";
import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// Selection helpers
// ---------------------------------------------------------------------------

function selectBestTransit(options: TransitOption[]): TransitOption | undefined {
  if (options.length === 0) return undefined;
  const scored = options.map((opt) => ({ opt, score: opt.price + opt.stops * 200 }));
  scored.sort((a, b) => a.score - b.score);
  return scored[0].opt;
}

function selectBestHotel(options: HotelOption[], constraints: UserConstraints): HotelOption | undefined {
  if (options.length === 0) return undefined;
  const scored = options.map((opt) => ({ opt, score: opt.pricePerNight - (opt.rating ?? 3) * 50 }));
  scored.sort((a, b) => a.score - b.score);
  return scored[0].opt;
}

function selectPlaces(allPlaces: PlaceOption[], constraints: UserConstraints): PlaceOption[] {
  let filtered = [...allPlaces];
  if (constraints.diet === "pure-veg" || constraints.diet === "vegetarian") {
    const restaurants = filtered.filter((p) => p.type === "restaurant" && p.isVegFriendly);
    const nonRestaurants = filtered.filter((p) => p.type !== "restaurant");
    filtered = [...nonRestaurants, ...restaurants];
  }
  const days = Math.max(1, Math.ceil(
    (new Date(constraints.endDate).getTime() - new Date(constraints.startDate).getTime()) / 86400000,
  ));
  const perDay = constraints.pace === "relaxed" ? 2 : constraints.pace === "packed" ? 5 : 3;
  return filtered.slice(0, days * perDay);
}

function calculateBudget(
  transit: TransitOption | undefined,
  hotel: HotelOption | undefined,
  places: PlaceOption[],
  c: UserConstraints,
) {
  const nights = Math.max(1, Math.ceil(
    (new Date(c.endDate).getTime() - new Date(c.startDate).getTime()) / 86400000,
  ));
  const transitCost = transit ? transit.price * c.travellers : 0;
  const hotelCost = hotel ? hotel.pricePerNight * nights : 0;
  const activities = places.reduce((sum, p) => sum + (p.entryFee ?? 0) * c.travellers, 0);
  const food = places.filter((p) => p.type === "restaurant").length * 25 * c.travellers;
  const total = transitCost + hotelCost + activities + food;
  return { transit: transitCost, hotel: hotelCost, activities, food, total, remaining: c.budget - total };
}

// ---------------------------------------------------------------------------
// Plugin: compiler-agent
// ---------------------------------------------------------------------------

const compilerAgentPlugin: AgentPlugin = {
  name: "compiler-agent",
  manifest: { capabilities: ["tools"] },

  setup(api: any) {
    api.registerTool(
      createTool({
        name: "compile_trip",
        description:
          "Compile outputs from Transit, Hotel, and Places agents into a " +
          "UnifiedTripPlan JSON. Selects best options, filters places, " +
          "calculates budget, and validates against the schema.",
        inputSchema: z.object({
          constraints: z.object({
            origin: z.string(),
            destination: z.string(),
            startDate: z.string(),
            endDate: z.string(),
            budget: z.number(),
            travellers: z.number(),
            diet: z.enum(["pure-veg", "vegetarian", "vegan", "any"]),
            pace: z.enum(["relaxed", "moderate", "packed"]),
            preferences: z.array(z.string()).default([]),
            currency: z.string().default("USD"),
          }),
          transitOptions: z.array(z.any()).default([]),
          hotelOptions: z.array(z.any()).default([]),
          placeOptions: z.array(z.any()).default([]),
          title: z.string().optional(),
        }),
        timeoutMs: 15_000,

        async execute(input: {
          constraints: Record<string, unknown>;
          transitOptions?: unknown[];
          hotelOptions?: unknown[];
          placeOptions?: unknown[];
          title?: string;
        }) {
          const constraints = input.constraints as UserConstraints;
          const transitOpts = (input.transitOptions ?? []) as TransitOption[];
          const hotelOpts = (input.hotelOptions ?? []) as HotelOption[];
          const placeOpts = (input.placeOptions ?? []) as PlaceOption[];

          const bestTransit = selectBestTransit(transitOpts);
          const bestHotel = selectBestHotel(hotelOpts, constraints);
          const selectedPlaces = selectPlaces(placeOpts, constraints);
          const budgetBreakdown = calculateBudget(bestTransit, bestHotel, selectedPlaces, constraints);
          const returnTransit = transitOpts.length > 1 ? transitOpts[1] : undefined;

          const tripPlan = {
            id: randomUUID(),
            title: input.title ?? `${constraints.origin} → ${constraints.destination}`,
            constraints,
            outboundTransit: bestTransit,
            returnTransit: returnTransit,
            allTransitOptions: transitOpts,
            hotel: bestHotel,
            allHotelOptions: hotelOpts,
            allPlaces: selectedPlaces,
            itinerary: [] as DayItinerary[],
            budgetBreakdown,
            validation: { passed: false, issues: [] },
            generatedAt: new Date().toISOString(),
            agentVersions: { transit: "1.0.0", hotel: "1.0.0", places: "1.0.0", compiler: "1.0.0" },
          };

          const parseResult = UnifiedTripPlanSchema.safeParse(tripPlan);
          if (!parseResult.success) {
            return {
              success: false,
              error: "Schema validation failed",
              issues: parseResult.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
              partialPlan: tripPlan,
            };
          }

          return {
            success: true,
            tripPlan: parseResult.data,
            summary: {
              transitSelected: bestTransit?.provider ?? "none",
              hotelSelected: bestHotel?.name ?? "none",
              placesSelected: selectedPlaces.length,
              totalBudget: budgetBreakdown.total,
              budgetRemaining: budgetBreakdown.remaining,
              withinBudget: budgetBreakdown.remaining >= 0,
            },
          };
        },
      }),
    );
  },
};

export { compilerAgentPlugin };
export default compilerAgentPlugin;
