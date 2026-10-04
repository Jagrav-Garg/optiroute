import React from 'react';
import {
  Compass,
  Columns,
  Map,
  List,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Download,
  Plus,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';

export const Navbar: React.FC = () => {
  const {
    currentTrip,
    setCurrentView,
    isSidebarOpen,
    setIsSidebarOpen,
    isChatOpen,
    setIsChatOpen,
    workspaceLayoutMode,
    setWorkspaceLayoutMode,
    setIsNewTripModalOpen,
    setIsExportModalOpen,
    setActiveWorkspaceTab
  } = useTrip();

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: '#0B1110',
        borderBottom: '1px solid rgba(216, 213, 203, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
        zIndex: 40,
        color: '#FAF9F5'
      }}
    >
      {/* Left: Brand + Nav Toggle + Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? 'Collapse Navigation' : 'Expand Navigation'}
          style={{
            padding: '6px',
            color: '#8B918C',
            backgroundColor: isSidebarOpen ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {isSidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
        </button>

        <button
          onClick={() => setCurrentView('landing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0
          }}
          title="Return to Generative Landing Page"
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              backgroundColor: '#10231D',
              border: '1px solid rgba(199, 243, 107, 0.4)',
              color: 'var(--route-lime, #C7F36B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Compass size={14} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#FAF9F5'
            }}
          >
            OPTIROUTE
          </span>
        </button>

        <span style={{ color: 'rgba(216, 213, 203, 0.25)', fontSize: '13px' }}>/</span>

        {/* Current Trip Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#FAF9F5' }}>
            {currentTrip.title}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              padding: '2px 8px',
              backgroundColor: '#10231D',
              border: '1px solid rgba(216, 213, 203, 0.15)',
              color: '#8B918C',
              borderRadius: '4px',
              fontWeight: 600
            }}
          >
            {currentTrip.dates.totalDays} DAYS
          </span>
          {currentTrip.preferences.diet === 'pure_veg' && (
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                padding: '2px 8px',
                backgroundColor: 'rgba(199, 243, 107, 0.1)',
                color: 'var(--route-lime, #C7F36B)',
                border: '1px solid rgba(199, 243, 107, 0.2)',
                borderRadius: '4px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ShieldCheck size={12} /> PURE VEG
            </span>
          )}
        </div>
      </div>

      {/* Center: Canvas View Controls (Canvas Split, Timeline Only, Map Only) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#10231D',
          borderRadius: '6px',
          padding: '3px',
          border: '1px solid rgba(216, 213, 203, 0.12)'
        }}
      >
        <button
          onClick={() => {
            setWorkspaceLayoutMode('split');
            setActiveWorkspaceTab('itinerary');
          }}
          title="Split View: Timeline & Map"
          style={{
            padding: '5px 12px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 600,
            borderRadius: '4px',
            border: 'none',
            backgroundColor: workspaceLayoutMode === 'split' ? 'rgba(199, 243, 107, 0.15)' : 'transparent',
            color: workspaceLayoutMode === 'split' ? 'var(--route-lime, #C7F36B)' : '#8B918C',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Columns size={13} />
          <span>CANVAS</span>
        </button>

        <button
          onClick={() => {
            setWorkspaceLayoutMode('itinerary_primary');
            setActiveWorkspaceTab('itinerary');
          }}
          title="Timeline Focus"
          style={{
            padding: '5px 12px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 600,
            borderRadius: '4px',
            border: 'none',
            backgroundColor: workspaceLayoutMode === 'itinerary_primary' ? 'rgba(199, 243, 107, 0.15)' : 'transparent',
            color: workspaceLayoutMode === 'itinerary_primary' ? 'var(--route-lime, #C7F36B)' : '#8B918C',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <List size={13} />
          <span>JOURNAL</span>
        </button>

        <button
          onClick={() => {
            setWorkspaceLayoutMode('map_primary');
            setActiveWorkspaceTab('map');
          }}
          title="Map Focus"
          style={{
            padding: '5px 12px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 600,
            borderRadius: '4px',
            border: 'none',
            backgroundColor: workspaceLayoutMode === 'map_primary' ? 'rgba(199, 243, 107, 0.15)' : 'transparent',
            color: workspaceLayoutMode === 'map_primary' ? 'var(--route-lime, #C7F36B)' : '#8B918C',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Map size={13} />
          <span>MAP</span>
        </button>
      </div>

      {/* Right: Actions & AI Travel Architect Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          title={isChatOpen ? 'Hide Travel Architect' : 'Open Travel Architect'}
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 700,
            borderRadius: '6px',
            backgroundColor: isChatOpen ? 'var(--route-lime, #C7F36B)' : 'rgba(255, 255, 255, 0.08)',
            border: isChatOpen ? 'none' : '1px solid rgba(216, 213, 203, 0.15)',
            color: isChatOpen ? '#0B1110' : '#FAF9F5',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <MessageSquare size={13} />
          <span>TRAVEL ARCHITECT</span>
        </button>

        <button
          onClick={() => setIsExportModalOpen(true)}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            borderRadius: '6px',
            border: '1px solid rgba(216, 213, 203, 0.15)',
            backgroundColor: 'transparent',
            color: '#8B918C',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Download size={13} />
          <span>Export</span>
        </button>

        <button
          onClick={() => setIsNewTripModalOpen(true)}
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '6px',
            backgroundColor: '#10231D',
            border: '1px solid rgba(199, 243, 107, 0.3)',
            color: 'var(--route-lime, #C7F36B)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Plus size={13} />
          <span>New Trip</span>
        </button>
      </div>
    </header>
  );
};