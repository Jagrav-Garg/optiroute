import assert from "node:assert/strict";
import { z } from "zod";
import { Agent } from "@cline/sdk";
import { extractTool, retryAgent, runSpecialist, publicOutput, boundedModel, coordinateRequest } from "../src/agents/live-runner.js";
import { validCoordinates, geocodeLocation } from "../src/tools/geocoding.js";
import { routingEnginePlugin, heldKarpTsp } from "../src/routing/routing-engine.js";
import { streamPlanning } from "../optiroute-main/optiroute-main/src/services/planningStream.js";
import { planLiveTrip } from "../src/server.js";
import { parseSerpPlaces, placeIdentity } from "../src/agents/places-agent.js";
import { allowedPhotoUrl, loadPhoto, photoUrls } from "../src/tools/photos.js";
import { validateDraft } from "../src/agents/planner-agent.js";
import { hotelAgentPlugin } from "../src/agents/hotel-agent.js";

const hotelSchema = extractTool(hotelAgentPlugin).inputSchema;
assert(hotelSchema.required.includes("check_in_date"));
assert(hotelSchema.required.includes("check_out_date"));
assert.equal(hotelSchema.properties.destination.type, "string");

const events: any[] = [];
const progress = (agent: string, status: string, action: string, detail?: any) => events.push({ agent, status, action, ...detail });
let attempts = 0;
assert.equal(await retryAgent("places", "Search", async (attempt, previousFailure) => {
  if (attempt === 2) assert.equal(previousFailure, "Worker crashed");
  if (++attempts === 1) throw new Error("Worker crashed");
  return "recovered";
}, progress), "recovered");
assert.equal(attempts, 2);
assert(events.some(event => event.status === "re-prompting"));
assert.equal(events.at(-1).status, "completed");

let permanentAttempts = 0;
await assert.rejects(retryAgent("hotel", "Search", async () => { permanentAttempts++; throw new Error("crashed"); }, progress), /failed after 3 attempts/);
assert.equal(permanentAttempts, 3);
assert.equal(events.at(-1).status, "error");

assert(!validCoordinates({ lat: 0, lng: 0 }));
assert(!validCoordinates({ lat: NaN, lng: 12 }));
assert(!validCoordinates({ lat: 100, lng: 12 }));
assert(validCoordinates({ lat: 0, lng: 12 })); // Valid equatorial place.
assert(validCoordinates({ lat: 48.8584, lng: 2.2945 }));

let searches = 0;
const fakePlugin: any = { name: "test", setup: (api: any) => api.registerTool({ name: "search_places", inputSchema: { type: "object", properties: {} }, execute: async () => { searches++; return { options: [{ name: "Eiffel Tower", location: { lat: 48.8584, lng: 2.2945 } }] }; } }) };
let turns = 0;
const result = await runSpecialist("places", fakePlugin, "Find Eiffel Tower", progress, options => new Agent({
  ...options, model: { async *stream() {
    if (++turns === 1) {
      yield { type: "tool-call-delta", toolCallId: "search-1", toolName: "search_places", input: {} };
      yield { type: "finish", reason: "tool-calls" };
    } else {
      yield { type: "reasoning-delta", text: "private reasoning" };
      yield { type: "text-delta", text: "Found Eiffel " };
      yield { type: "text-delta", text: "Tower at its verified coordinates." };
      yield { type: "finish", reason: "stop" };
    }
  } },
}));
assert.equal(result.options[0].name, "Eiffel Tower");
assert.equal(events.filter(event => event.outputDelta).map(event => event.outputDelta).join(""), "Found Eiffel Tower at its verified coordinates.");
assert(!JSON.stringify(events).includes("private reasoning"));
assert.equal(searches, 1); // Real SDK loop invokes the adapted contribution tool.

