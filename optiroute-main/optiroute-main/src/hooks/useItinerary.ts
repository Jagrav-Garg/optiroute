import { useTrip } from '../context/TripContext';
import { ItineraryStop } from '../types';

export function useItinerary() {
  const {
    currentTrip,
    activeDayIndex,
    setActiveDayIndex,
    selectedStop,
    setSelectedStop,
    focusedStopId,
    setFocusedStopId,
    removeStopFromDay,
    addStopToDay,
    swapStopInDay
  } = useTrip();

  // Consistent 1-indexed day lookup
  const currentDay = currentTrip.itinerary.find((d) => d.dayNumber === activeDayIndex) || currentTrip.itinerary[0];

  return {
    allDays: currentTrip.itinerary,
    activeDayIndex,
    setActiveDayIndex,
    currentDay,
    stops: currentDay?.stops || [],
    selectedStop,
    setSelectedStop,
    focusedStopId,
    setFocusedStopId,
    removeStop: (stopId: string) => removeStopFromDay(activeDayIndex, stopId),
    addStop: (stop: ItineraryStop) => addStopToDay(activeDayIndex, stop),
    swapStop: (oldStopId: string, newStop: ItineraryStop) => swapStopInDay(activeDayIndex, oldStopId, newStop)
  };
}