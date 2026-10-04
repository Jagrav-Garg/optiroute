import { DayItinerary } from '../types';

const API_BASE = '/api/itinerary';

export const itineraryService = {
  async getItinerary(tripId: string): Promise<DayItinerary[]> {
    try {
      const res = await fetch(`${API_BASE}/${tripId}`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async updateItinerary(tripId: string, itinerary: DayItinerary[]): Promise<DayItinerary[]> {
    try {
      const res = await fetch(`${API_BASE}/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary })
      });
      if (res.ok) return await res.json();
    } catch {}
    return itinerary;
  }
};