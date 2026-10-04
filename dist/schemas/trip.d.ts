import { z } from "zod";
export declare const UserConstraintsSchema: z.ZodObject<{
    origin: z.ZodString;
    destination: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    budget: z.ZodNumber;
    travellers: z.ZodNumber;
    diet: z.ZodDefault<z.ZodEnum<["pure-veg", "vegetarian", "vegan", "any"]>>;
    pace: z.ZodDefault<z.ZodEnum<["relaxed", "moderate", "packed"]>>;
    preferences: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    currency: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    currency: string;
    origin: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: number;
    travellers: number;
    diet: "pure-veg" | "vegetarian" | "vegan" | "any";
    pace: "relaxed" | "moderate" | "packed";
    preferences: string[];
}, {
    origin: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: number;
    travellers: number;
    currency?: string | undefined;
    diet?: "pure-veg" | "vegetarian" | "vegan" | "any" | undefined;
    pace?: "relaxed" | "moderate" | "packed" | undefined;
    preferences?: string[] | undefined;
}>;
export type UserConstraints = z.infer<typeof UserConstraintsSchema>;
export declare const TransitOptionSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["flight", "train", "bus", "ferry"]>;
    provider: z.ZodString;
    flightNumber: z.ZodOptional<z.ZodString>;
    departure: z.ZodObject<{
        airport: z.ZodString;
        time: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        airport: string;
        time: string;
    }, {
        airport: string;
        time: string;
    }>;
    arrival: z.ZodObject<{
        airport: z.ZodString;
        time: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        airport: string;
        time: string;
    }, {
        airport: string;
        time: string;
    }>;
    duration: z.ZodString;
    price: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    baggage: z.ZodOptional<z.ZodString>;
    stops: z.ZodDefault<z.ZodNumber>;
    url: z.ZodOptional<z.ZodString>;
    source: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "flight" | "train" | "bus" | "ferry";
    currency: string;
    id: string;
    provider: string;
    departure: {
        airport: string;
        time: string;
    };
    arrival: {
        airport: string;
        time: string;
    };
    duration: string;
    price: number;
    stops: number;
    source: string;
    flightNumber?: string | undefined;
    baggage?: string | undefined;
    url?: string | undefined;
}, {
    type: "flight" | "train" | "bus" | "ferry";
    id: string;
    provider: string;
    departure: {
        airport: string;
        time: string;
    };
    arrival: {
        airport: string;
        time: string;
    };
    duration: string;
    price: number;
    source: string;
    currency?: string | undefined;
    flightNumber?: string | undefined;
    baggage?: string | undefined;
    stops?: number | undefined;
    url?: string | undefined;
}>;
export type TransitOption = z.infer<typeof TransitOptionSchema>;
export declare const HotelOptionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    rating: z.ZodOptional<z.ZodNumber>;
    address: z.ZodString;
    location: z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
    }, {
        lat: number;
        lng: number;
    }>;
    pricePerNight: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    checkIn: z.ZodOptional<z.ZodString>;
    checkOut: z.ZodOptional<z.ZodString>;
    amenities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    proximity: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    url: z.ZodOptional<z.ZodString>;
    source: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currency: string;
    location: {
        lat: number;
        lng: number;
    };
    id: string;
    source: string;
    name: string;
    address: string;
    pricePerNight: number;
    amenities: string[];
    url?: string | undefined;
    rating?: number | undefined;
    checkIn?: string | undefined;
    checkOut?: string | undefined;
    proximity?: string | undefined;
    imageUrl?: string | undefined;
    images?: string[] | undefined;
}, {
    location: {
        lat: number;
        lng: number;
    };
    id: string;
    source: string;
    name: string;
    address: string;
    pricePerNight: number;
    currency?: string | undefined;
    url?: string | undefined;
    rating?: number | undefined;
    checkIn?: string | undefined;
    checkOut?: string | undefined;
    amenities?: string[] | undefined;
    proximity?: string | undefined;
    imageUrl?: string | undefined;
    images?: string[] | undefined;
}>;
export type HotelOption = z.infer<typeof HotelOptionSchema>;
export declare const PlaceOptionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["attraction", "restaurant", "park", "museum", "shopping", "religious", "other"]>;
    description: z.ZodOptional<z.ZodString>;
    location: z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
        address: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
        address?: string | undefined;
    }, {
        lat: number;
        lng: number;
        address?: string | undefined;
    }>;
    rating: z.ZodOptional<z.ZodNumber>;
    openingHours: z.ZodOptional<z.ZodString>;
    estimatedVisitDuration: z.ZodDefault<z.ZodString>;
    entryFee: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodDefault<z.ZodString>;
    cuisineType: z.ZodOptional<z.ZodString>;
    isVegFriendly: z.ZodDefault<z.ZodBoolean>;
    imageUrl: z.ZodOptional<z.ZodString>;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    url: z.ZodOptional<z.ZodString>;
    source: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "attraction" | "restaurant" | "park" | "museum" | "shopping" | "religious" | "other";
    currency: string;
    location: {
        lat: number;
        lng: number;
        address?: string | undefined;
    };
    id: string;
    source: string;
    name: string;
    estimatedVisitDuration: string;
    isVegFriendly: boolean;
    url?: string | undefined;
    rating?: number | undefined;
    imageUrl?: string | undefined;
    images?: string[] | undefined;
    description?: string | undefined;
    openingHours?: string | undefined;
    entryFee?: number | undefined;
    cuisineType?: string | undefined;
}, {
    type: "attraction" | "restaurant" | "park" | "museum" | "shopping" | "religious" | "other";
    location: {
        lat: number;
        lng: number;
        address?: string | undefined;
    };
    id: string;
    source: string;
    name: string;
    currency?: string | undefined;
    url?: string | undefined;
    rating?: number | undefined;
    imageUrl?: string | undefined;
    images?: string[] | undefined;
    description?: string | undefined;
    openingHours?: string | undefined;
    estimatedVisitDuration?: string | undefined;
    entryFee?: number | undefined;
    cuisineType?: string | undefined;
    isVegFriendly?: boolean | undefined;
}>;
export type PlaceOption = z.infer<typeof PlaceOptionSchema>;
export declare const RouteSegmentSchema: z.ZodObject<{
    from: z.ZodObject<{
        placeId: z.ZodString;
        name: z.ZodString;
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        lat: number;
        lng: number;
        placeId: string;
    }, {
        name: string;
        lat: number;
        lng: number;
        placeId: string;
    }>;
    to: z.ZodObject<{
        placeId: z.ZodString;
        name: z.ZodString;
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        lat: number;
        lng: number;
        placeId: string;
    }, {
        name: string;
        lat: number;
        lng: number;
        placeId: string;
    }>;
    distanceMeters: z.ZodNumber;
    durationSeconds: z.ZodNumber;
    durationText: z.ZodString;
    mode: z.ZodDefault<z.ZodEnum<["driving", "walking", "transit"]>>;
}, "strip", z.ZodTypeAny, {
    from: {
        name: string;
        lat: number;
        lng: number;
        placeId: string;
    };
    to: {
        name: string;
        lat: number;
        lng: number;
        placeId: string;
    };
    distanceMeters: number;
    durationSeconds: number;
    durationText: string;
    mode: "driving" | "walking" | "transit";
}, {
    from: {
        name: string;
        lat: number;
        lng: number;
        placeId: string;
    };
    to: {
        name: string;
        lat: number;
        lng: number;
        placeId: string;
    };
    distanceMeters: number;
    durationSeconds: number;
    durationText: string;
    mode?: "driving" | "walking" | "transit" | undefined;
}>;
export type RouteSegment = z.infer<typeof RouteSegmentSchema>;
export declare const DayItinerarySchema: z.ZodObject<{
    day: z.ZodNumber;
    date: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    places: z.ZodArray<z.ZodObject<{
        placeId: z.ZodString;
        name: z.ZodString;
        type: z.ZodString;
        startTime: z.ZodString;
        endTime: z.ZodString;
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        lat: number;
        lng: number;
        placeId: string;
        startTime: string;
        endTime: string;
    }, {
        type: string;
        name: string;
        lat: number;
        lng: number;
        placeId: string;
        startTime: string;
        endTime: string;
    }>, "many">;
    route: z.ZodArray<z.ZodObject<{
        from: z.ZodObject<{
            placeId: z.ZodString;
            name: z.ZodString;
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            name: string;
            lat: number;
            lng: number;
            placeId: string;
        }, {
            name: string;
            lat: number;
            lng: number;
            placeId: string;
        }>;
        to: z.ZodObject<{
            placeId: z.ZodString;
            name: z.ZodString;
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            name: string;
            lat: number;
            lng: number;
            placeId: string;
        }, {
            name: string;
            lat: number;
            lng: number;
            placeId: string;
        }>;
        distanceMeters: z.ZodNumber;
        durationSeconds: z.ZodNumber;
        durationText: z.ZodString;
        mode: z.ZodDefault<z.ZodEnum<["driving", "walking", "transit"]>>;
    }, "strip", z.ZodTypeAny, {
        from: {
            name: string;
            lat: number;
            lng: number;
            placeId: string;
        };
        to: {
            name: string;
            lat: number;
            lng: number;
            placeId: string;
        };
        distanceMeters: number;
        durationSeconds: number;
        durationText: string;
        mode: "driving" | "walking" | "transit";
    }, {
        from: {
            name: string;
            lat: number;
            lng: number;
            placeId: string;
        };
        to: {
            name: string;
            lat: number;
            lng: number;
            placeId: string;
        };
        distanceMeters: number;
        durationSeconds: number;
        durationText: string;
        mode?: "driving" | "walking" | "transit" | undefined;
    }>, "many">;
    meals: z.ZodDefault<z.ZodObject<{
        breakfast: z.ZodOptional<z.ZodString>;
        lunch: z.ZodOptional<z.ZodString>;
        dinner: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        breakfast?: string | undefined;
        lunch?: string | undefined;
        dinner?: string | undefined;
    }, {
        breakfast?: string | undefined;
        lunch?: string | undefined;
        dinner?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    date: string;
    day: number;
    places: {
        type: string;
        name: string;
        lat: number;
        lng: number;
        placeId: string;
        startTime: string;
        endTime: string;
    }[];
    route: {
        from: {
            name: string;
            lat: number;
            lng: number;
            placeId: string;
        };
        to: {
            name: string;
            lat: number;
            lng: number;
            placeId: string;
        };
        distanceMeters: number;
        durationSeconds: number;
        durationText: string;
        mode: "driving" | "walking" | "transit";
    }[];
    meals: {
        breakfast?: string | undefined;
        lunch?: string | undefined;
        dinner?: string | undefined;
    };
    title?: string | undefined;
}, {
    date: string;
    day: number;
    places: {
        type: string;
        name: string;
        lat: number;
        lng: number;
        placeId: string;
        startTime: string;
        endTime: string;
    }[];
    route: {
        from: {
            name: string;
            lat: number;
            lng: number;
            placeId: string;
        };
        to: {
            name: string;
            lat: number;
            lng: number;
            placeId: string;
        };
        distanceMeters: number;
        durationSeconds: number;
        durationText: string;
        mode?: "driving" | "walking" | "transit" | undefined;
    }[];
    title?: string | undefined;
    meals?: {
        breakfast?: string | undefined;
        lunch?: string | undefined;
        dinner?: string | undefined;
    } | undefined;
}>;
export type DayItinerary = z.infer<typeof DayItinerarySchema>;
export declare const UnifiedTripPlanSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    constraints: z.ZodObject<{
        origin: z.ZodString;
        destination: z.ZodString;
        startDate: z.ZodString;
        endDate: z.ZodString;
        budget: z.ZodNumber;
        travellers: z.ZodNumber;
        diet: z.ZodDefault<z.ZodEnum<["pure-veg", "vegetarian", "vegan", "any"]>>;
        pace: z.ZodDefault<z.ZodEnum<["relaxed", "moderate", "packed"]>>;
        preferences: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        currency: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        origin: string;
        destination: string;
        startDate: string;
        endDate: string;
        budget: number;
        travellers: number;
        diet: "pure-veg" | "vegetarian" | "vegan" | "any";
        pace: "relaxed" | "moderate" | "packed";
        preferences: string[];
    }, {
        origin: string;
        destination: string;
        startDate: string;
        endDate: string;
        budget: number;
        travellers: number;
        currency?: string | undefined;
        diet?: "pure-veg" | "vegetarian" | "vegan" | "any" | undefined;
        pace?: "relaxed" | "moderate" | "packed" | undefined;
        preferences?: string[] | undefined;
    }>;
    outboundTransit: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["flight", "train", "bus", "ferry"]>;
        provider: z.ZodString;
        flightNumber: z.ZodOptional<z.ZodString>;
        departure: z.ZodObject<{
            airport: z.ZodString;
            time: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            airport: string;
            time: string;
        }, {
            airport: string;
            time: string;
        }>;
        arrival: z.ZodObject<{
            airport: z.ZodString;
            time: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            airport: string;
            time: string;
        }, {
            airport: string;
            time: string;
        }>;
        duration: z.ZodString;
        price: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
        baggage: z.ZodOptional<z.ZodString>;
        stops: z.ZodDefault<z.ZodNumber>;
        url: z.ZodOptional<z.ZodString>;
        source: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "flight" | "train" | "bus" | "ferry";
        currency: string;
        id: string;
        provider: string;
        departure: {
            airport: string;
            time: string;
        };
        arrival: {
            airport: string;
            time: string;
        };
        duration: string;
        price: number;
        stops: number;
        source: string;
        flightNumber?: string | undefined;
        baggage?: string | undefined;
        url?: string | undefined;
    }, {
        type: "flight" | "train" | "bus" | "ferry";
        id: string;
        provider: string;
        departure: {
            airport: string;
            time: string;
        };
        arrival: {
            airport: string;
            time: string;
        };
        duration: string;
        price: number;
        source: string;
        currency?: string | undefined;
        flightNumber?: string | undefined;
        baggage?: string | undefined;
        stops?: number | undefined;
        url?: string | undefined;
    }>>;
    returnTransit: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["flight", "train", "bus", "ferry"]>;
        provider: z.ZodString;
        flightNumber: z.ZodOptional<z.ZodString>;
        departure: z.ZodObject<{
            airport: z.ZodString;
            time: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            airport: string;
            time: string;
        }, {
            airport: string;
            time: string;
        }>;
        arrival: z.ZodObject<{
            airport: z.ZodString;
            time: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            airport: string;
            time: string;
        }, {
            airport: string;
            time: string;
        }>;
        duration: z.ZodString;
        price: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
        baggage: z.ZodOptional<z.ZodString>;
        stops: z.ZodDefault<z.ZodNumber>;
        url: z.ZodOptional<z.ZodString>;
        source: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "flight" | "train" | "bus" | "ferry";
        currency: string;
        id: string;
        provider: string;
        departure: {
            airport: string;
            time: string;
        };
        arrival: {
            airport: string;
            time: string;
        };
        duration: string;
        price: number;
        stops: number;
        source: string;
        flightNumber?: string | undefined;
        baggage?: string | undefined;
        url?: string | undefined;
    }, {
        type: "flight" | "train" | "bus" | "ferry";
        id: string;
        provider: string;
        departure: {
            airport: string;
            time: string;
        };
        arrival: {
            airport: string;
            time: string;
        };
        duration: string;
        price: number;
        source: string;
        currency?: string | undefined;
        flightNumber?: string | undefined;
        baggage?: string | undefined;
        stops?: number | undefined;
        url?: string | undefined;
    }>>;
    allTransitOptions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["flight", "train", "bus", "ferry"]>;
        provider: z.ZodString;
        flightNumber: z.ZodOptional<z.ZodString>;
        departure: z.ZodObject<{
            airport: z.ZodString;
            time: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            airport: string;
            time: string;
        }, {
            airport: string;
            time: string;
        }>;
        arrival: z.ZodObject<{
            airport: z.ZodString;
            time: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            airport: string;
            time: string;
        }, {
            airport: string;
            time: string;
        }>;
        duration: z.ZodString;
        price: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
        baggage: z.ZodOptional<z.ZodString>;
        stops: z.ZodDefault<z.ZodNumber>;
        url: z.ZodOptional<z.ZodString>;
        source: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "flight" | "train" | "bus" | "ferry";
        currency: string;
        id: string;
        provider: string;
        departure: {
            airport: string;
            time: string;
        };
        arrival: {
            airport: string;
            time: string;
        };
        duration: string;
        price: number;
        stops: number;
        source: string;
        flightNumber?: string | undefined;
        baggage?: string | undefined;
        url?: string | undefined;
    }, {
        type: "flight" | "train" | "bus" | "ferry";
        id: string;
        provider: string;
        departure: {
            airport: string;
            time: string;
        };
        arrival: {
            airport: string;
            time: string;
        };
        duration: string;
        price: number;
        source: string;
        currency?: string | undefined;
        flightNumber?: string | undefined;
        baggage?: string | undefined;
        stops?: number | undefined;
        url?: string | undefined;
    }>, "many">>;
    hotel: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        rating: z.ZodOptional<z.ZodNumber>;
        address: z.ZodString;
        location: z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lng: number;
        }, {
            lat: number;
            lng: number;
        }>;
        pricePerNight: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
        checkIn: z.ZodOptional<z.ZodString>;
        checkOut: z.ZodOptional<z.ZodString>;
        amenities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        proximity: z.ZodOptional<z.ZodString>;
        imageUrl: z.ZodOptional<z.ZodString>;
        images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        url: z.ZodOptional<z.ZodString>;
        source: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        location: {
            lat: number;
            lng: number;
        };
        id: string;
        source: string;
        name: string;
        address: string;
        pricePerNight: number;
        amenities: string[];
        url?: string | undefined;
        rating?: number | undefined;
        checkIn?: string | undefined;
        checkOut?: string | undefined;
        proximity?: string | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
    }, {
        location: {
            lat: number;
            lng: number;
        };
        id: string;
        source: string;
        name: string;
        address: string;
        pricePerNight: number;
        currency?: string | undefined;
        url?: string | undefined;
        rating?: number | undefined;
        checkIn?: string | undefined;
        checkOut?: string | undefined;
        amenities?: string[] | undefined;
        proximity?: string | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
    }>>;
    allHotelOptions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        rating: z.ZodOptional<z.ZodNumber>;
        address: z.ZodString;
        location: z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lng: number;
        }, {
            lat: number;
            lng: number;
        }>;
        pricePerNight: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
        checkIn: z.ZodOptional<z.ZodString>;
        checkOut: z.ZodOptional<z.ZodString>;
        amenities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        proximity: z.ZodOptional<z.ZodString>;
        imageUrl: z.ZodOptional<z.ZodString>;
        images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        url: z.ZodOptional<z.ZodString>;
        source: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        location: {
            lat: number;
            lng: number;
        };
        id: string;
        source: string;
        name: string;
        address: string;
        pricePerNight: number;
        amenities: string[];
        url?: string | undefined;
        rating?: number | undefined;
        checkIn?: string | undefined;
        checkOut?: string | undefined;
        proximity?: string | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
    }, {
        location: {
            lat: number;
            lng: number;
        };
        id: string;
        source: string;
        name: string;
        address: string;
        pricePerNight: number;
        currency?: string | undefined;
        url?: string | undefined;
        rating?: number | undefined;
        checkIn?: string | undefined;
        checkOut?: string | undefined;
        amenities?: string[] | undefined;
        proximity?: string | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
    }>, "many">>;
    allPlaces: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["attraction", "restaurant", "park", "museum", "shopping", "religious", "other"]>;
        description: z.ZodOptional<z.ZodString>;
        location: z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
            address: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lng: number;
            address?: string | undefined;
        }, {
            lat: number;
            lng: number;
            address?: string | undefined;
        }>;
        rating: z.ZodOptional<z.ZodNumber>;
        openingHours: z.ZodOptional<z.ZodString>;
        estimatedVisitDuration: z.ZodDefault<z.ZodString>;
        entryFee: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodDefault<z.ZodString>;
        cuisineType: z.ZodOptional<z.ZodString>;
        isVegFriendly: z.ZodDefault<z.ZodBoolean>;
        imageUrl: z.ZodOptional<z.ZodString>;
        images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        url: z.ZodOptional<z.ZodString>;
        source: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "attraction" | "restaurant" | "park" | "museum" | "shopping" | "religious" | "other";
        currency: string;
        location: {
            lat: number;
            lng: number;
            address?: string | undefined;
        };
        id: string;
        source: string;
        name: string;
        estimatedVisitDuration: string;
        isVegFriendly: boolean;
        url?: string | undefined;
        rating?: number | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
        description?: string | undefined;
        openingHours?: string | undefined;
        entryFee?: number | undefined;
        cuisineType?: string | undefined;
    }, {
        type: "attraction" | "restaurant" | "park" | "museum" | "shopping" | "religious" | "other";
        location: {
            lat: number;
            lng: number;
            address?: string | undefined;
        };
        id: string;
        source: string;
        name: string;
        currency?: string | undefined;
        url?: string | undefined;
        rating?: number | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
        description?: string | undefined;
        openingHours?: string | undefined;
        estimatedVisitDuration?: string | undefined;
        entryFee?: number | undefined;
        cuisineType?: string | undefined;
        isVegFriendly?: boolean | undefined;
    }>, "many">>;
    itinerary: z.ZodDefault<z.ZodArray<z.ZodObject<{
        day: z.ZodNumber;
        date: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        places: z.ZodArray<z.ZodObject<{
            placeId: z.ZodString;
            name: z.ZodString;
            type: z.ZodString;
            startTime: z.ZodString;
            endTime: z.ZodString;
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            type: string;
            name: string;
            lat: number;
            lng: number;
            placeId: string;
            startTime: string;
            endTime: string;
        }, {
            type: string;
            name: string;
            lat: number;
            lng: number;
            placeId: string;
            startTime: string;
            endTime: string;
        }>, "many">;
        route: z.ZodArray<z.ZodObject<{
            from: z.ZodObject<{
                placeId: z.ZodString;
                name: z.ZodString;
                lat: z.ZodNumber;
                lng: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                name: string;
                lat: number;
                lng: number;
                placeId: string;
            }, {
                name: string;
                lat: number;
                lng: number;
                placeId: string;
            }>;
            to: z.ZodObject<{
                placeId: z.ZodString;
                name: z.ZodString;
                lat: z.ZodNumber;
                lng: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                name: string;
                lat: number;
                lng: number;
                placeId: string;
            }, {
                name: string;
                lat: number;
                lng: number;
                placeId: string;
            }>;
            distanceMeters: z.ZodNumber;
            durationSeconds: z.ZodNumber;
            durationText: z.ZodString;
            mode: z.ZodDefault<z.ZodEnum<["driving", "walking", "transit"]>>;
        }, "strip", z.ZodTypeAny, {
            from: {
                name: string;
                lat: number;
                lng: number;
                placeId: string;
            };
            to: {
                name: string;
                lat: number;
                lng: number;
                placeId: string;
            };
            distanceMeters: number;
            durationSeconds: number;
            durationText: string;
            mode: "driving" | "walking" | "transit";
        }, {
            from: {
                name: string;
                lat: number;
                lng: number;
                placeId: string;
            };
            to: {
                name: string;
                lat: number;
                lng: number;
                placeId: string;
            };
            distanceMeters: number;
            durationSeconds: number;
            durationText: string;
            mode?: "driving" | "walking" | "transit" | undefined;
        }>, "many">;
        meals: z.ZodDefault<z.ZodObject<{
            breakfast: z.ZodOptional<z.ZodString>;
            lunch: z.ZodOptional<z.ZodString>;
            dinner: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            breakfast?: string | undefined;
            lunch?: string | undefined;
            dinner?: string | undefined;
        }, {
            breakfast?: string | undefined;
            lunch?: string | undefined;
            dinner?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        date: string;
        day: number;
        places: {
            type: string;
            name: string;
            lat: number;
            lng: number;
            placeId: string;
            startTime: string;
            endTime: string;
        }[];
        route: {
            from: {
                name: string;
                lat: number;
                lng: number;
                placeId: string;
            };
            to: {
                name: string;
                lat: number;
                lng: number;
                placeId: string;
            };
            distanceMeters: number;
            durationSeconds: number;
            durationText: string;
            mode: "driving" | "walking" | "transit";
        }[];
        meals: {
            breakfast?: string | undefined;
            lunch?: string | undefined;
            dinner?: string | undefined;
        };
        title?: string | undefined;
    }, {
        date: string;
        day: number;
        places: {
            type: string;
            name: string;
            lat: number;
            lng: number;
            placeId: string;
            startTime: string;
            endTime: string;
        }[];
        route: {
            from: {
                name: string;
                lat: number;
                lng: number;
                placeId: string;
            };
            to: {
                name: string;
                lat: number;
                lng: number;
                placeId: string;
            };
            distanceMeters: number;
            durationSeconds: number;
            durationText: string;
            mode?: "driving" | "walking" | "transit" | undefined;
        }[];
        title?: string | undefined;
        meals?: {
            breakfast?: string | undefined;
            lunch?: string | undefined;
            dinner?: string | undefined;
        } | undefined;
    }>, "many">>;
    budgetBreakdown: z.ZodDefault<z.ZodObject<{
        transit: z.ZodDefault<z.ZodNumber>;
        hotel: z.ZodDefault<z.ZodNumber>;
        activities: z.ZodDefault<z.ZodNumber>;
        food: z.ZodDefault<z.ZodNumber>;
        total: z.ZodDefault<z.ZodNumber>;
        remaining: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        transit: number;
        hotel: number;
        activities: number;
        food: number;
        total: number;
        remaining: number;
    }, {
        transit?: number | undefined;
        hotel?: number | undefined;
        activities?: number | undefined;
        food?: number | undefined;
        total?: number | undefined;
        remaining?: number | undefined;
    }>>;
    validation: z.ZodDefault<z.ZodObject<{
        passed: z.ZodDefault<z.ZodBoolean>;
        issues: z.ZodDefault<z.ZodArray<z.ZodObject<{
            severity: z.ZodEnum<["error", "warning", "info"]>;
            category: z.ZodEnum<["budget", "timing", "opening_hours", "routing", "other"]>;
            message: z.ZodString;
            suggestion: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            message: string;
            severity: "error" | "warning" | "info";
            category: "budget" | "other" | "timing" | "opening_hours" | "routing";
            suggestion?: string | undefined;
        }, {
            message: string;
            severity: "error" | "warning" | "info";
            category: "budget" | "other" | "timing" | "opening_hours" | "routing";
            suggestion?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        issues: {
            message: string;
            severity: "error" | "warning" | "info";
            category: "budget" | "other" | "timing" | "opening_hours" | "routing";
            suggestion?: string | undefined;
        }[];
        passed: boolean;
    }, {
        issues?: {
            message: string;
            severity: "error" | "warning" | "info";
            category: "budget" | "other" | "timing" | "opening_hours" | "routing";
            suggestion?: string | undefined;
        }[] | undefined;
        passed?: boolean | undefined;
    }>>;
    generatedAt: z.ZodString;
    agentVersions: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    validation: {
        issues: {
            message: string;
            severity: "error" | "warning" | "info";
            category: "budget" | "other" | "timing" | "opening_hours" | "routing";
            suggestion?: string | undefined;
        }[];
        passed: boolean;
    };
    id: string;
    title: string;
    constraints: {
        currency: string;
        origin: string;
        destination: string;
        startDate: string;
        endDate: string;
        budget: number;
        travellers: number;
        diet: "pure-veg" | "vegetarian" | "vegan" | "any";
        pace: "relaxed" | "moderate" | "packed";
        preferences: string[];
    };
    allTransitOptions: {
        type: "flight" | "train" | "bus" | "ferry";
        currency: string;
        id: string;
        provider: string;
        departure: {
            airport: string;
            time: string;
        };
        arrival: {
            airport: string;
            time: string;
        };
        duration: string;
        price: number;
        stops: number;
        source: string;
        flightNumber?: string | undefined;
        baggage?: string | undefined;
        url?: string | undefined;
    }[];
    allHotelOptions: {
        currency: string;
        location: {
            lat: number;
            lng: number;
        };
        id: string;
        source: string;
        name: string;
        address: string;
        pricePerNight: number;
        amenities: string[];
        url?: string | undefined;
        rating?: number | undefined;
        checkIn?: string | undefined;
        checkOut?: string | undefined;
        proximity?: string | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
    }[];
    allPlaces: {
        type: "attraction" | "restaurant" | "park" | "museum" | "shopping" | "religious" | "other";
        currency: string;
        location: {
            lat: number;
            lng: number;
            address?: string | undefined;
        };
        id: string;
        source: string;
        name: string;
        estimatedVisitDuration: string;
        isVegFriendly: boolean;
        url?: string | undefined;
        rating?: number | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
        description?: string | undefined;
        openingHours?: string | undefined;
        entryFee?: number | undefined;
        cuisineType?: string | undefined;
    }[];
    itinerary: {
        date: string;
        day: number;
        places: {
            type: string;
            name: string;
            lat: number;
            lng: number;
            placeId: string;
            startTime: string;
            endTime: string;
        }[];
        route: {
            from: {
                name: string;
                lat: number;
                lng: number;
                placeId: string;
            };
            to: {
                name: string;
                lat: number;
                lng: number;
                placeId: string;
            };
            distanceMeters: number;
            durationSeconds: number;
            durationText: string;
            mode: "driving" | "walking" | "transit";
        }[];
        meals: {
            breakfast?: string | undefined;
            lunch?: string | undefined;
            dinner?: string | undefined;
        };
        title?: string | undefined;
    }[];
    budgetBreakdown: {
        transit: number;
        hotel: number;
        activities: number;
        food: number;
        total: number;
        remaining: number;
    };
    generatedAt: string;
    agentVersions: Record<string, string>;
    outboundTransit?: {
        type: "flight" | "train" | "bus" | "ferry";
        currency: string;
        id: string;
        provider: string;
        departure: {
            airport: string;
            time: string;
        };
        arrival: {
            airport: string;
            time: string;
        };
        duration: string;
        price: number;
        stops: number;
        source: string;
        flightNumber?: string | undefined;
        baggage?: string | undefined;
        url?: string | undefined;
    } | undefined;
    returnTransit?: {
        type: "flight" | "train" | "bus" | "ferry";
        currency: string;
        id: string;
        provider: string;
        departure: {
            airport: string;
            time: string;
        };
        arrival: {
            airport: string;
            time: string;
        };
        duration: string;
        price: number;
        stops: number;
        source: string;
        flightNumber?: string | undefined;
        baggage?: string | undefined;
        url?: string | undefined;
    } | undefined;
    hotel?: {
        currency: string;
        location: {
            lat: number;
            lng: number;
        };
        id: string;
        source: string;
        name: string;
        address: string;
        pricePerNight: number;
        amenities: string[];
        url?: string | undefined;
        rating?: number | undefined;
        checkIn?: string | undefined;
        checkOut?: string | undefined;
        proximity?: string | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
    } | undefined;
}, {
    id: string;
    title: string;
    constraints: {
        origin: string;
        destination: string;
        startDate: string;
        endDate: string;
        budget: number;
        travellers: number;
        currency?: string | undefined;
        diet?: "pure-veg" | "vegetarian" | "vegan" | "any" | undefined;
        pace?: "relaxed" | "moderate" | "packed" | undefined;
        preferences?: string[] | undefined;
    };
    generatedAt: string;
    validation?: {
        issues?: {
            message: string;
            severity: "error" | "warning" | "info";
            category: "budget" | "other" | "timing" | "opening_hours" | "routing";
            suggestion?: string | undefined;
        }[] | undefined;
        passed?: boolean | undefined;
    } | undefined;
    outboundTransit?: {
        type: "flight" | "train" | "bus" | "ferry";
        id: string;
        provider: string;
        departure: {
            airport: string;
            time: string;
        };
        arrival: {
            airport: string;
            time: string;
        };
        duration: string;
        price: number;
        source: string;
        currency?: string | undefined;
        flightNumber?: string | undefined;
        baggage?: string | undefined;
        stops?: number | undefined;
        url?: string | undefined;
    } | undefined;
    returnTransit?: {
        type: "flight" | "train" | "bus" | "ferry";
        id: string;
        provider: string;
        departure: {
            airport: string;
            time: string;
        };
        arrival: {
            airport: string;
            time: string;
        };
        duration: string;
        price: number;
        source: string;
        currency?: string | undefined;
        flightNumber?: string | undefined;
        baggage?: string | undefined;
        stops?: number | undefined;
        url?: string | undefined;
    } | undefined;
    allTransitOptions?: {
        type: "flight" | "train" | "bus" | "ferry";
        id: string;
        provider: string;
        departure: {
            airport: string;
            time: string;
        };
        arrival: {
            airport: string;
            time: string;
        };
        duration: string;
        price: number;
        source: string;
        currency?: string | undefined;
        flightNumber?: string | undefined;
        baggage?: string | undefined;
        stops?: number | undefined;
        url?: string | undefined;
    }[] | undefined;
    hotel?: {
        location: {
            lat: number;
            lng: number;
        };
        id: string;
        source: string;
        name: string;
        address: string;
        pricePerNight: number;
        currency?: string | undefined;
        url?: string | undefined;
        rating?: number | undefined;
        checkIn?: string | undefined;
        checkOut?: string | undefined;
        amenities?: string[] | undefined;
        proximity?: string | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
    } | undefined;
    allHotelOptions?: {
        location: {
            lat: number;
            lng: number;
        };
        id: string;
        source: string;
        name: string;
        address: string;
        pricePerNight: number;
        currency?: string | undefined;
        url?: string | undefined;
        rating?: number | undefined;
        checkIn?: string | undefined;
        checkOut?: string | undefined;
        amenities?: string[] | undefined;
        proximity?: string | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
    }[] | undefined;
    allPlaces?: {
        type: "attraction" | "restaurant" | "park" | "museum" | "shopping" | "religious" | "other";
        location: {
            lat: number;
            lng: number;
            address?: string | undefined;
        };
        id: string;
        source: string;
        name: string;
        currency?: string | undefined;
        url?: string | undefined;
        rating?: number | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
        description?: string | undefined;
        openingHours?: string | undefined;
        estimatedVisitDuration?: string | undefined;
        entryFee?: number | undefined;
        cuisineType?: string | undefined;
        isVegFriendly?: boolean | undefined;
    }[] | undefined;
    itinerary?: {
        date: string;
        day: number;
        places: {
            type: string;
            name: string;
            lat: number;
            lng: number;
            placeId: string;
            startTime: string;
            endTime: string;
        }[];
        route: {
            from: {
                name: string;
                lat: number;
                lng: number;
                placeId: string;
            };
            to: {
                name: string;
                lat: number;
                lng: number;
                placeId: string;
            };
            distanceMeters: number;
            durationSeconds: number;
            durationText: string;
            mode?: "driving" | "walking" | "transit" | undefined;
        }[];
        title?: string | undefined;
        meals?: {
            breakfast?: string | undefined;
            lunch?: string | undefined;
            dinner?: string | undefined;
        } | undefined;
    }[] | undefined;
    budgetBreakdown?: {
        transit?: number | undefined;
        hotel?: number | undefined;
        activities?: number | undefined;
        food?: number | undefined;
        total?: number | undefined;
        remaining?: number | undefined;
    } | undefined;
    agentVersions?: Record<string, string> | undefined;
}>;
export type UnifiedTripPlan = z.infer<typeof UnifiedTripPlanSchema>;
export declare const TransitSearchResultSchema: z.ZodObject<{
    agent: z.ZodLiteral<"transit">;
    options: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["flight", "train", "bus", "ferry"]>;
        provider: z.ZodString;
        flightNumber: z.ZodOptional<z.ZodString>;
        departure: z.ZodObject<{
            airport: z.ZodString;
            time: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            airport: string;
            time: string;
        }, {
            airport: string;
            time: string;
        }>;
        arrival: z.ZodObject<{
            airport: z.ZodString;
            time: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            airport: string;
            time: string;
        }, {
            airport: string;
            time: string;
        }>;
        duration: z.ZodString;
        price: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
        baggage: z.ZodOptional<z.ZodString>;
        stops: z.ZodDefault<z.ZodNumber>;
        url: z.ZodOptional<z.ZodString>;
        source: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "flight" | "train" | "bus" | "ferry";
        currency: string;
        id: string;
        provider: string;
        departure: {
            airport: string;
            time: string;
        };
        arrival: {
            airport: string;
            time: string;
        };
        duration: string;
        price: number;
        stops: number;
        source: string;
        flightNumber?: string | undefined;
        baggage?: string | undefined;
        url?: string | undefined;
    }, {
        type: "flight" | "train" | "bus" | "ferry";
        id: string;
        provider: string;
        departure: {
            airport: string;
            time: string;
        };
        arrival: {
            airport: string;
            time: string;
        };
        duration: string;
        price: number;
        source: string;
        currency?: string | undefined;
        flightNumber?: string | undefined;
        baggage?: string | undefined;
        stops?: number | undefined;
        url?: string | undefined;
    }>, "many">;
    query: z.ZodString;
}, "strip", z.ZodTypeAny, {
    query: string;
    options: {
        type: "flight" | "train" | "bus" | "ferry";
        currency: string;
        id: string;
        provider: string;
        departure: {
            airport: string;
            time: string;
        };
        arrival: {
            airport: string;
            time: string;
        };
        duration: string;
        price: number;
        stops: number;
        source: string;
        flightNumber?: string | undefined;
        baggage?: string | undefined;
        url?: string | undefined;
    }[];
    agent: "transit";
}, {
    query: string;
    options: {
        type: "flight" | "train" | "bus" | "ferry";
        id: string;
        provider: string;
        departure: {
            airport: string;
            time: string;
        };
        arrival: {
            airport: string;
            time: string;
        };
        duration: string;
        price: number;
        source: string;
        currency?: string | undefined;
        flightNumber?: string | undefined;
        baggage?: string | undefined;
        stops?: number | undefined;
        url?: string | undefined;
    }[];
    agent: "transit";
}>;
export type TransitSearchResult = z.infer<typeof TransitSearchResultSchema>;
export declare const HotelSearchResultSchema: z.ZodObject<{
    agent: z.ZodLiteral<"hotel">;
    options: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        rating: z.ZodOptional<z.ZodNumber>;
        address: z.ZodString;
        location: z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lng: number;
        }, {
            lat: number;
            lng: number;
        }>;
        pricePerNight: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
        checkIn: z.ZodOptional<z.ZodString>;
        checkOut: z.ZodOptional<z.ZodString>;
        amenities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        proximity: z.ZodOptional<z.ZodString>;
        imageUrl: z.ZodOptional<z.ZodString>;
        images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        url: z.ZodOptional<z.ZodString>;
        source: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        location: {
            lat: number;
            lng: number;
        };
        id: string;
        source: string;
        name: string;
        address: string;
        pricePerNight: number;
        amenities: string[];
        url?: string | undefined;
        rating?: number | undefined;
        checkIn?: string | undefined;
        checkOut?: string | undefined;
        proximity?: string | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
    }, {
        location: {
            lat: number;
            lng: number;
        };
        id: string;
        source: string;
        name: string;
        address: string;
        pricePerNight: number;
        currency?: string | undefined;
        url?: string | undefined;
        rating?: number | undefined;
        checkIn?: string | undefined;
        checkOut?: string | undefined;
        amenities?: string[] | undefined;
        proximity?: string | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
    }>, "many">;
    query: z.ZodString;
}, "strip", z.ZodTypeAny, {
    query: string;
    options: {
        currency: string;
        location: {
            lat: number;
            lng: number;
        };
        id: string;
        source: string;
        name: string;
        address: string;
        pricePerNight: number;
        amenities: string[];
        url?: string | undefined;
        rating?: number | undefined;
        checkIn?: string | undefined;
        checkOut?: string | undefined;
        proximity?: string | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
    }[];
    agent: "hotel";
}, {
    query: string;
    options: {
        location: {
            lat: number;
            lng: number;
        };
        id: string;
        source: string;
        name: string;
        address: string;
        pricePerNight: number;
        currency?: string | undefined;
        url?: string | undefined;
        rating?: number | undefined;
        checkIn?: string | undefined;
        checkOut?: string | undefined;
        amenities?: string[] | undefined;
        proximity?: string | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
    }[];
    agent: "hotel";
}>;
export type HotelSearchResult = z.infer<typeof HotelSearchResultSchema>;
export declare const PlacesSearchResultSchema: z.ZodObject<{
    agent: z.ZodLiteral<"places">;
    options: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["attraction", "restaurant", "park", "museum", "shopping", "religious", "other"]>;
        description: z.ZodOptional<z.ZodString>;
        location: z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
            address: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lng: number;
            address?: string | undefined;
        }, {
            lat: number;
            lng: number;
            address?: string | undefined;
        }>;
        rating: z.ZodOptional<z.ZodNumber>;
        openingHours: z.ZodOptional<z.ZodString>;
        estimatedVisitDuration: z.ZodDefault<z.ZodString>;
        entryFee: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodDefault<z.ZodString>;
        cuisineType: z.ZodOptional<z.ZodString>;
        isVegFriendly: z.ZodDefault<z.ZodBoolean>;
        imageUrl: z.ZodOptional<z.ZodString>;
        images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        url: z.ZodOptional<z.ZodString>;
        source: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "attraction" | "restaurant" | "park" | "museum" | "shopping" | "religious" | "other";
        currency: string;
        location: {
            lat: number;
            lng: number;
            address?: string | undefined;
        };
        id: string;
        source: string;
        name: string;
        estimatedVisitDuration: string;
        isVegFriendly: boolean;
        url?: string | undefined;
        rating?: number | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
        description?: string | undefined;
        openingHours?: string | undefined;
        entryFee?: number | undefined;
        cuisineType?: string | undefined;
    }, {
        type: "attraction" | "restaurant" | "park" | "museum" | "shopping" | "religious" | "other";
        location: {
            lat: number;
            lng: number;
            address?: string | undefined;
        };
        id: string;
        source: string;
        name: string;
        currency?: string | undefined;
        url?: string | undefined;
        rating?: number | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
        description?: string | undefined;
        openingHours?: string | undefined;
        estimatedVisitDuration?: string | undefined;
        entryFee?: number | undefined;
        cuisineType?: string | undefined;
        isVegFriendly?: boolean | undefined;
    }>, "many">;
    query: z.ZodString;
}, "strip", z.ZodTypeAny, {
    query: string;
    options: {
        type: "attraction" | "restaurant" | "park" | "museum" | "shopping" | "religious" | "other";
        currency: string;
        location: {
            lat: number;
            lng: number;
            address?: string | undefined;
        };
        id: string;
        source: string;
        name: string;
        estimatedVisitDuration: string;
        isVegFriendly: boolean;
        url?: string | undefined;
        rating?: number | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
        description?: string | undefined;
        openingHours?: string | undefined;
        entryFee?: number | undefined;
        cuisineType?: string | undefined;
    }[];
    agent: "places";
}, {
    query: string;
    options: {
        type: "attraction" | "restaurant" | "park" | "museum" | "shopping" | "religious" | "other";
        location: {
            lat: number;
            lng: number;
            address?: string | undefined;
        };
        id: string;
        source: string;
        name: string;
        currency?: string | undefined;
        url?: string | undefined;
        rating?: number | undefined;
        imageUrl?: string | undefined;
        images?: string[] | undefined;
        description?: string | undefined;
        openingHours?: string | undefined;
        estimatedVisitDuration?: string | undefined;
        entryFee?: number | undefined;
        cuisineType?: string | undefined;
        isVegFriendly?: boolean | undefined;
    }[];
    agent: "places";
}>;
export type PlacesSearchResult = z.infer<typeof PlacesSearchResultSchema>;
//# sourceMappingURL=trip.d.ts.map