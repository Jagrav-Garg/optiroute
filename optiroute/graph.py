import json
import logging
from contextlib import asynccontextmanager
from datetime import date, datetime, timezone
from typing import Annotated, TypedDict
from uuid import UUID, uuid4

import httpx
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt

from .agents import AgentRunError, ClineAgentRunner
from .budget import BudgetLedger
from .cline_api import create_model_client
from .config import Settings
from .models import Clarification, Plan, PlanDraft, Research, TripBrief
from .prompts import COORDINATOR, PLANNER, SPECIALISTS
from .search import WebTools
from .validation import validate_plan

log = logging.getLogger("optiroute")


def merge_research(left: dict, right: dict) -> dict:
    return {**left, **right}


class State(TypedDict, total=False):
    run_id: str
    original_input: str
    brief: dict
    questions: list[dict]
    answers: list[dict]
    clarification_round: int
    research: Annotated[dict, merge_research]
    plan: dict
    metrics: dict
    errors: list[str]


QUESTIONS = {
    "origin": "Where will you travel from?",
    "destination": "Which destination would you like to visit?",
    "start_date": "What is your departure date (YYYY-MM-DD)?",
    "end_date": "What is your return date (YYYY-MM-DD)?",
    "travelers": "How many people are traveling?",
    "budget": "What is the total budget for the whole group and trip?",
    "currency": "Which currency is that budget in (for example INR, USD or EUR)?",
}


