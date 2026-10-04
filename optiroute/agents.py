import asyncio
import json
import logging
import os
import shutil
import time
from typing import Callable, Type

from pydantic import BaseModel, ValidationError
from partial_json_parser import loads as partial_loads

from .config import ROOT, Settings
from .models import Source, TravelImage, citation_ids
from .openrouter import OpenRouterClient
from .search import WebTools
from .structured import normalize_containers, tool_schema

log = logging.getLogger("optiroute.agents")


class AgentRunError(RuntimeError):
    def __init__(self, message: str, partial: dict):
        super().__init__(message)
        self.partial = partial


class ClineAgentRunner:
    def __init__(self, settings: Settings, router: OpenRouterClient, web: WebTools):
        self.settings, self.router, self.web = settings, router, web
        self.observer = None

    async def emit(self, run_id, kind, **payload):
        if self.observer:
            await self.observer(run_id, kind, payload)

    async def run(self, run_id: str, role: str, system_prompt: str, prompt: str,
                  schema: Type[BaseModel], seed_sources: list[dict] | None = None,
                  max_tokens: int = 3000,
                  result_validator: Callable[[BaseModel, list[dict]], list[str]] | None = None) -> dict:
        worker = ROOT / "dist" / "agent.js"
        node = shutil.which("node")
        if not node or not worker.exists():
            raise RuntimeError("Cline worker is missing. Install Node.js 22+ and run npm install followed by npm run build.")
        env = {key: value for key, value in os.environ.items() if key not in ("OPENROUTER_API_KEY", "OPENAI_API_KEY", "CLINE_API_KEY")}
        sources = {source["id"]: source for source in (seed_sources or [])}
        images, warnings, calls, searches, image_searches = [], [], 0, 0, 0
        last_validation_errors = []
        model = self.settings.model_for(role)
        output_schema = tool_schema(schema)
        await self.emit(run_id, "agent_started", role=role, model=getattr(self.router, "display_model", model))
        last_draft_at = 0.0
        latest_output = None

        async def publish_output(output, force=False):
            nonlocal last_draft_at, latest_output
            latest_output = output
            if not force and time.monotonic() - last_draft_at < 0.18:
                return
            draft = None
            for tool in output.get("tool_calls", []):
                if tool.get("function", {}).get("name") == "submit_result":
                    try:
                        value = normalize_containers(partial_loads(tool["function"]["arguments"]), output_schema, partial=True)
                        if isinstance(value, dict):
                            draft = {k: v for k, v in value.items() if k in schema.model_fields}
                    except (ValueError, TypeError):
                        pass
            content = output.get("content", "")
            if draft or content:
                last_draft_at = time.monotonic()
                await self.emit(run_id, "agent_draft", role=role, call=calls, draft=draft, content=content[:20000])

        async def reply(identifier: str, data=None, error=None):
            payload = {"type": "response", "id": identifier, "data": data, "error": error}
            process.stdin.write((json.dumps(payload, default=str) + "\n").encode())
            await process.stdin.drain()

        start = {"type": "start", "role": role, "system_prompt": system_prompt, "prompt": prompt,
                 "output_schema": output_schema, "max_iterations": self.settings.max_model_calls_per_agent,
                 "rpc_timeout_ms": (self.settings.model_timeout_seconds + 25) * 1000}
        process = await asyncio.create_subprocess_exec(node, str(worker), cwd=ROOT, env=env,
            stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE, limit=2**20)
        stderr_task = asyncio.create_task(process.stderr.read())
        try:
            process.stdin.write((json.dumps(start) + "\n").encode())
            await process.stdin.drain()
            async with asyncio.timeout(self.settings.agent_timeout_seconds):
                while line := await process.stdout.readline():
                    message = json.loads(line)
                    if message["type"] == "result":
                        if message.get("data") is None or message.get("status") != "completed":
                            detail = f"{role}: {message.get('error', 'Agent did not complete')}"
                            if last_validation_errors:
                                detail += "; validation: " + json.dumps(last_validation_errors, default=str)[:800]
                            raise AgentRunError(detail, {"data": None, "sources": list(sources.values()),
                                "images": images, "warnings": warnings + [detail], "error": detail,
                                "metrics": {"model": model, "model_calls": calls, "searches": searches}})
                        validated = schema.model_validate(message["data"])
                        await self.emit(run_id, "agent_completed", role=role, data=validated.model_dump(mode="json"),
                                        sources=list(sources.values()), images=images,
                                        metrics={"model_calls": calls, "searches": searches})
                        return {"data": validated.model_dump(mode="json"), "sources": list(sources.values()),
                                "images": images, "warnings": warnings,
                                "metrics": {"model": model, "model_calls": calls, "searches": searches, **message.get("usage", {})}}
                    if message["type"] == "fatal":
                        raise RuntimeError(f"{role}: {message['error']}")
                    if message["type"] != "rpc":
                        continue
                    method, payload = message["method"], message["payload"]
                    log.info("%s: %s", role, method)
                    try:
                        if method == "completion":
                            calls += 1
                            if calls > self.settings.max_model_calls_per_agent:
                                raise RuntimeError("Agent model-call limit reached; no further API requests will be made")
                            if calls == self.settings.max_model_calls_per_agent:
                                payload["tools"] = [tool for tool in payload["tools"] if tool["function"]["name"] == "submit_result"]
                                payload["messages"].insert(0, {"role": "system", "content":
                                    "This is the final allowed model call. Submit the complete result with submit_result now. "
                                    "Use native JSON objects and arrays. Summary under 600 characters; each recommendation "
                                    "details under 700 characters; each activity details under 500 characters. "
                                    "Preserve evidence and price uncertainty, but omit verbose comparisons."})
                            await self.emit(run_id, "model_started", role=role, call=calls)
                            latest_output = None
                            if self.observer and hasattr(self.router, "complete_stream"):
                                result = await self.router.complete_stream(payload, run_id, role, model, max_tokens, publish_output)
                                if latest_output:
                                    await publish_output(latest_output, force=True)
                            else:
                                result = await self.router.complete(payload, run_id, role, model, max_tokens)
                            await self.emit(run_id, "model_completed", role=role, call=calls)
                        elif method == "search_web":
                            if searches >= self.settings.max_searches_per_agent:
                                result = {"sources": [], "error": "Search limit reached. Use the sources already collected."}
                            else:
                                searches += 1
                                await self.emit(run_id, "tool_started", role=role, tool=method, query=payload["query"])
                                result = await self.web.search_web(payload["query"])
                                for item in result.get("sources", []):
                                    source = Source.model_validate(item)
                                    sources[source.id] = source.model_dump(mode="json")
                                warnings.extend(result.get("warnings", []))
                                await self.emit(run_id, "tool_completed", role=role, tool=method,
                                                query=payload["query"], sources=result.get("sources", []), warnings=result.get("warnings", []))
                        elif method == "search_images":
                            if image_searches >= 1:
                                result = {"images": [], "error": "Image search limit reached"}
                            else:
                                image_searches += 1
                                await self.emit(run_id, "tool_started", role=role, tool=method, query=payload["query"])
                                result = await self.web.search_images(payload["query"])
                                images.extend(TravelImage.model_validate(item).model_dump(mode="json") for item in result.get("images", []))
                                warnings.extend(result.get("warnings", []))
                                await self.emit(run_id, "tool_completed", role=role, tool=method,
                                                query=payload["query"], images=result.get("images", []))
                        elif method == "submit_result":
                            try:
                                data = schema.model_validate(normalize_containers(payload, output_schema))
                                unknown = citation_ids(data) - sources.keys()
                                if unknown:
                                    result = {"valid": False, "errors": ["Unknown source IDs: " + ", ".join(sorted(unknown))]}
                                else:
                                    semantic_errors = result_validator(data, list(sources.values())) if result_validator else []
                                    if semantic_errors and calls < self.settings.max_model_calls_per_agent:
                                        result = {"valid": False, "errors": semantic_errors,
                                                  "instruction": "Revise the plan using the researched options. Do not invent cheaper quotes; leave unverified costs unknown. Respect the original dates, budget and pace."}
                                    else:
                                        if semantic_errors:
                                            warnings.append("Planner correction limit reached; unresolved constraints are flagged for review.")
                                        result = {"valid": True, "data": data.model_dump(mode="json")}
                            except ValidationError as exc:
                                result = {"valid": False, "errors": exc.errors(include_input=False, include_url=False)}
                            if not result["valid"]:
                                last_validation_errors = result["errors"]
                                log.warning("%s: structured submission rejected: %s", role, json.dumps(last_validation_errors, default=str)[:600])
                            await self.emit(run_id, "validation", role=role, valid=result["valid"], errors=result.get("errors", []))
                        else:
                            raise RuntimeError("Unknown worker method")
                        await reply(message["id"], data=result)
                    except Exception as exc:
                        await self.emit(run_id, "agent_warning", role=role, message=f"{type(exc).__name__}: {exc}")
                        await reply(message["id"], error=f"{type(exc).__name__}: {exc}")
                raise RuntimeError(f"{role}: Cline worker exited before returning a result")
        except asyncio.CancelledError:
            await self.emit(run_id, "agent_cancelled", role=role)
            raise
        except Exception as exc:
            await self.emit(run_id, "agent_failed", role=role, message=str(exc))
            raise
        finally:
            if process.returncode is None:
                process.kill()
            await process.wait()
            await stderr_task

