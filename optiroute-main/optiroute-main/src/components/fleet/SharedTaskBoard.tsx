import React from 'react';
import {
  Cpu,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';

export const SharedTaskBoard: React.FC = () => {
  const { currentTrip, isAgentStreaming, activeAgent, recalculateRoute } = useTrip();
  const fleet = currentTrip.agentStatus;

  const agentsList = [
    { key: 'coordinator', data: fleet.coordinator, role: 'Blackboard State & Memory' },
    { key: 'transit', data: fleet.transit, role: 'Fares, Routes & Baggage' },
    { key: 'hotel', data: fleet.hotel, role: 'Stays & Pure Veg Breakfast' },
    { key: 'places', data: fleet.places, role: 'Curated Attractions & Dining' },
    { key: 'compiler', data: fleet.compiler, role: 'Schema & Zod Serialization' },
    { key: 'routing', data: fleet.routing, role: 'Route Engine' },
    { key: 'validator', data: fleet.validator, role: 'Constraint Purity & Self-Reflection' }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--bg-app)',
      overflowY: 'auto',
      padding: '32px 40px'
    }}>
      {/* Editorial Header */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-hairline)',
        paddingBottom: '16px',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-sage)', fontWeight: 700 }}>
            Systems Architecture
          </span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 500, color: 'var(--primary)', marginTop: '2px' }}>
            Agent Swarm & Shared Task Board
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Orchestrating stateful coordinator memory (@cline/core) with stateless worker agents (@cline/agents).
          </p>
        </div>

        <button
          onClick={() => recalculateRoute()}
          disabled={isAgentStreaming}
          style={{
            padding: '7px 14px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RotateCcw size={13} className={isAgentStreaming ? 'animate-spin' : ''} />
          <span>Synchronize Swarm</span>
        </button>
      </div>

      {/* Agents Table (Editorial list instead of bloated colorful boxes) */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-subtle)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr 140px 120px',
          padding: '12px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface-soft)',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: 'var(--text-muted)'
        }}>
          <div>Agent Module</div>
          <div>Active Task / Responsibility</div>
          <div>Latency</div>
          <div style={{ textAlign: 'right' }}>Status</div>
        </div>

        {agentsList.map(({ key, data, role }) => {
          const isCurrentActive = activeAgent === key;

          return (
            <div
              key={key}
              style={{
                display: 'grid',
                gridTemplateColumns: '220px 1fr 140px 120px',
                alignItems: 'center',
                padding: '14px 18px',
                borderBottom: '1px solid var(--border-hairline)',
                backgroundColor: isCurrentActive ? 'var(--accent-sage-soft)' : 'transparent',
                fontSize: '13px'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  {data.displayName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {data.packageName}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-primary)' }}>{data.currentAction}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Role: {role}</div>
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                {data.latencyMs}ms ({data.tokensUsed} tokens)
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--accent-emerald)',
                  backgroundColor: 'var(--accent-emerald-soft)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)'
                }}>
                  ✓ Validated
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
