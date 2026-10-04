import React from 'react';
import {
  Compass,
  Calendar,
  DollarSign,
  Plus,
  ShieldCheck,
  Cpu,
  BarChart3,
  X
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import { PRESET_SCENARIOS } from '../../data/mockTrips';

export const Sidebar: React.FC = () => {
  const {
    currentTrip,
    isSidebarOpen,
    setIsSidebarOpen,
    loadScenario,
    setIsNewTripModalOpen,
    activeWorkspaceTab,
    setActiveWorkspaceTab
  } = useTrip();

  if (!isSidebarOpen) return null;

  return (
    <aside
      style={{
        width: '280px',
        backgroundColor: '#0B1110',
        borderRight: '1px solid rgba(216, 213, 203, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        zIndex: 35,
        color: '#FAF9F5'
      }}
    >
      {/* Sidebar Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(216, 213, 203, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#8B918C'
          }}
        >
          NAVIGATION & VIEWS
        </span>
        <button
          onClick={() => setIsSidebarOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#8B918C',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex'
          }}
          title="Close Navigation"
        >
          <X size={15} />
        </button>
      </div>

      {/* Workspace Sub-tabs Navigation */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(216, 213, 203, 0.12)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {[
            { id: 'itinerary', label: 'Day-by-Day Journal', icon: Calendar },
            { id: 'map', label: 'Interactive Route Map', icon: Compass },
            { id: 'fleet', label: 'Agent Fleet & Blackboard', icon: Cpu },
            { id: 'constraints', label: 'Constraint Satisfaction', icon: ShieldCheck },
            { id: 'analytics', label: 'Performance Analytics', icon: BarChart3 }
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeWorkspaceTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveWorkspaceTab(item.id as any)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: isSelected ? 'rgba(199, 243, 107, 0.12)' : 'transparent',
                  color: isSelected ? 'var(--route-lime, #C7F36B)' : '#FAF9F5',
                  fontSize: '12px',
                  fontFamily: 'var(--font-sans, sans-serif)',
                  fontWeight: isSelected ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left',
                  border: isSelected ? '1px solid rgba(199, 243, 107, 0.25)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} color={isSelected ? 'var(--route-lime, #C7F36B)' : '#8B918C'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preset Scenarios */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#8B918C'
            }}
          >
            CURATED TRIPS
          </span>
          <button
            onClick={() => setIsNewTripModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--route-lime, #C7F36B)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              cursor: 'pointer'
            }}
          >
            <Plus size={11} /> NEW
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {PRESET_SCENARIOS.map((s) => {
            const isCurrent = currentTrip.id.includes(s.id.split('-')[0]);
            return (
              <div
                key={s.id}
                onClick={() => loadScenario(s.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: isCurrent ? '#10231D' : 'rgba(255, 255, 255, 0.02)',
                  border: isCurrent ? '1px solid var(--route-lime, #C7F36B)' : '1px solid rgba(216, 213, 203, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#FAF9F5' }}>
                    {s.title.split(':')[0]}
                  </span>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', color: '#8B918C' }}>
                    {s.days}D
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--route-lime, #C7F36B)', fontWeight: 500 }}>
                  ★ {s.highlightConstraint}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div
        style={{
          padding: '14px 18px',
          borderTop: '1px solid rgba(216, 213, 203, 0.12)',
          backgroundColor: '#10231D'
        }}
      >
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: '#8B918C', lineHeight: 1.4 }}>
          Powered by <strong style={{ color: 'var(--route-lime, #C7F36B)' }}>@cline/core</strong> & Route Engine.
        </div>
      </div>
    </aside>
  );
};