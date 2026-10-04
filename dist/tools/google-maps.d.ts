/**
 * Travel Distance & Places Tools
 *
 * Supported engines:
 *   1. OpenStreetMap OSRM (Free, open-source road routing — NO API key or credit card needed)
 *   2. Google Maps Distance Matrix / Places API (Optional fallback if GOOGLE_MAPS_API_KEY is set)
 *   3. Geodesic Haversine calculation (100% offline fallback)
 */
interface DistanceMatrixResponse {
    status: string;
    origin_addresses: string[];
    destination_addresses: string[];
    rows: Array<{
        elements: Array<{
            status: string;
            duration?: {
                value: number;
                text: string;
            };
            distance?: {
                value: number;
                text: string;
            };
        }>;
    }>;
}
interface PlacesNearbySearchResponse {
    status: string;
    results: Array<{
        place_id: string;
        name: string;
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
        vicinity?: string;
        rating?: number;
        types?: string[];
        opening_hours?: {
            weekday_text?: string[];
            open_now?: boolean;
        };
    }>;
    next_page_token?: string;
}
export declare function getDistanceMatrix(params: {
    origins: string[];
    destinations: string[];
    mode?: "driving" | "walking" | "transit";
}): Promise<DistanceMatrixResponse>;
export declare function searchNearbyPlaces(params: {
    location: string;
    radius?: number;
    type?: string;
    keyword?: string;
}): Promise<PlacesNearbySearchResponse>;
export declare const googleMapsDistanceTool: any;
export declare const googleMapsPlacesTool: any;
export {};
//# sourceMappingURL=google-maps.d.ts.map