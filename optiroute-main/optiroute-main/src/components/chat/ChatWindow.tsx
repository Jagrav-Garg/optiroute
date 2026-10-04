import React, { useRef, useEffect } from 'react';
import { Sparkles, X, Compass, CheckCircle2, ArrowRight } from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import {
  ClarificationCard,
  AgentStatusCard,
  ConstraintUpdateCard,
  PlaceCard,
  HotelCard,
  RouteOptimizationCard,
  FinalItineraryCard
} from './MessageComponents';
import { ChatInput } from './ChatInput';

export const ChatWindow: React.FC = () => {
  const {
    messages,
    isAgentStreaming,
    activeAgent,
    setIsChatOpen,
    currentTrip,
    sendMessage
  } = useTrip();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const followOutputRef = useRef(true);

  useEffect(() => {
    if (followOutputRef.current) messagesEndRef.current?.scrollIntoView({ behavior: isAgentStreaming ? 'auto' : 'smooth' });
  }, [messages, isAgentStreaming]);

  const latestSuggestions = [...messages].reverse().find((m) => m.suggestions && m.suggestions.length > 0)?.suggestions;

  const satisfiedConstraints = currentTrip.constraints.filter((c) => c.status === 'satisfied').length;
  const totalConstraints = currentTrip.constraints.length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#0B1110',
        borderLeft: '1px solid rgba(216, 213, 203, 0.15)',
        position: 'relative',
        color: '#FAF9F5'
      }}
    >
      {/* Travel Architect Header (Section 16) */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(216, 213, 203, 0.15)',
          backgroundColor: '#10231D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.1em',
                color: 'var(--route-lime, #C7F36B)'
              }}
            >
              TRAVEL ARCHITECT
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              color: '#8B918C'
            }}
          >
            <span>{satisfiedConstraints}/{totalConstraints} constraints locked</span>
            <span>·</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isAgentStreaming ? '#6ED6D1' : 'var(--route-lime, #C7F36B)' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isAgentStreaming ? '#6ED6D1' : 'var(--route-lime, #C7F36B)',
                  boxShadow: '0 0 6px currentColor'
                }}
              />
              <span>{isAgentStreaming ? 'Planning…' : 'Active'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsChatOpen(false)}
          title="Collapse Travel Architect"
          style={{
            background: 'none',
            border: 'none',
            color: '#8B918C',
            padding: '6px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FAF9F5')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8B918C')}
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages Stream (Clean, Editorial, Whitespace-Driven) */}
      <div
        onScroll={event => {
          const panel = event.currentTarget;
          followOutputRef.current = panel.scrollHeight - panel.scrollTop - panel.clientHeight < 100;
        }}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                width: '100%'
              }}
            >
              {/* Message Header Label */}
              <div
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  color: '#8B918C',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{isUser ? 'YOU' : 'ARCHITECT'}</span>
                <span>·</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Body (No heavy bubbles, pure typography) */}
              <div
                style={{
                  maxWidth: '92%',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: isUser ? '#0B1110' : '#FAF9F5',
                  backgroundColor: isUser ? 'var(--route-lime, #C7F36B)' : 'rgba(16, 35, 29, 0.5)',
                  border: isUser ? 'none' : '1px solid rgba(216, 213, 203, 0.1)',
                  borderRadius: isUser ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
                  padding: '12px 16px',
                  fontWeight: isUser ? 500 : 400
                }}
              >
                {msg.content}

                {/* Specialized Dynamic Cards */}
                {msg.type === 'clarification' && msg.payload && (
                  <ClarificationCard prompt={msg.payload} messageId={msg.id} />
                )}

                {msg.type === 'agent_status' && msg.payload && (
                  <AgentStatusCard payload={msg.payload} />
                )}

                {msg.type === 'constraint_update' && msg.payload && (
                  <ConstraintUpdateCard constraints={msg.payload.constraints || currentTrip.constraints} />
                )}

                {msg.type === 'place_card' && msg.payload && (
                  <PlaceCard place={msg.payload} />
                )}

                {msg.type === 'hotel_card' && msg.payload && (
                  <HotelCard hotel={msg.payload} />
                )}

                {msg.type === 'route_update' && msg.payload && (
                  <RouteOptimizationCard payload={msg.payload} />
                )}

                {msg.type === 'final_itinerary' && msg.payload && (
                  <FinalItineraryCard itinerary={msg.payload} />
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Suggestions */}
      {latestSuggestions && latestSuggestions.length > 0 && (
        <div
          style={{
            padding: '8px 16px',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            backgroundColor: '#0B1110',
            borderTop: '1px solid rgba(216, 213, 203, 0.08)'
          }}
        >
          {latestSuggestions.map((sugg, i) => (
            <button
              key={i}
              onClick={() => sendMessage(sugg)}
              style={{
                whiteSpace: 'nowrap',
                padding: '6px 12px',
                borderRadius: '999px',
                backgroundColor: 'rgba(16, 35, 29, 0.8)',
                border: '1px solid rgba(216, 213, 203, 0.15)',
                color: '#FAF9F5',
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--route-lime, #C7F36B)';
                e.currentTarget.style.color = 'var(--route-lime, #C7F36B)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(216, 213, 203, 0.15)';
                e.currentTarget.style.color = '#FAF9F5';
              }}
            >
              {sugg}
            </button>
          ))}
        </div>
      )}

      {/* Input Field */}
      <ChatInput />
    </div>
  );
};
