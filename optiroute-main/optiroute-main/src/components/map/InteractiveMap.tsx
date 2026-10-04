import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapProvider, useMapContext } from './MapProvider';
import { MapController } from './MapController';
import { RouteLayer } from './RouteLayer';
import { MarkerLayer } from './MarkerLayer';
import { MapControls } from './MapControls';
import { MapFallback } from './MapFallback';
import { useTrip } from '../../context/TripContext';
import { mapService } from '../../services/mapService';

const MapboxMapInner: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { setMapInstance, isMapboxConfigured } = useMapContext();
  const { currentTrip } = useTrip();

  const cityLat = currentTrip.cityCenter?.lat || 35.6762;
  const cityLng = currentTrip.cityCenter?.lng || 139.6503;

  // Initialize Map once
  useEffect(() => {
    const token = mapService.getMapboxToken();
    if (!token || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: mapService.getDarkStyle(),
      center: [cityLng, cityLat],
      zoom: 12.8,
      pitch: 0,
      bearing: 0,
      attributionControl: false
    });

    mapRef.current = map;

    map.on('load', () => {
      setMapInstance(map);
    });

    return () => {
      try {
        map.remove();
      } catch (e) {
        console.warn('[InteractiveMap] Map cleanup notice:', e);
      }
      mapRef.current = null;
      setMapInstance(null);
    };
  }, [setMapInstance]);

  // Smoothly flyTo new city center when destination coordinates change
  useEffect(() => {
    if (!mapRef.current) return;
    if (typeof cityLat === 'number' && typeof cityLng === 'number' && !isNaN(cityLat) && !isNaN(cityLng)) {
      try {
        mapRef.current.flyTo({
          center: [cityLng, cityLat],
          zoom: 12.8,
          duration: 1200
        });
      } catch (e) {
        console.warn('[InteractiveMap] flyTo notice:', e);
      }
    }
  }, [cityLat, cityLng]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <MapController />
      <RouteLayer />
      <MarkerLayer />
      <MapControls />
    </div>
  );
};

export const InteractiveMap: React.FC = () => {
  const token = mapService.getMapboxToken();

  return (
    <MapProvider>
      {token ? <MapboxMapInner /> : <MapFallback />}
    </MapProvider>
  );
};