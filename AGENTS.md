# Agent Instructions

## Product direction

The selected product is **TecCoach**, not the original generic Gemini dynamic UI scaffold.

Build toward a Tec de Monterrey academic coach that:

- Uses Google OAuth through Supabase.
- Stores user profile, classes, synced events, and insights in Supabase.
- Syncs Canvas iCal and Google Calendar data.
- Uses Gemini API for structured weekly study insights.
- Lets the student approve suggested study blocks before writing to Google Calendar.

`README.md` is the product source of truth.

## Architecture direction

Target stack:

- Next.js 15 App Router and TypeScript.
- Next.js API routes as the backend.
- Supabase Auth + Postgres + RLS.
- Gemini API from server-side code only.
- Google Calendar API from server-side code only.
- Vercel deployment.

The old `apps/backend` FastAPI service has been removed. Do not reintroduce a Python backend unless the user explicitly changes the architecture.

## Branch and merge policy

- `main` is not locked, but it is protected.
- Merges to `main` must go through PRs with passing `Frontend CI`.
- Do work on `dev` or feature branches.
- Do not bypass PR protection or push directly to `main`.
- Preserve user changes, including untracked files, unless the user asks otherwise.

## Documentation policy

When product direction, architecture, API contracts, or branch policy changes:

- Update `README.md`.
- Update this `AGENTS.md` so future agents inherit the latest decision.
- Update architecture docs when stack or system design changes.

## Implementation confirmations

Before large code changes, confirm details that are not already specified in `README.md`, especially:

- Whether Next.js should remain under `apps/frontend` or move to the repo root.
- Which Supabase and Google Cloud projects are used for the demo.
- Whether the demo should be Spanish-only.
