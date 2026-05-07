"""Thin wrapper around the official Google Gen AI SDK (``google-genai``).

This is intentionally minimal so the team can iterate. Future extensions:

* Structured outputs — pass ``response_mime_type="application/json"`` and a
  ``response_schema`` derived from ``InterpretResponse`` so Gemini returns a
  parseable plan directly.
* Function calling — register Python tools via ``types.Tool(function_declarations=...)``
  and let Gemini invoke ``tool_call`` actions.
* Multimodal input — pass images, audio, or video parts in ``contents``.
* Long-context prompts — Gemini 2.5 Flash handles 1M tokens; pass large docs
  via ``client.files.upload`` and reference them in ``contents``.
"""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING

from app.core.config import Settings
from app.schemas.interpret import Component, InterpretMode, InterpretResponse
from app.services.mock_data import build_mock_response

if TYPE_CHECKING:
    from google.genai import Client

logger = logging.getLogger(__name__)


class GeminiClient:
    """Calls Gemini if an API key is configured, otherwise returns a mock."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client: Client | None = None
        if not settings.is_mock_mode:
            from google import genai

            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)

    @property
    def is_mock(self) -> bool:
        return self._client is None

    async def interpret(self, prompt: str, mode: InterpretMode) -> InterpretResponse:
        if self._client is None:
            return build_mock_response(prompt, mode)
        return await self._call_gemini(prompt, mode)

    # ---- Real Gemini call --------------------------------------------------

    async def _call_gemini(self, prompt: str, mode: InterpretMode) -> InterpretResponse:
        assert self._client is not None
        system_instruction = _system_prompt_for(mode)

        # The SDK's sync API is robust; run it in a worker thread so we don't
        # block the event loop. Swap to ``client.aio.models.generate_content``
        # once we want streaming.
        try:
            response = await asyncio.to_thread(
                self._client.models.generate_content,
                model=self._settings.GEMINI_MODEL,
                contents=prompt,
                config={"system_instruction": system_instruction},
            )
        except Exception:  # noqa: BLE001 — surface any SDK error to the caller
            logger.exception("Gemini call failed")
            raise

        text = getattr(response, "text", "") or ""
        return InterpretResponse(
            summary=text or "(empty response from Gemini)",
            intent=prompt,
            mode=mode,
            components=[
                Component(
                    type="card",
                    title="Gemini response",
                    description=text[:500],
                    data={"full_text": text},
                )
            ],
            actions=[],
            raw_model_output={"text": text, "model": self._settings.GEMINI_MODEL},
            is_mock=False,
        )


def _system_prompt_for(mode: InterpretMode) -> str:
    base = (
        "You are the planner for a hackathon prototype. Be concise. Reply in "
        "plain prose for now; structured-output mode will be enabled later."
    )
    if mode == "dynamic_ui":
        return base + " Focus on what data the user wants to see."
    if mode == "agentic_simulation":
        return base + " Focus on the steps an agent would take."
    return base


# Singleton-ish accessor. FastAPI Depends() can use this directly.
_client_instance: GeminiClient | None = None


def get_gemini_client(settings: Settings) -> GeminiClient:
    global _client_instance
    if _client_instance is None:
        _client_instance = GeminiClient(settings)
    return _client_instance


def _reset_for_tests() -> None:
    """Test helper — drops the cached client so tests can re-init."""
    global _client_instance
    _client_instance = None
