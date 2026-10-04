import "dotenv/config";
/**
 * Centralized configuration for the Multi-Agent Travel Planner.
 *
 * All API keys are read from environment variables (or a .env file).
 * The LLM provider defaults to Cline's gateway — swap to "openai" or
 * "anthropic" with your own key if preferred.
 */
function required(key) {
    const value = process.env[key]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
function optional(key, fallback) {
    return process.env[key]?.trim() || fallback;
}
export const config = {
    /** LLM provider for all agent reasoning */
    llm: {
        providerId: optional("CLINE_PROVIDER_ID", "cline"),
        modelId: optional("CLINE_MODEL_ID", "anthropic/claude-3-5-haiku"),
        apiKey: required("CLINE_API_KEY"),
        maxIterations: Number(optional("MAX_ITERATIONS", "3")),
    },
    /** SerpAPI for flight/hotel/place searches */
    serpapi: {
        apiKey: required("SERPAPI_KEY"),
        baseUrl: "https://serpapi.com/search",
    },
    /** Google Maps / OpenStreetMap for distance matrix + geocoding */
    googleMaps: {
        apiKey: optional("GOOGLE_MAPS_API_KEY", ""),
        distanceMatrixUrl: "https://maps.googleapis.com/maps/api/distancematrix/json",
        placesUrl: "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
    },
};
/** Pre-built agent config object ready to spread into `new Agent()` */
export function getAgentConfig() {
    return {
        providerId: config.llm.providerId,
        modelId: config.llm.modelId,
        apiKey: config.llm.apiKey,
        maxIterations: config.llm.maxIterations,
    };
}
//# sourceMappingURL=config.js.map