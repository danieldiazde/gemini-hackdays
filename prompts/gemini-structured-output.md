# Gemini structured-output prompts

This file is the team's working notebook for the system prompt and few-shot examples that get Gemini 2.5 Flash to emit our schema reliably. It is *not* loaded automatically — copy what works into `apps/backend/app/services/gemini_client.py`.

---

## The contract Gemini must produce

See [`docs/architecture/api-contract.md`](../docs/architecture/api-contract.md) for the canonical response shape.

When we wire structured outputs, we'll pass:

```python
from google.genai import types

config = types.GenerateContentConfig(
    response_mime_type="application/json",
    response_schema=InterpretResponse,  # Pydantic model
    system_instruction=SYSTEM_PROMPT,
)
```

This forces Gemini to return JSON that matches our Pydantic model. No string parsing, no fragile regex.

---

## System-prompt draft

```text
You are the planner for "gemini-hackdays", a hackathon prototype that turns
natural-language requests into structured UI plans.

Always return JSON matching the InterpretResponse schema you were given.

Rules:
- Be concise. The user is watching a demo.
- Pick the smallest set of components that answer the request.
- Set `summary` to one sentence the user could read aloud.
- Set `intent` to a short noun phrase describing what they asked for.
- Use `chart` for numeric comparisons, `table` for records, `timeline` for
  ordered events, `simulation_panel` for spatial / robotic state, and
  `card` for everything else.
- Use `actions[].tool_call` only for tools you were told are available.
- If you're uncertain, return one `card` with your best summary and an empty
  `actions` list. Do not invent data.
```

---

## Few-shot examples (to be added)

We'll fill these in once we pick the product direction. Some seeds:

### Direction 1 — generative UI

```text
USER: "Show me sensor health for the warehouse robots."
ASSISTANT: {
  "summary": "Two robots online, one degraded.",
  "intent": "warehouse robot sensor health",
  "mode": "dynamic_ui",
  "components": [
    { "type": "table", "title": "Robot status", "data": { ... } },
    { "type": "chart", "title": "Battery levels", "data": { ... } }
  ],
  "actions": [{ "type": "tool_call", "name": "fetch_robot_status", "arguments": {} }],
  "raw_model_output": {},
  "is_mock": false
}
```

### Direction 2 — agentic simulation

```text
USER: "Robot at (1,2). Patrol to (5,4) avoiding the guard NPC."
ASSISTANT: {
  "summary": "5-step patrol plan that avoids the guard.",
  "intent": "patrol route around guard",
  "mode": "agentic_simulation",
  "components": [
    { "type": "simulation_panel", "data": { ... } },
    { "type": "timeline", "data": { ... } }
  ],
  "actions": [
    { "type": "agent_action", "name": "move", "arguments": { "to": [2,2] } },
    { "type": "agent_action", "name": "move", "arguments": { "to": [3,2] } }
  ],
  "raw_model_output": {},
  "is_mock": false
}
```

---

## Pitfalls to watch for

- **Too many components.** Cap the response at 3–4 components for demo legibility.
- **Made-up data.** If we don't have a tool to fetch reality, the mock should be obvious or absent.
- **Drift from schema.** Use `response_schema` from day one, not just a system prompt.
- **Long descriptions.** Component descriptions render small — keep them under one sentence.

---

## Useful Gemini features to evaluate

| Feature             | Why we'd want it                              |
| ------------------- | --------------------------------------------- |
| `response_schema`   | Force-fit our Pydantic shape                  |
| Function calling    | Replace mock tools with real ones             |
| `thinking_config`   | Better plans on harder prompts (Gemini 2.5)   |
| Multimodal input    | Drop in a screenshot, get a UI plan back      |
| File API            | Long-context dataset summaries                |
