import hashlib
import ipaddress
from datetime import date, datetime, timezone
from typing import Literal
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class TripBrief(StrictModel):
    origin: str | None = Field(default=None, min_length=2, max_length=120)
    destination: str | None = Field(default=None, min_length=2, max_length=120)
    start_date: date | None = None
    end_date: date | None = None
    travelers: int | None = Field(default=None, ge=1, le=30)
    budget: float | None = Field(default=None, gt=0)
    currency: str | None = Field(default=None, pattern=r"^[A-Z]{3}$")
    interests: list[str] = Field(default_factory=list, max_length=15)
    pace: Literal["relaxed", "balanced", "busy"] = "balanced"
    accommodation: str = Field(default="comfortable budget stay", max_length=300)
    transport_preferences: str = Field(default="flexible", max_length=300)
    constraints: list[str] = Field(default_factory=list, max_length=15)

    def missing(self) -> list[str]:
        return [key for key in ("origin", "destination", "start_date", "end_date", "travelers", "budget", "currency") if getattr(self, key) is None]

    @model_validator(mode="after")
    def valid_dates(self):
        if self.start_date and self.end_date:
            if self.end_date < self.start_date:
                raise ValueError("end_date must be on or after start_date")
            if (self.end_date - self.start_date).days > 13:
                raise ValueError("The prototype supports trips of up to 14 days")
        return self


class Question(StrictModel):
    id: str = Field(min_length=1, max_length=80)
    question: str = Field(min_length=5, max_length=400)


class Clarification(StrictModel):
    brief: TripBrief
    questions: list[Question] = Field(default_factory=list, max_length=8)


def public_url(value: str) -> str:
    parsed = urlparse(value)
    if parsed.scheme not in ("https", "http") or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("Expected a public HTTP(S) URL")
    host = parsed.hostname.lower()
    if host in ("localhost", "0.0.0.0", "::1") or host.endswith(".local"):
        raise ValueError("Local URLs are not sources")
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        address = None
    if address is not None and not address.is_global:
        raise ValueError("Private IP URLs are not sources")
    return value


class Source(StrictModel):
    id: str
    title: str
    url: str
    snippet: str = ""
    retrieved_at: str
    provider: str
    _valid_url = field_validator("url")(public_url)

    @classmethod
    def make(cls, title: str, url: str, snippet: str, provider: str):
        return cls(id="src_" + hashlib.sha256(url.encode()).hexdigest()[:12], title=title[:200], url=url,
                   snippet=snippet[:900], retrieved_at=datetime.now(timezone.utc).isoformat(), provider=provider)


class TravelImage(StrictModel):
    title: str
    image_url: str
    source_url: str
    author: str
    license: str
    license_url: str
    _valid_image_url = field_validator("image_url", "source_url", "license_url")(public_url)


class Recommendation(StrictModel):
    name: str = Field(min_length=2, max_length=180)
    details: str = Field(min_length=10, max_length=1500)
    estimated_cost: float | None = Field(default=None, ge=0)
    cost_basis: Literal["whole_trip", "per_person", "per_night", "unknown"] = "unknown"
    source_ids: list[str] = Field(min_length=1, max_length=5)


class Research(StrictModel):
    summary: str = Field(min_length=10, max_length=1800)
    recommendations: list[Recommendation] = Field(min_length=1, max_length=4)
    cautions: list[str] = Field(default_factory=list, max_length=8)


class Activity(StrictModel):
    time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    duration_minutes: int = Field(ge=15, le=720)
    title: str = Field(min_length=2, max_length=180)
    location: str = Field(min_length=2, max_length=200)
    details: str = Field(min_length=5, max_length=1000)
    estimated_cost: float | None = Field(default=None, ge=0)
    source_ids: list[str] = Field(min_length=1, max_length=5)


class DayPlan(StrictModel):
    date: date
    theme: str = Field(min_length=2, max_length=160)
    activities: list[Activity] = Field(min_length=1, max_length=8)


class BudgetItem(StrictModel):
    category: str = Field(min_length=2, max_length=120)
    amount: float | None = Field(default=None, ge=0)
    notes: str = Field(min_length=5, max_length=500)
    source_ids: list[str] = Field(default_factory=list, max_length=5)


class PlanDraft(StrictModel):
    title: str = Field(min_length=3, max_length=200)
    summary: str = Field(min_length=20, max_length=2000)
    days: list[DayPlan] = Field(min_length=1, max_length=14)
    transport: list[Recommendation] = Field(min_length=1, max_length=3)
    stays: list[Recommendation] = Field(min_length=1, max_length=3)
    budget_items: list[BudgetItem] = Field(min_length=1, max_length=10)
    assumptions: list[str] = Field(default_factory=list, max_length=10)
    warnings: list[str] = Field(default_factory=list, max_length=12)


class ValidationReport(StrictModel):
    status: Literal["passed", "needs_review"]
    errors: list[str]
    warnings: list[str]
    known_estimated_total: float
    has_unknown_costs: bool


class Plan(PlanDraft):
    warnings: list[str] = Field(default_factory=list)
    brief: TripBrief
    sources: list[Source]
    images: list[TravelImage]
    validation: ValidationReport


def citation_ids(value) -> set[str]:
    if isinstance(value, BaseModel):
        value = value.model_dump(mode="json")
    found = set()
    if isinstance(value, dict):
        found.update(value.get("source_ids", []))
        for child in value.values():
            found.update(citation_ids(child))
    elif isinstance(value, list):
        for child in value:
            found.update(citation_ids(child))
    return found

