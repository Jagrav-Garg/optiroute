import shutil
import asyncio

import pytest

from optiroute.agents import ClineAgentRunner
from optiroute.config import ROOT, Settings
from optiroute.demo import DemoRouter, DemoWebTools, demo_brief, demo_sources
from optiroute.models import Clarification, PlanDraft, TripBrief
from optiroute.validation import validate_plan


class CorrectionRouter(DemoRouter):
    def __init__(self):
        self.calls = 0

    async def complete(self, payload, run_id, role, model, max_tokens):
        self.calls += 1
        response = await super().complete(payload, run_id, role, model, max_tokens)
        if self.calls == 1:
            import json
            call = response["choices"][0]["message"]["tool_calls"][0]
            data = json.loads(call["function"]["arguments"])
            data["budget_items"][0]["amount"] = 50000
            call["function"]["arguments"] = json.dumps(data)
        return response


class TextFirstRouter(DemoRouter):
    def __init__(self):
        self.calls = 0

    async def complete(self, payload, run_id, role, model, max_tokens):
        self.calls += 1
        if self.calls == 1:
            return {"choices": [{"finish_reason": "stop", "message": {
                "role": "assistant", "content": "A plain text answer without the required structured submission."
            }}], "usage": {"prompt_tokens": 0, "completion_tokens": 0, "cost": 0}}
        return await super().complete(payload, run_id, role, model, max_tokens)


@pytest.mark.skipif(not shutil.which("node") or not (ROOT / "dist/agent.js").exists(), reason="Build the Cline worker first")
async def test_real_cline_worker_corrects_invalid_plan_in_existing_call_limit(tmp_path):
    settings = Settings(data_dir=tmp_path, output_dir=tmp_path / "outputs")
    router = CorrectionRouter()
    runner = ClineAgentRunner(settings, router, DemoWebTools())
    brief = TripBrief.model_validate(demo_brief())

    def checks(draft, sources):
        return validate_plan(draft, brief, sources, []).errors

    result = await runner.run("test-trip", "planner", "Submit a structured plan", "Jaipur fixture trip", PlanDraft,
                             seed_sources=demo_sources(), result_validator=checks)
    assert router.calls == 2
    assert result["metrics"]["model_calls"] == 2
    assert checks(PlanDraft.model_validate(result["data"]), result["sources"]) == []


@pytest.mark.skipif(not shutil.which("node") or not (ROOT / "dist/agent.js").exists(), reason="Build the Cline worker first")
async def test_cline_requires_structured_submission_after_text_only_response(tmp_path):
    settings = Settings(data_dir=tmp_path, output_dir=tmp_path / "outputs")
    router = TextFirstRouter()
    runner = ClineAgentRunner(settings, router, DemoWebTools())
    result = await runner.run("test-trip", "planner", "Submit a structured plan", "Jaipur fixture trip", PlanDraft,
                             seed_sources=demo_sources())
    assert router.calls == 2
    assert result["data"]["title"] == "A Relaxed Jaipur Weekend"


@pytest.mark.skipif(not shutil.which("node") or not (ROOT / "dist/agent.js").exists(), reason="Build the Cline worker first")
async def test_encoded_nested_brief_is_validated_without_an_extra_model_call(tmp_path):
    import json
    class EncodedRouter(DemoRouter):
        async def complete(self, payload, *args):
            schema = next(t["function"]["parameters"] for t in payload["tools"] if t["function"]["name"] == "submit_result")
            assert schema["properties"]["brief"]["type"] == "object"
            response = await super().complete(payload, *args)
            call = response["choices"][0]["message"]["tool_calls"][0]
            data = json.loads(call["function"]["arguments"])
            data["brief"] = json.dumps(data["brief"])
            call["function"]["arguments"] = json.dumps(data)
            return response
    settings = Settings(data_dir=tmp_path)
    runner = ClineAgentRunner(settings, EncodedRouter(), DemoWebTools())
    events = []
    async def observer(run_id, kind, payload):
        events.append((kind, payload))
    runner.observer = observer
    result = await runner.run("test-trip", "coordinator", "Clarify the trip", json.dumps({"answers": []}), Clarification)
    assert result["data"]["brief"]["destination"] == "Jaipur"
    assert result["metrics"]["model_calls"] == 1
    assert any(kind == "agent_draft" and isinstance(payload.get("draft", {}).get("brief"), dict) for kind, payload in events)
    assert events[-1][0] == "agent_completed"


@pytest.mark.skipif(not shutil.which("node") or not (ROOT / "dist/agent.js").exists(), reason="Build the Cline worker first")
async def test_cancelling_active_agent_terminates_real_worker(monkeypatch, tmp_path):
    started = asyncio.Event()
    processes = []
    original = asyncio.create_subprocess_exec
    async def capture(*args, **kwargs):
        process = await original(*args, **kwargs)
        processes.append(process)
        return process
    class HangingRouter:
        async def complete(self, *args):
            started.set()
            await asyncio.Future()
    monkeypatch.setattr(asyncio, "create_subprocess_exec", capture)
    runner = ClineAgentRunner(Settings(data_dir=tmp_path), HangingRouter(), DemoWebTools())
    task = asyncio.create_task(runner.run("test-trip", "coordinator", "Clarify", "Test", Clarification))
    await asyncio.wait_for(started.wait(), 10)
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task
    assert len(processes) == 1 and processes[0].returncode is not None
