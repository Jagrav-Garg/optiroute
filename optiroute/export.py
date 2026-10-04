import json
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from .config import ROOT
from .models import Plan


def export_plan(plan: Plan, run_id: str, output_dir: Path, cost: dict, demo: bool = False) -> dict:
    folder = output_dir / run_id
    folder.mkdir(parents=True, exist_ok=True)
    payload = {"run_id": run_id, "demo": demo, "plan": plan.model_dump(mode="json"), "cost": cost}
    (folder / "plan.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    env = Environment(loader=FileSystemLoader(ROOT / "templates"), autoescape=select_autoescape(["html"]))
    source_map = {source.id: source for source in plan.sources}
    report = env.get_template("report.html").render(plan=plan, sources=source_map, cost=cost, demo=demo)
    (folder / "plan.html").write_text(report, encoding="utf-8")
    lines = [f"# {plan.title}", "", plan.summary, "",
             f"{plan.brief.origin} to {plan.brief.destination} | {plan.brief.start_date} to {plan.brief.end_date}",
             f"{plan.brief.travelers} travelers | Budget: {plan.brief.budget:g} {plan.brief.currency}", ""]
    if demo:
        lines += ["DEMO: fixture data; not live travel research.", ""]
    for day in plan.days:
        lines += [f"## {day.date}: {day.theme}", ""]
        for activity in day.activities:
            refs = " ".join(f"[{source_map[key].title}]({source_map[key].url})" for key in activity.source_ids if key in source_map)
            lines += [f"- **{activity.time} {activity.title}** ({activity.duration_minutes} min), {activity.location}. {activity.details} {refs}"]
        lines.append("")
    for heading, items in (("Transport", plan.transport), ("Stay Options", plan.stays)):
        lines += [f"## {heading}", ""]
        for item in items:
            refs = " ".join(f"[{source_map[key].title}]({source_map[key].url})" for key in item.source_ids if key in source_map)
            lines += [f"- **{item.name}**: {item.details} {refs}"]
        lines.append("")
    lines += ["## Budget Estimates", "", "Amounts cover the whole group and trip.", ""]
    for item in plan.budget_items:
        amount = f"{item.amount:g} {plan.brief.currency}" if item.amount is not None else "Unknown"
        lines.append(f"- {item.category}: {amount}. {item.notes}")
    lines += ["", f"Known estimated total: {plan.validation.known_estimated_total:g} {plan.brief.currency}", "",
              "## Review", ""]
    lines += ["- " + text for text in plan.validation.errors + plan.validation.warnings + plan.warnings + plan.assumptions]
    if plan.images:
        lines += ["", "## Destination Photos", ""]
        for photo in plan.images:
            lines += [f"![{photo.title}]({photo.image_url})", f"[Source]({photo.source_url}), {photo.author}, [{photo.license}]({photo.license_url})", ""]
    lines += ["", "## Sources", ""]
    lines += [f"- [{source.title}]({source.url}), retrieved {source.retrieved_at}" for source in plan.sources]
    lines += ["", f"API spend or reserved amount: ${cost['run_accounted_usd']:.6f}"]
    (folder / "plan.md").write_text("\n".join(lines), encoding="utf-8")
    return {format: str(folder / f"plan.{format}") for format in ("html", "json", "md")}

