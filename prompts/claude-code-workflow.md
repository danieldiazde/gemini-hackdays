# Claude Code workflow

How the team uses Claude Code (or similar AI coding agents) on this repo without making a mess.

---

## Ground rules

1. **Branch first.** `git checkout -b feature/<thing> dev` before asking the agent to do anything that writes files.
2. **Small PRs.** One feature per branch, one branch per PR. Easier to review, easier to revert.
3. **Run `pnpm check` before pushing.** Mirrors CI. If it passes locally, CI almost always passes.
4. **Never commit secrets.** Even temporarily. `.env` is git-ignored — keep it that way.

---

## Useful prompts

### "Add a new component type"

> Add a new component type called `map` to the contract. It should take `{ markers: [{ lat, lng, label }] }` in `data`. Update the Pydantic schema, the TS types, the mock data, and create a new renderer in `apps/frontend/src/components/dynamic/MapRenderer.tsx`. Wire it into the switch in `ResponseDisplay.tsx`. Don't forget tests.

### "Wire structured outputs"

> Update `app/services/gemini_client.py` so that when an API key is present, we pass our `InterpretResponse` Pydantic model as `response_schema` and `response_mime_type="application/json"`. Parse the JSON response into the Pydantic model. Keep mock mode unchanged.

### "Add a backend tool"

> Register a Python function `fetch_robot_status() -> dict` as a Gemini tool. When the model emits a `tool_call` action with `name="fetch_robot_status"`, the backend should execute it and feed the result back to Gemini for a final response.

---

## What *not* to ask the agent

- Mass refactors across both apps in one shot. Split them.
- Anything that touches `.github/workflows/*` without you reading the diff line by line.
- "Make it look nicer" without specifics — write the visual change you want.

---

## Reviewing AI-generated code

Treat it like a junior teammate's PR:

- Read every file, not just the diff summary.
- Run it locally before approving.
- Look for invented dependencies, hallucinated APIs, or fake test assertions.
- If it added a `try/except` or a fallback you didn't ask for, push back.
