import asyncio
import json

from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

from optiroute.budget import BudgetLedger
from optiroute.config import Settings
from optiroute.demo import DemoWebTools, demo_brief, demo_plan, demo_research, demo_sources
from optiroute.models import Plan
from optiroute.graph import Pipeline


class StubRunner:
    def __init__(self):
        self.calls = []
        self.active = set()
        self.all_started = asyncio.Event()

    async def run(self, run_id, role, system_prompt, prompt, schema, seed_sources=None, max_tokens=1800, result_validator=None):
        self.calls.append(role)
        if role == "coordinator":
            data = {"brief": demo_brief() if json.loads(prompt).get("answers") else {"destination": "Jaipur"}, "questions": []}
        elif role == "planner":
            assert self.all_started.is_set()
            data = demo_plan()
        else:
            self.active.add(role)
            if len(self.active) == 3:
                self.all_started.set()
            await asyncio.wait_for(self.all_started.wait(), timeout=2)
            data = demo_research(role)
        return {"data": schema.model_validate(data).model_dump(mode="json"), "sources": demo_sources(),
                "images": [], "warnings": [], "metrics": {}}


async def test_followup_persists_and_three_agents_run_in_parallel(tmp_path):
    settings = Settings(data_dir=tmp_path, output_dir=tmp_path / "outputs")
    ledger = BudgetLedger(tmp_path / "spend.sqlite", 0.01, 0.03)
    first_runner = StubRunner()
    path = str(tmp_path / "checkpoints.sqlite")
    async with AsyncSqliteSaver.from_conn_string(path) as saver:
        pipeline = Pipeline(settings, first_runner, DemoWebTools(), ledger, saver)
        initial = await pipeline.start("Plan a Jaipur trip")
        assert initial["status"] == "waiting_for_answers"
        assert first_runner.calls == ["coordinator"]
    runner = StubRunner()
    async with AsyncSqliteSaver.from_conn_string(path) as saver:
        pipeline = Pipeline(settings, runner, DemoWebTools(), ledger, saver)
        result = await pipeline.resume(initial["run_id"], demo_brief())
        assert result["status"] == "completed"
        assert set(result["research"]) == {"transit", "hotels", "places"}
        assert runner.calls.count("coordinator") == 1
        assert runner.calls[-1] == "planner"
        assert result["cost"]["run_accounted_usd"] == 0


class WarningRunner(StubRunner):
    async def run(self, run_id, role, *args, **kwargs):
        result = await super().run(run_id, role, *args, **kwargs)
        result["warnings"] = [f"{role} research caution {index}" for index in range(6)]
        return result


async def test_final_plan_preserves_warnings_from_all_agents(tmp_path):
    settings = Settings(data_dir=tmp_path, output_dir=tmp_path / "outputs")
    ledger = BudgetLedger(tmp_path / "spend.sqlite", 0.01, 0.03)
    async with AsyncSqliteSaver.from_conn_string(str(tmp_path / "checkpoints.sqlite")) as saver:
        pipeline = Pipeline(settings, WarningRunner(), DemoWebTools(), ledger, saver)
        initial = await pipeline.start("Plan a Jaipur trip")
        result = await pipeline.resume(initial["run_id"], demo_brief())
        plan = Plan.model_validate(result["plan"])
        assert result["status"] == "completed"
        assert len(plan.warnings) > 12
        for role in ("transit", "hotels", "places", "planner"):
            assert f"{role} research caution 5" in plan.warnings

