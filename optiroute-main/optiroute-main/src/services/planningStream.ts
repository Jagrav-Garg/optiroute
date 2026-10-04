export interface PlanningEvent {
  type: string;
  agent?: string;
  status?: string;
  action?: string;
  attempt?: number;
  maxRetries?: number;
  outputDelta?: string;
  outputReset?: boolean;
  query?: string;
  results?: any[];
  fleet?: any;
  trip?: any;
  message?: any;
}

export async function streamPlanning(endpoint: string, payload: unknown, onEvent: (event: PlanningEvent) => void) {
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' }, body: JSON.stringify(payload) });
  if (!response.ok || !response.body) throw new Error(`Planning request failed (${response.status})`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let result: PlanningEvent | undefined;
  const consume = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line) as PlanningEvent;
    if (event.type === 'error') throw new Error(String(event.message || 'Planning failed'));
    onEvent(event);
    if (event.type === 'itinerary.updated') result = event;
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      const lines = pending.split('\n');
      pending = lines.pop() || '';
      lines.forEach(consume);
      if (done) break;
    }
    consume(pending);
    if (!result?.trip) throw new Error('The agent connection ended before the itinerary was ready');
    return result;
  } finally { reader.releaseLock(); }
}
