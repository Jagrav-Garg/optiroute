import asyncio
import json

import httpx
import pytest

from optiroute.budget import BudgetLedger
from optiroute.cline_api import ClineClient
from optiroute.config import Settings
from optiroute.openrouter import OpenRouterClient


class ChunkStream(httpx.AsyncByteStream):
    def __init__(self, chunks):
        self.chunks = chunks
        self.consumed = 0

    async def __aiter__(self):
        for chunk in self.chunks:
            await asyncio.sleep(0)
            self.consumed += 1
            yield (chunk + "\n\n").encode()


@pytest.mark.parametrize("provider", [OpenRouterClient, ClineClient])
async def test_real_stream_incremental_tools_private_fields_and_billing(tmp_path, provider):
    wrap = lambda value: {"success": True, "data": value} if provider is ClineClient else value
    sse = lambda value: "data: " + json.dumps(wrap(value))
    stream = ChunkStream([
        sse({"choices": [{"index": 0, "delta": {"reasoning": "PRIVATE", "reasoning_details": [{"text": "PRIVATE"}], "content": "Hello "}}]}),
        sse({"choices": [{"index": 0, "delta": {"content": "world", "tool_calls": [{"index": 0, "id": "call_1", "function": {"name": "submit_result", "arguments": '{"summary":"'}}]}}]}),
        sse({"choices": [{"index": 0, "delta": {"tool_calls": [{"index": 0, "function": {"arguments": 'A trip"}'}}]}, "finish_reason": "tool_calls"}]}),
        sse({"choices": [], "usage": {"cost": 0.001, "prompt_tokens": 21, "completion_tokens": 13}}),
        "data: [DONE]",
    ])
    def respond(request):
        if request.url.path.endswith("/models"):
            return httpx.Response(200, json={"data": [{"id": "test/stream", "supported_parameters": ["tools"],
                "pricing": {"prompt": "0.000001", "completion": "0.000001"}}]})
        assert json.loads(request.content)["stream"] is True
        return httpx.Response(200, stream=stream)
    settings = Settings(openrouter_api_key="test", cline_api_key="test", allow_paid_models=True)
    ledger = BudgetLedger(tmp_path / "spend.sqlite", .03, .25)
    outputs = []
    async def callback(output):
        assert stream.consumed < len(stream.chunks)
        outputs.append(json.loads(json.dumps(output)))
    async with httpx.AsyncClient(transport=httpx.MockTransport(respond)) as client:
        result = await provider(settings, ledger, client).complete_stream(
            {"messages": [], "tools": []}, "trip", "places", "test/stream", 100, callback)
    assert outputs[0]["content"] == "Hello "
    assert "PRIVATE" not in json.dumps(outputs)
    assert "PRIVATE" not in json.dumps(result)
    assert result["choices"][0]["message"]["tool_calls"][0]["function"]["arguments"] == '{"summary":"A trip"}'
    assert ledger.summary("trip")["run_accounted_usd"] == .001
    assert ledger.summary()["unconfirmed_reservations"] == 0


async def test_truncated_stream_retains_reservation_no_retry(tmp_path):
    requests = []
    def respond(request):
        if request.url.path.endswith("/models"):
            return httpx.Response(200, json={"data": [{"id": "test/stream", "supported_parameters": ["tools"],
                "pricing": {"prompt": "0.000001", "completion": "0.000001"}}]})
        requests.append(request)
        return httpx.Response(200, stream=ChunkStream(['data: {"choices":[{"delta":{"content":"Partial"}}]}']))
    settings = Settings(openrouter_api_key="test", allow_paid_models=True)
    ledger = BudgetLedger(tmp_path / "spend.sqlite", .03, .25)
    async def callback(output):
        pass
    async with httpx.AsyncClient(transport=httpx.MockTransport(respond)) as client:
        with pytest.raises(RuntimeError, match="prematurely"):
            await OpenRouterClient(settings, ledger, client).complete_stream(
                {"messages": [], "tools": []}, "trip", "places", "test/stream", 100, callback)
    assert len(requests) == 1
    assert ledger.summary()["unconfirmed_reservations"] == 1
