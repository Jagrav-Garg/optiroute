import React from 'react';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { AgentStatusCard } from '../src/components/chat/MessageComponents';

const html = renderToStaticMarkup(<AgentStatusCard payload={{ agents: {
  transit: { status: 'completed', action: 'Found 4 flights', output: 'Four real flights found; comparing departure times.' },
  hotel: { status: 're-prompting', action: 'Restarting stay search', attempt: 2 },
  places: { status: 'running', action: 'Resolving the Louvre', reasoning: 'Private provider reasoning must stay hidden' },
  compiler: { status: 'idle', action: 'Waiting for the three specialists' },
  routing: { status: 'idle', action: 'Waiting for coordinates' },
} }} />);
for (const text of ['Transit agent', 'Stay agent', 'Places agent', '1/3 complete', 'Retrying', 'attempt 2/3', 'Resolving the Louvre', 'Planner', 'Four real flights found', 'retry 1/2']) assert(html.includes(text));
assert(!html.includes('Private provider reasoning'));
assert(!html.includes('Routing engine')); // A queued downstream stage is not shown as complete.
const failed = renderToStaticMarkup(<AgentStatusCard payload={{ agents: { hotel: { status: 'error', action: 'Failed after 3 attempts' } }, error: 'Provider unavailable' }} />);
assert(failed.includes('role="alert"'));
assert(failed.includes('Failed after 3 attempts'));
console.log('Agent card rendering checks passed: live states, retry attempts, public activity, errors.');

assert(html.includes('role="log"'));
