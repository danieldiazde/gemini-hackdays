# gemini-hackdays

A Gemini-powered hackathon project for **Major League Hacking · RoBorregos · Gemini**.

The repo is a clean monorepo with a FastAPI backend and a Next.js frontend, designed to support either of two product directions without locking in early:

1. **Generative UI / dynamic dashboard** — natural-language requests rendered as live UI components.
2. **AI agent / NPC / robotics simulation** — natural-language scenarios turned into structured plans, dialogue, and actions.

See [`docs/planning/project-directions.md`](docs/planning/project-directions.md) for the full pitches.

---

## Tech stack

| Layer       | Choice                                    |
| ----------- | ----------------------------------------- |
| Backend     | Python 3.12, FastAPI, Pydantic v2, `uv`   |
| Frontend    | Next.js 15 (App Router), TypeScript, Tailwind CSS v4, `pnpm` |
| AI          | Google Gen AI SDK (`google-genai`) — Gemini 2.5 Flash |
| Lint/format | `ruff` (Python), ESLint + `tsc` (TS)      |
| Tests       | `pytest` (Python)                         |
| CI          | GitHub Actions                            |

---

## Repo structure

```text
.
├── apps/
│   ├── backend/                FastAPI service (Python, uv)
│   └── frontend/               Next.js app (TypeScript, pnpm)
├── docs/
│   ├── planning/               product directions, team roles
│   ├── architecture/           system design, API contract
│   └── demo/                   demo script (TBD once idea is locked)
├── prompts/                    Gemini, Claude Code, Codex workflow prompts
├── .github/workflows/          CI
├── .env.example                template for secrets
├── pnpm-workspace.yaml         pnpm monorepo config
└── package.json                root scripts
```

---

## Prerequisites

You need these installed locally. The project is tested on **macOS** and **Windows** (Git Bash, PowerShell, or WSL all work).

| Tool        | Version    | Install                                                                 |
| ----------- | ---------- | ----------------------------------------------------------------------- |
| Python      | 3.12       | macOS: `brew install python@3.12` · Windows: [python.org](https://www.python.org/downloads/) |
| `uv`        | latest     | macOS: `brew install uv` · Windows: `winget install astral-sh.uv`        |
| Node.js     | 22 LTS     | macOS: `brew install node@22` · Windows: [nodejs.org](https://nodejs.org/) — or use [`fnm`](https://github.com/Schniz/fnm) / `nvm` |
| `pnpm`      | 11         | `corepack enable && corepack prepare pnpm@11 --activate`                 |

---

## Setup

```bash
# 1. Clone
git clone git@github.com:danieldiazde/gemini-hackdays.git
cd gemini-hackdays

# 2. Copy env template (keys stay empty for mock mode)
cp .env.example .env
# Windows PowerShell: Copy-Item .env.example .env

# 3. Install frontend deps
pnpm install

# 4. Install backend deps (uv creates the venv automatically)
uv --directory apps/backend sync
```

That's it. You can now run either app.

---

## Run the backend

```bash
pnpm dev:backend
# or, equivalently:
uv --directory apps/backend run uvicorn app.main:app --reload --port 8000
```

- API: <http://localhost:8000>
- Health check: <http://localhost:8000/health>
- Interactive docs: <http://localhost:8000/docs>

## Run the frontend

```bash
pnpm dev:frontend
```

- App: <http://localhost:3000>

The frontend talks to the backend via `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`).

---

## Add your Gemini API key

The backend works **without** a key — it returns a clearly-labeled mock response so the frontend renders all component types out of the box.

When you're ready for real Gemini calls:

1. Get a key from [aistudio.google.com](https://aistudio.google.com/app/apikey).
2. Add it to your local `.env` (root) **or** `apps/backend/.env`:
   ```
   GEMINI_API_KEY=your_key_here
   ```
3. Restart the backend.

> **The key only ever lives in the backend.** The frontend never sees it. Do not put `GEMINI_API_KEY` in any `NEXT_PUBLIC_*` variable.

---

## Branch workflow

Suggested long-lived branches:

- **`main`** — stable demo branch. Protect it once repo settings are configured.
- **`dev`** — integration branch. All feature branches start here and PR back here.

```text
feature/<name>  ──►  dev  ──►  main
                     │          │
                     └─ daily   └─ demo-stable only
```

Rules:

- No direct pushes to `main`.
- All feature work branches off `dev` (`git checkout -b feature/my-thing dev`).
- PRs merge into `dev`. CI must pass.
- `dev` → `main` only when something is demo-stable.

Branch protection is intentionally not configured by this scaffold. Add it from GitHub settings once the team agrees on required checks.

---

## CI

GitHub Actions runs on every PR and on pushes to `main` / `dev`:

- **Backend CI** — `uv sync`, `ruff check`, `ruff format --check`, `pytest`
- **Frontend CI** — `pnpm install --frozen-lockfile`, lint, typecheck, build

CI does not need `GEMINI_API_KEY` — backend tests run in mock mode.

---

## Useful scripts (from repo root)

| Command                  | What it does                                |
| ------------------------ | ------------------------------------------- |
| `pnpm dev:backend`       | Start FastAPI on :8000 with autoreload      |
| `pnpm dev:frontend`      | Start Next.js dev server on :3000           |
| `pnpm build:frontend`    | Production build of the frontend           |
| `pnpm lint:backend`      | Ruff lint                                   |
| `pnpm format:backend`    | Ruff format (check only, no writes)        |
| `pnpm test:backend`      | Pytest                                      |
| `pnpm lint:frontend`     | ESLint                                      |
| `pnpm typecheck:frontend`| TypeScript no-emit typecheck                |
| `pnpm check`             | Run every check above (mirrors CI)          |

---

## Next steps

- Pick a product direction (see [`docs/planning/project-directions.md`](docs/planning/project-directions.md)).
- Iterate on the Gemini prompt and structured-output schema in [`apps/backend/app/services/gemini_client.py`](apps/backend/app/services/gemini_client.py) and [`prompts/gemini-structured-output.md`](prompts/gemini-structured-output.md).
- Build out real component renderers in [`apps/frontend/src/components/dynamic/`](apps/frontend/src/components/dynamic/).
- Decide on deployment target — see [`docs/architecture/system-design.md`](docs/architecture/system-design.md) for options (Vercel + Render/Railway/Fly).

## License

MIT — see [`LICENSE`](LICENSE).
