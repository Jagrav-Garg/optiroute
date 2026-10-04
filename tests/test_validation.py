import pytest
from pydantic import ValidationError

from optiroute.demo import demo_brief, demo_plan, demo_sources
from optiroute.models import PlanDraft, TripBrief, public_url
from optiroute.validation import validate_plan


def test_missing_dates_overlap_hallucinated_citation_and_overbudget_flagged():
    raw = demo_plan()
    raw["days"] = raw["days"][:1]
    raw["days"][0]["activities"][1]["time"] = "11:30"
    raw["days"][0]["activities"][0]["source_ids"] = ["imaginary_source"]
    raw["budget_items"][0]["amount"] = 50000
    report = validate_plan(PlanDraft.model_validate(raw), TripBrief.model_validate(demo_brief()), demo_sources(), [])
    assert report.status == "needs_review"
    assert any("every requested date" in error for error in report.errors)
    assert any("Overlapping" in error for error in report.errors)
    assert any("citations" in error for error in report.errors)
    assert any("exceed" in error for error in report.errors)


def test_unknown_cost_is_not_treated_as_a_validated_budget():
    raw = demo_plan()
    raw["budget_items"][0]["amount"] = None
    report = validate_plan(PlanDraft.model_validate(raw), TripBrief.model_validate(demo_brief()), demo_sources(), [])
    assert report.has_unknown_costs
    assert report.status == "needs_review"


def test_budget_categories_are_complete_and_unique():
    raw = demo_plan()
    raw["budget_items"][0]["category"] = "food"
    report = validate_plan(PlanDraft.model_validate(raw), TripBrief.model_validate(demo_brief()), demo_sources(), [])
    assert any("missing categories" in error for error in report.errors)
    assert any("repeated" in error for error in report.errors)


def test_relaxed_pace_violation_requires_review_without_other_errors():
    raw = demo_plan()
    activity = raw["days"][0]["activities"][1]
    raw["days"][0]["activities"].extend(
        {**activity, "time": time} for time in ("16:00", "17:00", "18:00")
    )
    report = validate_plan(PlanDraft.model_validate(raw), TripBrief.model_validate(demo_brief()), demo_sources(), [])
    assert report.errors == []
    assert report.status == "needs_review"
    assert any("relaxed pace" in warning for warning in report.warnings)


def test_uncited_budget_estimates_require_review():
    raw = demo_plan()
    raw["budget_items"][0]["source_ids"] = []
    report = validate_plan(PlanDraft.model_validate(raw), TripBrief.model_validate(demo_brief()), demo_sources(), [])
    assert report.errors == []
    assert report.status == "needs_review"
    assert any("lack source citations" in warning for warning in report.warnings)


def test_inverted_dates_are_rejected():
    raw = demo_brief()
    raw["start_date"], raw["end_date"] = raw["end_date"], raw["start_date"]
    with pytest.raises(ValidationError):
        TripBrief.model_validate(raw)


@pytest.mark.parametrize("url", ["javascript:alert(1)", "http://localhost/", "http://127.0.0.1/", "http://10.0.0.1/", "https://user:password@example.com/"])
def test_report_sources_cannot_use_unsafe_urls(url):
    with pytest.raises(ValueError):
        public_url(url)

