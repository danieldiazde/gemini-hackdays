# TecCoach

Gemini-powered academic coach for Tec de Monterrey students, built for **Major League Hacking · RoBorregos · Gemini Hackdays**.

TecCoach helps a student decide what to study this week, explains why those priorities matter, and turns the recommendation into Google Calendar study blocks after the student approves them.

The project is no longer pursuing the original two flexible scaffold ideas. The committed product direction is:

> **A Tec21-aware academic planning assistant that uses Gemini API for structured weekly insights and schedule recommendations.**

See [`PROJECT.md`](PROJECT.md) for the master product brief and API contracts.

---

## Current status

The repository is now aligned around the `PROJECT.md` direction:

- `apps/frontend`: Next.js 15 app shell for TecCoach.
- `PROJECT.md`: master product brief, Supabase schema, API contracts, team roles, and demo script.
- `docs/planning/project-directions.md`: historical record of the original discarded ideas.

The previous FastAPI backend and generic `/api/interpret` dynamic UI scaffold have been removed. New backend work belongs in Next.js API routes.

---

## Target product

Primary user story:

> As a Tec student, I want an AI coach to tell me what to study this week and when, based on my current classes, Canvas deadlines, Google Calendar, and Tec21 academic context.

Core demo flow:

1. Student signs in with Google.
2. Student completes onboarding: student info, degree program, semester, enrolled courses, optional Canvas iCal URL.
3. TecCoach syncs Google Calendar and Canvas deadlines.
4. Gemini generates structured weekly insights:
   - short coaching message
   - priority classes
   - urgency rationale
   - suggested study blocks
5. Student approves the suggested blocks.
6. TecCoach writes the approved blocks to Google Calendar.

---

## Target tech stack

| Layer | Target choice |
| --- | --- |
| App | Next.js 15 App Router, TypeScript |
| Backend | Next.js API routes, not a separate Python service |
| Auth + DB | Supabase Auth, Postgres, Row Level Security |
| OAuth | Google OAuth through Supabase |
| Calendar | Google Calendar API read/write |
| Canvas | Canvas iCal URL ingestion |
| AI | Gemini API, structured output with `gemini-2.5-flash` |
| Styling | Tailwind CSS |
| Hosting | Vercel, push-to-deploy from `main` once unlocked |
| Pre-processing | Local scraper to seed Tec study-plan JSON into Supabase |

Important correction: there is no Python backend in the target architecture. New backend work should be implemented as Next.js API routes.

---

## Repository transition plan

### Phase 1: Documentation alignment

- Make `PROJECT.md` the product source of truth.
- Keep this README focused on setup, direction, and migration state.
- Mark the old two-direction planning doc as historical.
- Add `AGENTS.md` so coding agents inherit the selected direction and branch policy.
- Remove the old FastAPI and generic dynamic UI scaffold.

### Phase 2: Next.js app foundation

- Move the app surface toward a single Next.js application.
- Add Supabase browser/server clients.
- Add Google OAuth sign-in flow.
- Add protected routes for onboarding and dashboard.
- Add environment variables for Supabase, Gemini, Google OAuth, and app URL.

### Phase 3: Data model

- Create Supabase schema from `PROJECT.md`.
- Enable RLS for user-owned tables.
- Seed `planes_estudio` from local pre-processing output.
- Add typed data access helpers in the Next.js app.

### Phase 4: Integrations

- Implement Canvas iCal parser and `POST /api/canvas/sync`.
- Implement Google Calendar read sync via `POST /api/calendar/sync`.
- Implement Google Calendar event creation via `POST /api/calendar/create`.
- Store synced events in Supabase as cached planning context.

### Phase 5: Gemini structured insights

- Implement `POST /api/insights/generate`.
- Send Gemini only the minimum student profile, classes, deadlines, and calendar context needed for planning.
- Require structured JSON matching the contract in `PROJECT.md`.
- Cache generated weekly insights in Supabase.
- Add `GET /api/insights/current`.

### Phase 6: Demo UI

- Build onboarding flow.
- Build dashboard with priorities, rationale, and weekly calendar view.
- Add approval flow for suggested blocks.
- Add demo data fallback for local development when external credentials are not configured.

## Open questions before implementation

These still need owner confirmation before large feature work:

- Should the repository become a single Next.js app at the repo root, or keep the current `apps/frontend` workspace package as the app?
- Which Supabase project and Google Cloud project should be used for the hackathon demo?
- Are we using real Canvas iCal URLs in the demo, seeded fixture data, or both?
- Which Tec degree programs must be included in the first `planes_estudio` seed?
- Should the product UI be Spanish-only for the demo, as `PROJECT.md` suggests?

---

## Local setup today

```bash
pnpm install
pnpm dev:frontend
```

App: <http://localhost:3000>

---

## Branch workflow

- `main` is the stable branch and is currently locked to prevent accidental merges.
- `dev` is the integration branch.
- Feature branches should start from `dev`.
- Changes should flow through PRs unless the team explicitly unlocks `main`.

```text
feature/<name> -> dev -> main
```

---

## License

MIT. See [`LICENSE`](LICENSE).
