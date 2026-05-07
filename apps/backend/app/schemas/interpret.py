"""Pydantic schemas shared between the API and the Gemini client.

The shape of `InterpretResponse` is the contract the frontend renders against.
Add new component types or action types here first, then teach the renderers
about them on the frontend.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

# --- Inputs -----------------------------------------------------------------

InterpretMode = Literal["dynamic_ui", "agentic_simulation", "auto"]


class InterpretRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)
    mode: InterpretMode = "auto"


# --- Outputs ----------------------------------------------------------------

ComponentType = Literal["card", "chart", "table", "timeline", "simulation_panel"]
ActionType = Literal["tool_call", "agent_action", "ui_action"]


class Component(BaseModel):
    type: ComponentType
    title: str
    description: str = ""
    data: dict[str, Any] = Field(default_factory=dict)


class Action(BaseModel):
    type: ActionType
    name: str
    arguments: dict[str, Any] = Field(default_factory=dict)


class InterpretResponse(BaseModel):
    summary: str
    intent: str
    mode: InterpretMode
    components: list[Component] = Field(default_factory=list)
    actions: list[Action] = Field(default_factory=list)
    raw_model_output: dict[str, Any] = Field(default_factory=dict)
    is_mock: bool = False
