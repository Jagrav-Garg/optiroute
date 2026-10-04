import { Trip, TripScenario, ChatMessage, Hotel, Restaurant, Attraction } from '../types';
import { optimizeTripItinerary } from '../utils/routingEngine';

export const TOKYO_HOTELS: Hotel[] = [
  {
    id: 'hotel-1',
    name: 'Hotel Ryumeikan Tokyo',
    rating: 4.8,
    stars: 4,
    pricePerNight: 165,
    totalPrice: 495,
    address: '1-3-22 Yaesu, Chuo-ku, Tokyo 103-0028',
    coordinates: { lat: 35.6823, lng: 139.7702 },
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    amenities: ['Pure Veg Breakfast Option', 'Tokyo Station 3m Walk', 'High-Speed WiFi', 'Luggage Forwarding', 'Quiet Rooms'],
    pureVegBreakfast: true,
    transitProximityScore: 98,
    selected: true
  },
  {
    id: 'hotel-2',
    name: 'Cerulean Tower Tokyu Hotel',
    rating: 4.9,
    stars: 5,
    pricePerNight: 235,
    totalPrice: 705,
    address: '26-1 Sakuragaokacho, Shibuya-ku, Tokyo 150-8512',
    coordinates: { lat: 35.6562, lng: 139.6998 },
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    amenities: ['Skyline Bar', 'Shibuya Scramble 5m', 'Spa & Wellness', 'Dedicated Concierge', 'Valet'],
    pureVegBreakfast: true,
    transitProximityScore: 95,
    selected: false
  },
  {
    id: 'hotel-3',
    name: 'The Gate Hotel Asakusa Kaminarimon',
    rating: 4.7,
    stars: 4,
    pricePerNight: 140,
    totalPrice: 420,
    address: '2-16-11 Kaminarimon, Taito-ku, Tokyo 111-0034',
    coordinates: { lat: 35.7115, lng: 139.7963 },
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    amenities: ['Terrace View of Skytree', 'French Bistro with Veg Menu', 'Next to Metro', 'Boutique Design'],
    pureVegBreakfast: false,
    transitProximityScore: 91,
    selected: false
  }
];

export const TOKYO_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-1',
    name: "T's Tantan (Tokyo Station)",
    cuisine: 'Pure Vegan Ramen & Gyoza',
    priceRange: '$$',
    rating: 4.8,
    coordinates: { lat: 35.6812, lng: 139.7671 },
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    isPureVeg: true,
    isJainFriendly: true,
    dietCertification: 'Certified 100% Plant-Based (Zero Animal Broth/Fish Sauce)',
    distanceFromHotelKm: 0.3
  },
  {
    id: 'rest-2',
    name: 'Ain Soph. Journey Shinjuku',
    cuisine: 'Organic Vegan & Gluten-Free Dining',
    priceRange: '$$$',
    rating: 4.9,
    coordinates: { lat: 35.6908, lng: 139.7065 },
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    isPureVeg: true,
    isJainFriendly: true,
    dietCertification: 'Strict Vegan & Onion/Garlic Customization Available',
    distanceFromHotelKm: 4.2
  },
  {
    id: 'rest-3',
    name: 'Loving Hut Vegan Cuisine',
    cuisine: 'Pan-Asian Gourmet Vegetarian',
    priceRange: '$$',
    rating: 4.7,
    coordinates: { lat: 35.6989, lng: 139.775 },
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    isPureVeg: true,
    isJainFriendly: true,
    dietCertification: 'Certified Buddhist Pure Veg',
    distanceFromHotelKm: 1.8
  }
];

export const TOKYO_ATTRACTIONS: Attraction[] = [
  {
    id: 'attr-1',
    name: 'Meiji Jingu Shrine',
    category: 'Cultural Landmark',
    rating: 4.9,
    coordinates: { lat: 35.6764, lng: 139.6993 },
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
    estimatedVisitMinutes: 90,
    ticketPrice: 0,
    tags: ['Forest Walk', 'Historic', 'Serene', 'UNESCO Nominee']
  },
  {
    id: 'attr-2',
    name: 'Shibuya Crossing & Hachiko',
    category: 'Urban Icon',
    rating: 4.7,
    coordinates: { lat: 35.6595, lng: 139.7005 },
    imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=600&q=80',
    estimatedVisitMinutes: 45,
    ticketPrice: 0,
    tags: ['World Famous', 'Photography', 'Vibrant']
  },
  {
    id: 'attr-3',
    name: 'teamLab Planets TOKYO',
    category: 'Digital Art Museum',
    rating: 4.9,
    coordinates: { lat: 35.6491, lng: 139.7898 },
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
    estimatedVisitMinutes: 120,
    ticketPrice: 32,
    tags: ['Interactive Art', 'Sensory', 'Water Walk', 'Must-See']
  },
  {
    id: 'attr-4',
    name: 'Senso-ji Temple & Asakusa',
    category: 'Ancient Buddhist Temple',
    rating: 4.8,
    coordinates: { lat: 35.7148, lng: 139.7967 },
    imageUrl: 'https://images.unsplash.com/photo-1583084636548-3675244016fa?auto=format&fit=crop&w=600&q=80',
    estimatedVisitMinutes: 90,
    ticketPrice: 0,
    tags: ['Ancient Pagoda', 'Incense Ritual', 'Nakamise Market']
  }
];

