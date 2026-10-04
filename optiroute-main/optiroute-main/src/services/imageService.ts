import { ItineraryStop, Hotel } from '../types';

// In-memory cache for fast instant lookups during user session
const memoryCache = new Map<string, string[]>();

// Pre-curated high-resolution image galleries for Tokyo stops & hotels
const CURATED_GALLERIES: Record<string, string[]> = {
  // Hotel Ryumeikan Tokyo (Basecamp)
  'hotel-ryumeikan': [
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
  ],
  // Cerulean Tower Tokyu Hotel
  'hotel-cerulean': [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
  ],
  // Meiji Jingu Shrine
  'meiji-jingu': [
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80'
  ],
  // Shibuya Crossing & Hachiko
  'shibuya-crossing': [
    'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?auto=format&fit=crop&w=800&q=80'
  ],
  // Ain Soph. Journey (Pure Veg)
  'ain-soph': [
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
  ],
  // Shinjuku Gyoen National Garden
  'shinjuku-gyoen': [
    'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'
  ],
  // Roppongi Hills Observation Deck
  'roppongi-hills': [
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=800&q=80'
  ],
  // teamLab Planets TOKYO
  'teamlab-planets': [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'
  ],
  // Ginza Six
  'ginza-six': [
    'https://images.unsplash.com/photo-1554797589-7241abc22097?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80'
  ],
  // T's Tantan (Tokyo Station)
  'ts-tantan': [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80'
  ],
  // Akihabara Electric Town
  'akihabara': [
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?auto=format&fit=crop&w=800&q=80'
  ],
  // Senso-ji Temple & Asakusa
  'sensoji-temple': [
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80'
  ],
  // Tokyo Skytree
  'tokyo-skytree': [
    'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=800&q=80'
  ]
};

// Fallback thematic pools by category
const CATEGORY_POOLS: Record<string, string[]> = {
  hotel: [
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
  ],
  attraction: [
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=800&q=80'
  ],
  meal: [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80'
  ],
  activity: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'
  ]
};

function toCacheKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

async function fetchWikimediaImages(query: string, limit = 5): Promise<string[]> {
  try {
    const cleanQuery = query.replace(/\(.*?\)/g, '').trim();
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' +
      encodeURIComponent(cleanQuery) +
      '&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*&gsrlimit=' +
      limit;

    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return [];

    const imageUrls: string[] = [];
    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId];
      if (Array.isArray(page.imageinfo)) {
        for (const info of page.imageinfo) {
          const imgUrl = info.thumburl || info.url;
          if (
            imgUrl &&
            !imgUrl.endsWith('.svg') &&
            !imgUrl.endsWith('.ogg') &&
            !imgUrl.endsWith('.pdf')
          ) {
            imageUrls.push(imgUrl);
          }
        }
      }
    }
    return imageUrls.slice(0, limit);
  } catch (err) {
    console.warn('[imageService] Wikimedia search failed for:', query, err);
    return [];
  }
}

async function fetchGooglePlacesImages(query: string): Promise<string[]> {
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  try {
    const findUrl = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=' +
      encodeURIComponent(query) +
      '&inputtype=textquery&fields=photos,place_id&key=' +
      apiKey;

    const res = await fetch(findUrl);
    if (!res.ok) return [];

    const data = await res.json();
    const candidate = data?.candidates?.[0];
    if (!candidate?.photos) return [];

    return candidate.photos.slice(0, 5).map((p: any) => 
      'https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=' +
      p.photo_reference +
      '&key=' +
      apiKey
    );
  } catch {
    return [];
  }
}

