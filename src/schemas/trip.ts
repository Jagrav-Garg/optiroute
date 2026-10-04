import { z } from "zod";

// ---------------------------------------------------------------------------
// User Constraints — the input to the entire planning pipeline
// ---------------------------------------------------------------------------

export const UserConstraintsSchema = z.object({
  origin: z.string().describe("Departure city or airport code"),
  destination: z.string().describe("Destination city"),
  startDate: z.string().describe("Trip start date, e.g. 2026-11-01"),
  endDate: z.string().describe("Trip end date, e.g. 2026-11-07"),
  budget: z.number().positive().describe("Total trip budget in USD"),
  travellers: z.number().int().min(1).describe("Number of travellers"),
  diet: z.enum(["pure-veg", "vegetarian", "vegan", "any"]).default("any")
    .describe("Dietary preference. 'pure-veg' means strictly no meat/egg."),
  pace: z.enum(["relaxed", "moderate", "packed"]).default("moderate")
    .describe("How busy the itinerary should be"),
  preferences: z.array(z.string()).default([])
    .describe("Additional preferences as a list of strings"),
  currency: z.string().default("USD").describe("Currency code"),
});

export type UserConstraints = z.infer<typeof UserConstraintsSchema>;

// ---------------------------------------------------------------------------
// Transit Option — returned by the Transit Agent
// ---------------------------------------------------------------------------

export const TransitOptionSchema = z.object({
  id: z.string().describe("Unique identifier for this option"),
  type: z.enum(["flight", "train", "bus", "ferry"]).describe("Mode of transport"),
  provider: z.string().describe("Airline or carrier name"),
  flightNumber: z.string().optional().describe("Flight/train number"),
  departure: z.object({
    airport: z.string().describe("Departure airport or station"),
    time: z.string().describe("Departure time (ISO 8601)"),
  }),
  arrival: z.object({
    airport: z.string().describe("Arrival airport or station"),
    time: z.string().describe("Arrival time (ISO 8601)"),
  }),
  duration: z.string().describe("Duration in human-readable form"),
  price: z.number().describe("Price per person"),
  currency: z.string().default("USD"),
  baggage: z.string().optional().describe("Baggage allowance summary"),
  stops: z.number().default(0).describe("Number of stops"),
  url: z.string().optional().describe("Booking URL"),
  source: z.string().describe("Data source"),
});

export type TransitOption = z.infer<typeof TransitOptionSchema>;

// ---------------------------------------------------------------------------
// Hotel Option — returned by the Hotel Agent
// ---------------------------------------------------------------------------

export const HotelOptionSchema = z.object({
  id: z.string().describe("Unique identifier"),
  name: z.string().describe("Hotel name"),
  rating: z.number().min(0).max(5).optional().describe("Star or guest rating"),
  address: z.string().describe("Full address"),
  location: z.object({
    lat: z.number().describe("Latitude"),
    lng: z.number().describe("Longitude"),
  }).describe("Geographic coordinates"),
  pricePerNight: z.number().describe("Price per room per night"),
  currency: z.string().default("USD"),
  checkIn: z.string().optional().describe("Check-in date (ISO 8601)"),
  checkOut: z.string().optional().describe("Check-out date (ISO 8601)"),
  amenities: z.array(z.string()).default([]).describe("Key amenities"),
  proximity: z.string().optional().describe("Distance to key landmarks"),
  imageUrl: z.string().optional().describe("Main photo URL"),
  images: z.array(z.string()).optional().describe("List of photo URLs"),
  url: z.string().optional().describe("Booking URL"),
  source: z.string().describe("Data source"),
});

export type HotelOption = z.infer<typeof HotelOptionSchema>;

// ---------------------------------------------------------------------------
// Place Option — returned by the Places Agent
// ---------------------------------------------------------------------------

export const PlaceOptionSchema = z.object({
  id: z.string().describe("Unique identifier"),
  name: z.string().describe("Place or attraction name"),
  type: z.enum(["attraction", "restaurant", "park", "museum", "shopping", "religious", "other"])
    .describe("Category of the place"),
  description: z.string().optional().describe("Brief description"),
  location: z.object({
    lat: z.number().describe("Latitude"),
    lng: z.number().describe("Longitude"),
    address: z.string().optional().describe("Full address"),
  }),
  rating: z.number().min(0).max(5).optional().describe("Rating"),
  openingHours: z.string().optional().describe("Opening hours summary"),
  estimatedVisitDuration: z.string().default("1h")
    .describe("Estimated time to spend here"),
  entryFee: z.number().optional().describe("Entry fee per person"),
  currency: z.string().default("USD"),
  cuisineType: z.string().optional()
    .describe("For restaurants: cuisine type"),
  isVegFriendly: z.boolean().default(false)
    .describe("Whether the place is vegetarian-friendly"),
  imageUrl: z.string().optional().describe("Main photo URL"),
  images: z.array(z.string()).optional().describe("List of photo URLs"),
  url: z.string().optional().describe("URL for more info"),
  source: z.string().describe("Data source"),
});

