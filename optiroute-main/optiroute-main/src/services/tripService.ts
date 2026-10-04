import { streamPlanning, PlanningEvent } from './planningStream';
import { Trip } from '../types';
import { BASE_TOKYO_TRIP } from '../data/mockTrips';

const API_BASE = '/api/trips';

export const tripService = {
  async getTrip(id: string): Promise<Trip> {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (res.ok) return await res.json();
    } catch {}
    return BASE_TOKYO_TRIP;
  },

  async createTrip(payload: Partial<Trip>, onEvent: (event: PlanningEvent) => void = () => {}): Promise<Trip> {
    const result = await streamPlanning(API_BASE, payload, onEvent);
    return result.trip;
  },

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch {}
    return { ...BASE_TOKYO_TRIP, ...updates } as Trip;
  }
};