import React from 'react';
import {
  MessageSquare,
  Compass,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import { LandingPage } from '../landing/LandingPage';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ChatWindow } from '../chat/ChatWindow';
import { DayByDayTimeline } from '../itinerary/DayByDayTimeline';
import { InteractiveMap } from '../map/InteractiveMap';
import { SharedTaskBoard } from '../fleet/SharedTaskBoard';
import { ConstraintPanel } from '../constraints/ConstraintPanel';
import { TripAnalytics } from '../analytics/TripAnalytics';
import { NewTripModal } from '../modals/NewTripModal';
import { PlaceDetailModal } from '../modals/PlaceDetailModal';
import { ExportModal } from '../modals/ExportModal';
import { AgentSynthesisOverlay } from '../itinerary/AgentSynthesisOverlay';

export const AppShell: React.FC = () => {
  const {
    currentView,
    isSidebarOpen,
    isChatOpen,
    setIsChatOpen,
    workspaceLayoutMode,
    activeWorkspaceTab,
    isGeneratingTrip,
    generationDestination
  } = useTrip();

  // If in landing view, render the editorial landing page
  if (currentView === 'landing') {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <LandingPage />
        <NewTripModal />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-app)'
    }}>
      {/* Editorial Top Navbar */}
      <Navbar />

      {/* Main Workspace Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Collapsible Left Sidebar */}
        {isSidebarOpen && <Sidebar />}

        {/* Primary Interactive Workspace Canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
          {isGeneratingTrip ? (
            <AgentSynthesisOverlay destination={generationDestination} />
          ) : (
            <>
              {activeWorkspaceTab === 'fleet' && <SharedTaskBoard />}
              {activeWorkspaceTab === 'constraints' && <ConstraintPanel />}
              {activeWorkspaceTab === 'analytics' && <TripAnalytics />}

              {(activeWorkspaceTab === 'itinerary' || activeWorkspaceTab === 'map') && (
                <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
                  {/* Split Canvas: Itinerary on Left, Map on Right */}
                  {workspaceLayoutMode === 'split' && (
                    <>
                      <div style={{
                        width: '50%',
                        height: '100%',
                        borderRight: '1px solid var(--border-subtle)',
                        overflowY: 'auto'
                      }}>
                        <DayByDayTimeline />
                      </div>
                      <div style={{ width: '50%', height: '100%', position: 'relative' }}>
                        <InteractiveMap />
                      </div>
                    </>
                  )}

                  {/* Itinerary Focus Only */}
                  {workspaceLayoutMode === 'itinerary_primary' && (
                    <div style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
                      <DayByDayTimeline />
                    </div>
                  )}

                  {/* Map Focus Only */}
                  {workspaceLayoutMode === 'map_primary' && (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <InteractiveMap />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Collapsible Right Chat Panel */}
        {isChatOpen ? (
          <div style={{
            width: '380px',
            height: '100%',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 30
          }}>
            <ChatWindow />
          </div>
        ) : (
          /* Floating discreet button to summon AI Assistant */
          <button
            onClick={() => setIsChatOpen(true)}
            title="Open AI Travel Architect Assistant"
            style={{
              position: 'absolute',
              bottom: '24px',
              right: '24px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              padding: '10px 16px',
              borderRadius: '999px',
              boxShadow: 'var(--shadow-floating)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 600,
              zIndex: 1000,
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <MessageSquare size={16} />
            <span>AI Assistant</span>
          </button>
        )}
      </div>

      {/* Global Modals */}
      <NewTripModal />
      <PlaceDetailModal />
      <ExportModal />
    </div>
  );
};
