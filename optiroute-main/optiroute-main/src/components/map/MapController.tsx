import React, { useEffect } from 'react';
import { useMapContext } from './MapProvider';
import { useTrip } from '../../context/TripContext';
import { mapService } from '../../services/mapService';

export const MapController: React.FC = () => {
  const { mapInstance, flyToCoordinates } = useMapContext();
  const { currentTrip, activeDayIndex, focusedStopId, selectedStop } = useTrip();

  // Consistent 1-indexed day lookup
  const currentDay = currentTrip.itinerary.find((d) => d.dayNumber === activeDayIndex) || currentTrip.itinerary[0];

  // Auto-focus on stop when selected from itinerary
  useEffect(() => {
    if (!mapInstance) return;

    try {
      if (selectedStop?.coordinates && typeof selectedStop.coordinates.lat === 'number') {
        flyToCoordinates(selectedStop.coordinates, 15);
        return;
      }

      if (focusedStopId) {
        const found = currentDay?.stops?.find((s) => s.id === focusedStopId);
        if (found?.coordinates && typeof found.coordinates.lat === 'number') {
          flyToCoordinates(found.coordinates, 15);
        }
      }
    } catch (e) {
      console.warn('[MapController] flyTo notice:', e);
    }
  }, [selectedStop, focusedStopId, mapInstance, flyToCoordinates, currentDay]);

  // Fit bounds when active day changes
  useEffect(() => {
    if (!mapInstance || !currentDay?.stops?.length) return;

    try {
      const coords = currentDay.stops
        .filter((s) => s.coordinates && typeof s.coordinates.lat === 'number' && typeof s.coordinates.lng === 'number')
        .map((s) => s.coordinates);

      if (coords.length > 0) {
        const bounds = mapService.calculateBounds(coords);
        if (bounds) {
          mapInstance.fitBounds(bounds, {
            padding: { top: 80, bottom: 80, left: 80, right: 80 },
            maxZoom: 14.5,
            duration: 1200
          });
        }
      }
    } catch (e) {
      console.warn('[MapController] fitBounds notice:', e);
    }
  }, [activeDayIndex, mapInstance, currentDay]);

  return null;
};