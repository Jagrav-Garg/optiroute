"""Small live integration check. Free by default; never silently selects paid models."""
import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from optiroute.config import Settings
from optiroute.demo import demo_brief
from optiroute.export import export_plan
from optiroute.graph import open_pipeline
from optiroute.models import Plan


async def smoke(args):
    settings = Settings(max_run_cost_usd=0.02)
    if args.model:
        settings.openrouter_model = args.model
        settings.openrouter_planner_model = args.model
    settings.allow_paid_models = args.paid
    brief = demo_brief()
    request = (f"Plan a relaxed trip from Delhi to Jaipur from {brief['start_date']} to {brief['end_date']} "
               "for two adults. Total budget INR 14000 for both people including travel, one night, meals and sightseeing. "
               "We like history and vegetarian food, prefer trains and a central budget double room. No accessibility requirements.")
    async with open_pipeline(settings) as pipeline:
        result = await pipeline.start(request)
        print("RUN_ID=" + result["run_id"], flush=True)
        for _ in range(3):
            if result["status"] != "waiting_for_answers":
                break
            print("FOLLOW_UP=" + json.dumps(result["follow_up"]["questions"]), flush=True)
            result = await pipeline.resume(result["run_id"], {**brief, "preferences": "History, vegetarian food, relaxed pace. Prefer trains; no mobility limitations. Confirm all the constraints above."})
        plan = Plan.model_validate(result["plan"])
        files = export_plan(plan, result["run_id"], settings.output_dir, result["cost"])
        print(json.dumps({"run_id": result["run_id"], "status": result["status"], "validation": plan.validation.model_dump(),
            "sources": len(plan.sources), "images": len(plan.images), "specialists": {role: {"completed": item["data"] is not None, "metrics": item["metrics"], "error": item.get("error")} for role, item in result["research"].items()},
            "cost": result["cost"], "exports": files}, indent=2))
        if any(item["data"] is None for item in result["research"].values()):
            raise RuntimeError("At least one specialist failed; inspect the saved report")
        if plan.validation.errors:
            raise RuntimeError("Plan failed basic constraints; inspect the saved report")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model")
    parser.add_argument("--paid", action="store_true")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)
    try:
        asyncio.run(smoke(args))
    except Exception as exc:
        print(f"Smoke test failed: {exc}", file=sys.stderr)
        sys.exit(1)

