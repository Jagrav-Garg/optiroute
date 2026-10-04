"""Durable public activity streams and disconnect-safe chat jobs."""
import asyncio
import json
import re
import sqlite3
from datetime import datetime, timezone
from uuid import UUID, uuid4

from .export import export_plan
from .models import Plan

TERMINAL = {"completed", "failed", "cancelled"}
PRIVATE_FIELDS = {"reasoning", "reasoning_details", "thinking", "analysis", "api_key", "authorization"}


def public_payload(value):
    if isinstance(value, dict):
        return {k: public_payload(v) for k, v in value.items() if k.lower() not in PRIVATE_FIELDS}
    if isinstance(value, list):
        return [public_payload(v) for v in value]
    if isinstance(value, str):
        return re.sub(r"\bsk[-_][A-Za-z0-9_-]{16,}", "[redacted]", value)
    return value


def now():
    return datetime.now(timezone.utc).isoformat()


class ChatStore:
    def __init__(self, path):
        self.path = path
        with self.connect() as db:
            db.executescript("""
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS chats (
                    run_id TEXT PRIMARY KEY, title TEXT NOT NULL, mode TEXT NOT NULL,
                    status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
                    result TEXT NOT NULL DEFAULT '{}');
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT NOT NULL,
                    kind TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL);
                CREATE INDEX IF NOT EXISTS event_run ON events(run_id, id);
            """)

    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        return db

    def create(self, run_id, message, mode):
        timestamp = now()
        with self.connect() as db:
            db.execute("INSERT INTO chats VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (run_id, public_payload(message[:70]), mode, "queued", timestamp, timestamp, "{}"))
        self.append(run_id, "user_message", {"text": message})

    def get(self, run_id):
        with self.connect() as db:
            db.execute("BEGIN")
            row = db.execute("SELECT * FROM chats WHERE run_id = ?", (run_id,)).fetchone()
            cursor = db.execute("SELECT COALESCE(MAX(id),0) FROM events WHERE run_id = ?", (run_id,)).fetchone()[0]
        if row is None:
            raise KeyError(run_id)
        result = dict(row)
        result["last_event_id"] = cursor
        result["result"] = json.loads(result["result"])
        return result

    def list(self):
        with self.connect() as db:
            return [dict(row) for row in db.execute(
                "SELECT run_id, title, mode, status, created_at, updated_at FROM chats ORDER BY updated_at DESC LIMIT 100")]

    def append(self, run_id, kind, payload):
        payload = public_payload(payload)
        with self.connect() as db:
            cursor = db.execute("INSERT INTO events(run_id,kind,payload,created_at) VALUES(?,?,?,?)",
                                (run_id, kind, json.dumps(payload, default=str), now()))
            return cursor.lastrowid

    def events(self, run_id, after=0):
        with self.connect() as db:
            rows = db.execute("SELECT * FROM events WHERE run_id=? AND id>? ORDER BY id LIMIT 250",
                              (run_id, after)).fetchall()
        return [{**dict(row), "payload": json.loads(row["payload"])} for row in rows]

    def update(self, run_id, status, result=None):
        with self.connect() as db:
            if result is None:
                db.execute("UPDATE chats SET status=?, updated_at=? WHERE run_id=?", (status, now(), run_id))
            else:
                db.execute("UPDATE chats SET status=?, updated_at=?, result=? WHERE run_id=?",
                           (status, now(), json.dumps(public_payload(result), default=str), run_id))
        self.append(run_id, "state", {"status": status, **({"result": result} if result is not None else {})})


class ChatManager:
    def __init__(self, pipelines, store, semaphore):
        self.pipelines, self.store, self.semaphore = pipelines, store, semaphore
        self.jobs = {}
        for pipeline in pipelines.values():
            pipeline.runner.observer = self.emit

    async def emit(self, run_id, kind, payload):
        # CLI/legacy API runs are not necessarily registered as chats.
        try:
            self.store.get(run_id)
        except KeyError:
            return
        self.store.append(run_id, kind, payload)

    def launch(self, run_id, message=None, answers=None):
        if run_id in self.jobs:
            raise ValueError("This chat already has a request in progress")
        self.store.update(run_id, "queued")
        self.jobs[run_id] = asyncio.create_task(self.work(run_id, message, answers))

    def create(self, message, mode):
        if not message.strip():
            raise ValueError("Enter a trip request")
        if mode not in self.pipelines:
            raise ValueError("This provider is not configured on the server")
        run_id = str(uuid4())
        self.store.create(run_id, message.strip(), mode)
        self.launch(run_id, message=message.strip())
        return self.store.get(run_id)

    async def answer(self, run_id, answers):
        chat = self.store.get(run_id)
        if chat["status"] != "waiting_for_answers":
            raise ValueError("This chat is not waiting for follow-up answers")
        if not answers or isinstance(answers, str) and not answers.strip() or len(json.dumps(answers)) > 12000:
            raise ValueError("Answers must be nonempty and no longer than 12000 characters")
        if chat["mode"] not in self.pipelines:
            raise ValueError("The original provider is no longer configured")
        text = answers if isinstance(answers, str) else "\n".join(f"{k}: {v}" for k, v in answers.items())
        self.store.append(run_id, "user_message", {"text": text})
        self.launch(run_id, answers=answers)
        return self.store.get(run_id)

    async def work(self, run_id, message, answers):
        chat = self.store.get(run_id)
        pipeline = self.pipelines[chat["mode"]]
        try:
            async with self.semaphore:
                self.store.update(run_id, "running")
                result = await pipeline.start(message, run_id=run_id) if message is not None else await pipeline.resume(run_id, answers)
                if result.get("plan"):
                    export_plan(Plan.model_validate(result["plan"]), run_id, pipeline.settings.output_dir,
                                result["cost"], demo=chat["mode"] == "demo")
                    result["report_url"] = f"/runs/{run_id}/report"
                self.store.update(run_id, result["status"], result)
        except asyncio.CancelledError:
            self.store.update(run_id, "cancelled")
            raise
        except Exception as exc:
            try:
                result = await pipeline.status(run_id)
            except (KeyError, ValueError):
                result = {}
            result.update(status="failed", errors=[str(exc)])
            self.store.update(run_id, "failed", result)
        finally:
            self.jobs.pop(run_id, None)

    async def cancel(self, run_id):
        self.store.get(run_id)
        task = self.jobs.get(run_id)
        if not task:
            raise ValueError("This chat has no active request")
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)
        # A queued task can be cancelled before entering its try/finally.
        self.jobs.pop(run_id, None)
        if self.store.get(run_id)["status"] not in TERMINAL:
            self.store.update(run_id, "cancelled")
        return self.store.get(run_id)

    async def recover(self):
        for chat in self.store.list():
            if chat["status"] in {"queued", "running"}:
                self.store.update(chat["run_id"], "failed", {
                    "errors": ["The server restarted during this request. Start a new chat; partial activity has been preserved."]})
        # Make existing checkpointed CLI trips accessible in the chat history.
        seen = {chat["run_id"] for chat in self.store.list()}
        for mode, pipeline in self.pipelines.items():
            path = pipeline.settings.data_dir / (("demo-" if mode == "demo" else "") + "checkpoints.sqlite")
            if not path.exists():
                continue
            with sqlite3.connect(path) as db:
                table = db.execute("SELECT name FROM sqlite_master WHERE name='checkpoints'").fetchone()
                identifiers = [row[0] for row in db.execute("SELECT DISTINCT thread_id FROM checkpoints")] if table else []
            for identifier in identifiers:
                if identifier in seen:
                    continue
                try:
                    UUID(identifier)
                    result = await pipeline.status(identifier)
                except (ValueError, KeyError):
                    continue
                if result["status"] not in {"completed", "waiting_for_answers"}:
                    continue
                # Older runs predate a provider field; research metrics identify Cline's model.
                models = [r.get("metrics", {}).get("model", "") for r in result.get("research", {}).values()]
                original_mode = "cline" if any(m.startswith("inclusionai/") for m in models) else mode
                if original_mode not in self.pipelines:
                    original_mode = mode
                self.store.create(identifier, result.get("original_input") or result.get("plan", {}).get("title", "Saved trip"), original_mode)
                for answer in result.get("answers", []):
                    response = answer["response"]
                    self.store.append(identifier, "user_message", {"text": response if isinstance(response, str) else json.dumps(response)})
                if result.get("research"):
                    self.store.append(identifier, "research_spawned", {"roles": list(result["research"])})
                    for role, research in result["research"].items():
                        self.store.append(identifier, "agent_completed" if research.get("data") else "agent_failed",
                                          {"role": role, **research})
                if result.get("plan"):
                    result["report_url"] = f"/runs/{identifier}/report"
                self.store.update(identifier, result["status"], result)
                seen.add(identifier)

    async def close(self):
        for task in list(self.jobs.values()):
            task.cancel()
        await asyncio.gather(*list(self.jobs.values()), return_exceptions=True)
        self.jobs.clear()