export type PlaceOption = z.infer<typeof PlaceOptionSchema>;

// ---------------------------------------------------------------------------
// Route Segment — produced by the Routing Engine
// ---------------------------------------------------------------------------

export const RouteSegmentSchema = z.object({
  from: z.object({ placeId: z.string(), name: z.string(), lat: z.number(), lng: z.number() }),
  to: z.object({ placeId: z.string(), name: z.string(), lat: z.number(), lng: z.number() }),
  distanceMeters: z.number().describe("Distance in meters"),
  durationSeconds: z.number().describe("Travel duration in seconds"),
  durationText: z.string().describe("Human-readable duration"),
  mode: z.enum(["driving", "walking", "transit"]).default("driving"),
});

export type RouteSegment = z.infer<typeof RouteSegmentSchema>;

// ---------------------------------------------------------------------------
// Day Itinerary — a single day in the compiled trip
// ---------------------------------------------------------------------------

export const DayItinerarySchema = z.object({
  day: z.number().int().min(1).describe("Day number (1-indexed)"),
  date: z.string().describe("Date (ISO 8601)"),
  title: z.string().optional().describe("Optional day title"),
  places: z.array(z.object({
    placeId: z.string(),
    name: z.string(),
    type: z.string(),
    startTime: z.string().describe("Planned arrival time"),
    endTime: z.string().describe("Planned departure time"),
    lat: z.number(),
    lng: z.number(),
  })),
  route: z.array(RouteSegmentSchema).describe("Travel segments between places"),
  meals: z.object({
    breakfast: z.string().optional(),
    lunch: z.string().optional(),
    dinner: z.string().optional(),
  }).default({}),
});

export type DayItinerary = z.infer<typeof DayItinerarySchema>;

// ---------------------------------------------------------------------------
// Unified Trip Plan — the final compiled output
// ---------------------------------------------------------------------------

export const UnifiedTripPlanSchema = z.object({
  id: z.string().describe("Trip plan ID"),
  title: z.string().describe("Trip title"),
  constraints: UserConstraintsSchema.describe("Original user constraints"),
  outboundTransit: TransitOptionSchema.optional(),
  returnTransit: TransitOptionSchema.optional(),
  allTransitOptions: z.array(TransitOptionSchema).default([]),
  hotel: HotelOptionSchema.optional(),
  allHotelOptions: z.array(HotelOptionSchema).default([]),
  allPlaces: z.array(PlaceOptionSchema).default([]),
  itinerary: z.array(DayItinerarySchema).default([]),
  budgetBreakdown: z.object({
    transit: z.number().default(0),
    hotel: z.number().default(0),
    activities: z.number().default(0),
    food: z.number().default(0),
    total: z.number().default(0),
    remaining: z.number().default(0),
  }).default({}),
  validation: z.object({
    passed: z.boolean().default(false),
    issues: z.array(z.object({
      severity: z.enum(["error", "warning", "info"]),
      category: z.enum(["budget", "timing", "opening_hours", "routing", "other"]),
      message: z.string(),
      suggestion: z.string().optional(),
    })).default([]),
  }).default({ passed: false, issues: [] }),
  generatedAt: z.string().describe("ISO 8601 timestamp of generation"),
  agentVersions: z.record(z.string()).default({}),
});

export type UnifiedTripPlan = z.infer<typeof UnifiedTripPlanSchema>;

// ---------------------------------------------------------------------------
// Search Results — intermediate types for specialist agent outputs
// ---------------------------------------------------------------------------

export const TransitSearchResultSchema = z.object({
  agent: z.literal("transit"),
  options: z.array(TransitOptionSchema),
  query: z.string(),
});
export type TransitSearchResult = z.infer<typeof TransitSearchResultSchema>;

export const HotelSearchResultSchema = z.object({
  agent: z.literal("hotel"),
  options: z.array(HotelOptionSchema),
  query: z.string(),
});
export type HotelSearchResult = z.infer<typeof HotelSearchResultSchema>;

export const PlacesSearchResultSchema = z.object({
  agent: z.literal("places"),
  options: z.array(PlaceOptionSchema),
  query: z.string(),
});
export type PlacesSearchResult = z.infer<typeof PlacesSearchResultSchema>;

