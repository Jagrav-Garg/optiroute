import { AgentFleetState } from '../types';

const API_BASE = '/api/agents';

export const agentService = {
  async getAgentStatus(tripId: string): Promise<AgentFleetState | null> {
    try {
      const res = await fetch(`${API_BASE}/${tripId}/status`);
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }
};