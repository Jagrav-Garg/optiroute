from datetime import timedelta

from .models import PlanDraft, TripBrief, ValidationReport, citation_ids


def validate_plan(draft: PlanDraft, brief: TripBrief, sources: list[dict], images: list[dict]) -> ValidationReport:
    errors, warnings = [], []
    needs_review = False
    expected = [brief.start_date + timedelta(days=i) for i in range((brief.end_date - brief.start_date).days + 1)]
    if [day.date for day in draft.days] != expected:
        errors.append("The itinerary must cover every requested date once, in chronological order.")
    unknown = citation_ids(draft) - {source["id"] for source in sources}
    if unknown:
        errors.append("Some citations do not match retrieved sources: " + ", ".join(sorted(unknown)))
    for day in draft.days:
        previous_end = -1
        for activity in day.activities:
            hour, minute = map(int, activity.time.split(":"))
            start = hour * 60 + minute
            if start < previous_end:
                errors.append(f"Overlapping or out-of-order activities on {day.date}: {activity.title}.")
            previous_end = start + activity.duration_minutes
            if previous_end > 1440:
                errors.append(f"Activity extends beyond its itinerary day: {activity.title}.")
        if brief.pace == "relaxed" and len(day.activities) > 4:
            needs_review = True
            warnings.append(f"{day.date} has more than four activities despite the relaxed pace.")
    total = sum(item.amount or 0 for item in draft.budget_items)
    has_unknown = any(item.amount is None for item in draft.budget_items)
    if total > brief.budget:
        errors.append(f"Known estimated costs ({total:.2f} {brief.currency}) exceed the requested budget ({brief.budget:.2f}).")
    if has_unknown:
        warnings.append("Some costs are unknown; the requested budget cannot be confirmed.")
    categories = {item.category.lower() for item in draft.budget_items}
    required = {"transport", "accommodation", "food", "activities", "local_transport", "contingency"}
    if required - categories:
        errors.append("Budget is missing categories: " + ", ".join(sorted(required - categories)))
    if len(categories) != len(draft.budget_items):
        errors.append("Budget categories must not be repeated.")
    if any(item.amount is not None and item.amount > 0 and not item.source_ids for item in draft.budget_items):
        needs_review = True
        warnings.append("Some budget estimates lack source citations and need review.")
    if not images:
        warnings.append("No destination photos were retrieved.")
    warnings.append("Search excerpts are not booking availability. Fares, hotel rates, opening hours and transfer times need confirmation.")
    return ValidationReport(status="needs_review" if errors or has_unknown or needs_review else "passed", errors=errors,
                            warnings=warnings, known_estimated_total=round(total, 2), has_unknown_costs=has_unknown)