const RAW_TOKYO_DAYS = [
  {
    dayNumber: 1,
    date: '2026-10-15',
    title: 'Imperial Heritage & High-Energy Shibuya',
    theme: 'Culture & Modern Vibe',
    totalDistanceKm: 0,
    totalTransitMinutes: 0,
    estimatedCost: 85,
    efficiencyScore: 96,
    stops: [
      {
        id: 'stop-d1-hotel-start',
        name: 'Hotel Ryumeikan Tokyo (Departure)',
        category: 'hotel' as const,
        timeSlot: 'morning' as const,
        scheduledTime: '08:45 AM - 09:00 AM',
        durationMinutes: 15,
        cost: 0,
        rating: 4.8,
        reviewsCount: 3400,
        address: '1-3-22 Yaesu, Chuo-ku, Tokyo 103-0028',
        coordinates: { lat: 35.6823, lng: 139.7702 },
        imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Morning departure from central Yaesu basecamp. Concierge briefing & metro card top-up.',
        tags: ['Basecamp', 'Departure', 'Tokyo Station Proximity'],
        openingHours: { open: '06:00 AM', close: '11:00 PM', verifiedConflictFree: true },
        isHotelOrigin: true
      },
      {
        id: 'stop-d1-1',
        name: 'Meiji Jingu Shrine',
        category: 'attraction' as const,
        timeSlot: 'morning' as const,
        scheduledTime: '09:30 AM - 11:00 AM',
        durationMinutes: 90,
        cost: 0,
        rating: 4.9,
        reviewsCount: 38400,
        address: '1-1 Yoyogikamizonocho, Shibuya-ku',
        coordinates: { lat: 35.6764, lng: 139.6993 },
        imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
        description: 'Tranquil Shinto shrine nestled in a 170-acre evergreen forest in the heart of Tokyo.',
        tags: ['Serene', 'Ancient Trees', 'Cultural Ritual'],
        openingHours: { open: '06:00 AM', close: '05:30 PM', verifiedConflictFree: true },
        bookingStatus: 'confirmed' as const
      },
      {
        id: 'stop-d1-2',
        name: 'Shibuya Crossing & Hachiko Memorial',
        category: 'attraction' as const,
        timeSlot: 'morning' as const,
        scheduledTime: '11:15 AM - 12:15 PM',
        durationMinutes: 60,
        cost: 0,
        rating: 4.7,
        reviewsCount: 52100,
        address: '2 Chome-2-1 Dogenzaka, Shibuya-ku',
        coordinates: { lat: 35.6595, lng: 139.7005 },
        imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=600&q=80',
        description: 'The iconic scramble crossing where up to 3,000 pedestrians cross simultaneously.',
        tags: ['Iconic', 'Vibrant', 'Street View'],
        openingHours: { open: 'Open 24 Hours', close: 'Open 24 Hours', verifiedConflictFree: true }
      },
      {
        id: 'stop-d1-3',
        name: 'Ain Soph. Journey Shinjuku',
        category: 'meal' as const,
        timeSlot: 'afternoon' as const,
        scheduledTime: '12:45 PM - 02:00 PM',
        durationMinutes: 75,
        cost: 26,
        rating: 4.9,
        reviewsCount: 2900,
        address: '3-8-9 Shinjuku, Shinjuku-ku',
        coordinates: { lat: 35.6908, lng: 139.7065 },
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        description: 'Renowned 100% plant-based sanctuary serving fluffy vegan pancakes, curries, and salads.',
        tags: ['Pure Vegetarian', 'Jain Friendly', 'Organic'],
        dietCompliance: { isPureVeg: true, isJainFriendly: true, verifiedByAgent: true },
        openingHours: { open: '11:30 AM', close: '09:00 PM', verifiedConflictFree: true }
      },
      {
        id: 'stop-d1-4',
        name: 'Shinjuku Gyoen National Garden',
        category: 'attraction' as const,
        timeSlot: 'afternoon' as const,
        scheduledTime: '02:30 PM - 04:30 PM',
        durationMinutes: 120,
        cost: 4,
        rating: 4.8,
        reviewsCount: 31200,
        address: '11 Naitomachi, Shinjuku-ku',
        coordinates: { lat: 35.6852, lng: 139.7101 },
        imageUrl: 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=600&q=80',
        description: 'Blending Japanese traditional, English landscape, and French formal garden styles.',
        tags: ['Botanic Garden', 'Teahouse', 'Peaceful'],
        openingHours: { open: '09:00 AM', close: '05:30 PM', verifiedConflictFree: true }
      },
      {
        id: 'stop-d1-5',
        name: 'Roppongi Hills Observation Deck',
        category: 'activity' as const,
        timeSlot: 'evening' as const,
        scheduledTime: '05:15 PM - 07:15 PM',
        durationMinutes: 120,
        cost: 18,
        rating: 4.8,
        reviewsCount: 19800,
        address: '6-10-1 Roppongi, Minato-ku',
        coordinates: { lat: 35.6605, lng: 139.7292 },
        imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
        description: 'Panoramic 360-degree glass indoor observatory offering twilight views of Tokyo Tower.',
        tags: ['Golden Hour', 'Tokyo Tower View', 'Sky Deck'],
        openingHours: { open: '10:00 AM', close: '10:00 PM', verifiedConflictFree: true }
      },
      {
        id: 'stop-d1-hotel-end',
        name: 'Hotel Ryumeikan Tokyo (Return)',
        category: 'hotel' as const,
        timeSlot: 'evening' as const,
        scheduledTime: '07:45 PM - 08:30 PM',
        durationMinutes: 45,
        cost: 0,
        rating: 4.8,
        reviewsCount: 3400,
        address: '1-3-22 Yaesu, Chuo-ku, Tokyo 103-0028',
        coordinates: { lat: 35.6823, lng: 139.7702 },
        imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Return to hotel basecamp. Evening tea service, hot bath, and preparation for Day 2.',
        tags: ['Basecamp', 'Evening Return', 'Rest & Recharge'],
        openingHours: { open: '06:00 AM', close: '11:00 PM', verifiedConflictFree: true },
        isHotelDestination: true
      }
    ]
  },
  {
    dayNumber: 2,
    date: '2026-10-16',
    title: 'Future Tech, Ginza Elegance & Immersive Art',
    theme: 'Innovation & Art',
    totalDistanceKm: 0,
    totalTransitMinutes: 0,
    estimatedCost: 95,
    efficiencyScore: 97,
    stops: [
      {
        id: 'stop-d2-hotel-start',
        name: 'Hotel Ryumeikan Tokyo (Departure)',
        category: 'hotel' as const,
        timeSlot: 'morning' as const,
        scheduledTime: '08:45 AM - 09:00 AM',
        durationMinutes: 15,
        cost: 0,
        rating: 4.8,
        reviewsCount: 3400,
        address: '1-3-22 Yaesu, Chuo-ku, Tokyo 103-0028',
        coordinates: { lat: 35.6823, lng: 139.7702 },
        imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Morning departure from central Yaesu basecamp. Concierge briefing & metro card top-up.',
        tags: ['Basecamp', 'Departure', 'Tokyo Station Proximity'],
        openingHours: { open: '06:00 AM', close: '11:00 PM', verifiedConflictFree: true },
        isHotelOrigin: true
      },
      {
        id: 'stop-d2-1',
        name: 'teamLab Planets TOKYO',
        category: 'attraction' as const,
        timeSlot: 'morning' as const,
        scheduledTime: '09:30 AM - 11:30 AM',
        durationMinutes: 120,
        cost: 32,
        rating: 4.9,
        reviewsCount: 41200,
        address: '6 Chome-1-16 Toyosu, Koto City',
        coordinates: { lat: 35.6491, lng: 139.7898 },
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
        description: 'Immersive museum where you walk through water and floating flower garden.',
        tags: ['Digital Art', 'Sensory Journey', 'Timed Entry'],
        openingHours: { open: '09:00 AM', close: '10:00 PM', verifiedConflictFree: true },
        bookingStatus: 'confirmed' as const
      },
      {
        id: 'stop-d2-2',
        name: 'Ginza Six Rooftop Garden & Art Walk',
        category: 'attraction' as const,
        timeSlot: 'afternoon' as const,
        scheduledTime: '12:00 PM - 01:15 PM',
        durationMinutes: 75,
        cost: 0,
        rating: 4.7,
        reviewsCount: 14500,
        address: '6 Chome-10-1 Ginza, Chuo City',
        coordinates: { lat: 35.6696, lng: 139.764 },
        imageUrl: 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=600&q=80',
        description: 'Architectural marvel with modern installations and 4,000 sq meter green roof.',
        tags: ['Architecture', 'Rooftop', 'Contemporary Art'],
        openingHours: { open: '10:30 AM', close: '08:30 PM', verifiedConflictFree: true }
      },
      {
        id: 'stop-d2-3',
        name: "T's Tantan Tokyo Station",
        category: 'meal' as const,
        timeSlot: 'afternoon' as const,
        scheduledTime: '01:30 PM - 02:45 PM',
        durationMinutes: 75,
        cost: 16,
        rating: 4.8,
        reviewsCount: 8800,
        address: 'Keiyo Street, Tokyo Station 1F',
        coordinates: { lat: 35.6812, lng: 139.7671 },
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
        description: 'Tokyo premier 100% plant-based ramen house. Sesame dandan noodles with soy mince.',
        tags: ['Pure Veg', 'Fast Service', 'No Alliums Option'],
        dietCompliance: { isPureVeg: true, isJainFriendly: true, verifiedByAgent: true },
        openingHours: { open: '10:00 AM', close: '10:00 PM', verifiedConflictFree: true }
      },
      {
        id: 'stop-d2-4',
        name: 'Akihabara Electric Town & Retro Tech',
        category: 'activity' as const,
        timeSlot: 'afternoon' as const,
        scheduledTime: '03:15 PM - 05:30 PM',
        durationMinutes: 135,
        cost: 0,
        rating: 4.6,
        reviewsCount: 28400,
        address: 'Sotokanda, Chiyoda City',
        coordinates: { lat: 35.7022, lng: 139.7741 },
        imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
        description: 'The global epicenter of electronics, indie retro games, and technology culture.',
        tags: ['Electronics', 'Gaming', 'Subculture'],
        openingHours: { open: '10:00 AM', close: '08:00 PM', verifiedConflictFree: true }
      },
      {
        id: 'stop-d2-5',
        name: 'Kanda Myojin Shrine (Tech Blessing)',
        category: 'attraction' as const,
        timeSlot: 'evening' as const,
        scheduledTime: '05:45 PM - 06:45 PM',
        durationMinutes: 60,
        cost: 0,
        rating: 4.7,
        reviewsCount: 9100,
        address: '2-16-2 Sotokanda, Chiyoda-ku',
        coordinates: { lat: 35.702, lng: 139.7679 },
        imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=600&q=80',
        description: '1,300-year-old shrine famous for IT & business charms, illuminated at dusk.',
        tags: ['Twilight Lanterns', 'Historic Heritage', 'Quiet Retreat'],
        openingHours: { open: 'Open 24 Hours', close: 'Open 24 Hours', verifiedConflictFree: true }
      },
      {
        id: 'stop-d2-hotel-end',
        name: 'Hotel Ryumeikan Tokyo (Return)',
        category: 'hotel' as const,
        timeSlot: 'evening' as const,
        scheduledTime: '07:45 PM - 08:30 PM',
        durationMinutes: 45,
        cost: 0,
        rating: 4.8,
        reviewsCount: 3400,
        address: '1-3-22 Yaesu, Chuo-ku, Tokyo 103-0028',
        coordinates: { lat: 35.6823, lng: 139.7702 },
        imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Return to hotel basecamp. Evening tea service, hot bath, and preparation for Day 3.',
        tags: ['Basecamp', 'Evening Return', 'Rest & Recharge'],
        openingHours: { open: '06:00 AM', close: '11:00 PM', verifiedConflictFree: true },
        isHotelDestination: true
      }
    ]
  },
  {
    dayNumber: 3,
    date: '2026-10-17',
    title: 'Historic Asakusa & Skytree Sunset Panorama',
    theme: 'Edo Spirit & Modern Heights',
    totalDistanceKm: 0,
    totalTransitMinutes: 0,
    estimatedCost: 75,
    efficiencyScore: 98,
    stops: [
      {
        id: 'stop-d3-hotel-start',
        name: 'Hotel Ryumeikan Tokyo (Departure)',
        category: 'hotel' as const,
        timeSlot: 'morning' as const,
        scheduledTime: '08:45 AM - 09:00 AM',
        durationMinutes: 15,
        cost: 0,
        rating: 4.8,
        reviewsCount: 3400,
        address: '1-3-22 Yaesu, Chuo-ku, Tokyo 103-0028',
        coordinates: { lat: 35.6823, lng: 139.7702 },
        imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Morning departure from central Yaesu basecamp. Concierge briefing & metro card top-up.',
        tags: ['Basecamp', 'Departure', 'Tokyo Station Proximity'],
        openingHours: { open: '06:00 AM', close: '11:00 PM', verifiedConflictFree: true },
        isHotelOrigin: true
      },
      {
        id: 'stop-d3-1',
        name: 'Senso-ji Temple & Kaminarimon',
        category: 'attraction' as const,
        timeSlot: 'morning' as const,
        scheduledTime: '09:00 AM - 10:45 AM',
        durationMinutes: 105,
        cost: 0,
        rating: 4.8,
        reviewsCount: 64000,
        address: '2-3-1 Asakusa, Taito-ku',
        coordinates: { lat: 35.7148, lng: 139.7967 },
        imageUrl: 'https://images.unsplash.com/photo-1583084636548-3675244016fa?auto=format&fit=crop&w=600&q=80',
        description: 'Tokyo oldest Buddhist temple founded in 645 AD with the monumental red lantern.',
        tags: ['Historic', 'Jokoro Incense', 'Pagoda'],
        openingHours: { open: '06:00 AM', close: '05:00 PM', verifiedConflictFree: true }
      },
      {
        id: 'stop-d3-2',
        name: 'Nakamise-dori Crafts Walk',
        category: 'activity' as const,
        timeSlot: 'morning' as const,
        scheduledTime: '11:00 AM - 12:15 PM',
        durationMinutes: 75,
        cost: 15,
        rating: 4.7,
        reviewsCount: 31000,
        address: '1-36-3 Asakusa, Taito City',
        coordinates: { lat: 35.7126, lng: 139.7966 },
        imageUrl: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=600&q=80',
        description: 'Historic pedestrian approach with folding fans, Edo sweets, and woodblock prints.',
        tags: ['Souvenirs', 'Local Crafts', 'Cultural Street'],
        openingHours: { open: '09:00 AM', close: '07:00 PM', verifiedConflictFree: true }
      },
      {
        id: 'stop-d3-3',
        name: 'Loving Hut Asakusa Vegan Cafe',
        category: 'meal' as const,
        timeSlot: 'afternoon' as const,
        scheduledTime: '12:30 PM - 01:45 PM',
        durationMinutes: 75,
        cost: 20,
        rating: 4.7,
        reviewsCount: 2100,
        address: '2 Chome Ueno, Taito City',
        coordinates: { lat: 35.6989, lng: 139.775 },
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
        description: 'Pure vegetarian cuisine with tempura vegetables, vegan sushi rolls, and matcha sweets.',
        tags: ['Pure Veg', 'Certified Vegan', 'Zen Atmosphere'],
        dietCompliance: { isPureVeg: true, isJainFriendly: true, verifiedByAgent: true },
        openingHours: { open: '11:00 AM', close: '08:30 PM', verifiedConflictFree: true }
      },
      {
        id: 'stop-d3-4',
        name: 'Tokyo National Museum & Ueno Park',
        category: 'attraction' as const,
        timeSlot: 'afternoon' as const,
        scheduledTime: '02:15 PM - 04:30 PM',
        durationMinutes: 135,
        cost: 10,
        rating: 4.8,
        reviewsCount: 22400,
        address: '13-9 Uenokoen, Taito City',
        coordinates: { lat: 35.7188, lng: 139.7765 },
        imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
        description: 'Japan largest museum housing over 110,000 national treasures.',
        tags: ['Museum', 'Sculpture', 'Tranquil Gardens'],
        openingHours: { open: '09:30 AM', close: '05:00 PM', verifiedConflictFree: true }
      },
      {
        id: 'stop-d3-5',
        name: 'Tokyo Skytree Sunset Panorama Deck',
        category: 'activity' as const,
        timeSlot: 'evening' as const,
        scheduledTime: '05:15 PM - 07:30 PM',
        durationMinutes: 135,
        cost: 24,
        rating: 4.9,
        reviewsCount: 58000,
        address: '1 Chome-1-2 Oshiage, Sumida City',
        coordinates: { lat: 35.71, lng: 139.8107 },
        imageUrl: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=600&q=80',
        description: '634 meters tall, offering views of Mt. Fuji and Tokyo skyline at sunset.',
        tags: ['Sunset Wonder', 'Mt Fuji Horizon', 'Observation'],
        openingHours: { open: '10:00 AM', close: '09:00 PM', verifiedConflictFree: true }
      },
      {
        id: 'stop-d3-hotel-end',
        name: 'Hotel Ryumeikan Tokyo (Return)',
        category: 'hotel' as const,
        timeSlot: 'evening' as const,
        scheduledTime: '07:45 PM - 08:30 PM',
        durationMinutes: 45,
        cost: 0,
        rating: 4.8,
        reviewsCount: 3400,
        address: '1-3-22 Yaesu, Chuo-ku, Tokyo 103-0028',
        coordinates: { lat: 35.6823, lng: 139.7702 },
        imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Return to hotel basecamp. Evening tea service, hot bath, and preparation for Day Departure.',
        tags: ['Basecamp', 'Evening Return', 'Rest & Recharge'],
        openingHours: { open: '06:00 AM', close: '11:00 PM', verifiedConflictFree: true },
        isHotelDestination: true
      }
    ]
  }
];

