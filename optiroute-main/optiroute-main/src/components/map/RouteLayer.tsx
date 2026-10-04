import React, { useEffect } from 'react';
import { useMapContext } from './MapProvider';
import { useTrip } from '../../context/TripContext';
import { mapService } from '../../services/mapService';

const ROUTE_SOURCE_ID = 'optiroute-active-route';
const ROUTE_LINE_LAYER_ID = 'optiroute-line-main';
const ROUTE_GLOW_LAYER_ID = 'optiroute-line-glow';

export const RouteLayer: React.FC = () => {
  const { mapInstance } = useMapContext();
  const { currentTrip, activeDayIndex } = useTrip();

  // Consistent 1-indexed day lookup
  const currentDay = currentTrip.itinerary.find((d) => d.dayNumber === activeDayIndex) || currentTrip.itinerary[0];

  useEffect(() => {
    if (!mapInstance || !mapInstance.isStyleLoaded()) return;

    let isMounted = true;
    const initialPolyline = currentDay?.routePolyline || [];
    const geojsonData = mapService.routeToGeoJSON(initialPolyline);

    const setupLayers = (data: any) => {
      try {
        if (!mapInstance.getSource(ROUTE_SOURCE_ID)) {
          mapInstance.addSource(ROUTE_SOURCE_ID, {
            type: 'geojson',
            data
          });

          // Ambient subtle glow layer behind route line
          mapInstance.addLayer({
            id: ROUTE_GLOW_LAYER_ID,
            type: 'line',
            source: ROUTE_SOURCE_ID,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#C7F36B',
              'line-width': 8,
              'line-opacity': 0.3,
              'line-blur': 4
            }
          });

          // Sharp primary Route Lime line
          mapInstance.addLayer({
            id: ROUTE_LINE_LAYER_ID,
            type: 'line',
            source: ROUTE_SOURCE_ID,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#C7F36B',
              'line-width': 3.5,
              'line-opacity': 0.95
            }
          });
        } else {
          const s = mapInstance.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource;
          if (s && typeof s.setData === 'function') {
            s.setData(data);
          }
        }
      } catch (err) {
        console.warn('[RouteLayer] Layer setup notice:', err);
      }
    };

    // Render initial polyline (or empty FeatureCollection if none)
    setupLayers(geojsonData);

    // Call Mapbox Directions API for real street-level turn-by-turn pathfinding
    const stopsCoords = currentDay?.stops
      ?.filter((s) => s.coordinates && typeof s.coordinates.lat === 'number' && typeof s.coordinates.lng === 'number')
      .map((s) => s.coordinates) || [];

    if (stopsCoords.length >= 2) {
      mapService.fetchDirectionsPath(stopsCoords, 'walking')
        .then((result) => {
          if (!isMounted || !result) return;
          setupLayers(result.geojson);
        })
        .catch((err) => {
          console.warn('[RouteLayer] Directions fetch notice:', err);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [mapInstance, currentDay, activeDayIndex]);

  return null;
};