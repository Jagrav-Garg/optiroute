import { ConstraintItem } from '../types';

const API_BASE = '/api/constraints';

export const constraintService = {
  async getConstraints(tripId: string): Promise<ConstraintItem[]> {
    try {
      const res = await fetch(`${API_BASE}/${tripId}`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async updateConstraint(
    tripId: string,
    constraintId: string,
    updates: Partial<ConstraintItem>
  ): Promise<ConstraintItem> {
    try {
      const res = await fetch(`${API_BASE}/${tripId}/${constraintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch {}
    return { id: constraintId, ...updates } as ConstraintItem;
  }
};