// Invalid tool arguments restart visibly once, carrying the actual failure.
let inputRuns = 0, validSearches = 0;
const inputPrompts: string[] = [];
const strictPlugin: any = { name: "strict", setup: (api: any) => api.registerTool({ name: "search_places", inputSchema: z.object({ destination: z.string() }), execute: async () => { validSearches++; return { options: [{ name: "Verified Fort" }] }; } }) };
await runSpecialist("places", strictPlugin, "Find nearby forts", progress, options => {
  const run = ++inputRuns;
  let turn = 0;
  return new Agent({ ...options, model: { async *stream(request) {
    inputPrompts.push(JSON.stringify(request.messages));
    if (++turn === 1) {
      yield { type: "tool-call-delta", toolCallId: "strict-search", toolName: "search_places", input: run === 1 ? {} : { destination: "Goa" } };
      yield { type: "finish", reason: "tool-calls" };
    } else { yield { type: "text-delta", text: "Found a verified fort." }; yield { type: "finish", reason: "stop" }; }
  } } });
});
assert.equal(inputRuns, 2); assert.equal(validSearches, 1);
assert(inputPrompts[1].includes("previousFailure"));
assert(inputPrompts[1].includes("destination"));

// A provider's transient error must not cause hidden retries inside a run.
let modelRequests = 0;
await assert.rejects(runSpecialist("places", fakePlugin, "Test a provider outage", progress, options => new Agent({
  ...options, model: boundedModel({ async *stream() {
    modelRequests++;
    yield { type: "finish", reason: "error", error: "Transient provider outage", errorRetryable: true };
  } }),
})), /failed after 3 attempts/);
assert.equal(modelRequests, 3);

let coordinatorInput = "";
await coordinateRequest("Keep the earlier restrictions", { destination: "Goa", origin: "Mumbai", dates: { startDate: "2026-11-07" }, hotels: [{ selected: true, name: "The White Balcao" }] }, progress,
  [{ sender: "user", content: "Avoid the remote south coast and do not repeat Saudagar." }, { sender: "assistant", content: "Previous route crossed the city repeatedly." }], 2,
  options => new Agent({ ...options, model: { async *stream(request) {
    coordinatorInput = JSON.stringify(request.messages);
    yield { type: "tool-call-delta", toolCallId: "submit", toolName: "submit_trip_request", input: { destination: "Goa", origin: "Mumbai", startDate: "2026-11-07", endDate: "2026-11-10", budget: 3000, travellers: 2, diet: "pure-veg", pace: "relaxed", currency: "USD", query: "Keep earlier restrictions" } };
    yield { type: "finish", reason: "tool-calls" };
  } } }));
assert(coordinatorInput.includes("Avoid the remote south coast"));
assert(coordinatorInput.includes("The White Balcao"));
assert(coordinatorInput.includes("Previous route crossed"));