const { optimizedDays: TOKYO_OPTIMIZED_DAYS, metrics: TOKYO_ROUTE_METRICS } =
  optimizeTripItinerary(RAW_TOKYO_DAYS);

export const BASE_TOKYO_TRIP: Trip = {
  id: 'trip-tokyo-01',
  title: 'Tokyo: High-Tech & Heritage (100% Pure Veg)',
  destination: 'Tokyo',
  country: 'Japan',
  cityCenter: { lat: 35.6812, lng: 139.7671 },
  dates: {
    startDate: '2026-10-15',
    endDate: '2026-10-18',
    totalDays: 3
  },
  travelers: {
    adults: 2,
    children: 0,
    type: 'couple'
  },
  budget: {
    currency: 'USD',
    totalCap: 1450,
    spentTotal: 1145,
    breakdown: {
      flights: 420,
      hotels: 495,
      food: 125,
      activities: 75,
      buffer: 30
    },
    status: 'under'
  },
  constraints: [
    {
      id: 'c-1',
      type: 'diet',
      title: '100% Pure Vegetarian Dining',
      description: 'Zero meat, seafood, poultry, dashi, or gelatin broth. Verified vegetarian kitchens.',
      isHardConstraint: true,
      status: 'satisfied',
      confidence: 100,
      extractedFromText: 'Make sure all meals are strictly 100% pure vegetarian (Jain friendly).'
    },
    {
      id: 'c-2',
      type: 'budget',
      title: 'Hard Budget Ceiling: $1,450',
      description: 'Total accommodation, activities, transit, and meals capped strictly under $1,450.',
      isHardConstraint: true,
      status: 'satisfied',
      confidence: 100,
      extractedFromText: 'Our maximum cap is $1,450 total.'
    },
    {
      id: 'c-3',
      type: 'timebox',
      title: 'No Morning Starts Before 09:00 AM',
      description: 'Relaxed mornings with hotel breakfast without rushing.',
      isHardConstraint: false,
      status: 'satisfied',
      confidence: 95,
      extractedFromText: 'We do not want to wake up before 8:30 AM.'
    },
    {
      id: 'c-4',
      type: 'transit',
      title: 'Max 35-min Transit Per Leg & Zero Zigzagging',
      description: 'Deterministic Route Engine sequence optimization to eliminate city zigzagging.',
      isHardConstraint: true,
      status: 'satisfied',
      confidence: 98,
      extractedFromText: 'Cluster stops so we do not spend hours going back and forth across the city.'
    },
    {
      id: 'c-5',
      type: 'hotel_amenity',
      title: 'Hotel Pure Veg Breakfast Included',
      description: 'Accommodation must guarantee verified pure vegetarian hot breakfast items on-site.',
      isHardConstraint: false,
      status: 'satisfied',
      confidence: 92
    }
  ],
  preferences: {
    pace: 'moderate',
    diet: 'pure_veg',
    mobility: 'metro_subway',
    interests: ['Cultural Heritage', 'Futuristic Tech', 'Digital Art', 'Fine Dining', 'Scenic Panoramas']
  },
  itinerary: TOKYO_OPTIMIZED_DAYS,
  hotels: TOKYO_HOTELS,
  restaurants: TOKYO_RESTAURANTS,
  attractions: TOKYO_ATTRACTIONS,
  transportation: [],
  route: TOKYO_ROUTE_METRICS,
  validation: {
    passed: true,
    totalChecks: 14,
    passedChecks: 14,
    autoRepairsApplied: 2,
    violations: [
      {
        id: 'viol-init-1',
        rule: 'Dietary Verification Protocol',
        severity: 'critical',
        dayNumber: 1,
        description: 'Initial candidate ramen shop in Shinjuku used bonito fish flake dashi in standard base.',
        repairActionTaken: 'Places Agent swapped venue to Ain Soph. Journey (100% plant-based certified).',
        resolved: true
      },
      {
        id: 'viol-init-2',
        rule: 'Geographic Zigzag Elimination',
        severity: 'warning',
        dayNumber: 2,
        description: 'Original AI sequence suggested Akihabara -> Toyosu -> Ginza -> Akihabara (28.4 km zigzag).',
        repairActionTaken: 'Route Engine re-sequenced Day 2 to Toyosu -> Ginza -> Tokyo Station -> Akihabara, cutting 14.8 km.',
        resolved: true
      }
    ],
    lastValidatedTimestamp: '11:28 AM'
  },
  agentStatus: {
    isOrchestrating: false,
    overallStatusText: 'Swarm Standby — All 6 Specialists Synchronized & Validated',
    coordinator: {
      agent: 'coordinator',
      displayName: 'Coordinator Agent',
      packageName: '@cline/core',
      status: 'completed',
      currentAction: 'Maintains Master State & Constraint Blackboard',
      progressPercent: 100,
      tokensUsed: 1420,
      latencyMs: 140,
      lastUpdated: 'Just now'
    },
    transit: {
      agent: 'transit',
      displayName: 'Transit Specialist',
      packageName: '@cline/agents',
      status: 'completed',
      currentAction: 'Calculated Tokyo Metro subway schedules & fares',
      progressPercent: 100,
      tokensUsed: 980,
      latencyMs: 195,
      lastUpdated: 'Just now'
    },
    hotel: {
      agent: 'hotel',
      displayName: 'Hotel Specialist',
      packageName: '@cline/agents',
      status: 'completed',
      currentAction: 'Verified Ryumeikan Tokyo pure-veg breakfast',
      progressPercent: 100,
      tokensUsed: 890,
      latencyMs: 210,
      lastUpdated: 'Just now'
    },
    places: {
      agent: 'places',
      displayName: 'Places & Food Specialist',
      packageName: '@cline/agents',
      status: 'completed',
      currentAction: 'Filtered 14 pure-vegetarian venues & booked tickets',
      progressPercent: 100,
      tokensUsed: 1840,
      latencyMs: 320,
      lastUpdated: 'Just now'
    },
    compiler: {
      agent: 'compiler',
      displayName: 'Compiler Agent',
      packageName: '@cline/agents',
      status: 'completed',
      currentAction: 'Merged candidate streams into unified Zod JSON',
      progressPercent: 100,
      tokensUsed: 620,
      latencyMs: 85,
      lastUpdated: 'Just now'
    },
    routing: {
      agent: 'routing',
      displayName: 'Algorithmic Routing Engine',
      packageName: '@cline/routing',
      status: 'completed',
      currentAction: 'Route Engine sequence optimization completed in 1.4ms',
      progressPercent: 100,
      tokensUsed: 0,
      latencyMs: 1.4,
      lastUpdated: 'Just now'
    },
    validator: {
      agent: 'validator',
      displayName: 'Strict Validation Layer',
      packageName: '@cline/validator',
      status: 'completed',
      currentAction: '14/14 constraints satisfied, 0 unhandled conflicts',
      progressPercent: 100,
      tokensUsed: 410,
      latencyMs: 42,
      lastUpdated: 'Just now'
    }
  }
};

