"""Shared pytest fixtures.

Tests run in mock mode (no GEMINI_API_KEY) so CI does not need real
credentials. We clear any inherited env var explicitly to be safe.
"""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.services import gemini_client as gc_module


@pytest.fixture(autouse=True)
def _force_mock_mode(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    gc_module._reset_for_tests()
    yield
    gc_module._reset_for_tests()


@pytest.fixture
def client() -> TestClient:
    return TestClient(create_app())
