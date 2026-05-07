# System design

## Pieces

```text
┌────────────┐    HTTP/JSON    ┌────────────┐    HTTPS    ┌────────────┐
│  Browser   │ ──────────────► │  FastAPI   │ ──────────► │  Gemini    │
│ (Next.js)  │                 │  backend   │             │  API       │
└────────────┘ ◄────────────── └────────────┘ ◄────────── └────────────┘
                  structured                  structured
                  JSON                        text/JSON
```

### Frontend (`apps/frontend`)

- Next.js 15 App Router, TypeScript, Tailwind v4.
- One page (`/`) with a prompt form, mode selector, and a renderer that switches on `component.type`.
- Talks to the backend via `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`).
- Knows nothing about Gemini — it just renders whatever JSON the backend returns.

### Backend (`apps/backend`)

- FastAPI on Python 3.12, managed by `uv`.
- Two endpoints: `GET /health`, `POST /api/interpret`.
- Owns the Gemini client (`google-genai`) and the system prompts.
- Validates input/output with Pydantic v2.
- Runs in **mock mode** when `GEMINI_API_KEY` is unset — the response is identical in shape but flagged with `is_mock: true`.

### Gemini

- Called only from the backend.
- Currently a minimal text call; structured outputs and function calling are the obvious next steps.

---

## Why secrets stay in the backend

`NEXT_PUBLIC_*` env vars are bundled into the browser. Anyone hitting the deployed frontend can extract them from the JS source. So the rule is:

- `GEMINI_API_KEY` lives in the backend environment only.
- The frontend talks to *our* backend, never to Gemini directly.
- The backend can rate-limit, log, and switch model versions without a frontend redeploy.

If we ever want browser-side Gemini calls (e.g., for low-latency streaming), the right pattern is to mint short-lived signed tokens from the backend and have the frontend use those — never a long-lived key.

---

## The structured JSON contract

Single source of truth for the response shape: [`apps/backend/app/schemas/interpret.py`](../../apps/backend/app/schemas/interpret.py).
TypeScript mirror: [`apps/frontend/src/types/interpret.ts`](../../apps/frontend/src/types/interpret.ts).
Detailed reference with examples: [`api-contract.md`](api-contract.md).

When you change the contract:

1. Update the Pydantic schema first.
2. Update the TS types.
3. Update the mock in `app/services/mock_data.py` so all component types still render.
4. Update the renderer for the changed type in `apps/frontend/src/components/dynamic/`.
5. Bump `apps/backend` and `apps/frontend` together — one PR.

---

## Deployment options

We have not picked a deployment target yet. All three of these work cleanly with the current scaffold and have free tiers suitable for a hackathon demo.

### Frontend → Vercel

- Zero-config for Next.js.
- Set `NEXT_PUBLIC_API_URL` in Project Settings → Environment Variables.
- One environment per branch: `main` → production, `dev` → preview.

### Backend → Render / Railway / Fly.io

| Provider | Pros                                   | Notes                                  |
| -------- | -------------------------------------- | -------------------------------------- |
| Render   | Easiest UI, free tier sleeps after 15m | `uv sync` then `uvicorn app.main:app`  |
| Railway  | Generous free credits, fast deploys    | Same start command                     |
| Fly.io   | Cheapest at scale, Dockerfile required | Adds Docker complexity (we avoid it)   |

For all three, set:

```env
GEMINI_API_KEY=...
FRONTEND_URL=https://<your-vercel-app>.vercel.app
```

Required GitHub Secrets when we add a deploy workflow:

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- One of: `RENDER_API_KEY`, `RAILWAY_TOKEN`, `FLY_API_TOKEN`
- `GEMINI_API_KEY` (set on the *deployed backend* environment, not in CI)

The deploy workflow is intentionally not committed yet — we'll add it once we pick a provider, so we don't ship a workflow that fails on missing secrets.

---

## Future extensions

- **Streaming** — swap to `client.aio.models.generate_content_stream` and SSE on the backend; render tokens as they arrive.
- **Function calling** — register Python tools in `gemini_client.py`; map them to the existing `actions[].tool_call` shape.
- **Structured outputs** — pass our Pydantic schema as `response_schema` so Gemini emits parseable JSON natively.
- **Multimodal** — accept image uploads in `/api/interpret` and forward them as parts to Gemini.
- **Long context** — `client.files.upload` for big docs; reference them in `contents`.
