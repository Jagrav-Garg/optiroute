import { ChatMessage } from '../types';

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
  async sendMessage(
    content: string,
    context?: { tripId?: string; currentDay?: number }
  ): Promise<ChatMessage> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, context })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Fallback
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      content: `I received: "${content}". Coordinating with Cline agents...`
    };
  },

  subscribeStream(
    tripId: string,
    onEvent: (event: ChatStreamEvent) => void
  ): () => void {
    if (typeof window === 'undefined' || !(window as any).EventSource) {
      return () => {};
    }

    try {
      const eventSource = new EventSource(`${API_BASE}/stream?tripId=${tripId}`);
      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          onEvent(parsed);
        } catch {}
      };
      eventSource.onerror = () => {
        eventSource.close();
      };
      return () => eventSource.close();
    } catch {
      return () => {};
    }
  }
};