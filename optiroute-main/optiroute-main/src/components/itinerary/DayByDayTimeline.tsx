import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Footprints,
  Train,
  Car,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Navigation,
  Building,
  Home
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import { ItineraryStop } from '../../types';
import { imageService } from '../../services/imageService';

// Interactive rotating thumbnail for each stop
const StopThumbnailCycler: React.FC<{ stop: ItineraryStop; onClick: () => void }> = ({ stop, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const images = imageService.getStopImages(stop);

  useEffect(() => {
    if (!isHovered || images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }, 1400);
    return () => clearInterval(timer);
  }, [isHovered, images.length]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentIdx(0);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        position: 'relative',
        width: '74px',
        height: '74px',
        borderRadius: '8px',
        overflow: 'hidden',
        flexShrink: 0,
        backgroundColor: '#E8E5DC',
        boxShadow: isHovered ? '0 8px 22px rgba(0, 0, 0, 0.22)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
        cursor: 'pointer',
        transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)'
      }}
      title="Hover to rotate photos · Click to inspect"
    >
      <img
        src={images[currentIdx] || stop.imageUrl}
        alt={stop.name}
        onError={event => imageService.handleImageError(event.currentTarget, images)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transition: 'opacity 0.2s ease-in-out'
        }}
      />

      {/* Mini dots indicator when hovering */}
      {isHovered && images.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '3px',
            zIndex: 3
          }}
        >
          {images.map((_, i) => (
            <span
              key={i}
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: i === currentIdx ? '#C7F36B' : 'rgba(255, 255, 255, 0.6)'
              }}
            />
          ))}
        </div>
      )}

      {/* Badge showing photo count */}
      <div
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          backgroundColor: 'rgba(11, 17, 16, 0.75)',
          color: '#FAF9F5',
          fontSize: '9px',
          fontFamily: 'var(--font-mono, monospace)',
          padding: '1px 5px',
          borderRadius: '3px',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {isHovered ? `${currentIdx + 1}/${images.length}` : `${images.length} photos`}
      </div>
    </div>
  );
};

