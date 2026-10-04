import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { runToolAgent, type Progress } from "./live-runner.js";

export interface PlanningDraft { hotelId: string; days: Array<{ placeIds: string[] }> }

export function validateDraft(draft: PlanningDraft, data: any): PlanningDraft {
  if (!data.hotelOptions.some((h: any) => h.id === draft.hotelId)) throw new Error("Choose a hotel ID from the supplied search results");
  if (draft.days.length !== data.totalDays) throw new Error(`Provide exactly ${data.totalDays} days`);
  const seen = new Set<string>();
  for (const day of draft.days) {
    for (const id of day.placeIds) {
      const place = data.placeOptions.find((p: any) => p.id === id);
      if (!place) throw new Error(`Unknown place ID: ${id}`);
      if (seen.has(id)) throw new Error("Do not repeat a place across days; choose another nearby place or leave free time");
      seen.add(id);
      if (place.type === "restaurant" && /veg/.test(data.constraints.diet) && !place.isVegFriendly) throw new Error("Select dining with dietary evidence in the results");
    }
  }
  if (!seen.size) throw new Error("The itinerary needs at least one resolved place");
  return draft;
}

export async function runPlanner(data: any, progress: Progress): Promise<PlanningDraft> {
  return runToolAgent("compiler", {
    name: "draft_itinerary",
    description: "Select a real hotel and assign known place IDs to each day. The routing engine will order each day's visits and calculate roads. Preserve the user's named hotel and places. Group nearby sights and dining to avoid repeated long crossings.",
    inputSchema: zodToJsonSchema(z.object({ hotelId: z.string(), days: z.array(z.object({ placeIds: z.array(z.string()).max(6) })) }), { $refStrategy: "none" }),
    execute: async (draft: PlanningDraft) => validateDraft(draft, data),
  }, JSON.stringify({
    constraints: data.constraints, request: data.query, totalDays: data.totalDays,
    hotels: data.hotelOptions.map((h: any) => ({ id: h.id, name: h.name, pricePerNight: h.pricePerNight, coordinates: h.location })),
    places: data.placeOptions.map((p: any) => ({ id: p.id, name: p.name, type: p.type, coordinates: p.location, isVegFriendly: p.isVegFriendly })),
    instructions: "Select only known IDs. Do not repeat attractions or restaurants across days. Spread available attractions across the days; leave free time when research is sparse. Prefer a hotel near requested attractions unless the user specified a hotel. Select meals near each day's sights, not repeated distant dining. Never fabricate coordinates or claim a road route before routing completes.",
  }), progress);
}
