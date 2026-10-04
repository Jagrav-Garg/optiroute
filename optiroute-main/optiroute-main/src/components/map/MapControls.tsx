import React from 'react';
import { Plus, Minus, Compass, Box, RotateCcw } from 'lucide-react';
import { useMapContext } from './MapProvider';
import { useTrip } from '../../context/TripContext';

export const MapControls: React.FC = () => {
  const { mapInstance, resetView, togglePitch, is3d } = useMapContext();
  const { currentTrip, activeDayIndex } = useTrip();

  // Consistent 1-indexed day lookup
  const currentDay = currentTrip.itinerary.find((d) => d.dayNumber === activeDayIndex) || currentTrip.itinerary[0];

  const handleZoomIn = () => {
    if (mapInstance) mapInstance.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    if (mapInstance) mapInstance.zoomOut({ duration: 300 });
  };

  return (
    <>
      {/* Top Left: Technical Navigation Telemetry HUD */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
          backgroundColor: 'rgba(11, 17, 16, 0.88)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(216, 213, 203, 0.15)',
          borderRadius: '8px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
        }}
      >

        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: '#8B918C' }}>
          <span>
            DIST: <strong style={{ color: '#FAF9F5' }}>{currentDay?.totalDistanceKm || 0} KM</strong>
          </span>
          <span>
            TIME: <strong style={{ color: '#FAF9F5' }}>{currentDay?.totalTransitMinutes || 0} MIN</strong>
          </span>
        </div>
      </div>

      {/* Top Right: Cartographic Viewport Controls */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          backgroundColor: 'rgba(11, 17, 16, 0.88)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(216, 213, 203, 0.15)',
          borderRadius: '8px',
          padding: '6px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
        }}
      >
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#FAF9F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Plus size={16} />
        </button>

        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#FAF9F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Minus size={16} />
        </button>

        <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(216, 213, 203, 0.15)' }} />

        <button
          onClick={togglePitch}
          title="Toggle 3D Perspective Tilt"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: is3d ? 'rgba(199, 243, 107, 0.2)' : 'transparent',
            color: is3d ? 'var(--route-lime, #C7F36B)' : '#FAF9F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (!is3d) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            if (!is3d) e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Box size={16} />
        </button>

        <button
          onClick={resetView}
          title="Reset Camera View"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#FAF9F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </>
  );
};