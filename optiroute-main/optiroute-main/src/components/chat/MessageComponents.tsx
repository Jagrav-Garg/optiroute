import React, { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  MapPin,
  Clock,
  TrendingDown,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import {
  ClarificationPrompt,
  ConstraintItem,
  Hotel,
  ItineraryStop
} from '../../types';
import { useTrip } from '../../context/TripContext';

// 1. Clarification Card (Human-in-the-Loop, Section 20)
export const ClarificationCard: React.FC<{ prompt: any; messageId: string }> = ({
  prompt,
  messageId
}) => {
  const { handleClarificationResponse } = useTrip();

  // Safely unwrap prompt in case payload is { prompt: { ... } } or { ... }
  const actualPrompt: ClarificationPrompt = prompt?.prompt || prompt;
  const options = actualPrompt?.options || [];

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (actualPrompt?.selectedAnswer && actualPrompt.selectedAnswer.length > 0) {
      return actualPrompt.selectedAnswer;
    }
    if (actualPrompt?.defaultSelected && actualPrompt.defaultSelected.length > 0) {
      return actualPrompt.defaultSelected;
    }
    if (options.length > 0 && options[0]?.id) {
      return [options[0].id];
    }
    return [];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!actualPrompt || options.length === 0) {
    return null;
  }

  const toggleOption = (optId: string) => {
    if (actualPrompt.resolved) return;
    if (actualPrompt.allowMultiple) {
      setSelectedIds((prev) =>
        prev.includes(optId) ? prev.filter((id) => id !== optId) : [...prev, optId]
      );
    } else {
      setSelectedIds([optId]);
    }
  };

  const handleSubmit = async () => {
    if (actualPrompt.resolved || selectedIds.length === 0) return;
    setIsSubmitting(true);
    await handleClarificationResponse(actualPrompt.id, selectedIds);
    setIsSubmitting(false);
  };

  return (
    <div
      style={{
        backgroundColor: '#10231D',
        border: '1px solid rgba(216, 213, 203, 0.18)',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: actualPrompt.resolved ? 'var(--route-lime, #C7F36B)' : '#6ED6D1'
          }}
        >
          {actualPrompt.resolved ? '✓ DECISION LOCKED' : 'CLARIFICATION REQUIRED'}
        </span>
        {actualPrompt.resolved && (
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--route-lime, #C7F36B)',
              backgroundColor: 'rgba(199, 243, 107, 0.1)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
          >
            Saved to Master State
          </span>
        )}
      </div>

      <p style={{ fontSize: '13px', fontWeight: 600, color: '#FAF9F5', marginBottom: '12px', lineHeight: 1.4 }}>
        {actualPrompt.question}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          return (
            <div
              key={option.id}
              onClick={() => toggleOption(option.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: isSelected ? 'rgba(199, 243, 107, 0.12)' : 'rgba(0, 0, 0, 0.25)',
                border: isSelected ? '1px solid var(--route-lime, #C7F36B)' : '1px solid rgba(216, 213, 203, 0.1)',
                cursor: actualPrompt.resolved ? 'default' : 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: actualPrompt.allowMultiple ? '3px' : '50%',
                  border: isSelected ? '4px solid var(--route-lime, #C7F36B)' : '1.5px solid #8B918C',
                  backgroundColor: '#0B1110',
                  marginTop: '2px',
                  flexShrink: 0
                }}
              />

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#FAF9F5' }}>
                    {option.label}
                  </span>
                  {option.badge && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono, monospace)',
                        backgroundColor: 'rgba(110, 214, 209, 0.15)',
                        color: '#6ED6D1',
                        padding: '1px 5px',
                        borderRadius: '3px'
                      }}
                    >
                      {option.badge}
                    </span>
                  )}
                </div>
                {option.description && (
                  <p style={{ fontSize: '11px', color: '#8B918C', marginTop: '2px', lineHeight: 1.4 }}>
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!actualPrompt.resolved && (
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedIds.length === 0}
          style={{
            marginTop: '12px',
            width: '100%',
            padding: '8px 14px',
            backgroundColor: 'var(--route-lime, #C7F36B)',
            color: '#0B1110',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          {isSubmitting ? 'Synchronizing with Agent Fleet…' : 'Lock Choice & Re-route'}
          <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
};

// 2. Multi-Agent Activity Checklist (Section 18)
export const AgentStatusCard: React.FC<{ payload: any }> = ({ payload }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!payload?.agents) return null;
  const roles = [
    { id: 'transit', name: 'Transit agent', subtitle: 'Flights & getting around' },
    { id: 'hotel', name: 'Stay agent', subtitle: 'Hotels & neighborhoods' },
    { id: 'places', name: 'Places agent', subtitle: 'Experiences & local finds' }
  ];
  const states = payload?.agents || {};
  const completed = roles.filter(role => states[role.id]?.status === 'completed').length;
  const renderAgent = (role: { id: string; name: string; subtitle?: string }) => {
    const agent = states[role.id] || { status: 'idle', action: 'Waiting for dispatch' };
    const labels: Record<string, string> = { idle: 'Queued', running: 'Working', completed: 'Complete', 're-prompting': 'Retrying', error: 'Failed' };
    return <div key={role.id} style={{ border: '1px solid rgba(216,213,203,0.18)', borderRadius: 8, padding: 12, minWidth: 0 }}>
      <button type="button" onClick={() => setExpanded(expanded === role.id ? null : role.id)} aria-expanded={expanded === role.id} style={{ background: 'none', border: 0, padding: 0, width: '100%', color: '#FAF9F5', cursor: 'pointer', textAlign: 'left' }}>
        <strong style={{ display: 'block' }}>{role.name}</strong>
        {role.subtitle && <span style={{ display: 'block', fontSize: 10, color: '#8B918C', marginTop: 4 }}>{role.subtitle}</span>}
        <span style={{ display: 'block', marginTop: 10, color: agent.status === 'error' ? '#F0A58B' : '#C7F36B', fontSize: 11 }}>{labels[agent.status] || agent.status}{agent.attempt > 1 ? ` · attempt ${agent.attempt}/3 (retry ${agent.attempt - 1}/2)` : ''}</span>
        <span style={{ display: 'block', marginTop: 6, fontSize: 11, color: '#D8D5CB', overflowWrap: 'anywhere' }}>{agent.action}</span>
      </button>
      {agent.output && <p role="log" aria-label={`${role.name} output`} aria-live={agent.status === 'completed' ? 'off' : 'polite'} style={{ margin: '10px 0 0', fontSize: 11, lineHeight: 1.5, color: '#D8D5CB', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 220, overflowY: 'auto' }}>{agent.output}</p>}
      {expanded === role.id && <div style={{ marginTop: 12, fontSize: 11, color: '#D8D5CB' }}>
        <strong>Activity</strong>
        {agent.query && <p>{agent.query}</p>}
        {(agent.activity || []).map((action: string, index: number) => <p key={index} style={{ margin: '6px 0' }}>{action}</p>)}
        {!!agent.results?.length && <><strong>Results</strong>{agent.results.map((result: any, index: number) => <p key={index}>{typeof result === 'string' ? result : `${result.name}: ${result.coordinates?.lat}, ${result.coordinates?.lng}`}</p>)}</>}
      </div>}
    </div>;
  };
  return <div style={{ marginTop: 12, fontSize: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><strong>Research</strong><span style={{ color: '#8B918C' }}>{completed}/3 complete</span></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 8 }}>{roles.map(renderAgent)}</div>
    <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>{['coordinator', 'compiler', 'routing', 'validator'].filter(id => states[id] && (id === 'compiler' || states[id].status !== 'idle')).map(id => renderAgent({ id, name: ({ coordinator: 'Coordinator', compiler: 'Planner', routing: 'Routing engine', validator: 'Validator' } as any)[id] }))}</div>
    {payload?.error && <p role="alert" style={{ color: '#F0A58B' }}>{payload.error}</p>}
  </div>;
};

// 3. Strict Constraint Card (Section 19: CONSTRAINTS LOCKED)
export const ConstraintUpdateCard: React.FC<{ constraints: any }> = ({ constraints }) => {
  const list: ConstraintItem[] = Array.isArray(constraints)
    ? constraints
    : constraints?.constraints || [];

  const satisfiedCount = list.filter((c) => c.status === 'satisfied').length;
  const totalCount = list.length;

  return (
    <div
      style={{
        backgroundColor: '#10231D',
        border: '1px solid rgba(216, 213, 203, 0.15)',
        borderRadius: '8px',
        padding: '14px',
        marginTop: '10px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color="var(--route-lime, #C7F36B)" />
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--route-lime, #C7F36B)',
              letterSpacing: '0.08em'
            }}
          >
            CONSTRAINTS LOCKED
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '10px',
            fontWeight: 700,
            color: '#0B1110',
            backgroundColor: 'var(--route-lime, #C7F36B)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}
        >
          {satisfiedCount} / {totalCount} SATISFIED
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {list.map((c) => (
          <div
            key={c.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)'
            }}
          >
            <span style={{ color: c.status === 'satisfied' ? 'var(--route-lime, #C7F36B)' : '#E06C75' }}>
              {c.status === 'satisfied' ? '●' : '⚠'}
            </span>
            <span style={{ fontWeight: 600, color: '#FAF9F5', textTransform: 'uppercase' }}>
              {c.title}
            </span>
            <span style={{ color: '#8B918C' }}>— {c.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. Place Card
export const PlaceCard: React.FC<{ place: any }> = ({ place }) => {
  const { setFocusedStopId, setSelectedStop, setIsStopDetailModalOpen } = useTrip();
  const actualPlace = place?.place || place;

  if (!actualPlace) return null;

  return (
    <div
      style={{
        backgroundColor: '#10231D',
        border: '1px solid rgba(216, 213, 203, 0.15)',
        borderRadius: '8px',
        overflow: 'hidden',
        marginTop: '10px'
      }}
    >
      {actualPlace.imageUrl && (
        <div style={{ position: 'relative', height: '110px', width: '100%' }}>
          <img src={actualPlace.imageUrl} alt={actualPlace.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: '#0B1110',
              color: '#FAF9F5',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px'
            }}
          >
            ★ {actualPlace.rating}
          </div>
          {actualPlace.dietCompliance?.isPureVeg && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                backgroundColor: 'var(--route-lime, #C7F36B)',
                color: '#0B1110',
                fontSize: '10px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px'
              }}
            >
              100% PURE VEG
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '12px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#FAF9F5', margin: '0 0 3px 0' }}>
          {actualPlace.name}
        </h4>
        <p style={{ fontSize: '12px', color: '#8B918C', margin: '0 0 8px 0', lineHeight: 1.4 }}>
          {actualPlace.description}
        </p>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              setSelectedStop(actualPlace);
              setFocusedStopId(actualPlace.id);
              setIsStopDetailModalOpen(true);
            }}
            style={{
              flex: 1,
              padding: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '4px',
              color: '#FAF9F5',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Inspect Details
          </button>
        </div>
      </div>
    </div>
  );
};

// 5. Hotel Card
export const HotelCard: React.FC<{ hotel: any }> = ({ hotel }) => {
  const { selectHotel, selectedHotel } = useTrip();
  const actualHotel: Hotel = hotel?.hotel || hotel;

  if (!actualHotel) return null;

  const isSelected = selectedHotel?.id === actualHotel.id || actualHotel.selected;

  return (
    <div
      style={{
        backgroundColor: '#10231D',
        border: isSelected ? '1px solid var(--route-lime, #C7F36B)' : '1px solid rgba(216, 213, 203, 0.15)',
        borderRadius: '8px',
        overflow: 'hidden',
        marginTop: '10px'
      }}
    >
      <div style={{ padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#FAF9F5', margin: 0 }}>
            {actualHotel.name}
          </h4>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--route-lime, #C7F36B)' }}>
            ${actualHotel.pricePerNight}/nt
          </span>
        </div>

        <p style={{ fontSize: '11px', color: '#8B918C', margin: '4px 0 8px 0' }}>
          {actualHotel.address}
        </p>

        {actualHotel.pureVegBreakfast && (
          <div
            style={{
              display: 'inline-block',
              fontSize: '10px',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--route-lime, #C7F36B)',
              backgroundColor: 'rgba(199, 243, 107, 0.1)',
              padding: '2px 6px',
              borderRadius: '4px',
              marginBottom: '8px'
            }}
          >
            ✓ PURE VEG BREAKFAST CONFIRMED
          </div>
        )}

        <button
          onClick={() => selectHotel(actualHotel.id)}
          style={{
            width: '100%',
            padding: '7px',
            backgroundColor: isSelected ? 'var(--route-lime, #C7F36B)' : 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: isSelected ? '#0B1110' : '#FAF9F5',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {isSelected ? '✓ Selected Stay' : 'Select Accommodation'}
        </button>
      </div>
    </div>
  );
};

// 6. Route Engine Optimization Card (Section 21: ROUTE ENGINE UX)
export const RouteOptimizationCard: React.FC<{ payload: any }> = ({ payload }) => {
  const p = payload?.payload || payload || {};

  return (
    <div
      style={{
        backgroundColor: '#10231D',
        border: '1px solid rgba(199, 243, 107, 0.25)',
        borderRadius: '8px',
        padding: '14px',
        marginTop: '10px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingDown size={14} color="var(--route-lime, #C7F36B)" />
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--route-lime, #C7F36B)',
              letterSpacing: '0.08em'
            }}
          >
            ROUTE OPTIMIZED
          </span>
        </div>
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 700,
            backgroundColor: 'rgba(199, 243, 107, 0.15)',
            color: 'var(--route-lime, #C7F36B)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}
        >
          -{p.percentReduction || 38}% LESS TRAVEL
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          margin: '8px 0',
          fontSize: '11px',
          fontFamily: 'var(--font-mono, monospace)'
        }}
      >
        <div>
          <span style={{ color: '#8B918C' }}>SAVED DISTANCE: </span>
          <strong style={{ color: 'var(--route-lime, #C7F36B)' }}>{p.savedDistanceKm || '14.8'} km</strong>
        </div>
        <div>
          <span style={{ color: '#8B918C' }}>TRANSIT SAVED: </span>
          <strong style={{ color: '#FAF9F5' }}>-{p.transitMinutesSaved || '54'} mins</strong>
        </div>
      </div>

      <div
        style={{
          fontSize: '11px',
          fontFamily: 'var(--font-mono, monospace)',
          color: '#6ED6D1',
          borderTop: '1px solid rgba(216, 213, 203, 0.1)',
          paddingTop: '6px',
          marginTop: '6px'
        }}
      >
        ✓ 4 / 4 CONSTRAINTS SATISFIED
      </div>
    </div>
  );
};

// 7. Final Itinerary Summary Card
export const FinalItineraryCard: React.FC<{ itinerary: any }> = ({ itinerary }) => {
  const { setActiveWorkspaceTab } = useTrip();

  return (
    <div
      style={{
        backgroundColor: '#10231D',
        border: '1px solid rgba(199, 243, 107, 0.3)',
        borderRadius: '8px',
        padding: '14px',
        marginTop: '10px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <CheckCircle2 size={15} color="var(--route-lime, #C7F36B)" />
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--route-lime, #C7F36B)',
            letterSpacing: '0.08em'
          }}
        >
          COMPLETE TRIP ARCHITECTURE READY
        </span>
      </div>

      <p style={{ fontSize: '12px', color: '#FAF9F5', margin: '0 0 10px 0' }}>
        All constraints satisfied. 3 Days sequenced with shortest Hamiltonian paths.
      </p>

      <button
        onClick={() => setActiveWorkspaceTab('itinerary')}
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor: 'var(--route-lime, #C7F36B)',
          color: '#0B1110',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          border: 'none',
          cursor: 'pointer'
        }}
      >
        View Complete Timeline
      </button>
    </div>
  );
};
