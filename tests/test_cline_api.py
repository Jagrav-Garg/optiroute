import json

import httpx
import pytest

from optiroute.budget import BudgetExceeded, BudgetLedger
from optiroute.cline_api import ClineClient, create_model_client
from optiroute.config import Settings


FREE_MODEL = "stealth/test-free"


def catalog(pricing=None):
    return {"data": [{"id": FREE_MODEL, "context_length": 128000, "supported_parameters": ["tools"],
                      "pricing": pricing if pricing is not None else {"prompt": "0", "completion": "0"}}]}


async def test_cline_key_and_free_alias_use_only_cline_endpoint(tmp_path):
    requests = []

    def respond(request):
        requests.append(request)
        assert request.url.host == "api.cline.bot"
        if request.url.path.endswith("/models"):
            return httpx.Response(200, json=catalog())
        assert request.headers["Authorization"] == "Bearer cline-test-key"
        body = json.loads(request.content)
        assert body["model"] == FREE_MODEL
        assert body["provider"]["max_price"]["prompt"] == 0
        assert body["stream"] is False
        return httpx.Response(200, json={"success": True, "data": {"choices": [{"message": {"content": "OK"}}], "usage": {"cost": 0}}})

    settings = Settings(model_provider="cline", cline_api_key="cline-test-key", openrouter_api_key="other-provider-key")
    ledger = BudgetLedger(tmp_path / "spend.sqlite", 0.02, 0.25)
    async with httpx.AsyncClient(transport=httpx.MockTransport(respond)) as client:
        router = create_model_client(settings, ledger, client)
        assert isinstance(router, ClineClient)
        result = await router.complete({"messages": [], "tools": []}, "trip", "coordinator", FREE_MODEL, 100)
        assert result["choices"][0]["message"]["content"] == "OK"
    assert len(requests) == 2
    assert ledger.summary("trip")["run_accounted_usd"] == 0
    assert ledger.summary()["unconfirmed_reservations"] == 0


async def test_cline_models_without_verified_pricing_are_rejected(tmp_path):
    requests = []

    def respond(request):
        requests.append(request.url.path)
        return httpx.Response(200, json=catalog(pricing={}))

    settings = Settings(model_provider="cline", cline_api_key="test-key", allow_paid_models=True)
    ledger = BudgetLedger(tmp_path / "spend.sqlite", 0.02, 0.25)
    async with httpx.AsyncClient(transport=httpx.MockTransport(respond)) as client:
        router = ClineClient(settings, ledger, client)
        with pytest.raises(RuntimeError, match="Missing model pricing"):
            await router.complete({"messages": [], "tools": []}, "trip", "planner", FREE_MODEL, 100)
    assert requests == ["/api/v1/ai/cline/models"]
    assert ledger.summary()["calls"] == []


async def test_cline_unexpected_billing_is_accounted_and_stops_run(tmp_path):
    def respond(request):
        if request.url.path.endswith("/models"):
            return httpx.Response(200, json=catalog())
        return httpx.Response(200, json={"choices": [], "usage": {"cost": 0.001}})

    settings = Settings(model_provider="cline", cline_api_key="test-key")
    ledger = BudgetLedger(tmp_path / "spend.sqlite", 0.02, 0.25)
    async with httpx.AsyncClient(transport=httpx.MockTransport(respond)) as client:
        router = ClineClient(settings, ledger, client)
        with pytest.raises(BudgetExceeded, match="more than the reserved upper bound"):
            await router.complete({"messages": [], "tools": []}, "trip", "planner", FREE_MODEL, 100)
    assert ledger.summary("trip")["run_accounted_usd"] == 0.001


def test_selected_provider_uses_its_own_role_models():
    settings = Settings(model_provider="cline", cline_model="cline-free/research", cline_planner_model="cline-free/planner")
    assert settings.model_for("coordinator") == "cline-free/research"
    assert settings.model_for("planner") == "cline-free/planner"


async def test_product_only_free_alias_is_excluded_from_api_models(tmp_path):
    def respond(request):
        return httpx.Response(200, json=catalog())

    settings = Settings(model_provider="cline", cline_api_key="test-key")
    ledger = BudgetLedger(tmp_path / "spend.sqlite", 0.02, 0.25)
    async with httpx.AsyncClient(transport=httpx.MockTransport(respond)) as client:
        assert set(await ClineClient(settings, ledger, client).models()) == {FREE_MODEL}


async def test_wrapped_cline_usage_is_billed_before_returning_completion(tmp_path):
    def respond(request):
        if request.url.path.endswith("/models"):
            return httpx.Response(200, json=catalog(pricing={"prompt": "0.000001", "completion": "0.000001"}))
        return httpx.Response(200, json={"success": True, "data": {"choices": [], "usage": {"cost": 0.001}}})

    settings = Settings(model_provider="cline", cline_api_key="test-key", allow_paid_models=True)
    ledger = BudgetLedger(tmp_path / "spend.sqlite", 0.02, 0.25)
    async with httpx.AsyncClient(transport=httpx.MockTransport(respond)) as client:
        router = ClineClient(settings, ledger, client)
        await router.complete({"messages": [], "tools": []}, "trip", "planner", FREE_MODEL, 100)
    assert ledger.summary("trip")["run_accounted_usd"] == 0.001
    assert ledger.summary()["unconfirmed_reservations"] == 0
