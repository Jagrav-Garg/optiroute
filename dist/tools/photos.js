// Proxy only public image CDNs used by search results. Validate every redirect,
// never forward credentials, and bound both download size and cache memory.
const hosts = ["googleusercontent.com", "gstatic.com", "wikimedia.org", "unsplash.com", "tripadvisor.com", "tripadvisor.in", "trvl-media.com", "bstatic.com", "agoda.net"];
export function allowedPhotoUrl(value) {
    if (typeof value !== "string")
        return null;
    try {
        const url = new URL(value);
        if (url.protocol !== "https:" || url.username || url.password || url.port || /(?:api_?key|key|token)=/i.test(url.search))
            return null;
        return hosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`)) ? url : null;
    }
    catch {
        return null;
    }
}
const placeholder = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#E8E5DC"/><g fill="none" stroke="#8B918C" stroke-width="8"><rect x="300" y="205" width="200" height="145" rx="14"/><circle cx="400" cy="277" r="42"/><path d="M335 205l20-25h90l20 25"/></g><text x="400" y="420" text-anchor="middle" fill="#68766D" font-family="sans-serif" font-size="24">Photo unavailable</text></svg>');
const cache = new Map();
const pending = new Map();
let cacheBytes = 0;
export async function loadPhoto(source) {
    const hit = cache.get(source);
    if (hit && hit.expires > Date.now())
        return hit;
    if (pending.has(source))
        return pending.get(source);
    const task = (async () => {
        let photo = { bytes: placeholder, type: "image/svg+xml", expires: Date.now() + 60_000 };
        try {
            let url = allowedPhotoUrl(source);
            if (!url)
                throw new Error("Unsupported image host");
            const signal = AbortSignal.timeout(10_000);
            for (let redirects = 0; redirects <= 3; redirects++) {
                const response = await fetch(url, { signal, redirect: "manual", headers: { Accept: "image/*" } });
                if (response.status >= 300 && response.status < 400) {
                    await response.body?.cancel();
                    url = allowedPhotoUrl(new URL(response.headers.get("location") || "", url).href);
                    if (!url)
                        throw new Error("Unsupported image redirect");
                    continue;
                }
                const type = (response.headers.get("content-type") || "").split(";")[0];
                if (!response.ok || !/^image\/(jpeg|png|webp|gif|avif)$/.test(type) || Number(response.headers.get("content-length")) > 5_000_000) {
                    await response.body?.cancel();
                    throw new Error("Image is unavailable");
                }
                const reader = response.body.getReader();
                const parts = [];
                let size = 0;
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    size += value.length;
                    if (size > 5_000_000) {
                        await reader.cancel();
                        throw new Error("Image is too large");
                    }
                    parts.push(value);
                }
                if (!size)
                    throw new Error("Empty image");
                photo = { bytes: Buffer.concat(parts), type, expires: Date.now() + 60 * 60_000 };
                break;
            }
        }
        catch { /* An honest local placeholder prevents broken thumbnails. */ }
        if (hit)
            cacheBytes -= hit.bytes.length;
        cache.set(source, photo);
        cacheBytes += photo.bytes.length;
        while (cache.size > 150 || cacheBytes > 30_000_000) {
            const oldest = cache.keys().next().value;
            cacheBytes -= cache.get(oldest).bytes.length;
            cache.delete(oldest);
        }
        return photo;
    })();
    pending.set(source, task);
    try {
        return await task;
    }
    finally {
        pending.delete(source);
    }
}
export async function servePhoto(source, res) {
    const photo = await loadPhoto(source);
    res.writeHead(200, { "Content-Type": photo.type, "Content-Length": photo.bytes.length, "Cache-Control": photo.type === "image/svg+xml" ? "no-cache" : "public, max-age=3600", "X-Content-Type-Options": "nosniff" });
    res.end(photo.bytes);
}
export function photoUrls(images, thumbnail) {
    const sources = Array.from(new Set([thumbnail, ...images].filter(value => allowedPhotoUrl(value))));
    return sources.map(source => `/api/photos?url=${encodeURIComponent(source)}`);
}
//# sourceMappingURL=photos.js.map