export const INITIAL_TOKYO_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'user',
    timestamp: '11:20 AM',
    type: 'text',
    content: 'Plan a 3-day trip to Tokyo for 2 people. We are strict Pure Vegetarians (no meat, no fish broth/dashi, no gelatin). Budget cap is strictly $1,450. Please cluster stops so we don’t waste time zigzagging across town!'
  },
  {
    id: 'msg-2',
    sender: 'assistant',
    timestamp: '11:20 AM',
    type: 'agent_status',
    content: 'Initializing OptiRoute Multi-Agent Orchestration Fleet...',
    payload: {
      step: 'ingestion',
      activeAgents: ['Coordinator (@cline/core)', 'Constraint NLP Parser'],
      message: 'Parsing natural language parameters into rigid blackboard constraints...'
    }
  },
  {
    id: 'msg-3',
    sender: 'assistant',
    timestamp: '11:21 AM',
    type: 'constraint_update',
    content: 'Locked 4 Hard & Soft Travel Constraints',
    payload: {
      constraints: BASE_TOKYO_TRIP.constraints.slice(0, 4)
    }
  },
  {
    id: 'msg-4',
    sender: 'assistant',
    timestamp: '11:21 AM',
    type: 'clarification',
    content: 'Human-in-the-Loop Clarification: To help our Hotel Agent filter accommodations accurately, please confirm your morning preference:',
    payload: {
      prompt: {
        id: 'clarify-breakfast-hotel',
        question: 'Which hotel setup do you prefer for your pure vegetarian dining?',
        category: 'hotel',
        options: [
          {
            id: 'hotel-opt-1',
            label: 'Hotel Ryumeikan Tokyo (Recommended)',
            badge: 'Pure Veg Breakfast On-Site',
            description: 'Directly at Tokyo Station. Dedicated Japanese vegetarian porridge & tofu set breakfast.'
          },
          {
            id: 'hotel-opt-2',
            label: 'Cerulean Tower Tokyu Shibuya',
            badge: 'Luxury High-Rise',
            description: 'Panoramic Tokyo views, 5m walk from Shibuya Scramble, western veg options.'
          },
          {
            id: 'hotel-opt-3',
            label: 'Boutique Stay near Asakusa',
            badge: 'Budget Savvy',
            description: 'Traditional neighborhood feel, saves $75 towards dining and activities.'
          }
        ],
        allowMultiple: false,
        resolved: true,
        selectedAnswer: ['hotel-opt-1']
      }
    }
  },
  {
    id: 'msg-5',
    sender: 'assistant',
    timestamp: '11:22 AM',
    type: 'route_update',
    content: 'Route Engine Optimization Completed',
    payload: {
      algorithm: 'Route Engine (Deterministic Pathfinding)',
      beforeDistanceKm: 34.6,
      afterDistanceKm: 19.8,
      savedDistanceKm: 14.8,
      percentReduction: 43,
      transitMinutesSaved: 48,
      note: 'Eliminated criss-crossing between Shinjuku and Toyosu across Day 1 & Day 2.'
    }
  },
  {
    id: 'msg-6',
    sender: 'assistant',
    timestamp: '11:22 AM',
    type: 'place_card',
    content: 'Highlight Food Stop: Certified 100% Pure Plant-Based Ramen',
    payload: {
      place: TOKYO_RESTAURANTS[0]
    },
    suggestions: [
      'Swap dinner for Jain vegetarian options',
      'Add an evening shopping stop in Ginza',
      'Recalculate route for relaxed walking pace',
      'Export trip itinerary as PDF'
    ]
  },
  {
    id: 'msg-7',
    sender: 'assistant',
    timestamp: '11:23 AM',
    type: 'final_itinerary',
    content: 'Your 3-Day Tokyo Itinerary is fully synthesized, validated, and optimized!',
    payload: {
      totalDays: 3,
      totalStops: 15,
      totalDistanceKm: 19.8,
      totalBudget: '$1,145 / $1,450 Cap (Under by $305)',
      satisfactionScore: '100% Conflict-Free'
    },
    suggestions: [
      'Remove the museum from Day 2 and replace it with something closer to the hotel',
      'Change diet constraint to Vegan only',
      'Optimize Day 1 for taxi instead of subway',
      'Show live agent fleet telemetry'
    ]
  }
];

