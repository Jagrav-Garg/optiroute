import { config } from "../config.js";
import { callSerpApi } from "./serp-search.js";
export function validCoordinates(value) {
    return !!value && Number.isFinite(value.lat) && Number.isFinite(value.lng)
        && Math.abs(value.lat) <= 90 && Math.abs(value.lng) <= 180
        && !(value.lat === 0 && value.lng === 0);
}
const cache = new Map();
const pending = new Map();
const normalized = (text) => text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, " ").trim();
export async function geocodeLocation(name, destination = "", address = "") {
    const query = [...new Set([name, address, destination].filter(Boolean))].join(", ");
    if (cache.has(query))
        return cache.get(query);
    if (pending.has(query))
        return pending.get(query);
    const lookup = async () => {
        if (config.googleMaps.apiKey) {
            try {
                const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
                url.searchParams.set("address", query);
                url.searchParams.set("key", config.googleMaps.apiKey);
                const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
                const data = await response.json();
                const match = data.results?.find((result) => !result.partial_match && (name === destination || !destination || result.types?.some((type) => ["establishment", "point_of_interest", "premise", "street_address", "park"].includes(type))));
                const coords = match?.geometry?.location;
                if (data.status === "OK" && validCoordinates(coords))
                    return coords;
            }
            catch { /* Try the configured Maps search provider. */ }
        }
        try {
            const data = await callSerpApi({ engine: "google_maps", q: query, type: "search" });
            const candidates = data.place_results ? [data.place_results] : data.local_results || [];
            const terms = normalized(name).split(/ +/).filter(term => term.length > 2);
            for (const match of candidates) {
                const title = normalized(String(match.title || match.name || ""));
                if (terms.length && terms.filter(term => title.includes(term)).length / terms.length < 0.5)
                    continue;
                const gps = match.gps_coordinates;
                const coords = { lat: Number(gps?.latitude), lng: Number(gps?.longitude) };
                if (validCoordinates(coords))
                    return coords;
            }
        }
        catch { /* Unresolved places remain unpinned. */ }
        return null;
    };
    const task = lookup().then(result => {
        if (cache.size >= 300)
            cache.delete(cache.keys().next().value);
        cache.set(query, result);
        return result;
    }).finally(() => pending.delete(query));
    pending.set(query, task);
    return task;
}
//# sourceMappingURL=geocoding.js.map