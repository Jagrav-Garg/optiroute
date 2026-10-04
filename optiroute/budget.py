import json
import math
import sqlite3
from pathlib import Path
from uuid import uuid4


class BudgetExceeded(RuntimeError):
    pass


class BudgetLedger:
    """Reservations survive failures and serialize concurrent agent spending."""

    def __init__(self, path: Path, run_limit: float, total_limit: float):
        self.path, self.run_limit, self.total_limit = path, run_limit, total_limit
        path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.execute("""CREATE TABLE IF NOT EXISTS charges (
                id TEXT PRIMARY KEY, run_id TEXT NOT NULL, agent TEXT NOT NULL,
                model TEXT NOT NULL, amount REAL NOT NULL, status TEXT NOT NULL,
                usage TEXT NOT NULL DEFAULT '{}')""")

    def connect(self):
        return sqlite3.connect(self.path, timeout=20)

    def reserve(self, run_id: str, agent: str, model: str, amount: float) -> str:
        if not math.isfinite(amount) or amount < 0:
            raise ValueError("Negative prices are not supported")
        identifier = str(uuid4())
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            total = db.execute("SELECT COALESCE(SUM(amount),0) FROM charges").fetchone()[0]
            run = db.execute("SELECT COALESCE(SUM(amount),0) FROM charges WHERE run_id=?", (run_id,)).fetchone()[0]
            if total + amount > self.total_limit or run + amount > self.run_limit:
                raise BudgetExceeded(f"Spending limit reached (run cap ${self.run_limit:.2f}, project cap ${self.total_limit:.2f}).")
            db.execute("INSERT INTO charges(id,run_id,agent,model,amount,status) VALUES(?,?,?,?,?,?)",
                       (identifier, run_id, agent, model, amount, "reserved"))
        return identifier

    def settle(self, identifier: str, actual: float, usage: dict) -> None:
        if not math.isfinite(actual) or actual < 0:
            raise ValueError("Negative usage costs are not supported")
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            previous = db.execute("SELECT amount FROM charges WHERE id=?", (identifier,)).fetchone()
            if previous is None:
                raise ValueError("Unknown reservation")
            db.execute("UPDATE charges SET amount=?,status='settled',usage=? WHERE id=?",
                       (actual, json.dumps(usage), identifier))
        if actual > previous[0] + 0.0000001:
            raise BudgetExceeded("Provider billed more than the reserved upper bound; stopping this run.")

    def release(self, identifier: str) -> None:
        with self.connect() as db:
            db.execute("UPDATE charges SET amount=0,status='not_charged' WHERE id=?", (identifier,))

    def summary(self, run_id: str | None = None) -> dict:
        with self.connect() as db:
            total = db.execute("SELECT COALESCE(SUM(amount),0) FROM charges").fetchone()[0]
            rows = db.execute("SELECT agent,model,amount,status,usage FROM charges" +
                              (" WHERE run_id=?" if run_id else ""), (run_id,) if run_id else ()).fetchall()
        return {"project_accounted_usd": round(total, 8), "run_accounted_usd": round(sum(row[2] for row in rows), 8),
                "unconfirmed_reservations": sum(row[3] == "reserved" for row in rows),
                "calls": [{"agent": a, "model": m, "cost_usd": c, "status": s, "usage": json.loads(u)} for a, m, c, s, u in rows],
                "run_cap_usd": self.run_limit, "project_cap_usd": self.total_limit}
