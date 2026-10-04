from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / ".env", extra="ignore")

    model_provider: Literal["openrouter", "cline"] = "openrouter"
    openrouter_api_key: SecretStr = SecretStr("")
    openrouter_model: str = "qwen/qwen3.8-27b:free"
    openrouter_planner_model: str = "qwen/qwen3.8-27b:free"
    cline_api_key: SecretStr = SecretStr("")
    cline_model: str = "inclusionai/ling-3.1-flash"
    cline_planner_model: str = "inclusionai/ling-3.1-flash"
    allow_paid_models: bool = False
    max_run_cost_usd: float = Field(default=0.03, gt=0, le=3)
    max_total_cost_usd: float = Field(default=0.25, gt=0, le=3)
    max_model_calls_per_agent: int = Field(default=3, ge=1, le=5)
    max_searches_per_agent: int = Field(default=2, ge=1, le=4)
    model_timeout_seconds: int = Field(default=90, ge=5, le=180)
    agent_timeout_seconds: int = Field(default=240, ge=10, le=600)
    data_dir: Path = ROOT / "data"
    output_dir: Path = ROOT / "outputs"

    def model_for(self, role: str) -> str:
        suffix = "planner_model" if role == "planner" else "model"
        return getattr(self, f"{self.model_provider}_{suffix}")

    def prepare(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)

