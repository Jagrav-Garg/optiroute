import argparse
import asyncio
import json
import logging
import sys

import httpx

from .budget import BudgetLedger
from .cline_api import create_model_client
from .config import Settings
from .export import export_plan
from .graph import open_pipeline
from .models import Plan


def parser():
    root = argparse.ArgumentParser(prog="python -m optiroute", description="OptiRoute travel planner: Cline SDK + LangGraph")
    commands = root.add_subparsers(dest="command", required=True)
    chat = commands.add_parser("chat", help="Plan a trip with interactive follow-up questions")
    chat.add_argument("message", nargs="?", help="Initial travel request")
    chat.add_argument("--model", help="Override both coordinator/specialist and planner models")
    chat.add_argument("--planner-model", help="Override only the planner model")
    chat.add_argument("--paid", action="store_true", help="Explicitly allow paid models under the spending caps")
    chat.add_argument("--demo", action="store_true", help="Use Jaipur fixtures, with no API calls")
    resume = commands.add_parser("resume", help="Resume a saved follow-up after restarting the application")
    resume.add_argument("run_id")
    resume.add_argument("--demo", action="store_true")
    commands.add_parser("demo", help="Exercise the real Cline agent loop with unbilled fixtures")
    models = commands.add_parser("models", help="List cheapest current tool-capable models for the selected provider")
    doctor = commands.add_parser("doctor", help="Check provider configuration, dependencies and project spending")
    status = commands.add_parser("status", help="Read a saved trip")
    status.add_argument("run_id")
    status.add_argument("--demo", action="store_true")
    repair = commands.add_parser("repair", help="Replan from saved specialist research without repeating it")
    repair.add_argument("run_id")
    repair.add_argument("--demo", action="store_true")
    repair.add_argument("--model", help="Override the planner model for this repair only")
    repair.add_argument("--paid", action="store_true", help="Explicitly allow a paid planner under the spending caps")
    for command in (chat, resume, repair, models, doctor):
        command.add_argument("--provider", choices=["openrouter", "cline"], help="Choose the model API for this invocation")
    return root


async def finish_interactively(pipeline, result, automatic=False):
    from .demo import demo_brief
    while result["status"] == "waiting_for_answers":
        print(f"\nRun: {result['run_id']}\nFollow-up questions:")
        answers = {}
        for question in result["follow_up"]["questions"]:
            if automatic:
                answers[question["id"]] = demo_brief().get(question["id"], "History, vegetarian food, trains preferred.")
                print(f"  {question['question']} {answers[question['id']]}")
            else:
                answer = input(question["question"] + " ").strip()
                if not answer:
                    print("Saved. Resume this run with: python -m optiroute resume " + result["run_id"])
                    return result
                answers[question["id"]] = answer
        result = await pipeline.resume(result["run_id"], answers)
    return result


async def main(args):
    settings = Settings()
    if getattr(args, "provider", None):
        settings.model_provider = args.provider
    if getattr(args, "model", None):
        setattr(settings, settings.model_provider + "_model", args.model)
        setattr(settings, settings.model_provider + "_planner_model", args.model)
    if getattr(args, "planner_model", None):
        setattr(settings, settings.model_provider + "_planner_model", args.planner_model)
    if getattr(args, "paid", False):
        settings.allow_paid_models = True
    settings.prepare()
    if args.command in ("models", "doctor"):
        ledger = BudgetLedger(settings.data_dir / "spending.sqlite", settings.max_run_cost_usd, settings.max_total_cost_usd)
        async with httpx.AsyncClient() as client:
            router = create_model_client(settings, ledger, client)
            if args.command == "models":
                print(json.dumps(await router.cheapest(30), indent=2))
            else:
                import shutil
                from .config import ROOT
                print(json.dumps({"python": sys.version.split()[0], "node": shutil.which("node"),
                    "worker_built": (ROOT / "dist/agent.js").exists(), "key": await router.key_info(),
                    "provider": settings.model_provider,
                    "research_model": settings.model_for("transit"), "planner_model": settings.model_for("planner"),
                    "paid_models_allowed": settings.allow_paid_models, "spending": ledger.summary()}, indent=2))
        return
    demo = args.command == "demo" or getattr(args, "demo", False)
    async with open_pipeline(settings, demo=demo) as pipeline:
        if args.command == "status":
            print(json.dumps(await pipeline.status(args.run_id), indent=2))
            return
        if args.command == "repair":
            saved = await pipeline.graph.aget_state(pipeline.config(args.run_id))
            if not saved.values.get("research") or saved.next:
                raise ValueError("Repair requires a completed run with saved specialist research")
            update = await pipeline.plan(saved.values)
            await pipeline.graph.aupdate_state(pipeline.config(args.run_id), update, as_node="planner")
            result = await pipeline.status(args.run_id)
        elif args.command == "resume":
            result = await pipeline.status(args.run_id)
        else:
            message = "Plan a relaxed weekend in Jaipur." if args.command == "demo" else args.message or input("Where would you like to go? ").strip()
            print("\nOptiRoute / " + ("unbilled fixture demo" if demo else "live, source-backed planning"))
            result = await pipeline.start(message)
        result = await finish_interactively(pipeline, result, automatic=args.command == "demo")
        if result.get("plan"):
            plan = Plan.model_validate(result["plan"])
            files = export_plan(plan, result["run_id"], settings.output_dir, result["cost"], demo=demo)
            print(f"\n{plan.title}\nValidation: {plan.validation.status}\nKnown estimated total: {plan.validation.known_estimated_total:g} {plan.brief.currency}")
            print(f"Sources: {len(plan.sources)} | Photos: {len(plan.images)} | API spend or reserved: ${result['cost']['run_accounted_usd']:.6f}")
            for format, path in files.items():
                print(f"{format.upper()}: {path}")
        elif result["status"] != "waiting_for_answers":
            raise RuntimeError("Run ended without a plan: " + json.dumps(result.get("errors", [])))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)
    try:
        asyncio.run(main(parser().parse_args()))
    except KeyboardInterrupt:
        print("\nStopped. Completed checkpoints and spending reservations remain saved.", file=sys.stderr)
        sys.exit(130)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
