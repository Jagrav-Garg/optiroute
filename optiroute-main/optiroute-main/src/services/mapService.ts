import { LatLng, ItineraryStop } from '../types';

export function validCoordinates(value: any): boolean {
  return !!value && Number.isFinite(value.lat) && Number.isFinite(value.lng)
    && Math.abs(value.lat) <= 90 && Math.abs(value.lng) <= 180 && !(value.lat === 0 && value.lng === 0);
}

export const mapService = {
  getMapboxToken(): string | null {
    const token = (import.meta as any).env?.VITE_MAPBOX_TOKEN;
    if (!token || token.trim() === '' || token.includes('your_token_here')) {
      return null;
    }
    return token;
  },

  getDarkStyle(): string {
    return 'mapbox://styles/mapbox/dark-v11';
  },

  getLightStyle(): string {
    return 'mapbox://styles/mapbox/light-v11';
  },

  calculateBounds(coordinates: LatLng[]): [[number, number], [number, number]] | null {
    if (!coordinates || coordinates.length === 0) return null;

    let minLat = coordinates[0].lat;
    let maxLat = coordinates[0].lat;
    let minLng = coordinates[0].lng;
    let maxLng = coordinates[0].lng;

    for (const c of coordinates) {
      if (c.lat < minLat) minLat = c.lat;
      if (c.lat > maxLat) maxLat = c.lat;
      if (c.lng < minLng) minLng = c.lng;
      if (c.lng > maxLng) maxLng = c.lng;
    }

    const latPadding = Math.max(0.01, (maxLat - minLat) * 0.15);
    const lngPadding = Math.max(0.01, (maxLng - minLng) * 0.15);

    return [
      [minLng - lngPadding, minLat - latPadding],
      [maxLng + lngPadding, maxLat + latPadding]
    ];
  },

  stopsToGeoJSON(stops: ItineraryStop[]): any {
    return {
      type: 'FeatureCollection',
      features: stops.filter(stop => validCoordinates(stop.coordinates)).map((stop, index) => ({
        type: 'Feature',
        properties: {
          id: stop.id,
          name: stop.name,
          order: index + 1,
          time: stop.scheduledTime,
          category: stop.category
        },
        geometry: {
          type: 'Point',
          coordinates: [stop.coordinates.lng, stop.coordinates.lat]
        }
      }))
    };
  },

  routeToGeoJSON(polyline: LatLng[]): any {
    if (!polyline || polyline.length < 2) {
      return {
        type: 'FeatureCollection',
        features: []
      };
    }
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: polyline.map((c) => [c.lng, c.lat])
      }
    };
  },

  /**
   * Real turn-by-turn road and street pathfinding via Mapbox Directions API.
   * Hugs actual city streets, bridges, and walkways instead of straight lines.
   */
  async fetchDirectionsPath(
    coordinates: LatLng[],
    profile: 'walking' | 'driving' | 'cycling' = 'walking'
  ): Promise<{ polyline: LatLng[]; totalDistanceKm: number; totalDurationMinutes: number; geojson: any } | null> {
    const token = this.getMapboxToken();
    if (!token || coordinates.length < 2) return null;

    try {
      const limited = coordinates.slice(0, 25);
      const coordStr = limited.map((c) => `${c.lng},${c.lat}`).join(';');
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordStr}?geometries=geojson&overview=full&access_token=${token}`;

      const res = await fetch(url);
      if (!res.ok) return null;

      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) return null;

      const route = data.routes[0];
      const coords = route.geometry.coordinates as [number, number][];
      const polyline: LatLng[] = coords.map(([lng, lat]) => ({ lat, lng }));

      return {
        polyline,
        totalDistanceKm: Math.round((route.distance / 1000) * 100) / 100,
        totalDurationMinutes: Math.round(route.duration / 60),
        geojson: {
          type: 'Feature',
          properties: {},
          geometry: route.geometry
        }
      };
    } catch (err) {
      console.warn('Mapbox directions API failed, falling back to direct route', err);
      return null;
    }
  }
};