const previousFetch = globalThis.fetch;
globalThis.fetch = (async (url: any) => {
  if (String(url).includes("/table/")) {
    const n = new URL(String(url)).pathname.split("/").at(-1)!.split(";").length / 2;
    return new Response(JSON.stringify({ code: "Ok", durations: n === 3 ? [[0, 60, 120], [90, 0, 60], [30, 120, 0]] : [[0, 60], [90, 0]], distances: n === 3 ? [[0, 1000, 2000], [1500, 0, 1000], [500, 2000, 0]] : [[0, 1000], [1500, 0]] }));
  }
  if (String(url).includes("/route/")) {
    const coordinates = new URL(String(url)).pathname.split("/").at(-1)!.split(";").map(pair => pair.split(",").map(Number));
    return new Response(JSON.stringify({ code: "Ok", routes: [{ legs: coordinates.slice(1).map((_, i) => ({ distance: i === 2 ? 500 : 1000, duration: i === 2 ? 30 : 60 })), geometry: { coordinates } }] }));
  }
  if (String(url).includes("/geocode/")) return new Response(JSON.stringify({ status: "ZERO_RESULTS" }));
  return new Response(JSON.stringify([]));
}) as typeof fetch;
try {
  const route = await extractTool(routingEnginePlugin).execute({ places: [
    { placeId: "hotel", name: "Hotel", lat: 48.85, lng: 2.3 },
    { placeId: "tower", name: "Tower", lat: 48.8584, lng: 2.2945 },
    { placeId: "museum", name: "Museum", lat: 48.86, lng: 2.33 },
  ], returnToStart: true, mode: "driving" });
  assert.deepEqual(route.optimizedOrder.map((stop: any) => stop.placeId), ["hotel", "tower", "museum"]);
  assert.equal(route.routeSegments.at(-1).to.placeId, "hotel");
  assert.equal(route.totalTravelTime.seconds, 150);
  assert.equal(route.routeSegments.reduce((total: number, leg: any) => total + leg.distanceMeters, 0), 2500);
  assert.equal(await geocodeLocation("Unresolvable test place", "Unresolvable city"), null);

  const hotel = { id: "hotel", name: "Test Hotel", address: "Paris", location: { lat: 48.85, lng: 2.3 }, pricePerNight: 100, currency: "USD", amenities: [], source: "fixture" };
  const places = [
    { id: "tower", name: "Test Tower", type: "attraction", location: { lat: 48.8584, lng: 2.2945 }, currency: "USD", estimatedVisitDuration: "2h", isVegFriendly: false, source: "fixture" },
    { id: "museum", name: "Test Museum", type: "museum", location: { lat: 48.86, lng: 2.33 }, currency: "USD", estimatedVisitDuration: "2h", isVegFriendly: false, source: "fixture" },
    { id: "unresolved", name: "Unresolvable fixture", type: "attraction", location: { lat: 0, lng: 0 }, currency: "USD", estimatedVisitDuration: "2h", isVegFriendly: false, source: "fixture" },
  ];
  const trip = await planLiveTrip({ destination: "Paris", origin: "London", startDate: "2026-11-02", endDate: "2026-11-03", budget: 3000, travellers: 1, diet: "any" }, progress,
    (async (role: string) => ({ options: role === "hotel" ? [hotel] : role === "places" ? places : [] })) as typeof runSpecialist,
    async data => ({ hotelId: data.hotelOptions[0].id, days: [{ placeIds: data.placeOptions.map((p: any) => p.id) }] }));
  assert.equal(trip.itinerary.length, 1);
  assert.equal(trip.itinerary[0].stops.length, 4);
  assert(!trip.itinerary[0].stops.some((stop: any) => stop.id === "unresolved"));
  assert(trip.itinerary[0].stops.every((stop: any) => validCoordinates(stop.coordinates)));
  assert.equal(trip.itinerary[0].stops[0].coordinates.lat, trip.itinerary[0].stops.at(-1)!.coordinates.lat);
  assert.equal(trip.route.totalDistanceKm, 2.5);
  assert.equal(trip.itinerary[0].totalTransitMinutes, 3);
  assert.equal(trip.itinerary[0].routeSource, "osrm");
  assert(trip.itinerary[0].stops[0].isHotelOrigin);
  assert(trip.itinerary[0].stops.at(-1)!.isHotelDestination);
  assert.equal(new Set(trip.itinerary[0].stops.map(stop => stop.id)).size, 4);
  assert.deepEqual(trip.itinerary[0].routePolyline?.[0], { lat: 48.85, lng: 2.3 });
  assert.equal(trip.itinerary[0].stops.reduce((sum, stop) => sum + (stop.transitToNext?.distanceKm || 0), 0), trip.itinerary[0].totalDistanceKm);

  const collisionPlaces = [
    { ...places[0], id: "same", name: "North Fort" },
    { ...places[1], id: "same", name: "Central Museum" },
    { ...places[0], id: "same", name: "Pure Veg Cafe", type: "restaurant", isVegFriendly: true },
  ];
  const multiDay = await planLiveTrip({ destination: "Paris", startDate: "2026-11-02", endDate: "2026-11-04", days: 2, budget: 3000, diet: "any" }, progress,
    (async (role: string) => ({ options: role === "hotel" ? [hotel] : role === "places" ? collisionPlaces : [] })) as typeof runSpecialist,
    async data => ({ hotelId: data.hotelOptions[0].id, days: [{ placeIds: [data.placeOptions[0].id, data.placeOptions[2].id] }, { placeIds: [data.placeOptions[1].id] }] }));
  const dailyStops = multiDay.itinerary.flatMap(day => day.stops);
  assert.equal(new Set(dailyStops.map(stop => stop.id)).size, dailyStops.length);
  for (const day of multiDay.itinerary) {
    assert(day.stops[0].isHotelOrigin);
    assert(day.stops.at(-1)!.isHotelDestination);
    const times = day.stops.map(stop => stop.scheduledTime.split(" - ")[0]);
    assert.deepEqual(times, [...times].sort());
    assert.equal(day.totalDistanceKm, day.stops.reduce((sum, stop) => sum + (stop.transitToNext?.distanceKm || 0), 0));
  }
  assert.notEqual(multiDay.itinerary[0].stops[1].name, multiDay.itinerary[1].stops[1].name);

  // The return leg changes the optimal ordering for this asymmetric matrix.
  const matrix = [[0, 1, 2], [50, 0, 1], [100, 10, 0]];
  assert.deepEqual(heldKarpTsp(matrix), [0, 1, 2]);
  assert.deepEqual(heldKarpTsp(matrix, true), [0, 2, 1]);

  const encoder = new TextEncoder();
  const body = JSON.stringify({ type: "agent.progress", agent: "places", action: "Finding café" }) + "\n" + JSON.stringify({ type: "itinerary.updated", trip: { destination: "Paris" } }) + "\n";
  const bytes = encoder.encode(body);
  // Split UTF-8 and NDJSON arbitrarily to exercise real network chunk boundaries.
  globalThis.fetch = (async () => new Response(new ReadableStream({ start(controller) { for (let i = 0; i < bytes.length; i += 3) controller.enqueue(bytes.slice(i, i + 3)); controller.close(); } }))) as typeof fetch;
  const received: any[] = [];
  assert.equal((await streamPlanning("/api/chat", {}, event => received.push(event))).trip.destination, "Paris");
  assert.equal(received[0].action, "Finding café");
  globalThis.fetch = (async () => new Response('{"type":"error","message":"Agent failed"}\n')) as typeof fetch;
  await assert.rejects(streamPlanning("/api/chat", {}, () => {}), /Agent failed/);
} finally { globalThis.fetch = previousFetch; }
console.log("Live planning regression checks passed: SDK tools, crash retries, coordinates, closed routing, distances, streamed responses.");

