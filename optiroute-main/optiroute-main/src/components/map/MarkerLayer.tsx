import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapContext } from './MapProvider';
import { useTrip } from '../../context/TripContext';
import { validCoordinates } from '../../services/mapService';
import { imageService } from '../../services/imageService';

export const MarkerLayer: React.FC = () => {
  const { mapInstance } = useMapContext();
  const {
    currentTrip,
    activeDayIndex,
    selectedStop,
    setSelectedStop,
    focusedStopId,
    setFocusedStopId,
    setIsStopDetailModalOpen
  } = useTrip();

  // Consistent 1-indexed day lookup
  const currentDay = currentTrip.itinerary.find((d) => d.dayNumber === activeDayIndex) || currentTrip.itinerary[0];
  const markersRef = useRef<{ [stopId: string]: mapboxgl.Marker }>({});
  const intervalsRef = useRef<{ [stopId: string]: any }>({});

  useEffect(() => {
    if (!mapInstance) return;

    // Clear previous markers & intervals
    Object.values(intervalsRef.current).forEach((t) => clearInterval(t));
    intervalsRef.current = {};
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    if (!currentDay?.stops) return;

    // Preload all stop images in background for instant hover transitions
    imageService.preloadTripImages(currentDay.stops);

    let attractionIndex = 1;

    currentDay.stops.forEach((stop) => {
      if (!validCoordinates(stop.coordinates)) return;
      // Departure and return share one hotel pin.
      if (stop.isHotelDestination && currentDay.stops.some(other => other.isHotelOrigin && other.coordinates.lat === stop.coordinates.lat && other.coordinates.lng === stop.coordinates.lng)) return;
      const isHotel = Boolean(stop.isHotelOrigin || stop.isHotelDestination || stop.category === 'hotel');
      const orderLabel = isHotel ? 'H' : attractionIndex.toString().padStart(2, '0');
      if (!isHotel) {
        attractionIndex++;
      }

      const isSelected = selectedStop?.id === stop.id || focusedStopId === stop.id;
      const images = imageService.getStopImages(stop);
      let currentImgIdx = 0;

      // Outer container: Mapbox controls its transform for geographic placement.
      // We NEVER modify el.style.transform directly to prevent marker jumping to (0,0)!
      const el = document.createElement('div');
      el.className = 'optiroute-marker-container';
      el.style.width = '36px';
      el.style.height = '36px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.cursor = 'pointer';

      // Inner pin: Visual styling and scale animations live strictly on this child div.
      const innerEl = document.createElement('div');
      innerEl.className = 'optiroute-marker-pin';
      innerEl.style.width = isHotel ? '34px' : '30px';
      innerEl.style.height = isHotel ? '34px' : '30px';
      innerEl.style.borderRadius = '50%';
      innerEl.style.display = 'flex';
      innerEl.style.alignItems = 'center';
      innerEl.style.justifyContent = 'center';
      innerEl.style.fontFamily = 'var(--font-mono, monospace)';
      innerEl.style.fontSize = isHotel ? '14px' : '11px';
      innerEl.style.fontWeight = '700';
      innerEl.style.transition = 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease';
      innerEl.style.boxShadow = isSelected
        ? '0 0 0 4px rgba(199, 243, 107, 0.45), 0 8px 18px rgba(0,0,0,0.6)'
        : (isHotel ? '0 0 0 2px rgba(199, 243, 107, 0.4), 0 4px 14px rgba(0,0,0,0.6)' : '0 4px 12px rgba(0,0,0,0.5)');
      innerEl.style.backgroundColor = isSelected ? 'var(--route-lime, #C7F36B)' : '#10231D';
      innerEl.style.color = isSelected ? '#0B1110' : '#FAF9F5';
      innerEl.style.border = isHotel
        ? '2px solid var(--route-lime, #C7F36B)'
        : (isSelected ? '2px solid #FFFFFF' : '1.5px solid rgba(216, 213, 203, 0.35)');
      innerEl.innerText = isHotel ? 'H' : orderLabel;

      if (isSelected) {
        innerEl.style.transform = 'scale(1.12)';
      }

      el.appendChild(innerEl);

      // Rich Hover Popup Window with Rotating Multi-Image Carousel
      const timeStr = stop.scheduledTime ? stop.scheduledTime.split('-')[0].trim() : '09:30 AM';
      const pureVegBadge = stop.dietCompliance?.isPureVeg
        ? '<span style="color: var(--route-lime, #C7F36B); font-weight: 700;">· PURE VEG</span>'
        : '';
      const badgeHeader = isHotel
        ? (stop.isHotelOrigin ? 'BASECAMP DEPARTURE' : 'BASECAMP RETURN')
        : `STOP ${orderLabel}`;

      const popupHtml = `
        <div id="popup-card-${stop.id}" style="width: 270px; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; overflow: hidden; border-radius: 8px; box-shadow: 0 16px 40px rgba(0,0,0,0.85); background: #10231D; border: 1px solid rgba(216, 213, 203, 0.15);">
          <div style="position: relative; width: 100%; height: 130px; overflow: hidden; background: #0B1110;">
            <img id="hover-img-${stop.id}" src="${images[0]}" alt="${stop.name}" style="width: 100%; height: 100%; object-fit: cover; display: block; opacity: 1; transition: opacity 0.22s ease-in-out;" />
            
            <!-- Top Badges -->
            <div style="position: absolute; top: 8px; left: 8px; background: ${isHotel ? '#10231D' : 'var(--route-lime, #C7F36B)'}; color: ${isHotel ? 'var(--route-lime, #C7F36B)' : '#0B1110'}; font-family: monospace; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; border: 1px solid ${isHotel ? 'rgba(199, 243, 107, 0.4)' : 'transparent'}; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">
              ${badgeHeader}
            </div>
            <div style="position: absolute; top: 8px; right: 8px; background: rgba(11, 17, 16, 0.85); color: #FAF9F5; font-family: monospace; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(216, 213, 203, 0.2);">
              ★ ${stop.rating || '4.8'}
            </div>

            <!-- Manual Nav Arrows -->
            <button id="prev-btn-${stop.id}" style="position: absolute; left: 6px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; border-radius: 50%; background: rgba(11,17,16,0.7); border: 1px solid rgba(255,255,255,0.25); color: #fff; font-size: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0;">&lsaquo;</button>
            <button id="next-btn-${stop.id}" style="position: absolute; right: 6px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; border-radius: 50%; background: rgba(11,17,16,0.7); border: 1px solid rgba(255,255,255,0.25); color: #fff; font-size: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0;">&rsaquo;</button>

            <!-- Bottom Dots Indicator -->
            <div id="dots-${stop.id}" style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; z-index: 5;">
              ${images.map((_, i) => `<span id="dot-${stop.id}-${i}" style="width: 5px; height: 5px; border-radius: 50%; background: ${i === 0 ? 'var(--route-lime, #C7F36B)' : 'rgba(255,255,255,0.4)'}; transition: all 0.2s ease;"></span>`).join('')}
            </div>

            <!-- Image Index Counter -->
            <div id="counter-${stop.id}" style="position: absolute; bottom: 6px; right: 8px; background: rgba(0,0,0,0.75); font-family: monospace; font-size: 9px; padding: 1px 5px; border-radius: 3px; color: #FAF9F5; border: 1px solid rgba(255,255,255,0.15);">
              1 / ${images.length}
            </div>
          </div>

          <div style="padding: 12px 14px; background: #10231D; border-top: 1px solid rgba(216, 213, 203, 0.1);">
            <div style="font-size: 13px; font-weight: 600; color: #FAF9F5; margin-bottom: 3px; line-height: 1.3;">
              ${stop.name}
            </div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; font-family: monospace; color: #8B918C; margin-bottom: 6px;">
              <span>${timeStr}</span>
              <span>·</span>
              <span>${stop.durationMinutes} MIN</span>
              ${pureVegBadge}
            </div>
            <p style="font-size: 11px; color: #D8D5CB; margin: 0 0 10px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${stop.description || ''}
            </p>
            <div style="font-size: 10px; font-family: monospace; color: var(--route-lime, #C7F36B); font-weight: 700; display: flex; align-items: center; justify-content: space-between;">
              <span>${isHotel ? 'INSPECT BASECAMP ?' : 'INSPECT LOCATION ?'}</span>
              <span style="color: #6ED6D1; font-size: 9px;">${images.length} PHOTOS</span>
            </div>
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: [0, -22],
        closeButton: false,
        closeOnClick: false,
        maxWidth: '290px',
        className: 'optiroute-hover-popup'
      }).setHTML(popupHtml);

      // Helper function to transition to a specific image index
      const setCardImage = (newIdx: number) => {
        currentImgIdx = (newIdx + images.length) % images.length;
        const imgEl = document.getElementById(`hover-img-${stop.id}`) as HTMLImageElement | null;
        const counterEl = document.getElementById(`counter-${stop.id}`);

        if (imgEl) {
          imgEl.style.opacity = '0.3';
          setTimeout(() => {
            imgEl.src = images[currentImgIdx];
            imgEl.style.opacity = '1';
          }, 110);
        }

        if (counterEl) {
          counterEl.innerText = `${currentImgIdx + 1} / ${images.length}`;
        }

        images.forEach((_, i) => {
          const dot = document.getElementById(`dot-${stop.id}-${i}`);
          if (dot) {
            dot.style.background = i === currentImgIdx ? 'var(--route-lime, #C7F36B)' : 'rgba(255,255,255,0.4)';
            dot.style.transform = i === currentImgIdx ? 'scale(1.25)' : 'scale(1.0)';
          }
        });
      };

      const startRotation = () => {
        if (intervalsRef.current[stop.id]) clearInterval(intervalsRef.current[stop.id]);
        if (images.length > 1) {
          intervalsRef.current[stop.id] = setInterval(() => {
            setCardImage(currentImgIdx + 1);
          }, 1600);
        }
      };

      const stopRotation = () => {
        if (intervalsRef.current[stop.id]) {
          clearInterval(intervalsRef.current[stop.id]);
          delete intervalsRef.current[stop.id];
        }
      };

      // Hover events
      el.addEventListener('mouseenter', () => {
        innerEl.style.transform = 'scale(1.22)';
        innerEl.style.boxShadow = isHotel
          ? '0 0 0 5px rgba(199, 243, 107, 0.6), 0 10px 24px rgba(0,0,0,0.75)'
          : '0 0 0 5px rgba(199, 243, 107, 0.5), 0 10px 22px rgba(0,0,0,0.65)';
        popup.setLngLat([stop.coordinates.lng, stop.coordinates.lat]).addTo(mapInstance);

        setTimeout(() => {
          const prevBtn = document.getElementById(`prev-btn-${stop.id}`);
          const nextBtn = document.getElementById(`next-btn-${stop.id}`);
          const card = document.getElementById(`popup-card-${stop.id}`);

          if (prevBtn) {
            prevBtn.onclick = (e) => {
              e.stopPropagation();
              setCardImage(currentImgIdx - 1);
            };
          }
          if (nextBtn) {
            nextBtn.onclick = (e) => {
              e.stopPropagation();
              setCardImage(currentImgIdx + 1);
            };
          }
          if (card) {
            card.onclick = (e) => {
              e.stopPropagation();
              popup.remove();
              stopRotation();
              setSelectedStop(stop);
              setFocusedStopId(stop.id);
              setIsStopDetailModalOpen(true);
            };
          }
        }, 50);

        startRotation();
      });

      el.addEventListener('mouseleave', () => {
        innerEl.style.transform = isSelected ? 'scale(1.12)' : 'scale(1.0)';
        innerEl.style.boxShadow = isSelected
          ? '0 0 0 4px rgba(199, 243, 107, 0.45), 0 8px 18px rgba(0,0,0,0.6)'
          : (isHotel ? '0 0 0 2px rgba(199, 243, 107, 0.4), 0 4px 14px rgba(0,0,0,0.6)' : '0 4px 12px rgba(0,0,0,0.5)');
        popup.remove();
        stopRotation();
      });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        popup.remove();
        stopRotation();
        setSelectedStop(stop);
        setFocusedStopId(stop.id);
        setIsStopDetailModalOpen(true);
      });

      try {
        if (
          stop.coordinates &&
          typeof stop.coordinates.lng === 'number' &&
          typeof stop.coordinates.lat === 'number' &&
          !isNaN(stop.coordinates.lng) &&
          !isNaN(stop.coordinates.lat)
        ) {
          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([stop.coordinates.lng, stop.coordinates.lat])
            .addTo(mapInstance);

          markersRef.current[stop.id] = marker;
        }
      } catch (err) {
        console.warn('[MarkerLayer] Failed to mount marker for stop:', stop.name, err);
      }
    });

    return () => {
      Object.values(intervalsRef.current).forEach((t) => clearInterval(t));
      intervalsRef.current = {};
      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};
    };
  }, [mapInstance, currentDay, selectedStop, focusedStopId, setSelectedStop, setFocusedStopId, setIsStopDetailModalOpen]);

  return null;
};
