import { useTrip as useTripFromContext } from '../context/TripContext';

export function useTrip() {
  return useTripFromContext();
}
