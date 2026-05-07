# API contract

The frontend renders against this contract. Keep `apps/backend/app/schemas/interpret.py` and `apps/frontend/src/types/interpret.ts` in sync when you change it.

---

## `GET /health`

Quick liveness check. Useful for the frontend to detect that the backend is up and to surface mock-mode in the UI.

**Response 200**

```json
{
  "status": "ok",
  "mock_mode": true,
  "model": "gemini-2.5-flash"
}
```

---

## `POST /api/interpret`

The single endpoint the demo runs through. The backend turns the user's prompt into a structured plan the UI can render.

### Request

```json
{
  "prompt": "Show me our hackathon team's progress",
  "mode": "auto"
}
```

| Field    | Type                                                | Required | Notes                                  |
| -------- | --------------------------------------------------- | -------- | -------------------------------------- |
| `prompt` | string (1–4000 chars)                               | yes      | The user's natural-language request    |
| `mode`   | `"dynamic_ui"` \| `"agentic_simulation"` \| `"auto"`| yes      | Hint to Gemini about expected output  |

### Response 200

```json
{
  "summary": "string",
  "intent": "string",
  "mode": "auto",
  "components": [
    {
      "type": "card | chart | table | timeline | simulation_panel",
      "title": "string",
      "description": "string",
      "data": { "...": "free-form, type-specific" }
    }
  ],
  "actions": [
    {
      "type": "tool_call | agent_action | ui_action",
      "name": "string",
      "arguments": { "...": "free-form" }
    }
  ],
  "raw_model_output": { "...": "anything" },
  "is_mock": false
}
```

### Component data shapes

The schema deliberately keeps `data` as a free-form `Record<string, unknown>`, but the renderers expect these shapes today:

#### `card`

```json
{ "any_key": "any_value" }
```

Rendered as a key/value grid plus the description.

#### `chart`

```json
{
  "kind": "bar",
  "x_label": "Category",
  "y_label": "Value",
  "series": [{ "label": "alpha", "value": 12 }]
}
```

Rendered as a horizontal bar chart. Add new `kind` values (`line`, `area`, …) by extending `ChartRenderer.tsx`.

#### `table`

```json
{
  "columns": ["id", "name", "status"],
  "rows": [[1, "Sensor A", "online"]]
}
```

#### `timeline`

```json
{ "events": [{ "t": "T+0s", "label": "Receive prompt" }] }
```

#### `simulation_panel`

```json
{
  "world": { "grid_w": 8, "grid_h": 8 },
  "agents": [{ "id": "robot-1", "x": 1, "y": 2, "heading": "N" }],
  "tick": 0
}
```

### Action types

| `type`         | Meaning                                              | Example `name`     |
| -------------- | ---------------------------------------------------- | ------------------ |
| `tool_call`    | Backend should execute a registered tool             | `search_inventory` |
| `agent_action` | Simulated agent action in the rendered world         | `plan_route`       |
| `ui_action`    | Frontend-only directive (open panel, scroll to, …)   | `open_panel`       |

### Errors

| Status | When                                              | Body                                     |
| ------ | ------------------------------------------------- | ---------------------------------------- |
| 422    | Invalid request (empty prompt, unknown mode)      | FastAPI default validation error         |
| 502    | Upstream Gemini call failed                       | `{ "detail": "upstream model error: ..." }` |

### Mock mode

If `GEMINI_API_KEY` is not set, the response carries `is_mock: true` and a clearly-labeled summary. The shape is identical to the real response so the frontend never has to special-case mock data.

---

## Extending the contract

When you add a new component type:

1. Add it to the `ComponentType` literal in `interpret.py`.
2. Mirror it in `interpret.ts`.
3. Add a sample to `mock_data.py` so the mock still exercises every type.
4. Create `apps/frontend/src/components/dynamic/<Name>Renderer.tsx`.
5. Wire it into the switch in `ResponseDisplay.tsx`.
