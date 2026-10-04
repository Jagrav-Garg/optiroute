import { RouteEngineRequest, RouteEngineResponse } from '../types';
import { optimizeRouteEngine } from '../utils/routingEngine';

const API_BASE = '/api/routes';

export const routeService = {
  async optimizeRoute(request: RouteEngineRequest): Promise<RouteEngineResponse> {
    try {
      const response = await fetch(`${API_BASE}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Backend not yet running in standalone frontend mode; use deterministic fallback
    }

    return optimizeRouteEngine(request);
  }
};