export const DayByDayTimeline: React.FC = () => {
  const {
    currentTrip,
    activeDayIndex,
    setActiveDayIndex,
    selectedStop,
    setSelectedStop,
    focusedStopId,
    setFocusedStopId,
    setIsStopDetailModalOpen,
    removeStopFromDay,
    setWorkspaceLayoutMode,
    setActiveWorkspaceTab
  } = useTrip();

  const days = currentTrip.itinerary;
  const currentDay = days.find((d) => d.dayNumber === activeDayIndex) || days[0];

  const handleStopClick = (stop: ItineraryStop) => {
    setSelectedStop(stop);
    setFocusedStopId(stop.id);
  };

  const handleInspect = (e: React.MouseEvent, stop: ItineraryStop) => {
    e.stopPropagation();
    setSelectedStop(stop);
    setFocusedStopId(stop.id);
    setIsStopDetailModalOpen(true);
  };

  const handleRemove = (e: React.MouseEvent, stop: ItineraryStop) => {
    e.stopPropagation();
    if (window.confirm(`Remove "${stop.name}" from Day ${currentDay.dayNumber}?`)) {
      removeStopFromDay(currentDay.dayNumber, stop.id);
    }
  };

  let attractionCount = 1;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--paper, #F4F1E8)',
        color: '#0B1110',
        overflowY: 'auto',
        padding: '32px 40px'
      }}
    >
      {/* Day Selector Pill Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(216, 213, 203, 0.6)',
          paddingBottom: '16px',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {days.map((day) => {
            const isSelected = day.dayNumber === activeDayIndex;
            return (
              <button
                key={day.dayNumber}
                onClick={() => setActiveDayIndex(day.dayNumber)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border: isSelected ? '1px solid #10231D' : '1px solid rgba(216, 213, 203, 0.8)',
                  backgroundColor: isSelected ? '#10231D' : 'transparent',
                  color: isSelected ? '#FAF9F5' : '#8B918C',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                DAY {day.dayNumber.toString().padStart(2, '0')}
              </button>
            );
          })}
        </div>

        {/* Day Metric Badges in Monospace */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono, monospace)',
            color: '#8B918C'
          }}
        >
          <span>{currentDay.totalDistanceKm} KM TOTAL</span>
          <span>·</span>
          <span>{currentDay.totalTransitMinutes} MIN TRANSIT</span>
        </div>
      </div>

      {/* Editorial Header */}
      <div style={{ marginBottom: '36px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '11px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#8B918C',
            marginBottom: '4px'
          }}
        >
          DAY {currentDay.dayNumber.toString().padStart(2, '0')} · {currentTrip.destination.toUpperCase()} · CLOSED HOTEL CIRCUIT
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-serif, "Instrument Serif", Georgia, serif)',
            fontSize: '34px',
            fontWeight: 400,
            lineHeight: 1.15,
            color: '#0B1110',
            margin: '0 0 8px 0'
          }}
        >
          {currentDay.title}
        </h2>
        <p style={{ fontSize: '13px', color: '#6A706A', margin: 0 }}>
          {currentDay.theme} — Begins and concludes at {currentTrip.hotels[0]?.name || 'Basecamp Hotel'} with zero city zigzagging.
        </p>
      </div>

      {/* Visual Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {currentDay.stops.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#8B918C' }}>
            No waypoints scheduled for this day. Ask Travel Architect to plan this day.
          </div>
        ) : (
          currentDay.stops.map((stop, idx) => {
            const isLast = idx === currentDay.stops.length - 1;
            const transit = stop.transitToNext;
            const isSelected = selectedStop?.id === stop.id || focusedStopId === stop.id;
            const isHotel = Boolean(stop.isHotelOrigin || stop.isHotelDestination || stop.category === 'hotel');

            const orderLabel = isHotel
              ? (stop.isHotelOrigin ? 'DEPART' : 'RETURN')
              : `STOP ${(attractionCount++).toString().padStart(2, '0')}`;

            const startTimeStr = stop.scheduledTime ? stop.scheduledTime.split('-')[0].trim() : '09:30 AM';

            return (
              <div key={stop.id} style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Waypoint Row */}
                <div
                  onClick={() => handleStopClick(stop)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '20px',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    backgroundColor: isSelected
                      ? 'rgba(199, 243, 107, 0.16)'
                      : (isHotel ? 'rgba(16, 35, 29, 0.04)' : 'transparent'),
                    borderLeft: isSelected
                      ? '3px solid #10231D'
                      : (isHotel ? '3px solid rgba(16, 35, 29, 0.4)' : '3px solid transparent'),
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.035)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = isHotel ? 'rgba(16, 35, 29, 0.04)' : 'transparent';
                  }}
                >
                  {/* Left: Time and Order Node */}
                  <div
                    style={{
                      width: '80px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      flexShrink: 0
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: isSelected ? '#10231D' : '#0B1110'
                      }}
                    >
                      {startTimeStr}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '10px',
                        fontWeight: isHotel ? 700 : 500,
                        color: isHotel ? '#10231D' : '#8B918C',
                        marginTop: '2px',
                        letterSpacing: '0.04em'
                      }}
                    >
                      {isHotel ? 'BASECAMP' : orderLabel}
                    </span>
                  </div>

                  {/* Interactive Thumbnail with Multi-Image Rotation on Hover */}
                  <StopThumbnailCycler
                    stop={stop}
                    onClick={() => {
                      setSelectedStop(stop);
                      setFocusedStopId(stop.id);
                      setIsStopDetailModalOpen(true);
                    }}
                  />

                  {/* Right Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                      <h3
                        style={{
                          fontSize: '17px',
                          fontWeight: 600,
                          color: '#0B1110',
                          margin: '0 0 4px 0',
                          fontFamily: 'var(--font-sans, sans-serif)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>{stop.name}</span>
                      </h3>

                      {/* Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isHotel ? (
                          <span
                            style={{
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono, monospace)',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              backgroundColor: '#10231D',
                              color: 'var(--route-lime, #C7F36B)'
                            }}
                          >
                            {stop.isHotelOrigin ? 'DEPARTURE' : 'RETURN'}
                          </span>
                        ) : null}

                        {stop.dietCompliance?.isPureVeg && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono, monospace)',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(16, 35, 29, 0.08)',
                              color: '#10231D'
                            }}
                          >
                            PURE VEG
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '10px',
                            fontFamily: 'var(--font-mono, monospace)',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                            color: '#6A706A'
                          }}
                        >
                          {stop.durationMinutes}m
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '13px', color: '#6A706A', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                      {stop.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#8B918C' }}>
                      <span>{stop.address}</span>
                      <span>·</span>
                      <button
                        onClick={(e) => handleInspect(e, stop)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '11px',
                          color: '#10231D',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Inspect Details
                      </button>
                      {!isHotel && (
                        <>
                          <span>·</span>
                          <button
                            onClick={(e) => handleRemove(e, stop)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              fontSize: '11px',
                              color: '#A84B4B',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Transit Connector Between Stops */}
                {!isLast && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      margin: '4px 0 4px 38px',
                      paddingLeft: '24px',
                      position: 'relative'
                    }}
                  >
                    {/* Continuous vertical guide line */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '6px',
                        top: 0,
                        bottom: 0,
                        width: '1.5px',
                        backgroundColor: 'rgba(216, 213, 203, 0.9)'
                      }}
                    />

                    {/* Transit info connector pill */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.75)',
                        border: '1px solid rgba(216, 213, 203, 0.6)',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono, monospace)',
                        color: '#343B36',
                        margin: '6px 0',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                      }}
                    >
                      {transit?.mode === 'walk' ? (
                        <Footprints size={12} color="#10231D" />
                      ) : transit?.mode === 'subway' ? (
                        <Train size={12} color="#10231D" />
                      ) : (
                        <Car size={12} color="#10231D" />
                      )}
                      <span>
                        {transit ? `${transit.distanceKm} km · ${transit.durationMinutes} min` : '1.2 km · 15 min'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