export const PRESET_SCENARIOS: TripScenario[] = [
  {
    id: 'tokyo-pure-veg',
    title: 'Tokyo: High-Tech & Heritage',
    destination: 'Tokyo, Japan',
    description: '3 Days • 100% Pure Veg • $1,450 Cap • Route Engine Minimized Transit',
    days: 3,
    highlightConstraint: 'Strict Pure Veg & Jain-Friendly',
    tripData: BASE_TOKYO_TRIP,
    initialMessages: INITIAL_TOKYO_MESSAGES
  },
  {
    id: 'swiss-scenic',
    title: 'Swiss Alps: Panoramic Railways & Lakes',
    destination: 'Zurich & Interlaken, Switzerland',
    description: '4 Days • Scenic Rail Passes • Family Friendly • Timeboxed Hikes',
    days: 4,
    highlightConstraint: 'Scenic Train Schedules & Guaranteed Transfers',
    tripData: {
      ...BASE_TOKYO_TRIP,
      id: 'trip-swiss-02',
      title: 'Swiss Alps: Panoramic Railways & Alpine Lakes',
      destination: 'Interlaken & Lucerne',
      country: 'Switzerland',
      cityCenter: { lat: 46.6863, lng: 7.8632 },
      budget: {
        currency: 'CHF',
        totalCap: 2200,
        spentTotal: 1890,
        breakdown: { flights: 650, hotels: 720, food: 320, activities: 150, buffer: 50 },
        status: 'under'
      },
      preferences: {
        pace: 'relaxed',
        diet: 'none',
        mobility: 'public_transit',
        interests: ['Alpine Vistas', 'Glacier Trains', 'Lakeside Walks']
      }
    },
    initialMessages: [
      {
        id: 'swiss-msg-1',
        sender: 'user',
        timestamp: '09:15 AM',
        type: 'text',
        content: 'Plan a 4-day Swiss trip between Zurich, Lucerne, and Interlaken. We want scenic train routes and no tight connections less than 15 minutes.'
      },
      {
        id: 'swiss-msg-2',
        sender: 'assistant',
        timestamp: '09:16 AM',
        type: 'route_update',
        content: 'Transit Specialist synchronized with SBB Swiss Railway timetables.',
        payload: {
          algorithm: 'Route Engine (Time-Windowed Pathfinding)',
          beforeDistanceKm: 184,
          afterDistanceKm: 162,
          savedDistanceKm: 22,
          percentReduction: 32,
          transitMinutesSaved: 65,
          note: 'Guaranteed 20m minimum transfer buffer across all railway junctions.'
        }
      }
    ]
  },
  {
    id: 'nyc-sprinter',
    title: 'New York: 24-Hour Business Sprinter',
    destination: 'Manhattan, New York',
    description: '24 Hours • 3 Client Meetings • Dinner • Hotel • Strict Timeboxing',
    days: 1,
    highlightConstraint: 'Strict Zero-Slack Business Meeting Windows',
    tripData: {
      ...BASE_TOKYO_TRIP,
      id: 'trip-nyc-03',
      title: 'New York: 24-Hour Business Sprinter',
      destination: 'New York City',
      country: 'USA',
      cityCenter: { lat: 40.7128, lng: -74.006 },
      budget: {
        currency: 'USD',
        totalCap: 1100,
        spentTotal: 980,
        breakdown: { flights: 380, hotels: 380, food: 140, activities: 50, buffer: 30 },
        status: 'under'
      },
      preferences: {
        pace: 'intensive',
        diet: 'none',
        mobility: 'taxi_private',
        interests: ['Financial District', 'Midtown', 'Executive Dining']
      }
    },
    initialMessages: [
      {
        id: 'nyc-msg-1',
        sender: 'user',
        timestamp: '08:00 AM',
        type: 'text',
        content: 'I have 24 hours in NYC: meetings in Hudson Yards, Midtown, and Wall St, plus an executive dinner. Sequence them to eliminate cross-town traffic delays.'
      },
      {
        id: 'nyc-msg-2',
        sender: 'assistant',
        timestamp: '08:01 AM',
        type: 'route_update',
        content: 'Deterministic Route Engine sequenced meetings based on real-time Manhattan traffic flows.',
        payload: {
          algorithm: 'Route Engine (Constrained Sequence)',
          beforeDistanceKm: 18.2,
          afterDistanceKm: 11.4,
          savedDistanceKm: 6.8,
          percentReduction: 38,
          transitMinutesSaved: 54,
          note: 'Eliminated 2 cross-town gridlocks by sequencing Hudson Yards -> Midtown -> Financial District.'
        }
      }
    ]
  }
];
