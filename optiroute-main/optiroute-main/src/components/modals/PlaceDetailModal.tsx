import React, { useState } from 'react';
import { X, MapPin, Clock, Star, CheckCircle2, Navigation, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import { imageService } from '../../services/imageService';

export const PlaceDetailModal: React.FC = () => {
  const { selectedStop, isStopDetailModalOpen, setIsStopDetailModalOpen, setActiveWorkspaceTab, setWorkspaceLayoutMode } = useTrip();
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!isStopDetailModalOpen || !selectedStop) return null;

  const images = imageService.getStopImages(selectedStop);
  const currentImg = images[activePhotoIdx] || selectedStop.imageUrl;
  const isHotel = Boolean(selectedStop.isHotelOrigin || selectedStop.isHotelDestination || selectedStop.category === 'hotel');

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(11, 17, 16, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}
    onClick={() => setIsStopDetailModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FAF9F5',
          border: '1px solid rgba(216, 213, 203, 0.6)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
          color: '#0B1110'
        }}
      >
        {/* Multi-Photo Carousel Banner */}
        <div style={{ position: 'relative', height: '220px', width: '100%', backgroundColor: '#0B1110' }}>
          <img
            src={currentImg}
            alt={selectedStop.name}
            onError={event => imageService.handleImageError(event.currentTarget, images)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.2s ease-in-out' }}
          />

          {/* Top Header Tags */}
          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px', zIndex: 10 }}>
            <span style={{
              backgroundColor: isHotel ? '#10231D' : 'var(--route-lime, #C7F36B)',
              color: isHotel ? 'var(--route-lime, #C7F36B)' : '#0B1110',
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '4px',
              border: isHotel ? '1px solid rgba(199, 243, 107, 0.5)' : 'none'
            }}>
              {isHotel ? '?? BASECAMP' : selectedStop.category.toUpperCase()}
            </span>
            <span style={{
              backgroundColor: 'rgba(11, 17, 16, 0.8)',
              color: '#FAF9F5',
              fontFamily: 'monospace',
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              PHOTO {activePhotoIdx + 1} OF {images.length}
            </span>
          </div>

          <button
            onClick={() => setIsStopDetailModalOpen(false)}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              backgroundColor: 'rgba(11, 17, 16, 0.75)',
              color: '#FAF9F5',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <X size={16} />
          </button>

          {/* Prev / Next Carousel Controls */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevPhoto}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(11, 17, 16, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#FAF9F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 5
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleNextPhoto}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(11, 17, 16, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#FAF9F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 5
                }}
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Filmstrip thumbnails row at bottom of hero */}
          {images.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '6px',
              backgroundColor: 'rgba(11, 17, 16, 0.65)',
              padding: '4px 8px',
              borderRadius: '8px',
              backdropFilter: 'blur(8px)',
              zIndex: 5
            }}>
              {images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIdx(idx);
                  }}
                  style={{
                    width: '34px',
                    height: '24px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: idx === activePhotoIdx ? '2px solid var(--route-lime, #C7F36B)' : '1px solid rgba(255,255,255,0.3)',
                    opacity: idx === activePhotoIdx ? 1 : 0.65,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <img src={img} alt="thumb" onError={event => imageService.handleImageError(event.currentTarget)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#8B918C', fontWeight: 600 }}>
              {selectedStop.scheduledTime || '09:30 AM'} · {selectedStop.durationMinutes} MIN DURATION
            </span>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#10231D' }}>
              ? {selectedStop.rating || '4.8'}
            </span>
          </div>

          <h3 style={{ fontFamily: 'var(--font-serif, "Instrument Serif", Georgia, serif)', fontSize: '26px', fontWeight: 400, color: '#0B1110', margin: '0 0 6px 0' }}>
            {selectedStop.name}
          </h3>

          <p style={{ fontSize: '12px', color: '#6A706A', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 14px 0' }}>
            <MapPin size={13} color="#10231D" />
            <span>{selectedStop.address}</span>
          </p>

          <p style={{ fontSize: '14px', color: '#2C3531', lineHeight: 1.6, margin: '0 0 20px 0' }}>
            {selectedStop.description}
          </p>

          {/* Diet Compliance or Amenities Box */}
          {selectedStop.dietCompliance?.isPureVeg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(199, 243, 107, 0.15)',
              border: '1px solid rgba(16, 35, 29, 0.2)',
              marginBottom: '20px'
            }}>
              <CheckCircle2 size={16} color="#10231D" />
              <div style={{ fontSize: '12px', color: '#10231D', fontWeight: 500 }}>
                100% Pure Vegetarian Verified · Zero onion/garlic options available
              </div>
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(216, 213, 203, 0.6)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {selectedStop.tags?.slice(0, 3).map((tag, i) => (
                <span key={i} style={{ fontSize: '10px', fontFamily: 'monospace', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.05)', color: '#6A706A' }}>
                  #{tag}
                </span>
              ))}
            </div>

            <button
              onClick={() => {
                setIsStopDetailModalOpen(false);
                setActiveWorkspaceTab('map');
                setWorkspaceLayoutMode('map_primary');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#10231D',
                color: 'var(--route-lime, #C7F36B)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '12px',
                fontFamily: 'monospace',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Navigation size={13} />
              <span>LOCATE ON MAP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

