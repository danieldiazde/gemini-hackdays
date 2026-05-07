from __future__ import annotations

from fastapi.testclient import TestClient


def test_health_returns_ok_in_mock_mode(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["mock_mode"] is True
    assert isinstance(body["model"], str) and body["model"]
