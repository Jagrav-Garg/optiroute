import { useState, useCallback } from 'react';
import { useTrip } from '../context/TripContext';
import { routeService } from '../services/routeService';
import { RouteEngineRequest, RouteEngineResponse } from '../types';

export function useRoute() {
  const { currentTrip, activeDayIndex, recalculateRoute } = useTrip();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastOptimizedResponse, setLastOptimizedResponse] = useState<RouteEngineResponse | null>(null);

  // Consistent 1-indexed day lookup
  const currentDay = currentTrip.itinerary.find((d) => d.dayNumber === activeDayIndex) || currentTrip.itinerary[0];

  const optimizeDay = useCallback(async (dayIndex?: number) => {
    const targetDayNumber = dayIndex !== undefined ? dayIndex : activeDayIndex;
    const targetDay = currentTrip.itinerary.find((d) => d.dayNumber === targetDayNumber) || currentTrip.itinerary[0];
    if (!targetDay) return;

    setIsOptimizing(true);
    try {
      const req: RouteEngineRequest = {
        locations: targetDay.stops,
        date: targetDay.date,
        constraints: {
          maxDailyTransitMinutes: 120,
          preserveFirstStop: true
        }
      };

      const result = await routeService.optimizeRoute(req);
      setLastOptimizedResponse(result);
      recalculateRoute(targetDayNumber);
      return result;
    } finally {
      setIsOptimizing(false);
    }
  }, [activeDayIndex, currentTrip, recalculateRoute]);

  return {
    metrics: currentTrip.route,
    isOptimizing,
    currentDayPolyline: currentDay?.routePolyline || [],
    currentDayDistanceKm: currentDay?.totalDistanceKm || 0,
    currentDayTransitMinutes: currentDay?.totalTransitMinutes || 0,
    efficiencyScore: currentDay?.efficiencyScore || 98,
    optimizeDay,
    reoptimizeAll: () => recalculateRoute(),
    lastOptimizedResponse
  };
}