# OptiRoute — Intelligent Navigation Instrument

A multi-agent AI travel planning platform combining **Cline SDK orchestration**, **strict constraint validation**, and a **deterministic Route Engine**.

---

## Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Add Mapbox Access Token (Optional for dev fallback, required for vector maps)
Open `.env.local` and add your Mapbox public token:
```env
VITE_MAPBOX_TOKEN=pk.your_mapbox_public_token_here
```
> **Note:** If no token is provided during development, OptiRoute automatically displays an interactive cartographic route canvas fallback with full pan, zoom, node selection, and route telemetry.

### 4. Run Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173/`.

---

## Architectural Principles

1. **Frontend / Backend Boundary**: The UI communicates via clean service abstractions (`services/routeService.ts`, `services/chatService.ts`, etc.) without embedding agent orchestration logic directly into React components.
2. **Cline Orchestration**:
   - `@cline/core`: Stateful Coordinator Agent maintaining master trip state & blackboard memory.
   - `@cline/agents`: Stateless specialist workers (`TransitAgent`, `HotelAgent`, `PlacesAgent`, `RouteValidationAgent`).
   - `@cline/llms`: Dynamic model routing.
3. **Route Engine**: Deterministic shortest-path pathfinding eliminating spatial hallucinations and zigzagging.
4. **Strict Constraint Satisfaction**: Programmatic verification of dietary restrictions, budget ceilings, and transit timeboxing.
