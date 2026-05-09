# System design

> Status: this file reflects the selected TecCoach direction from the repo README.

## Pieces

```text
┌────────────┐         ┌────────────────────┐         ┌──────────────┐
│  Browser   │ ──────► │ Next.js App Router │ ──────► │ Supabase     │
│            │ ◄────── │ + API routes       │ ◄────── │ Auth + DB    │
└────────────┘         └─────────┬──────────┘         └──────────────┘
                                 │
                  ┌──────────────┼──────────────┐
                  ▼              ▼              ▼
             Gemini API   Google Calendar   Canvas iCal
```

### App (`apps/frontend`)

- Next.js 15 App Router, TypeScript, Tailwind v4.
- Owns both UI and backend behavior through API routes.
- Provides Google sign-in, onboarding, dashboard, weekly calendar, and apply-to-calendar flow.
- Should be kept as the app package unless the team decides to move Next.js to the repo root.

### Supabase

- Supabase Auth handles Google OAuth.
- Postgres stores profiles, study plans, enrolled classes, synced events, and cached insights.
- Row Level Security must be enabled for user-owned tables.
- `planes_estudio` is public read-only seed data.

### Gemini

- Called only from server-side code in Next.js API routes.
- Generates structured weekly academic insights, not generic chat responses.
- The response shape should match the contracts in the repo README.
- Gemini context should be scoped to the user's profile, enrolled classes, deadlines, calendar availability, and Tec21 rules.

### Google Calendar

- Read upcoming calendar events for availability.
- Write only approved AI-suggested study blocks.
- Do not write events without explicit student approval in the UI.

### Canvas iCal

- Ingest an iCal URL provided by the student.
- Parse assignments/deadlines into normalized `eventos` rows.
- Treat Canvas data as cached planning context, not as an authentication surface.

---

## Why secrets stay in the backend

`NEXT_PUBLIC_*` env vars are bundled into the browser. Anyone hitting the deployed frontend can extract them from the JS source. So the rules are:

- `GEMINI_API_KEY` lives only in server-side environment variables.
- `SUPABASE_SERVICE_ROLE_KEY` lives only in server-side environment variables.
- Google OAuth secrets live only in server-side environment variables or provider configuration.
- Browser code may use `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_APP_URL`.
- The browser never calls Gemini directly.

If we ever want browser-side Gemini calls (e.g., for low-latency streaming), the right pattern is to mint short-lived signed tokens from the backend and have the frontend use those — never a long-lived key.

---

## API route contracts

The active product contracts are in [`../../README.md`](../../README.md):

- `POST /api/canvas/sync`
- `POST /api/calendar/sync`
- `POST /api/calendar/create`
- `GET /api/planes/:carreraClave`
- `POST /api/insights/generate`
- `GET /api/insights/current`
- `POST /api/profile/setup`

[`api-contract.md`](api-contract.md) mirrors those contracts in architecture-doc form.

---

## Deployment

Target deployment is Vercel:

- `main` deploys production when the branch is unlocked and the app is ready.
- PRs and `dev` can deploy previews.
- Supabase hosts Auth and Postgres.
- Gemini and Google credentials are configured as Vercel environment variables.

Expected environment variables:

```env
GEMINI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=...
```

---

## Implementation notes

- Add backend behavior through Next.js API routes.
- Keep Gemini prompts and structured-output schemas close to the route that owns them.
- Preserve demo-mode fixture data so the UI can be exercised without live Google/Canvas/Supabase credentials.