class Pipeline:
    def __init__(self, settings: Settings, runner: ClineAgentRunner, web: WebTools, ledger: BudgetLedger, checkpointer):
        self.settings, self.runner, self.web, self.ledger = settings, runner, web, ledger
        builder = StateGraph(State)
        builder.add_node("coordinator", self.coordinate)
        builder.add_node("follow_up", self.follow_up)
        for role in SPECIALISTS:
            builder.add_node(role, self.specialist(role))
        builder.add_node("planner", self.plan)
        builder.add_edge(START, "coordinator")
        builder.add_conditional_edges("coordinator", self.route, ["follow_up", "transit", "hotels", "places"])
        builder.add_edge("follow_up", "coordinator")
        builder.add_edge(["transit", "hotels", "places"], "planner")
        builder.add_edge("planner", END)
        self.graph = builder.compile(checkpointer=checkpointer)

    async def emit(self, run_id, kind, **payload):
        if hasattr(self.runner, "emit"):
            await self.runner.emit(run_id, kind, **payload)

    async def coordinate(self, state: State) -> dict:
        log.info("Coordinator: extracting constraints (follow-up round %s)", state.get("clarification_round", 0))
        result = await self.runner.run(state["run_id"], "coordinator", COORDINATOR, json.dumps({
            "original_input": state["original_input"], "current_brief": state.get("brief", {}),
            "answers": state.get("answers", []), "current_date": date.today().isoformat(),
            "follow_up_round": state.get("clarification_round", 0)}), Clarification, max_tokens=1600)
        clarification = Clarification.model_validate(result["data"])
        brief = clarification.brief
        missing = brief.missing()
        questions = [{"id": key, "question": QUESTIONS[key]} for key in missing]
        if not missing and brief.start_date < date.today():
            questions = [{"id": "start_date", "question": "The departure date is in the past. What future dates should I use?"}]
        if not questions and state.get("clarification_round", 0) == 0:
            questions = [question.model_dump() for question in clarification.questions] or [
                {"id": "preferences", "question": "Any must-see places, food preferences, accommodation or accessibility needs? You can also confirm the current preferences."}]
        if questions and state.get("clarification_round", 0) >= 3:
            raise ValueError("Essential constraints are still unresolved after three follow-ups. Start a new run with the requested details.")
        if not questions:
            await self.emit(state["run_id"], "research_spawned", roles=list(SPECIALISTS))
        return {"brief": brief.model_dump(mode="json"), "questions": questions}

    @staticmethod
    def route(state: State):
        return "follow_up" if state.get("questions") else ["transit", "hotels", "places"]

    @staticmethod
    def follow_up(state: State) -> dict:
        # This node has no model call: LangGraph replay cannot bill the coordinator twice.
        answers = interrupt({"questions": state["questions"], "brief": state["brief"]})
        if not isinstance(answers, (str, dict)) or not answers:
            raise ValueError("Follow-up answers must be a nonempty string or object")
        return {"answers": state.get("answers", []) + [{"questions": state["questions"], "response": answers}],
                "clarification_round": state.get("clarification_round", 0) + 1}

    def specialist(self, role: str):
        async def run(state: State):
            log.info("%s agent: starting research", role)
            try:
                result = await self.runner.run(state["run_id"], role, SPECIALISTS[role],
                    json.dumps({"brief": state["brief"]}), Research)
            except AgentRunError as exc:
                result = exc.partial
            except Exception as exc:
                # The planner receives the missing branch explicitly, never fabricated research.
                result = {"data": None, "sources": [], "images": [], "warnings": [f"{role} research failed: {exc}"],
                          "metrics": {}, "error": str(exc)}
            log.info("%s agent: %s", role, "finished" if result["data"] else "needs attention")
            return {"research": {role: result}}
        return run

    async def plan(self, state: State) -> dict:
        log.info("Planner: combining three specialist reports")
        await self.emit(state["run_id"], "planner_started", role="planner", message="Combining the three research reports")
        sources, images, warnings = {}, {}, []
        for result in state["research"].values():
            sources.update({item["id"]: item for item in result["sources"]})
            images.update({item["image_url"]: item for item in result["images"]})
            warnings.extend(result["warnings"])
        if not images:
            await self.emit(state["run_id"], "tool_started", role="planner", tool="search_images", query=state["brief"]["destination"])
            photos = await self.web.search_images(state["brief"]["destination"])
            await self.emit(state["run_id"], "tool_completed", role="planner", tool="search_images", images=photos["images"])
            images.update({item["image_url"]: item for item in photos["images"]})
            warnings.extend(photos["warnings"])
        if not sources:
            raise RuntimeError("All research failed or returned no sources. The planner will not fabricate an itinerary. Check search connectivity and model availability.")
        prompt = {"brief": state["brief"], "research": {role: result["data"] for role, result in state["research"].items()},
                  "sources": list(sources.values()), "research_warnings": warnings}
        if state.get("plan"):
            prompt["previous_plan"] = state["plan"]
            prompt["corrections_requested"] = state["plan"]["validation"]["errors"] + state["plan"]["validation"]["warnings"]
        brief = TripBrief.model_validate(state["brief"])
        days = (brief.end_date - brief.start_date).days + 1

        def check_draft(draft, known_sources):
            checks = validate_plan(draft, brief, known_sources, list(images.values()))
            return checks.errors + [warning for warning in checks.warnings if "despite the relaxed pace" in warning]

        result = await self.runner.run(state["run_id"], "planner", PLANNER, json.dumps(prompt), PlanDraft,
                                      seed_sources=list(sources.values()), max_tokens=min(10000, 3200 + days * 600),
                                      result_validator=check_draft)
        sources.update({item["id"]: item for item in result["sources"]})
        images.update({item["image_url"]: item for item in result["images"]})
        draft = PlanDraft.model_validate(result["data"])
        draft.warnings = list(dict.fromkeys(draft.warnings + warnings + result["warnings"]))
        validation = validate_plan(draft, brief, list(sources.values()), list(images.values()))
        if any(result.get("error") for result in state["research"].values()):
            validation.status = "needs_review"
            validation.warnings.append("One or more specialist agents failed; the plan has incomplete research.")
        if any(source["provider"] == "wikipedia_reference" for source in sources.values()):
            validation.status = "needs_review"
        plan = Plan(**draft.model_dump(), brief=brief, sources=list(sources.values()),
                    images=list(images.values())[:6], validation=validation)
        await self.emit(state["run_id"], "plan_validated", role="planner", validation=validation.model_dump(mode="json"))
        return {"plan": plan.model_dump(mode="json"), "metrics": result["metrics"]}

    @staticmethod
    def config(run_id: str):
        UUID(run_id)
        return {"configurable": {"thread_id": run_id}, "recursion_limit": 30}

    async def start(self, user_input: str, run_id: str | None = None) -> dict:
        if not user_input.strip() or len(user_input) > 12000:
            raise ValueError("Trip input must contain between 1 and 12000 characters")
        run_id = run_id or str(uuid4())
        if (await self.graph.aget_state(self.config(run_id))).values:
            raise ValueError("This run already exists")
        log.info("Starting saved trip %s", run_id)
        await self.graph.ainvoke({"run_id": run_id, "original_input": user_input, "answers": [],
                                  "clarification_round": 0, "research": {}}, config=self.config(run_id))
        return await self.status(run_id)

    async def resume(self, run_id: str, answers: str | dict) -> dict:
        snapshot = await self.graph.aget_state(self.config(run_id))
        if not snapshot.values:
            raise KeyError("Run not found")
        if not any(task.interrupts for task in snapshot.tasks):
            raise ValueError("This run is not waiting for follow-up answers")
        if not answers or len(json.dumps(answers)) > 12000:
            raise ValueError("Answers must be nonempty and no longer than 12000 characters")
        await self.graph.ainvoke(Command(resume=answers), config=self.config(run_id))
        return await self.status(run_id)

    async def status(self, run_id: str) -> dict:
        snapshot = await self.graph.aget_state(self.config(run_id))
        if not snapshot.values:
            raise KeyError("Run not found")
        pending = [item.value for task in snapshot.tasks for item in task.interrupts]
        errors = [str(task.error) for task in snapshot.tasks if task.error]
        values = snapshot.values
        status = "waiting_for_answers" if pending else "completed" if values.get("plan") else "failed" if errors else "running"
        return {"run_id": run_id, "status": status, "brief": values.get("brief"),
                "original_input": values.get("original_input"), "answers": values.get("answers", []),
                "follow_up": pending[0] if pending else None, "plan": values.get("plan"),
                "research": values.get("research", {}), "errors": errors, "cost": self.ledger.summary(run_id)}


@asynccontextmanager
async def open_pipeline(settings: Settings | None = None, demo: bool = False):
    settings = settings or Settings()
    settings.prepare()
    prefix = "demo-" if demo else ""
    ledger = BudgetLedger(settings.data_dir / (prefix + "spending.sqlite"), settings.max_run_cost_usd, settings.max_total_cost_usd)
    async with httpx.AsyncClient(headers={"User-Agent": "OptiRoute/0.1 (local travel-planning prototype)"}) as client:
        if demo:
            from .demo import DemoRouter, DemoWebTools
            web = DemoWebTools()
            router = DemoRouter()
        else:
            web = WebTools(settings.data_dir / "search.sqlite", client)
            router = create_model_client(settings, ledger, client)
        runner = ClineAgentRunner(settings, router, web)
        async with AsyncSqliteSaver.from_conn_string(str(settings.data_dir / (prefix + "checkpoints.sqlite"))) as checkpointer:
            yield Pipeline(settings, runner, web, ledger, checkpointer)
