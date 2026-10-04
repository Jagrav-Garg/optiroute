import asyncio
import os
import json
import time
from contextlib import AsyncExitStack, asynccontextmanager
from uuid import UUID

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .export import export_plan
from .graph import open_pipeline
from .models import Plan
from .config import ROOT, Settings
from .chat import ChatManager, ChatStore, TERMINAL


class TripInput(BaseModel):
    message: str = Field(min_length=1, max_length=12000, examples=["Plan a relaxed 2-day trip to Jaipur from Delhi for two people in November. Budget INR 14000."])


class AnswersInput(BaseModel):
    answers: str | dict = Field(examples=[{"start_date": "2026-11-07", "end_date": "2026-11-08", "preferences": "History, vegetarian food, trains preferred"}])


class ChatInput(TripInput):
    mode: str = "cline"


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = Settings()
    demo_only = os.getenv("OPT_ROUTE_DEMO", "false").lower() == "true"
    async with AsyncExitStack() as stack:
        pipelines = {"demo": await stack.enter_async_context(open_pipeline(settings, demo=True))}
        if not demo_only:
            for provider in ("cline", "openrouter"):
                if getattr(settings, provider + "_api_key").get_secret_value():
                    pipelines[provider] = await stack.enter_async_context(open_pipeline(
                        settings.model_copy(update={"model_provider": provider})))
        app.state.pipeline = pipelines.get(settings.model_provider, pipelines["demo"])
        app.state.busy = set()
        app.state.semaphore = asyncio.Semaphore(2)
        app.state.chats = ChatManager(pipelines, ChatStore(settings.data_dir / "chat.sqlite"), app.state.semaphore)
        await app.state.chats.recover()
        try:
            yield
        finally:
            await app.state.chats.close()


app = FastAPI(title="OptiRoute Travel Planner", version="0.2.0", lifespan=lifespan,
              description="Cline SDK agents with resumable clarification, parallel research and source-backed itineraries.")
app.mount("/assets", StaticFiles(directory=ROOT / "frontend" / "dist" / "assets", check_dir=False), name="assets")


@app.middleware("http")
async def local_origin(request: Request, call_next):
    if request.method in {"POST", "PUT", "DELETE"} and request.headers.get("origin"):
        from urllib.parse import urlparse
        if urlparse(request.headers["origin"]).netloc != request.headers.get("host"):
            from fastapi.responses import JSONResponse
            return JSONResponse({"detail": "Cross-origin mutations are not allowed"}, status_code=403)
    return await call_next(request)


def exported(result: dict) -> dict:
    if result.get("plan"):
        pipeline = app.state.pipeline
        result["exports"] = export_plan(Plan.model_validate(result["plan"]), result["run_id"],
            pipeline.settings.output_dir, result["cost"], demo=os.getenv("OPT_ROUTE_DEMO", "false").lower() == "true")
        result["report_url"] = f"/runs/{result['run_id']}/report"
    return result


@app.get("/", include_in_schema=False)
async def root():
    path = ROOT / "frontend" / "dist" / "index.html"
    if not path.exists():
        raise HTTPException(503, "Build the chat interface with npm run build")
    return FileResponse(path, media_type="text/html")


@app.get("/health")
async def health():
    return {"status": "ok", "engine": "Cline SDK + LangGraph", "demo": os.getenv("OPT_ROUTE_DEMO", "false").lower() == "true"}


@app.post("/runs")
async def create_run(body: TripInput):
    try:
        async with app.state.semaphore:
            return exported(await app.state.pipeline.start(body.message))
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(502, str(exc)) from exc


@app.get("/runs/{run_id}")
async def get_run(run_id: UUID):
    try:
        return await app.state.pipeline.status(str(run_id))
    except KeyError as exc:
        raise HTTPException(404, "Run not found") from exc


@app.post("/runs/{run_id}/answers")
async def answer_run(run_id: UUID, body: AnswersInput):
    identifier = str(run_id)
    if identifier in app.state.busy:
        raise HTTPException(409, "This run already has a request in progress")
    app.state.busy.add(identifier)
    try:
        async with app.state.semaphore:
            return exported(await app.state.pipeline.resume(identifier, body.answers))
    except KeyError as exc:
        raise HTTPException(404, "Run not found") from exc
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(502, str(exc)) from exc
    finally:
        app.state.busy.discard(identifier)


