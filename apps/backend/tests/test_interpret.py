from __future__ import annotations

from fastapi.testclient import TestClient


def test_interpret_mock_returns_all_component_types(client: TestClient) -> None:
    response = client.post(
        "/api/interpret",
        json={"prompt": "Show me a dashboard for our robotics team", "mode": "auto"},
    )
    assert response.status_code == 200
    body = response.json()

    assert body["is_mock"] is True
    assert body["mode"] == "auto"
    assert body["intent"]
    assert body["summary"].startswith("[LOCAL MOCK MODE]")

    types_returned = {c["type"] for c in body["components"]}
    assert types_returned == {"card", "chart", "table", "timeline", "simulation_panel"}

    action_types = {a["type"] for a in body["actions"]}
    assert action_types == {"tool_call", "agent_action", "ui_action"}


def test_interpret_rejects_empty_prompt(client: TestClient) -> None:
    response = client.post("/api/interpret", json={"prompt": "", "mode": "auto"})
    assert response.status_code == 422


def test_interpret_rejects_invalid_mode(client: TestClient) -> None:
    response = client.post("/api/interpret", json={"prompt": "hi", "mode": "nope"})
    assert response.status_code == 422