// Distinct sight/dining searches must not overwrite each other's pins or rows.
const sight = parseSerpPlaces({ local_results: [{ title: "Fort", type: "tourist attraction", gps_coordinates: { latitude: 15.49, longitude: 73.77 } }] });
const meal = parseSerpPlaces({ local_results: [{ title: "Veg Cafe", type: "vegetarian restaurant", gps_coordinates: { latitude: 15.50, longitude: 73.78 }, photos: [{ bad: "value" }] }] });
assert.notEqual(sight[0].id, meal[0].id);
assert(!meal[0].images?.includes("[object Object]"));
assert.equal(placeIdentity(sight[0]), sight[0].id);
assert.throws(() => validateDraft({ hotelId: "h", days: [{ placeIds: ["p"] }, { placeIds: ["p"] }] }, { totalDays: 2, constraints: { diet: "any" }, hotelOptions: [{ id: "h" }], placeOptions: [{ id: "p" }] }), /repeat/);
assert(!allowedPhotoUrl("https://googleusercontent.com.evil.test/image"));
assert(!allowedPhotoUrl("http://localhost/image"));
assert(!allowedPhotoUrl("https://lh3.googleusercontent.com/image?key=secret"));
assert(allowedPhotoUrl("https://lh3.googleusercontent.com/image"));
assert.equal(photoUrls(["[object Object]", "https://lh3.googleusercontent.com/photo"]).length, 1);
const fetchBeforePhotos = globalThis.fetch;
try {
  let downloads = 0;
  globalThis.fetch = (async () => { downloads++; return new Response(new Uint8Array([255, 216, 255]), { headers: { "Content-Type": "image/jpeg" } }); }) as typeof fetch;
  const [a, b] = await Promise.all([loadPhoto("https://lh3.googleusercontent.com/unit-test"), loadPhoto("https://lh3.googleusercontent.com/unit-test")]);
  assert.equal(a.type, "image/jpeg"); assert.equal(a.bytes.length, 3); assert.equal(downloads, 1); assert.equal(b.bytes.length, 3);
  const placeholder = await loadPhoto("http://127.0.0.1/private");
  assert.equal(placeholder.type, "image/svg+xml"); assert.equal(downloads, 1);
} finally { globalThis.fetch = fetchBeforePhotos; }
console.log("Identity, planner repetition, photo proxy and download checks passed.");
