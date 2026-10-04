import React, { useState, useEffect } from 'react';
import { LucideIcon, Plane, Building2, MapPin, Route, ShieldCheck, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

import { useTrip } from '../../context/TripContext';

interface AgentSynthesisOverlayProps {
  destination: string;
}

interface AgentTask {
  name: string;
  role: string;
  icon: LucideIcon;
  detail: string;
  delayMs: number;
}

const AGENT_TASKS: AgentTask[] = [
  {
    name: 'Transit Specialist',
    role: 'SerpAPI Google Flights',
    icon: Plane,
    detail: 'Querying live round-trip flight links and transit timetables...',
    delayMs: 1500
  },
  {
    name: 'Hotel Specialist',
    role: 'SerpAPI Google Hotels',
    icon: Building2,
    detail: 'Sourcing boutique accommodations with verified pure-veg breakfast...',
    delayMs: 3800
  },
  {
    name: 'Places & Dining Agent',
    role: 'Google Places + Wikimedia',
    icon: MapPin,
    detail: 'Discovering signature landmarks and certified vegetarian culinary spots...',
    delayMs: 7000
  },
  {
    name: 'DP Routing Engine',
    role: 'OSRM + Held-Karp TSP',
    icon: Route,
    detail: 'Formulating daily closed hotel circuits with zero city zigzagging...',
    delayMs: 11000
  },
  {
    name: 'Strict Validator',
    role: 'Constraint Engine',
    icon: ShieldCheck,
    detail: 'Enforcing hard budget cap, dietary compliance, and timebox buffers...',
    delayMs: 15000
  }
];

export const AgentSynthesisOverlay: React.FC<AgentSynthesisOverlayProps> = ({ destination }) => {
  const { messages } = useTrip();
  const agentStates = [...messages].reverse().find(message => message.type === "agent_status")?.payload?.agents || {};
  const taskRoles = ["transit", "hotel", "places", "routing", "validator"];
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#0B1110',
        color: '#FAF9F5',
        padding: '32px 24px',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        {/* Editorial Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(199, 243, 107, 0.1)',
            border: '1px solid rgba(199, 243, 107, 0.3)',
            borderRadius: '999px',
            padding: '5px 14px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono, monospace)',
            letterSpacing: '0.08em',
            color: '#C7F36B',
            marginBottom: '20px'
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#C7F36B',
              boxShadow: '0 0 8px #C7F36B'
            }}
          />
          MULTI-AGENT FLEET DEPLOYED · LIVE WEB RESEARCH
        </div>

        {/* Big Editorial Heading */}
        <h2
          style={{
            fontFamily: 'var(--font-serif, "Instrument Serif", Georgia, serif)',
            fontSize: '38px',
            fontWeight: 400,
            lineHeight: 1.15,
            margin: '0 0 10px 0',
            color: '#FAF9F5'
          }}
        >
          Synthesizing Journey for {destination}
        </h2>

        <p
          style={{
            fontSize: '14px',
            color: '#8B918C',
            maxWidth: '520px',
            lineHeight: 1.5,
            margin: '0 0 24px 0'
          }}
        >
          Specialist agents are performing live web searches for hotels, attractions, pure-vegetarian dining,
          and compiling an optimal closed-circuit schedule.
        </p>

        {/* Elapsed Timer Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono, monospace)',
            color: '#6ED6D1',
            marginBottom: '32px'
          }}
        >
          <Loader2 size={14} className="animate-spin" />
          <span>ORCHESTRATING FOR {elapsedSeconds}s · PLEASE WAIT A MOMENT</span>
        </div>

        {/* Live Agent Tasks Grid */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            textAlign: 'left'
          }}
        >
          {AGENT_TASKS.map((task, index) => {
            const state = agentStates[taskRoles[index]];
            const isCompleted = state?.status === "completed";
            const isCurrent = state?.status === "running" || state?.status === "re-prompting";
            const Icon = task.icon;

            return (
              <div
                key={task.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  backgroundColor: isCurrent
                    ? 'rgba(16, 35, 29, 0.8)'
                    : isCompleted
                    ? 'rgba(16, 35, 29, 0.4)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isCurrent
                    ? '1px solid rgba(199, 243, 107, 0.4)'
                    : isCompleted
                    ? '1px solid rgba(110, 214, 209, 0.25)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: isCompleted
                      ? 'rgba(110, 214, 209, 0.15)'
                      : isCurrent
                      ? 'rgba(199, 243, 107, 0.15)'
                      : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon
                    size={18}
                    color={isCompleted ? '#6ED6D1' : isCurrent ? '#C7F36B' : '#8B918C'}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: isCurrent || isCompleted ? '#FAF9F5' : '#8B918C'
                      }}
                    >
                      {task.name}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono, monospace)',
                        color: '#6ED6D1',
                        backgroundColor: 'rgba(110, 214, 209, 0.1)',
                        padding: '1px 6px',
                        borderRadius: '3px'
                      }}
                    >
                      {task.role}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: isCurrent ? '#C7F36B' : '#8B918C',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {state?.action || "Waiting for dispatch"}
                  </div>
                </div>

                <div style={{ flexShrink: 0 }}>
                  {isCompleted ? (
                    <CheckCircle2 size={16} color="#6ED6D1" />
                  ) : isCurrent ? (
                    <Loader2 size={16} color="#C7F36B" className="animate-spin" />
                  ) : (
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono, monospace)',
                        color: 'rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      QUEUED
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