@app.get("/runs/{run_id}/report", include_in_schema=False)
async def report(run_id: UUID):
    path = app.state.pipeline.settings.output_dir / str(run_id) / "plan.html"
    if not path.exists():
        raise HTTPException(404, "Report has not been exported yet")
    return FileResponse(path, media_type="text/html")


@app.get("/spending")
async def spending():
    return app.state.pipeline.ledger.summary()


@app.get("/chat-config")
async def chat_config():
    pipelines = app.state.chats.pipelines
    return {"default_mode": "cline" if "cline" in pipelines else "openrouter" if "openrouter" in pipelines else "demo",
            "modes": [{"id": mode, "label": {"cline": "Cline", "openrouter": "OpenRouter", "demo": "Demo fixtures"}[mode],
                       "model": pipeline.settings.model_for("places") if mode != "demo" else "Offline fixtures",
                       "free_only": not pipeline.settings.allow_paid_models if mode != "demo" else True}
                      for mode, pipeline in pipelines.items()]}


@app.get("/chats")
async def list_chats():
    return app.state.chats.store.list()


@app.post("/chats", status_code=202)
async def create_chat(body: ChatInput):
    try:
        return app.state.chats.create(body.message, body.mode)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@app.get("/chats/{run_id}")
async def get_chat(run_id: UUID):
    try:
        return app.state.chats.store.get(str(run_id))
    except KeyError as exc:
        raise HTTPException(404, "Chat not found") from exc


@app.post("/chats/{run_id}/answers", status_code=202)
async def answer_chat(run_id: UUID, body: AnswersInput):
    try:
        return await app.state.chats.answer(str(run_id), body.answers)
    except KeyError as exc:
        raise HTTPException(404, "Chat not found") from exc
    except ValueError as exc:
        raise HTTPException(409 if "progress" in str(exc) else 422, str(exc)) from exc


@app.post("/chats/{run_id}/cancel")
async def cancel_chat(run_id: UUID):
    try:
        return await app.state.chats.cancel(str(run_id))
    except KeyError as exc:
        raise HTTPException(404, "Chat not found") from exc
    except ValueError as exc:
        raise HTTPException(409, str(exc)) from exc


@app.get("/chats/{run_id}/events")
async def chat_events(run_id: UUID, request: Request, after: int = 0):
    identifier = str(run_id)
    try:
        app.state.chats.store.get(identifier)
    except KeyError as exc:
        raise HTTPException(404, "Chat not found") from exc
    try:
        cursor = max(0, after, int(request.headers.get("last-event-id", "0")))
    except ValueError as exc:
        raise HTTPException(422, "Invalid event cursor") from exc

    async def stream():
        nonlocal cursor
        ping_at = time.monotonic()
        while not await request.is_disconnected():
            events = app.state.chats.store.events(identifier, cursor)
            for event in events:
                cursor = event["id"]
                yield f"id: {cursor}\ndata: {json.dumps(event)}\n\n"
            status = app.state.chats.store.get(identifier)["status"]
            if len(events) < 250 and status in TERMINAL | {"waiting_for_answers"}:
                yield f"event: idle\ndata: {json.dumps(app.state.chats.store.get(identifier))}\n\n"
                break
            if time.monotonic() - ping_at > 10:
                yield ": heartbeat\n\n"
                ping_at = time.monotonic()
            await asyncio.sleep(0.15)
    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.get("/runs/{run_id}/download/{kind}")
async def download_report(run_id: UUID, kind: str):
    if kind not in {"json", "md", "html"}:
        raise HTTPException(404, "Unknown report format")
    path = app.state.pipeline.settings.output_dir / str(run_id) / f"plan.{kind}"
    if not path.exists():
        raise HTTPException(404, "Report not found")
    return FileResponse(path, filename=f"optiroute-{run_id}.{kind}")
