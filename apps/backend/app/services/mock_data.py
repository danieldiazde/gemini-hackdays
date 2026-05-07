"""Rich mock response used when ``GEMINI_API_KEY`` is not set.

The mock exercises every supported component type (`card`, `chart`, `table`,
`timeline`, `simulation_panel`) and every action type so the frontend renders
something meaningful out of the box. ``is_mock=True`` is set on the response
so the UI can display a clear "local mock mode" badge.
"""

from __future__ import annotations

from app.schemas.interpret import Action, Component, InterpretMode, InterpretResponse


def build_mock_response(prompt: str, mode: InterpretMode) -> InterpretResponse:
    return InterpretResponse(
        summary=(
            "[LOCAL MOCK MODE] No GEMINI_API_KEY was found, so this is a "
            "deterministic placeholder response. The real backend will replace "
            "this with output from Gemini. The shape is identical."
        ),
        intent=prompt,
        mode=mode,
        components=[
            Component(
                type="card",
                title="What Gemini would do here",
                description=(
                    "Interpret the user's natural-language request, decide on a "
                    "high-level plan, and emit structured components for the UI "
                    "to render. The card component is best for short summaries "
                    "and key facts."
                ),
                data={"prompt": prompt, "mode": mode},
            ),
            Component(
                type="chart",
                title="Sample bar chart",
                description="Replace with whatever data Gemini computes or selects.",
                data={
                    "kind": "bar",
                    "x_label": "Category",
                    "y_label": "Value",
                    "series": [
                        {"label": "alpha", "value": 12},
                        {"label": "beta", "value": 27},
                        {"label": "gamma", "value": 9},
                        {"label": "delta", "value": 33},
                    ],
                },
            ),
            Component(
                type="table",
                title="Sample tabular data",
                description="Useful when Gemini extracts structured records.",
                data={
                    "columns": ["id", "name", "status", "score"],
                    "rows": [
                        [1, "Sensor A", "online", 0.92],
                        [2, "Sensor B", "degraded", 0.61],
                        [3, "Sensor C", "online", 0.88],
                    ],
                },
            ),
            Component(
                type="timeline",
                title="Sample plan timeline",
                description=(
                    "When the agentic mode generates a multi-step plan, render "
                    "it here as ordered events with timestamps."
                ),
                data={
                    "events": [
                        {"t": "T+0s", "label": "Receive prompt"},
                        {"t": "T+1s", "label": "Identify intent"},
                        {"t": "T+2s", "label": "Pick tool / sub-agent"},
                        {"t": "T+5s", "label": "Execute and stream result"},
                    ]
                },
            ),
            Component(
                type="simulation_panel",
                title="Sample simulation state",
                description=(
                    "Placeholder for a live simulation view — robotics state, "
                    "NPC dialogue, or a 2D scene snapshot."
                ),
                data={
                    "world": {"grid_w": 8, "grid_h": 8},
                    "agents": [
                        {"id": "robot-1", "x": 1, "y": 2, "heading": "N"},
                        {"id": "npc-7", "x": 5, "y": 4, "heading": "E"},
                    ],
                    "tick": 0,
                },
            ),
        ],
        actions=[
            Action(
                type="tool_call",
                name="search_inventory",
                arguments={"query": "demo"},
            ),
            Action(
                type="agent_action",
                name="plan_route",
                arguments={"from": [1, 2], "to": [5, 4]},
            ),
            Action(
                type="ui_action",
                name="open_panel",
                arguments={"panel": "simulation"},
            ),
        ],
        raw_model_output={"note": "mock response — no model was called"},
        is_mock=True,
    )
