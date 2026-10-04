import asyncio
import json
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

from optiroute.api import app
from optiroute.budget import BudgetLedger
from optiroute.chat import ChatManager, ChatStore
from optiroute.config import Settings
from optiroute.demo import DemoWebTools, demo_brief
from optiroute.graph import Pipeline
from test_graph import StubRunner


def test_public_log_replays_and_redacts_private_fields(tmp_path):
    store = ChatStore(tmp_path / "chat.sqlite")
    identifier = str(uuid4())
    store.create(identifier, "Trip", "demo")
    first = store.append(identifier, "agent_draft", {"role": "places", "reasoning": "hidden", "draft": {
        "summary": "Public result", "reasoning_details": "hidden", "api_key": "hidden"},
        "message": "Failure sk_fake0123456789abcdefghijklmnop"})
    last = store.append(identifier, "tool_started", {"query": "Switzerland"})
    assert store.get(identifier)["last_event_id"] == last
    assert [event["id"] for event in store.events(identifier, first)] == [last]
    log = json.dumps(store.events(identifier))
    assert "hidden" not in log and "sk_fake" not in log and "[redacted]" in log
    assert "Public result" in log
    assert ChatStore(store.path).events(identifier, first) == store.events(identifier, first)


async def test_jobs_detach_followup_duplicate_answers_export_and_restart(tmp_path):
    settings = Settings(data_dir=tmp_path, output_dir=tmp_path / "outputs")
    ledger = BudgetLedger(tmp_path / "spend.sqlite", .03, .25)
    store = ChatStore(tmp_path / "chat.sqlite")
    async with AsyncSqliteSaver.from_conn_string(str(tmp_path / "checkpoints.sqlite")) as saver:
        pipeline = Pipeline(settings, StubRunner(), DemoWebTools(), ledger, saver)
        manager = ChatManager({"demo": pipeline}, store, asyncio.Semaphore(2))
        chat = manager.create("A trip to Jaipur", "demo")
        identifier = chat["run_id"]
        assert chat["status"] == "queued"
        await manager.jobs[identifier]
        assert store.get(identifier)["status"] == "waiting_for_answers"
        await manager.answer(identifier, demo_brief())
        with pytest.raises(ValueError, match="not waiting"):
            await manager.answer(identifier, demo_brief())
        await manager.jobs[identifier]
        assert store.get(identifier)["status"] == "completed"
        assert len(store.get(identifier)["result"]["research"]) == 3
        assert (settings.output_dir / identifier / "plan.html").exists()
        resumed = ChatManager({"demo": pipeline}, ChatStore(store.path), asyncio.Semaphore(2))
        await resumed.recover()
        assert resumed.store.get(identifier)["status"] == "completed"
        assert len(resumed.store.events(identifier)) >= 4


async def test_stop_queued_job_and_restart_interrupted_job(tmp_path):
    store = ChatStore(tmp_path / "chat.sqlite")
    class NeverStarted:
        runner = StubRunner()
    manager = ChatManager({"demo": NeverStarted()}, store, asyncio.Semaphore(0))
    chat = manager.create("Trip", "demo")
    await manager.cancel(chat["run_id"])
    assert store.get(chat["run_id"])["status"] == "cancelled"
    assert not manager.jobs
    orphan = str(uuid4())
    store.create(orphan, "Old request", "demo")
    recovered = ChatManager({}, store, asyncio.Semaphore(1))
    await recovered.recover()
    assert store.get(orphan)["status"] == "failed"
    assert "restarted" in store.get(orphan)["result"]["errors"][0]


def test_sse_cursor_history_not_found_and_local_origin(monkeypatch, tmp_path):
    monkeypatch.setenv("OPT_ROUTE_DEMO", "true")
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
    monkeypatch.setenv("OUTPUT_DIR", str(tmp_path / "outputs"))
    with TestClient(app) as client:
        config = client.get("/chat-config").json()
        assert config["default_mode"] == "demo"
        assert "api_key" not in json.dumps(config)
        assert client.post("/chats", json={"message": " ", "mode": "demo"}).status_code == 422
        assert client.post("/chats", json={"message": "Trip", "mode": "cline"}).status_code == 422
        assert client.post("/chats", json={"message": "Trip", "mode": "demo"}, headers={"Origin": "https://evil.example"}).status_code == 403
        identifier = str(uuid4())
        app.state.chats.store.create(identifier, "Trip", "demo")
        cursor = app.state.chats.store.append(identifier, "agent_started", {"role": "places"})
        app.state.chats.store.update(identifier, "completed", {"plan": None})
        response = client.get(f"/chats/{identifier}/events", headers={"Last-Event-ID": str(cursor)})
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        assert '"kind": "state"' in response.text
        assert "agent_started" not in response.text
        assert "event: idle" in response.text
        assert client.get(f"/chats/{uuid4()}/events").status_code == 404
        assert client.get(f"/chats/{identifier}/events", headers={"Last-Event-ID": "bad"}).status_code == 422
