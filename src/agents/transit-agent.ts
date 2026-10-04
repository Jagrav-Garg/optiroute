/**
 * Transit Agent Plugin
 *
 * Registers a `search_flights` tool that queries SerpAPI's Google Flights engine
 * and returns structured TransitOption results.
 *
 * Responsibilities: Flights, fares, baggage
 */

import { type AgentPlugin, createTool } from "@cline/core";
import { z } from "zod";
import { callSerpApi, type SerpApiParams } from "../tools/serp-search.js";
import type { TransitOption } from "../schemas/trip.js";

// ---------------------------------------------------------------------------
// SerpAPI Google Flights response parser
// ---------------------------------------------------------------------------

function parseFlightResults(raw: Record<string, unknown>): TransitOption[] {
  const flights = (raw.best_flights ?? raw.other_flights ?? []) as Array<Record<string, unknown>>;
  const allFlights: TransitOption[] = [];
  let idx = 0;

  for (const flight of flights) {
    const legs = (flight.flights ?? [flight]) as Array<Record<string, unknown>>;
    const firstLeg = legs[0] ?? {};
    const lastLeg = legs[legs.length - 1] ?? firstLeg;

    const departureAirport = (firstLeg.departure_airport as Record<string, unknown>) ?? {};
    const arrivalAirport = (lastLeg.arrival_airport as Record<string, unknown>) ?? {};

    allFlights.push({
      id: `flight_${idx++}`,
      type: "flight",
      provider: String(firstLeg.airline ?? "Unknown"),
      flightNumber: String(firstLeg.flight_number ?? ""),
      departure: {
        airport: String(departureAirport.id ?? departureAirport.name ?? ""),
        time: String(departureAirport.time ?? ""),
      },
      arrival: {
        airport: String(arrivalAirport.id ?? arrivalAirport.name ?? ""),
        time: String(arrivalAirport.time ?? ""),
      },
      duration: formatDuration(flight.total_duration as number | undefined),
      price: Number(flight.price ?? 0),
      currency: String(raw.price ?? "USD"),
      baggage: flight.booking_token
        ? undefined
        : String(flight.baggage ?? ""),
      stops: Math.max(0, legs.length - 1),
      source: "serpapi",
    });
  }

  return allFlights;
}

function formatDuration(minutes?: number): string {
  if (!minutes) return "N/A";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ---------------------------------------------------------------------------
// Plugin: transit-agent
// ---------------------------------------------------------------------------

const transitAgentPlugin: AgentPlugin = {
  name: "transit-agent",
  manifest: {
    capabilities: ["tools"],
  },

  setup(api: any) {
    api.registerTool(
      createTool({
        name: "search_flights",
        description:
          "Search for flights between two cities using SerpAPI Google Flights. " +
          "Returns a list of flight options with provider, times, price, stops, and baggage. " +
          "Use IATA airport codes for departure_id and arrival_id (e.g. 'JFK', 'LHR').",
        inputSchema: z.object({
          departure_id: z.string().describe("Departure airport IATA code, e.g. 'JFK'"),
          arrival_id: z.string().describe("Arrival airport IATA code, e.g. 'LHR'"),
          outbound_date: z.string().describe("Outbound date in YYYY-MM-DD format"),
          return_date: z.string().optional().describe("Return date in YYYY-MM-DD format (omit for one-way)"),
          adults: z.number().optional().default(1).describe("Number of adult passengers"),
          currency: z.string().optional().default("USD").describe("Currency code"),
        }),
        timeoutMs: 30_000,
        retryable: true,
        maxRetries: 1,

        async execute(input: { departure_id: string; arrival_id: string; outbound_date: string; return_date?: string; adults?: number; currency?: string }) {
          const params: SerpApiParams = {
            engine: "google_flights",
            departure_id: input.departure_id,
            arrival_id: input.arrival_id,
            outbound_date: input.outbound_date,
            adults: input.adults ?? 1,
            currency: input.currency ?? "USD",
          };
          if (input.return_date) {
            params.return_date = input.return_date;
            params.type = "1";
          } else {
            params.type = "2";
          }

          const raw = await callSerpApi(params);
          const options = parseFlightResults(raw);

          return {
            agent: "transit",
            query: `${input.departure_id} → ${input.arrival_id} on ${input.outbound_date}`,
            options,
            raw_metadata: {
              search_id: raw.search_metadata?.id,
              total_results: options.length,
            },
          };
        },
      }),
    );
  },
};

export { transitAgentPlugin };
export default transitAgentPlugin;
