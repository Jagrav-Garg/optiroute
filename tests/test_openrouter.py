import httpx
import pytest

from optiroute.budget import BudgetLedger
from optiroute.config import Settings
from optiroute.openrouter import OpenRouterClient


def catalog():
    return {"data": [{"id": "test/paid", "supported_parameters": ["tools"], "context_length": 32000,
                      "pricing": {"prompt": "0.00000003", "completion": "0.00000013", "request": "0"}}]}


async def test_paid_model_requires_opt_in_before_any_generation(tmp_path):
    requests = []
    def respond(request):
        requests.append(request.url.path)
        return httpx.Response(200, json=catalog())
    settings = Settings(openrouter_api_key="test-key", allow_paid_models=False, data_dir=tmp_path)
    ledger = BudgetLedger(tmp_path / "spend.sqlite", 0.03, 0.25)
    async with httpx.AsyncClient(transport=httpx.MockTransport(respond)) as client:
        router = OpenRouterClient(settings, ledger, client)
        with pytest.raises(RuntimeError, match="Paid model selected"):
            await router.complete({"messages": [], "tools": []}, "trip", "planner", "test/paid", 100)
    assert requests == ["/api/v1/models"]
    assert ledger.summary()["calls"] == []


async def test_provider_timeout_retains_reservation_without_retry(tmp_path):
    attempts = []
    def respond(request):
        if request.url.path.endswith("/models"):
            return httpx.Response(200, json=catalog())
        attempts.append(request)
        raise httpx.ReadTimeout("simulated uncertain billing")
    settings = Settings(openrouter_api_key="test-key", allow_paid_models=True, data_dir=tmp_path)
    ledger = BudgetLedger(tmp_path / "spend.sqlite", 0.03, 0.25)
    async with httpx.AsyncClient(transport=httpx.MockTransport(respond)) as client:
        router = OpenRouterClient(settings, ledger, client)
        with pytest.raises(httpx.ReadTimeout):
            await router.complete({"messages": [{"role": "user", "content": "test"}], "tools": []}, "trip", "planner", "test/paid", 100)
    assert len(attempts) == 1
    assert ledger.summary()["unconfirmed_reservations"] == 1


async def test_routing_failure_explains_error_redacts_key_and_releases_reservation(tmp_path):
    def respond(request):
        if request.url.path.endswith("/models"):
            return httpx.Response(200, json=catalog())
        return httpx.Response(404, json={"error": {"message": "No endpoints match test-key"}})

    settings = Settings(openrouter_api_key="test-key", allow_paid_models=True, data_dir=tmp_path)
    ledger = BudgetLedger(tmp_path / "spend.sqlite", 0.03, 0.25)
    async with httpx.AsyncClient(transport=httpx.MockTransport(respond)) as client:
        router = OpenRouterClient(settings, ledger, client)
        with pytest.raises(RuntimeError, match="No endpoints match") as exc:
            await router.complete({"messages": [], "tools": []}, "trip", "planner", "test/paid", 100)
    assert "test-key" not in str(exc.value)
    assert "[redacted]" in str(exc.value)
    assert ledger.summary()["unconfirmed_reservations"] == 0
    assert ledger.summary("trip")["run_accounted_usd"] == 0
