# Demo script

> **Status: placeholder.** Fill this in once the team commits to a product direction (see [`docs/planning/project-directions.md`](../planning/project-directions.md)).

The goal is a 60–90 second live demo that lands without narration if the audio cuts out.

---

## Template

### Opening (10s)

- One sentence: what problem the project solves.
- One sentence: who it's for.

### Setup (10s)

- Open the deployed frontend (or local dev server).
- Show the empty prompt form.

### The "wow" (30s)

- Type the **canonical demo prompt** (defined below).
- Press submit.
- Watch the structured UI populate live.
- Highlight 2–3 component renderers as they appear.

### Story (10s)

- One sentence: how Gemini made this possible.
- One sentence: what's interesting under the hood (structured outputs / tool use / multimodal).

### Close (10s)

- One sentence: what's next.
- Repo URL.

---

## Canonical demo prompt

`<TBD — pick something that always works on stage and exercises the chosen component types>`

Examples to riff on:

- *"Show me a live dashboard for our robotics team's hackathon progress, including a sensor health table and a sprint burndown chart."*
- *"Robot starts at (1,2). Patrol the warehouse and report blockers, then plan a rescue mission for any stuck teammates."*

---

## Failure modes (and the recovery plan)

| Failure                       | Mitigation                                        |
| ----------------------------- | ------------------------------------------------- |
| Wifi dies                     | Run backend in mock mode locally — UI still demos |
| Gemini quota / 5xx            | Mock mode kicks in; flag bar shows "local mock"   |
| Frontend white-screens        | `pnpm build && pnpm start` rather than dev server |
| Backend slow to start         | Pre-warm with one dry-run prompt before going live |

---

## Pre-demo checklist

- [ ] Backend is running and `/health` returns `mock_mode: false`
- [ ] Frontend is running and pointing at the right API URL
- [ ] Canonical demo prompt is in the clipboard
- [ ] One backup prompt is in the clipboard
- [ ] Slack notifications muted, browser tabs closed
- [ ] Battery > 60% or plugged in
