import React, { useState, useRef } from 'react';
import { AlertCircle, Plus, Minus, RotateCcw } from 'lucide-react';
import { validCoordinates } from '../../services/mapService';
import { useTrip } from '../../context/TripContext';

export const MapFallback: React.FC = () => {
  const {
    currentTrip,
    activeDayIndex,
    selectedStop,
    setSelectedStop,
    focusedStopId,
    setFocusedStopId,
    setIsStopDetailModalOpen
  } = useTrip();

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showConfigNotice, setShowConfigNotice] = useState(true);

  // Consistent 1-indexed day lookup
  const currentDay = currentTrip.itinerary.find((d) => d.dayNumber === activeDayIndex) || currentTrip.itinerary[0];
  const stops = (currentDay?.stops || []).filter(stop => validCoordinates(stop.coordinates));

  const svgWidth = 800;
  const svgHeight = 600;

  const lats = stops.map((s) => s.coordinates.lat);
  const lngs = stops.map((s) => s.coordinates.lng);
  const minLat = Math.min(...lats, currentTrip.cityCenter.lat - 0.05);
  const maxLat = Math.max(...lats, currentTrip.cityCenter.lat + 0.05);
  const minLng = Math.min(...lngs, currentTrip.cityCenter.lng - 0.05);
  const maxLng = Math.max(...lngs, currentTrip.cityCenter.lng + 0.05);

  const project = (lat: number, lng: number) => {
    const padding = 100;
    const x = padding + ((lng - minLng) / (maxLng - minLng || 0.001)) * (svgWidth - padding * 2);
    const y = svgHeight - (padding + ((lat - minLat) / (maxLat - minLat || 0.001)) * (svgHeight - padding * 2));
    return { x, y };
  };

  const projectedStops = stops.map((stop, idx) => ({
    ...stop,
    point: project(stop.coordinates.lat, stop.coordinates.lng),
    order: (idx + 1).toString().padStart(2, '0')
  }));

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetCanvas = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#0B1110',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Dev Configuration Notice Banner */}
      {showConfigNotice && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            backgroundColor: 'rgba(16, 35, 29, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(199, 243, 107, 0.3)',
            borderRadius: '8px',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
            maxWidth: '90%'
          }}
        >
          <AlertCircle size={16} color="var(--route-lime, #C7F36B)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '12px', color: '#FAF9F5', lineHeight: 1.4 }}>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--route-lime, #C7F36B)' }}>
              MAP CONFIGURATION REQUIRED:{' '}
            </span>
            Add <code style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '4px', color: '#6ED6D1' }}>VITE_MAPBOX_TOKEN</code> to your <code style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '4px' }}>.env.local</code> file, then restart the server.
            <span style={{ marginLeft: '8px', color: '#8B918C' }}>(Interactive vector cartographic fallback active)</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowConfigNotice(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#8B918C',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px 6px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Left: Technical Telemetry HUD */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 20,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--route-lime, #C7F36B)',
              boxShadow: '0 0 10px rgba(199, 243, 107, 0.8)'
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--route-lime, #C7F36B)'
            }}
          >
            ROUTE ENGINE
          </span>
        </div>

        <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(216, 213, 203, 0.2)' }} />

        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: '#8B918C' }}>
          <span>
            LAT: <strong style={{ color: '#FAF9F5' }}>{currentTrip.cityCenter.lat.toFixed(4)}° N</strong>
          </span>
          <span>
            LNG: <strong style={{ color: '#FAF9F5' }}>{currentTrip.cityCenter.lng.toFixed(4)}° E</strong>
          </span>
          <span>
            STOPS: <strong style={{ color: 'var(--route-lime, #C7F36B)' }}>{stops.length}</strong>
          </span>
        </div>
      </div>

      {/* Top Right: Canvas Controls */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 20,
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
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.min(z + 0.25, 2.5));
          }}
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
            cursor: 'pointer'
          }}
        >
          <Plus size={16} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.max(z - 0.25, 0.6));
          }}
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
            cursor: 'pointer'
          }}
        >
          <Minus size={16} />
        </button>

        <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(216, 213, 203, 0.15)' }} />

        <button
          onClick={(e) => {
            e.stopPropagation();
            resetCanvas();
          }}
          title="Reset View"
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
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* SVG Cartographic Route Map Canvas */}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{
          width: '100%',
          height: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        <defs>
          <pattern id="carto-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(216, 213, 203, 0.05)" strokeWidth="1" />
          </pattern>
          <pattern id="carto-grid-major" width="160" height="160" patternUnits="userSpaceOnUse">
            <path d="M 160 0 L 0 0 0 160" fill="none" stroke="rgba(216, 213, 203, 0.1)" strokeWidth="1.2" />
          </pattern>

          <filter id="route-lime-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={svgWidth} height={svgHeight} fill="#0B1110" />
        <rect width={svgWidth} height={svgHeight} fill="url(#carto-grid)" />
        <rect width={svgWidth} height={svgHeight} fill="url(#carto-grid-major)" />

        <g stroke="rgba(199, 243, 107, 0.2)" strokeWidth="1">
          <line x1="20" y1="20" x2="40" y2="20" />
          <line x1="20" y1="20" x2="20" y2="40" />
          <line x1={svgWidth - 20} y1="20" x2={svgWidth - 40} y2="20" />
          <line x1={svgWidth - 20} y1="20" x2={svgWidth - 20} y2="40" />
          <line x1="20" y1={svgHeight - 20} x2="40" y2={svgHeight - 20} />
          <line x1="20" y1={svgHeight - 20} x2="20" y2={svgHeight - 40} />
          <line x1={svgWidth - 20} y1={svgHeight - 20} x2={svgWidth - 40} y2={svgHeight - 20} />
          <line x1={svgWidth - 20} y1={svgHeight - 20} x2={svgWidth - 20} y2={svgHeight - 40} />
        </g>

        {projectedStops.length > 1 && (
          <>
            <path
              d={projectedStops.reduce((acc, s, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${s.point.x} ${s.point.y}`, '')}
              fill="none"
              stroke="#C7F36B"
              strokeWidth="10"
              strokeOpacity="0.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={projectedStops.reduce((acc, s, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${s.point.x} ${s.point.y}`, '')}
              fill="none"
              stroke="#C7F36B"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        )}

        {projectedStops.slice(0, -1).map((s, idx) => {
          const next = projectedStops[idx + 1];
          const midX = (s.point.x + next.point.x) / 2;
          const midY = (s.point.y + next.point.y) / 2;
          const seg = s.transitToNext;

          return (
            <g key={`leg-${s.id}-${next.id}`} transform={`translate(${midX}, ${midY})`}>
              <rect
                x="-36"
                y="-11"
                width="72"
                height="22"
                rx="4"
                fill="#10231D"
                stroke="rgba(216, 213, 203, 0.2)"
                strokeWidth="1"
              />
              <text
                x="0"
                y="3.5"
                textAnchor="middle"
                fill="#6ED6D1"
                fontSize="10"
                fontFamily="var(--font-mono, monospace)"
                fontWeight="600"
              >
                {seg ? `${seg.distanceKm}km` : 'link'}
              </text>
            </g>
          );
        })}

        {projectedStops.map((s) => {
          const isSelected = selectedStop?.id === s.id || focusedStopId === s.id;

          return (
            <g
              key={s.id}
              transform={`translate(${s.point.x}, ${s.point.y})`}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedStop(s);
                setFocusedStopId(s.id);
                setIsStopDetailModalOpen(true);
              }}
            >
              {isSelected && (
                <circle
                  r="26"
                  fill="none"
                  stroke="#C7F36B"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.8"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0"
                    to="360"
                    dur="12s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              <circle
                r="18"
                fill={isSelected ? '#C7F36B' : '#10231D'}
                stroke={isSelected ? '#FAF9F5' : 'rgba(216, 213, 203, 0.4)'}
                strokeWidth="2"
                filter="url(#route-lime-glow)"
              />

              <text
                x="0"
                y="4.5"
                textAnchor="middle"
                fill={isSelected ? '#0B1110' : '#FAF9F5'}
                fontSize="12"
                fontFamily="var(--font-mono, monospace)"
                fontWeight="700"
              >
                {s.order}
              </text>

              <g transform="translate(0, 32)">
                <rect
                  x="-65"
                  y="-12"
                  width="130"
                  height="22"
                  rx="4"
                  fill="rgba(11, 17, 16, 0.9)"
                  stroke="rgba(216, 213, 203, 0.15)"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill={isSelected ? '#C7F36B' : '#FAF9F5'}
                  fontSize="11"
                  fontFamily="var(--font-sans, sans-serif)"
                  fontWeight={isSelected ? '600' : '500'}
                >
                  {s.name.length > 16 ? s.name.substring(0, 15) + '…' : s.name}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};