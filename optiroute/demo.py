"""Deterministic, unbilled fixtures exercised through the real Cline agent loop."""
import json
import asyncio
from datetime import date, timedelta

from .models import Source


def demo_brief() -> dict:
    start = date.today() + timedelta(days=35)
    return {"origin": "Delhi", "destination": "Jaipur", "start_date": start.isoformat(),
            "end_date": (start + timedelta(days=1)).isoformat(), "travelers": 2, "budget": 14000,
            "currency": "INR", "interests": ["history", "vegetarian food"], "pace": "relaxed",
            "accommodation": "comfortable budget stay", "transport_preferences": "trains",
            "constraints": []}


def demo_sources():
    return [Source.make("Rajasthan Tourism: Jaipur", "https://www.tourism.rajasthan.gov.in/jaipur.html",
                        "DEMO FIXTURE: Jaipur attractions including Hawa Mahal and Amber Fort.", "demo_fixture").model_dump(mode="json"),
            Source.make("IRCTC train booking", "https://www.irctc.co.in/", "DEMO FIXTURE: Check trains and current fares.",
                        "demo_fixture").model_dump(mode="json"),
            Source.make("Rajasthan Tourism accommodation", "https://www.tourism.rajasthan.gov.in/hotels.html",
                        "DEMO FIXTURE: Accommodation resources; no availability is asserted.", "demo_fixture").model_dump(mode="json")]


def recommendation(name: str, details: str, source: str, cost=None, basis="unknown"):
    return {"name": name, "details": details, "estimated_cost": cost, "cost_basis": basis, "source_ids": [source]}


def demo_research(role: str):
    sources = demo_sources()
    if role == "transit":
        options = [recommendation("Delhi to Jaipur by train", "Fixture route: compare a daytime return train for two travelers; verify the actual timetable and fares with IRCTC.", sources[1]["id"], 2400, "whole_trip")]
    elif role == "hotels":
        options = [recommendation("Central Jaipur budget stay", "Fixture neighborhood option: one double room for one night, near the old city. No specific hotel availability is claimed.", sources[2]["id"], 2500, "whole_trip")]
    else:
        options = [recommendation("Hawa Mahal and old-city walk", "Fixture suggestion: a relaxed heritage walk and vegetarian lunch; confirm monument access and entry costs.", sources[0]["id"]),
                   recommendation("Amber Fort", "Fixture suggestion: allow time for travel and a relaxed fort visit. Verify accessibility and hours.", sources[0]["id"])]
    return {"summary": f"Demo {role} research, using deterministic fixture data rather than live facts.",
            "recommendations": options, "cautions": ["This is fixture data, not live travel research."]}


def demo_plan():
    brief, sources = demo_brief(), demo_sources()
    days = []
    for index, title in enumerate(("Old-city heritage", "Amber Fort and return")):
        days.append({"date": (date.fromisoformat(brief["start_date"]) + timedelta(days=index)).isoformat(), "theme": title,
                     "activities": [{"time": "11:00" if index == 0 else "09:30", "duration_minutes": 120,
                         "title": "Hawa Mahal and heritage walk" if index == 0 else "Amber Fort",
                         "location": "Jaipur old city" if index == 0 else "Amer, Jaipur",
                         "details": "Demonstration schedule. Allow unverified transfer time and confirm visiting hours before traveling.",
                         "estimated_cost": 600, "source_ids": [sources[0]["id"]]},
                         {"time": "14:00", "duration_minutes": 60, "title": "Vegetarian lunch and rest",
                          "location": "Jaipur", "details": "Demonstration meal break; select a suitable restaurant and confirm prices.",
                          "estimated_cost": 500, "source_ids": [sources[0]["id"]]}]})
    categories = [("transport", 2400), ("accommodation", 2500), ("food", 2000), ("activities", 1200), ("local_transport", 1000), ("contingency", 1500)]
    return {"title": "A Relaxed Jaipur Weekend", "summary": "A two-day heritage itinerary for two travelers from Delhi, with a central stay and room for meals and rest. All details and prices in this demonstration are fixtures.",
            "days": days, "transport": demo_research("transit")["recommendations"],
            "stays": demo_research("hotels")["recommendations"],
            "budget_items": [{"category": category, "amount": amount, "notes": "Illustrative fixture estimate for the whole group and trip.", "source_ids": [sources[0]["id"]]} for category, amount in categories],
            "assumptions": ["One double room for one night.", "All prices are illustrative fixture data."],
            "warnings": ["Do not use this demonstration as a booking quote."]}


class DemoWebTools:
    async def search_web(self, query: str):
        return {"query": query, "sources": demo_sources(), "warnings": ["Demo fixture sources, not live search results."]}

    async def search_images(self, query: str):
        return {"images": [], "warnings": ["Offline demo does not retrieve photos; live mode searches destination images."]}


class DemoRouter:
    display_model = "Offline fixtures"
    async def complete_stream(self, payload, run_id, role, model, max_tokens, on_output):
        result = await self.complete(payload, run_id, role, model, max_tokens)
        tool = result["choices"][0]["message"]["tool_calls"][0]
        arguments = tool["function"]["arguments"]
        if tool["function"]["name"] == "submit_result":
            for end in range(80, len(arguments) + 80, 80):
                await asyncio.sleep(0.04)
                await on_output({"content": "", "tool_calls": [{**tool, "function": {
                    "name": "submit_result", "arguments": arguments[:end]}}]})
        return result

    async def complete(self, payload, run_id, role, model, max_tokens):
        if role == "coordinator":
            task = json.loads(payload["messages"][1]["content"])
            brief = demo_brief() if task.get("answers") else {"destination": "Jaipur", "pace": "relaxed"}
            name, arguments = "submit_result", {"brief": brief, "questions": []}
        elif role in ("transit", "hotels", "places") and not any(message["role"] == "tool" for message in payload["messages"]):
            name, arguments = "search_web", {"query": f"Jaipur {role} official tourism"}
        else:
            name, arguments = "submit_result", demo_plan() if role == "planner" else demo_research(role)
        return {"choices": [{"finish_reason": "tool_calls", "message": {"role": "assistant", "content": None,
            "tool_calls": [{"id": f"call_{role}_{len(payload['messages'])}", "type": "function",
                            "function": {"name": name, "arguments": json.dumps(arguments)}}]}}],
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "cost": 0}}

