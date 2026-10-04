import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { LatLng } from '../../types';
import { mapService } from '../../services/mapService';

interface MapContextType {
  mapInstance: mapboxgl.Map | null;
  setMapInstance: (map: mapboxgl.Map | null) => void;
  isMapboxConfigured: boolean;
  activeStopId: string | null;
  setActiveStopId: (id: string | null) => void;
  flyToCoordinates: (coords: LatLng, zoom?: number) => void;
  resetView: () => void;
  togglePitch: () => void;
  is3d: boolean;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{
  children: React.ReactNode;
  defaultCenter?: LatLng;
}> = ({ children, defaultCenter = { lat: 35.6762, lng: 139.6503 } }) => {
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [is3d, setIs3d] = useState<boolean>(false);

  const token = mapService.getMapboxToken();
  const isMapboxConfigured = Boolean(token);

  const flyToCoordinates = useCallback((coords: LatLng, zoom: number = 14.5) => {
    if (mapInstance) {
      mapInstance.flyTo({
        center: [coords.lng, coords.lat],
        zoom,
        speed: 1.2,
        curve: 1.42,
        essential: true
      });
    }
  }, [mapInstance]);

  const resetView = useCallback(() => {
    if (mapInstance) {
      mapInstance.flyTo({
        center: [defaultCenter.lng, defaultCenter.lat],
        zoom: 12.8,
        pitch: 0,
        bearing: 0,
        essential: true
      });
      setIs3d(false);
    }
  }, [mapInstance, defaultCenter]);

  const togglePitch = useCallback(() => {
    if (mapInstance) {
      const nextPitch = is3d ? 0 : 55;
      const nextBearing = is3d ? 0 : -15;
      mapInstance.easeTo({
        pitch: nextPitch,
        bearing: nextBearing,
        duration: 800
      });
      setIs3d(!is3d);
    }
  }, [mapInstance, is3d]);

  return (
    <MapContext.Provider
      value={{
        mapInstance,
        setMapInstance,
        isMapboxConfigured,
        activeStopId,
        setActiveStopId,
        flyToCoordinates,
        resetView,
        togglePitch,
        is3d
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};