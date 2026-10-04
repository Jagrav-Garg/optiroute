import asyncio
import json
import math
import time

import httpx

from .budget import BudgetLedger
from .config import Settings

API = "https://openrouter.ai/api/v1"


class OpenRouterClient:
    api_url = API
    catalog_path = "/models"
    provider_name = "OpenRouter"
    api_key_setting = "openrouter_api_key"

    def __init__(self, settings: Settings, ledger: BudgetLedger, client: httpx.AsyncClient):
        self.settings, self.ledger, self.client = settings, ledger, client
        self._models: dict = {}
        self._loaded_at = 0.0
        self._catalog_lock = asyncio.Lock()

    async def models(self) -> dict:
        async with self._catalog_lock:
            if time.monotonic() - self._loaded_at < 600 and self._models:
                return self._models
            response = await self.client.get(self.api_url + self.catalog_path, timeout=20)
            response.raise_for_status()
            self._models = {model["id"]: model for model in response.json()["data"]}
            self._loaded_at = time.monotonic()
            return self._models

    async def cheapest(self, limit: int = 15) -> list[dict]:
        candidates = []
        for model in (await self.models()).values():
            prices = model.get("pricing", {})
            prompt, completion = float(prices.get("prompt", -1)), float(prices.get("completion", -1))
            if min(prompt, completion) < 0 or "tools" not in model.get("supported_parameters", []) or ":batch" in model["id"]:
                continue
            candidates.append({"id": model["id"], "input_per_million_usd": prompt * 1e6,
                               "output_per_million_usd": completion * 1e6,
                               "context_length": model["context_length"]})
        return sorted(candidates, key=lambda item: item["input_per_million_usd"] + item["output_per_million_usd"])[:limit]

    def routing_options(self, prices: dict) -> dict:
        return {"provider": {"sort": "price", "require_parameters": True,
                             "max_price": {"prompt": prices["prompt"] * 1e6,
                                           "completion": prices["completion"] * 1e6,
                                           "request": prices["request"]}}}

    def normalize_completion(self, result: dict) -> dict:
        return result

    async def complete_stream(self, payload, run_id, role, model, max_tokens, on_output):
        return await self.complete(payload, run_id, role, model, max_tokens, on_output=on_output)

    async def complete(self, payload: dict, run_id: str, role: str, model: str, max_tokens: int,
                       on_output=None) -> dict:
        key = getattr(self.settings, self.api_key_setting).get_secret_value()
        if not key:
            raise RuntimeError(f"Set {self.api_key_setting.upper()} in the local .env file before a live run; demo mode needs no key.")
        metadata = (await self.models()).get(model)
        if not metadata or "tools" not in metadata.get("supported_parameters", []):
            raise RuntimeError(f"Model {model} is unavailable or does not advertise tool support. Run the models command.")
        pricing = metadata.get("pricing", {})
        if not all(name in pricing for name in ("prompt", "completion")):
            raise RuntimeError("Missing model pricing cannot be budgeted")
        prices = {name: float(pricing.get(name, 0)) for name in ("prompt", "completion", "request")}
        if any(not math.isfinite(value) or value < 0 for value in prices.values()):
            raise RuntimeError("Dynamic or invalid model prices cannot be budgeted")
        if sum(prices.values()) > 0 and not self.settings.allow_paid_models:
            raise RuntimeError("Paid model selected but paid models are disabled. Explicitly enable --paid to use it.")
        # UTF-8 bytes plus generous framing overhead over-reserve prompt tokens.
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        if len(encoded) > 200_000:
            raise RuntimeError("Agent context exceeds the prototype's input size limit")
        upper_cost = (2 * len(encoded) + 8192) * prices["prompt"] + max_tokens * prices["completion"] + prices["request"]
        reservation = self.ledger.reserve(run_id, role, model, upper_cost)
        body = {**payload, "model": model, "max_tokens": max_tokens, "temperature": 0.2, "stream": False,
                "tool_choice": "auto", "usage": {"include": True},
                **self.routing_options(prices)}
        if "reasoning" in metadata.get("supported_parameters", []):
            body["reasoning"] = {"enabled": False}
        headers = {"Authorization": "Bearer " + key, "X-Title": "OptiRoute Cline SDK",
                   "X-OpenRouter-Title": "OptiRoute Cline SDK"}
        if on_output:
            body.update(stream=True, stream_options={"include_usage": True})
            async with self.client.stream("POST", self.api_url + "/chat/completions", json=body,
                                          headers=headers, timeout=self.settings.model_timeout_seconds) as response:
                if response.status_code >= 400:
                    await response.aread()
                    self.check_response(response, reservation, key)
                result = await self.read_stream(response, on_output)
        else:
            response = await self.client.post(self.api_url + "/chat/completions", json=body,
                                             headers=headers, timeout=self.settings.model_timeout_seconds)
            self.check_response(response, reservation, key)
            result = self.normalize_completion(response.json())
        if "error" in result:
            raise RuntimeError(f"{self.provider_name} returned a provider error; reservation retained until billing can be reconciled")
        usage = result.get("usage", {})
        cost = usage.get("cost")
        if cost is None:
            if upper_cost == 0:
                self.ledger.settle(reservation, 0, usage)
            # Retain the worst-case reservation when the provider omits billing.
        else:
            self.ledger.settle(reservation, float(cost), usage)
        return result

    def check_response(self, response, reservation, key):
        if response.status_code >= 400:
            if response.status_code in (400, 401, 402, 403, 404, 429):
                self.ledger.release(reservation)
            descriptions = {401: "API key was rejected", 402: "Insufficient credits", 429: "Model rate limit reached; try later"}
            description = descriptions.get(response.status_code, "provider request failed")
            try:
                error_body = response.json()
                provider_error = error_body.get("error")
                detail = provider_error.get("message") if isinstance(provider_error, dict) else provider_error
                if not isinstance(detail, str):
                    detail = error_body.get("message")
                if isinstance(detail, str):
                    description += "; " + " ".join(detail.replace(key, "[redacted]").split())[:400]
            except (ValueError, AttributeError):
                pass
            raise RuntimeError(f"{self.provider_name} HTTP {response.status_code}: {description}")

    async def read_stream(self, response, on_output):
        content, tools, usage, finish, identifier = "", {}, {}, None, None
        ended = False
        async for line in response.aiter_lines():
            if not line.startswith("data:"):
                continue
            raw = line[5:].strip()
            if raw == "[DONE]":
                ended = True
                break
            if not raw:
                continue
            chunk = self.normalize_completion(json.loads(raw))
            if chunk.get("error"):
                raise RuntimeError("Provider stream failed; billing reservation retained")
            identifier = chunk.get("id", identifier)
            if chunk.get("usage"):
                usage.update(chunk["usage"])
            for choice in chunk.get("choices", []):
                if choice.get("index", 0) != 0:
                    continue
                finish = choice.get("finish_reason") or finish
                if finish == "error":
                    raise RuntimeError("Provider stream failed; billing reservation retained")
                delta = choice.get("delta", {})
                # Only public content and function arguments cross the UI boundary.
                # Reasoning and encrypted reasoning blocks are deliberately discarded.
                content += delta.get("content") or ""
                for call in delta.get("tool_calls", []):
                    index = call.get("index", 0)
                    tool = tools.setdefault(index, {"id": "", "type": "function", "function": {"name": "", "arguments": ""}})
                    if call.get("id"):
                        tool["id"] = call["id"]
                    function = call.get("function", {})
                    tool["function"]["name"] += function.get("name") or ""
                    tool["function"]["arguments"] += function.get("arguments") or ""
                await on_output({"content": content, "tool_calls": list(tools.values())})
        if not ended or not finish:
            raise RuntimeError("Provider stream ended prematurely; billing reservation retained")
        return {"id": identifier, "choices": [{"index": 0, "finish_reason": finish,
                    "message": {"role": "assistant", "content": content or None,
                                "tool_calls": [tools[i] for i in sorted(tools)]}}], "usage": usage}

    async def key_info(self) -> dict:
        key = getattr(self.settings, self.api_key_setting).get_secret_value()
        if not key:
            return {"configured": False}
        response = await self.client.get(self.api_url + "/key", headers={"Authorization": "Bearer " + key}, timeout=20)
        if response.status_code != 200:
            return {"configured": True, "http_status": response.status_code}
        data = response.json()["data"]
        return {"configured": True, **{name: data.get(name) for name in ("limit", "limit_remaining", "usage", "is_free_tier")}}
