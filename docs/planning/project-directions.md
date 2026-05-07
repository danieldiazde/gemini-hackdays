# Project directions

We have not yet committed to a final product idea. The repository scaffold is intentionally flexible — the same backend contract (`POST /api/interpret` returning `summary`, `intent`, `mode`, `components`, `actions`, `raw_model_output`) supports both directions below. Pick one (or hybridize) once we have a product hypothesis.

---

## Direction 1 — Generative UI / dynamic dashboard

**Pitch.** The user types a natural-language request. Gemini interprets the intent, the backend executes safe predefined tools, and the frontend renders dynamic UI components from structured JSON.

**Example prompts.**

- "Show our hackathon team's progress as a dashboard with a burndown chart and a blockers list."
- "Pull the top 5 open-source robotics datasets and rank them by GitHub stars."
- "Compare our sensor readings from yesterday vs. today as a chart."

**What Gemini produces.** Structured plans of `card`, `chart`, `table`, `timeline` components, plus `tool_call` actions (e.g., `fetch_dataset`, `compute_diff`).

**Strengths.**

- Visually impressive — judges see UI populate live.
- Easy to extend: add a new tool, add a new component renderer.
- Real-world utility (dashboards, BI, exploratory data tools).

**Risks.**

- Demo can feel "just another chatbot with widgets" without a strong vertical.
- Needs a clear domain to ground the demo (RoBorregos data? hackathon stats?).

**Required to ship.**

1. Pick the vertical (RoBorregos robot telemetry? GitHub data? a public dataset?).
2. Define 2–4 tools the backend will execute.
3. Tighten the Gemini prompt so structured outputs match our schema.
4. Polish 2–3 component types (chart + table + card likely enough for demo).

---

## Direction 2 — AI agent / NPC / robotics simulation

**Pitch.** The user types a scenario or instruction. Gemini generates structured actions, dialogue, events, and mission plans. The frontend visualizes the result as an interactive simulation panel — robot path, NPC dialogue tree, mission timeline.

**Example prompts.**

- "Robot starts at (1,2). Patrol the warehouse and avoid the guard NPC."
- "Generate an NPC merchant who greets the player and reacts if they're carrying contraband."
- "Plan a 5-step rescue mission for two drones."

**What Gemini produces.** A sequence of `agent_action` and `tool_call` actions with a `simulation_panel` component holding world state, plus a `timeline` of events.

**Strengths.**

- Great fit for the mechatronics teammate's strengths.
- Differentiated demo — fewer teams will build something interactive.
- Strong story: "natural-language mission control for robots/NPCs."

**Risks.**

- More mechanical complexity — needs a working tick loop / state machine.
- The simulation panel is the demo; if rendering breaks, the demo falls flat.

**Required to ship.**

1. Define the world model (grid? continuous? graph?).
2. Define the agent action vocabulary (`move`, `say`, `pick_up`, etc.).
3. Implement a tick loop on the backend or frontend.
4. Render the world clearly — even a 8×8 grid is fine for a demo.

---

## Hybrid option

Build dynamic UI primitives (Direction 1) but use them to render an agentic plan (Direction 2). For example: Gemini produces a mission plan; the frontend renders it as a `timeline` plus a `simulation_panel` plus `card` summaries. This is closest to what the scaffold ships with today.

---

## Decision checklist

- [ ] Which direction (or hybrid) are we committing to?
- [ ] What's the demo vertical / domain?
- [ ] Who owns Gemini prompt + structured output?
- [ ] Who owns the frontend visualization for the chosen direction?
- [ ] What's the minimum viable demo (60 seconds, no narration)?
