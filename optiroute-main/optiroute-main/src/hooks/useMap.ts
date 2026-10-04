import { useState, useCallback } from 'react';
import { useTrip } from '../context/TripContext';
import { LatLng } from '../types';

export function useMap() {
  const {
    currentTrip,
    activeDayIndex,
    selectedStop,
    setSelectedStop,
    focusedStopId,
    setFocusedStopId
  } = useTrip();

  // Consistent 1-indexed day lookup
  const currentDay = currentTrip.itinerary.find((d) => d.dayNumber === activeDayIndex) || currentTrip.itinerary[0];
  const [mapCenter, setMapCenter] = useState<LatLng>(
    currentTrip.cityCenter || { lat: 35.6762, lng: 139.6503 }
  );
  const [zoomLevel, setZoomLevel] = useState<number>(13);

  const focusOnCoordinates = useCallback((coords: LatLng, zoom: number = 15) => {
    setMapCenter(coords);
    setZoomLevel(zoom);
  }, []);

  return {
    center: mapCenter,
    zoom: zoomLevel,
    stops: currentDay?.stops || [],
    polyline: currentDay?.routePolyline || [],
    selectedStop,
    setSelectedStop,
    focusedStopId,
    setFocusedStopId,
    focusOnCoordinates
  };
}