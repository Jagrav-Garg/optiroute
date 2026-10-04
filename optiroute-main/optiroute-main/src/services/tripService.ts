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

  async createTrip(payload: Partial<Trip>): Promise<Trip> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60_000)
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Backend createTrip failed (HTTP ${res.status}): ${errText || res.statusText}`);
    }
    return await res.json();
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