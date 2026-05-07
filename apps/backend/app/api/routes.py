"""HTTP routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.config import Settings, get_settings
from app.schemas.interpret import InterpretRequest, InterpretResponse
from app.services.gemini_client import GeminiClient, get_gemini_client

router = APIRouter()


def _client_dep(settings: Settings = Depends(get_settings)) -> GeminiClient:
    return get_gemini_client(settings)


@router.get("/health", tags=["meta"])
def health(settings: Settings = Depends(get_settings)) -> dict[str, object]:
    return {
        "status": "ok",
        "mock_mode": settings.is_mock_mode,
        "model": settings.GEMINI_MODEL,
    }


@router.post("/api/interpret", response_model=InterpretResponse, tags=["interpret"])
async def interpret(
    payload: InterpretRequest,
    client: GeminiClient = Depends(_client_dep),
) -> InterpretResponse:
    try:
        return await client.interpret(prompt=payload.prompt, mode=payload.mode)
    except Exception as exc:  # noqa: BLE001 — translate SDK errors into 502
        raise HTTPException(status_code=502, detail=f"upstream model error: {exc}") from exc