export const imageService = {
  preloadImages(urls: string[]): void {
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  },

  preloadTripImages(stops: ItineraryStop[]): void {
    stops.forEach((stop) => {
      const images = this.getStopImages(stop);
      this.preloadImages(images);
    });
  },

  getCuratedKey(name: string): string | null {
    const lower = name.toLowerCase();
    if (lower.includes('ryumeikan')) {
      return 'hotel-ryumeikan';
    }
    if (lower.includes('cerulean')) return 'hotel-cerulean';
    if (lower.includes('meiji') || lower.includes('jingu')) return 'meiji-jingu';
    if (lower.includes('shibuya') && (lower.includes('crossing') || lower.includes('hachiko'))) return 'shibuya-crossing';
    if (lower.includes('ain soph') || lower.includes('journey')) return 'ain-soph';
    if (lower.includes('shinjuku gyoen')) return 'shinjuku-gyoen';
    if (lower.includes('roppongi')) return 'roppongi-hills';
    if (lower.includes('teamlab') || lower.includes('planets')) return 'teamlab-planets';
    if (lower.includes('ginza six')) return 'ginza-six';
    if (lower.includes('tantan') || lower.includes('ts tantan')) return 'ts-tantan';
    if (lower.includes('akihabara')) return 'akihabara';
    if (lower.includes('senso') || lower.includes('asakusa')) return 'sensoji-temple';
    if (lower.includes('skytree')) return 'tokyo-skytree';
    return null;
  },

  getStopImages(stop: ItineraryStop): string[] {
    return this.resolveStopImages(stop).map(url => this.proxyUrl(url)).filter(Boolean);
  },

  proxyUrl(url: string): string {
    if (typeof url !== 'string') return '/photo-unavailable.svg';
    if (url.startsWith('/api/photos') || url === '/photo-unavailable.svg') return url;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' ? `/api/photos?url=${encodeURIComponent(url)}` : '/photo-unavailable.svg';
    } catch { return '/photo-unavailable.svg'; }
  },

  handleImageError(image: HTMLImageElement, alternatives: string[] = []): void {
    const tried = (image.dataset.failedImages || '').split('|');
    tried.push(image.getAttribute('src') || '');
    image.dataset.failedImages = tried.join('|');
    const next = alternatives.map(url => this.proxyUrl(url)).find(url => !tried.includes(url));
    if (image.getAttribute('src') !== '/photo-unavailable.svg') image.src = next || '/photo-unavailable.svg';
  },

  resolveStopImages(stop: ItineraryStop): string[] {
    const cacheKey = toCacheKey(stop.name);

    if (memoryCache.has(cacheKey)) {
      return memoryCache.get(cacheKey)!;
    }

    // 1. If stop already has real web-derived images attached, prioritize them!
    if (stop.images && stop.images.length > 0) {
      memoryCache.set(cacheKey, stop.images);
      return stop.images;
    }

    if (stop.imageUrl) {
      const list = [stop.imageUrl];
      memoryCache.set(cacheKey, list);
      this.fetchStopImagesAsync(stop).catch(() => {});
      return list;
    }

    const curatedKey = this.getCuratedKey(stop.name);
    if (curatedKey && CURATED_GALLERIES[curatedKey]) {
      const gallery = CURATED_GALLERIES[curatedKey];
      memoryCache.set(cacheKey, gallery);
      return gallery;
    }

    const pool = CATEGORY_POOLS[stop.category] || CATEGORY_POOLS.attraction;
    const combined = pool.slice(0, 4);

    memoryCache.set(cacheKey, combined);
    this.fetchStopImagesAsync(stop).catch(() => {});

    return combined;
  },

  getHotelImages(hotel: Hotel): string[] {
    return this.resolveHotelImages(hotel).map(url => this.proxyUrl(url));
  },

  resolveHotelImages(hotel: Hotel): string[] {
    const cacheKey = toCacheKey(hotel.name);
    if (memoryCache.has(cacheKey)) {
      return memoryCache.get(cacheKey)!;
    }
    if (hotel.images && hotel.images.length > 0) {
      memoryCache.set(cacheKey, hotel.images);
      return hotel.images;
    }
    if (hotel.imageUrl) {
      const list = [hotel.imageUrl];
      memoryCache.set(cacheKey, list);
      return list;
    }
    const curatedKey = this.getCuratedKey(hotel.name);
    if (curatedKey && CURATED_GALLERIES[curatedKey]) {
      const gallery = CURATED_GALLERIES[curatedKey];
      memoryCache.set(cacheKey, gallery);
      return gallery;
    }
    return CATEGORY_POOLS.hotel;
  },

  async fetchStopImagesAsync(stop: ItineraryStop): Promise<string[]> {
    const cacheKey = toCacheKey(stop.name);

    const googleImgs = await fetchGooglePlacesImages(stop.name);
    if (googleImgs.length >= 2) {
      memoryCache.set(cacheKey, googleImgs);
      this.preloadImages(googleImgs);
      return googleImgs;
    }

    const wikimediaImgs = await fetchWikimediaImages(stop.name);
    if (wikimediaImgs.length >= 2) {
      const base = stop.imageUrl ? [stop.imageUrl] : [];
      const merged = Array.from(new Set([...base, ...wikimediaImgs])).slice(0, 5);
      memoryCache.set(cacheKey, merged);
      this.preloadImages(merged);
      return merged;
    }

    return this.getStopImages(stop);
  }
};
