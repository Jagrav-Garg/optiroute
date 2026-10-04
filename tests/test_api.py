import pytest
from fastapi.testclient import TestClient

from optiroute.api import app


def test_api_health_invalid_ids_and_input_validation(monkeypatch, tmp_path):
    monkeypatch.setenv("OPT_ROUTE_DEMO", "true")
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
    monkeypatch.setenv("OUTPUT_DIR", str(tmp_path / "outputs"))
    with TestClient(app) as client:
        assert client.get("/health").json()["engine"] == "Cline SDK + LangGraph"
        assert client.get("/runs/not-a-uuid").status_code == 422
        assert client.get("/runs/00000000-0000-0000-0000-000000000000").status_code == 404
        assert client.post("/runs", json={"message": ""}).status_code == 422
        assert client.get("/spending").json()["project_accounted_usd"] == 0
