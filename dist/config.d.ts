import "dotenv/config";
export declare const config: {
    /** LLM provider for all agent reasoning */
    readonly llm: {
        readonly providerId: string;
        readonly modelId: string;
        readonly apiKey: string;
        readonly maxIterations: number;
    };
    /** SerpAPI for flight/hotel/place searches */
    readonly serpapi: {
        readonly apiKey: string;
        readonly baseUrl: "https://serpapi.com/search";
    };
    /** Google Maps / OpenStreetMap for distance matrix + geocoding */
    readonly googleMaps: {
        readonly apiKey: string;
        readonly distanceMatrixUrl: "https://maps.googleapis.com/maps/api/distancematrix/json";
        readonly placesUrl: "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
    };
};
/** Pre-built agent config object ready to spread into `new Agent()` */
export declare function getAgentConfig(): {
    providerId: string;
    modelId: string;
    apiKey: string;
    maxIterations: number;
};
//# sourceMappingURL=config.d.ts.map