import asyncio
import hashlib
import html
import json
import logging
import sqlite3
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote
from urllib.parse import urlparse

import httpx
from ddgs import DDGS

from .models import Source, TravelImage

logging.getLogger("ddgs").setLevel(logging.WARNING)


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)


def plain_html(value: str) -> str:
    parser = TextExtractor()
    parser.feed(value)
    return html.unescape("".join(parser.parts)).strip()


class WebTools:
    def __init__(self, path: Path, client: httpx.AsyncClient):
        self.path, self.client = path, client
        path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(path) as db:
            db.execute("CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, created REAL, payload TEXT)")
        self._semaphore = asyncio.Semaphore(3)

    def _cached(self, method: str, query: str) -> tuple[str, dict | None]:
        key = hashlib.sha256((method + query.strip().casefold()).encode()).hexdigest()
        with sqlite3.connect(self.path) as db:
            row = db.execute("SELECT created,payload FROM cache WHERE key=?", (key,)).fetchone()
        return key, json.loads(row[1]) if row and time.time() - row[0] < 21600 else None

    def _save(self, key: str, result: dict):
        with sqlite3.connect(self.path) as db:
            db.execute("INSERT OR REPLACE INTO cache VALUES(?,?,?)", (key, time.time(), json.dumps(result)))

    @staticmethod
    def _query(query: str):
        if not isinstance(query, str) or not 2 <= len(query.strip()) <= 300:
            raise ValueError("Search query must have between 2 and 300 characters")

    async def _available_images(self, candidates: list[dict]) -> list[dict]:
        available = []
        for item in candidates:
            try:
                photo = TravelImage.model_validate(item)
                async with self.client.stream("GET", photo.image_url, follow_redirects=True, timeout=10) as response:
                    mime = response.headers.get("content-type", "").split(";")[0].lower()
                    policy = response.headers.get("cross-origin-resource-policy", "").lower()
                    if response.is_success and mime in ("image/jpeg", "image/png", "image/webp") and policy not in ("same-origin", "same-site"):
                        available.append(photo.model_dump(mode="json"))
            except (ValueError, httpx.HTTPError):
                continue
        return available

    async def search_web(self, query: str) -> dict:
        self._query(query)
        key, cached = self._cached("web", query)
        if cached:
            return {**cached, "cached": True}
        warnings, sources = [], []
        async with self._semaphore:
            try:
                rows = await asyncio.to_thread(lambda: list(DDGS(timeout=12).text(query, max_results=5)))
                for row in rows:
                    try:
                        sources.append(Source.make(row["title"], row["href"], row.get("body", ""), "web_search"))
                    except (ValueError, KeyError):
                        continue
            except Exception:
                warnings.append("General web search was unavailable; trying Wikipedia reference search.")
            if not sources:
                try:
                    response = await self.client.get("https://en.wikipedia.org/w/api.php",
                        params={"action": "query", "list": "search", "srsearch": query, "srlimit": 5, "format": "json"}, timeout=15)
                    response.raise_for_status()
                    for row in response.json().get("query", {}).get("search", []):
                        sources.append(Source.make(row["title"], "https://en.wikipedia.org/wiki/" + quote(row["title"].replace(" ", "_")),
                                                   plain_html(row.get("snippet", "")), "wikipedia_reference"))
                    warnings.append("Wikipedia results are general references, not live fares, availability or opening hours.")
                except Exception:
                    warnings.append("Reference search also failed. No current facts could be verified.")
        result = {"query": query, "sources": [source.model_dump(mode="json") for source in sources],
                  "warnings": warnings, "untrusted_content": True}
        if sources:
            self._save(key, result)
        return result

    async def search_images(self, query: str) -> dict:
        self._query(query)
        key, cached = self._cached("images", query)
        if cached:
            usable = await self._available_images(cached["images"])
            if usable:
                warnings = cached.get("warnings", [])
                if len(usable) < len(cached["images"]):
                    warnings = warnings + ["Unavailable destination photos were omitted from the report."]
                result = {**cached, "images": usable, "warnings": warnings, "cached": True}
                self._save(key, result)
                return result
        images = []
        try:
            response = await self.client.get("https://commons.wikimedia.org/w/api.php", params={
                "action": "query", "generator": "search", "gsrsearch": query + " filetype:bitmap",
                "gsrnamespace": 6, "gsrlimit": 6, "prop": "imageinfo", "iiprop": "url|extmetadata|mime",
                "iiurlwidth": 900, "format": "json"}, timeout=20)
            response.raise_for_status()
            for page in response.json().get("query", {}).get("pages", {}).values():
                info = page.get("imageinfo", [{}])[0]
                meta = info.get("extmetadata", {})
                if info.get("mime") not in ("image/jpeg", "image/png", "image/webp"):
                    continue
                license_name = plain_html(meta.get("LicenseShortName", {}).get("value", ""))
                license_url = meta.get("LicenseUrl", {}).get("value", "")
                if not license_name or not license_url:
                    continue
                if license_url.startswith("//"):
                    license_url = "https:" + license_url
                try:
                    images.append(TravelImage(title=page["title"].removeprefix("File:"),
                        image_url=info.get("thumburl", info["url"]), source_url=info["descriptionurl"],
                        author=plain_html(meta.get("Artist", {}).get("value", "Unknown author"))[:300],
                        license=license_name, license_url=license_url))
                except ValueError:
                    continue
                if len(images) == 3:
                    break
        except Exception:
            pass
        if not images:
            try:
                rows = await asyncio.to_thread(lambda: list(DDGS(timeout=12).images(query, max_results=6, backend="bing")))
                words = {word.lower() for word in query.split() if len(word) >= 3}
                for row in rows:
                    title = row.get("title", "")
                    source_url, image_url = row.get("url", ""), row.get("image", "")
                    if not image_url.startswith("https://") or not words.intersection((title + " " + source_url).lower().replace("/", " ").replace("-", " ").split()):
                        continue
                    try:
                        images.append(TravelImage(title=title[:200], image_url=image_url, source_url=source_url,
                            author=row.get("source", urlparse(source_url).hostname or "See source"),
                            license="Reuse rights unverified; check source", license_url=source_url))
                    except ValueError:
                        continue
                    if len(images) == 3:
                        break
            except Exception:
                pass
        candidates = [image.model_dump(mode="json") for image in images]
        available = await self._available_images(candidates)
        result = {"images": available,
                  "warnings": (["Some image reuse rights could not be verified; review each source's terms."]
                               if any("unverified" in image.license for image in images) else []) if images
                               else ["Destination photo search was unavailable or returned no usable photos."]}
        if len(available) < len(candidates):
            result["warnings"].append("Unavailable destination photos were omitted from the report.")
        if available:
            self._save(key, result)
        return result
