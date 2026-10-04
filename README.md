# Multi-Agent Travel Planner

A multi-agent travel planning system built with the **Cline SDK**. Specialist agents work together to search, compile, optimize, and validate complete trip plans.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  User Constraints (budget, dates, travellers, diet)    │
│  Async Events (delay updates, user changes)            │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Orchestration: Coordinator Agent (@cline/core)        │
│  Shared Task Board (trip state, tasks, results)        │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Specialist Agents (@cline/agents)                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │   Transit   │ │    Hotel    │ │   Places    │      │
│  │  Agent      │ │   Agent     │ │   Agent     │      │
│  │  (flights,  │ │  (stays,    │ │  (attractions│     │
│  │   fares,    │ │   check-in, │ │   veg food,  │     │
│  │   baggage)  │ │   location) │ │   hours)     │     │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Plan & Validate                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │  Compiler   │ │   Routing   │ │    Strict   │      │
│  │  Agent      │ │   Engine    │ │  Validation │      │
│  │  (merge +   │ │  (travel    │ │  (budget,   │      │
│  │   schema)   │ │   times,    │ │   timing,   │      │
│  │             │ │    DP TSP)  │ │   hours)    │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Review & Export (JSON output — PDF deferred)           │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

- **TypeScript** with Node.js 22+
- **Cline SDK** (`@cline/sdk`, `@cline/core`) for agent runtime
- **Zod** for type-safe schemas
- **SerpAPI** for flight/hotel/place searches (raw HTTP)
- **Google Maps API** for distance matrix & places (raw HTTP)

## Setup

```bash
# Install dependencies
npm install

# Copy and fill in API keys
cp .env.example .env
# Edit .env with your CLINE_API_KEY, SERPAPI_KEY, GOOGLE_MAPS_API_KEY

# Build
npm run build

# Run demo
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLINE_API_KEY` | Yes | Cline gateway API key for LLM inference |
| `SERPAPI_KEY` | Yes | SerpAPI key for Google Flights/Hotels/Places |
| `GOOGLE_MAPS_API_KEY` | Yes | Google Maps key for Distance Matrix & Places |
| `CLINE_MODEL_ID` | No | Model override (default: `anthropic/claude-sonnet-4.6`) |
| `MAX_ITERATIONS` | No | Max agent loop iterations (default: 10) |

## Project Structure

```
src/
├── index.ts                      # Entry point + runTravelPlanner() demo
├── config.ts                     # Centralized config from env vars
├── schemas/
│   └── trip.ts                   # Zod schemas (UserConstraints, options, plan)
├── tools/
│   ├── serp-search.ts            # serp_search tool (raw SerpAPI)
│   └── google-maps.ts            # google_maps_distance + google_maps_places
├── agents/
│   ├── transit-agent.ts          # search_flights tool plugin
│   ├── hotel-agent.ts            # search_hotels tool plugin
│   ├── places-agent.ts           # search_places tool plugin
│   ├── compiler-agent.ts         # compile_trip tool plugin
│   └── validation-agent.ts       # validate_trip tool plugin
└── routing/
    └── routing-engine.ts         # optimize_route tool (DP TSP)
```

## Agents

### Transit Agent
- **Tool**: `search_flights`
- Queries SerpAPI Google Flights engine
- Returns structured flight options with provider, times, price, stops, baggage

### Hotel Agent
- **Tool**: `search_hotels`
- Queries SerpAPI Google Hotels engine
- Returns hotel options with name, rating, location, price/night, amenities

### Places Agent
- **Tool**: `search_places`
- Combines SerpAPI + Google Maps Places API
- Returns attractions and restaurants with veg-friendliness flags

### Compiler Agent
- **Tool**: `compile_trip`
- Merges all specialist outputs into a `UnifiedTripPlan`
- Selects best options, filters places by constraints, calculates budget
- Validates against Zod schema

### Routing Engine
- **Tool**: `optimize_route`
- Calls Google Maps Distance Matrix for real travel times
- Uses **Held-Karp DP** (exact optimal) for ≤10 stops
- Falls back to **nearest-neighbour greedy** for larger sets

### Validation Agent
- **Tool**: `validate_trip`
- Strict checks: budget compliance, timing overlaps, opening hours, routing
- Returns categorized issues with fix suggestions

## Usage

### As standalone plugins

```typescript
import { Agent } from "@cline/sdk";
import { transitAgentPlugin } from "./agents/transit-agent.js";

const agent = new Agent({
  providerId: "cline",
  modelId: "anthropic/claude-sonnet-4.6",
  apiKey: process.env.CLINE_API_KEY,
  plugins: [transitAgentPlugin],
});

const result = await agent.run("Search flights from JFK to LHR on 2026-11-01");
```

### Full pipeline

```typescript
import { runTravelPlanner } from "./index.js";

const plan = await runTravelPlanner({
  origin: "New York",
  destination: "Paris",
  startDate: "2026-11-01",
  endDate: "2026-11-07",
  budget: 3000,
  travellers: 2,
  diet: "vegetarian",
  pace: "moderate",
  preferences: [],
  currency: "USD",
});
```

## License

MIT
