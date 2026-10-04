"""Live Cline test using explicit sample assumptions and catalog pricing."""
import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from optiroute.config import Settings
from optiroute.export import export_plan
from optiroute.graph import open_pipeline
from optiroute.models import Plan


ASSUMPTIONS = {
    "origin": "Delhi", "destination": "Switzerland",
    "start_date": "2027-06-07", "end_date": "2027-06-13",
    "travelers": 2, "budget": 6000, "currency": "CHF", "pace": "relaxed",
    "interests": ["scenic lakes", "mountain views", "old towns", "vegetarian food"],
    "accommodation": "one comfortable budget double room per night",
    "transport_preferences": "international flights and public trains within Switzerland",
    "constraints": ["These are automated test assumptions, not confirmed user preferences.",
                    "Prefer Zurich, Lucerne and Interlaken; avoid strenuous hiking.",
                    "Allow arrival and departure time; no more than four itinerary activities per day."]}


async def smoke(args):
    settings = Settings(model_provider="cline", max_run_cost_usd=0.02, allow_paid_models=args.paid)
    if args.model:
        settings.cline_model = settings.cline_planner_model = args.model
    async with open_pipeline(settings) as pipeline:
        result = await pipeline.start("Plan a trip to Switzerland. This is an automated pipeline test; follow-up answers will specify sample assumptions rather than confirmed personal preferences.")
        print("RUN_ID=" + result["run_id"], flush=True)
        print("TEST_ASSUMPTIONS=" + json.dumps(ASSUMPTIONS), flush=True)
        for _ in range(3):
            if result["status"] != "waiting_for_answers":
                break
            print("FOLLOW_UP=" + json.dumps(result["follow_up"]["questions"]), flush=True)
            result = await pipeline.resume(result["run_id"], {
                **ASSUMPTIONS, "preferences": "Use the stated test assumptions. Include international round-trip flights, six nights, meals, sightseeing, Swiss transport and contingency in the total group budget. Disclose uncertain costs; do not invent booking quotes."})
        if not result.get("plan"):
            raise RuntimeError("Test ended without a plan; saved run " + result["run_id"])
        plan = Plan.model_validate(result["plan"])
        note = "TEST ASSUMPTIONS: Delhi departure; 7-13 June 2027; two adults; CHF 6,000 total. User supplied only Switzerland as the destination."
        if plan.assumptions:
            plan.assumptions[0] = note + " " + plan.assumptions[0]
        else:
            plan.assumptions.append(note)
        await pipeline.graph.aupdate_state(pipeline.config(result["run_id"]), {"plan": plan.model_dump(mode="json")}, as_node="planner")
        files = export_plan(plan, result["run_id"], settings.output_dir, result["cost"])
        summary = {"run_id": result["run_id"], "provider": "cline", "status": result["status"],
                   "validation": plan.validation.model_dump(), "sources": len(plan.sources), "images": len(plan.images),
                   "specialists": {role: {"completed": item["data"] is not None, "metrics": item["metrics"], "error": item.get("error")} for role, item in result["research"].items()},
                   "cost": result["cost"], "exports": files}
        print(json.dumps(summary, indent=2), flush=True)
        if any(item["data"] is None for item in result["research"].values()):
            raise RuntimeError("At least one specialist failed; inspect the saved report")
        if plan.validation.errors:
            raise RuntimeError("Plan has unresolved basic constraints; inspect the saved report")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", help="Override the Cline model for this test")
    parser.add_argument("--paid", action="store_true", help="Allow paid models under the $0.02 run cap")
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("primp").setLevel(logging.WARNING)
    try:
        asyncio.run(smoke(parser.parse_args()))
    except Exception as exc:
        print(f"Switzerland test failed: {exc}", file=sys.stderr)
        sys.exit(1)
