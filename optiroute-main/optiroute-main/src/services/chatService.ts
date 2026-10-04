import { streamPlanning, PlanningEvent } from './planningStream';

const API_BASE = '/api/chat';

export interface ChatStreamEvent {
  type: 
    | 'agent.started'
    | 'agent.progress'
    | 'agent.completed'
    | 'constraint.updated'
    | 'route.optimizing'
    | 'route.optimized'
    | 'validation.failed'
    | 'itinerary.updated';
  data: any;
}

export const chatService = {
  async sendMessage(content: string, context: { trip: any; currentDay?: number; history?: any[] }, onEvent: (event: PlanningEvent) => void) {
    return streamPlanning(API_BASE, { message: content, context }, onEvent);
  }
};
