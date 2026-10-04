import httpx

from optiroute.search import WebTools


def photo(name):
    return {"title": name, "image_url": f"https://images.example.com/{name}.jpg",
            "source_url": "https://example.com/photos", "author": "Example",
            "license": "Check source", "license_url": "https://example.com/license"}


async def test_cached_photos_omit_blocked_or_non_image_responses(tmp_path):
    def respond(request):
        if request.url.path.endswith("/blocked.jpg"):
            return httpx.Response(403)
        if request.url.path.endswith("/html.jpg"):
            return httpx.Response(200, headers={"content-type": "text/html"}, text="Access denied")
        if request.url.path.endswith("/protected.jpg"):
            return httpx.Response(200, headers={"content-type": "image/jpeg", "cross-origin-resource-policy": "same-site"}, content=b"image fixture")
        return httpx.Response(200, headers={"content-type": "image/jpeg"}, content=b"image fixture")

    async with httpx.AsyncClient(transport=httpx.MockTransport(respond)) as client:
        web = WebTools(tmp_path / "search.sqlite", client)
        key, _ = web._cached("images", "Switzerland")
        web._save(key, {"images": [photo("valid"), photo("blocked"), photo("html"), photo("protected")], "warnings": []})
        result = await web.search_images("Switzerland")
    assert result["cached"]
    assert [item["title"] for item in result["images"]] == ["valid"]
    assert any("omitted" in warning for warning in result["warnings"])
