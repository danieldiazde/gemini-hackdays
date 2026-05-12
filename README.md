# TecCoach

TecCoach is a Gemini-powered academic coach for Tec de Monterrey students.
It helps students decide what to study this week, explains why those priorities
matter, and turns approved recommendations into Google Calendar study blocks.

Live app: <https://teccoach.vercel.app>

## What It Does

- Signs students in with Google OAuth through Supabase.
- Stores profiles, enrolled classes, synced events, and weekly insights in Supabase.
- Syncs Canvas iCal deadlines and Google Calendar events.
- Uses Gemini to generate structured weekly study priorities and suggested blocks.
- Lets students approve study blocks before writing anything to Google Calendar.

## Product Flow

```text
Google OAuth
  -> Onboarding: profile, degree, semester, MiTec schedule PDF, Canvas iCal
  -> Calendar + Canvas sync
  -> Gemini weekly study insight
  -> Student approves suggested blocks
  -> Google Calendar events are created
```

## Stack

| Layer | Technology |
| --- | --- |
| App | Next.js 15 App Router, TypeScript |
| Backend | Next.js API routes |
| Auth + DB | Supabase Auth, Postgres, Row Level Security |
| OAuth | Google OAuth through Supabase |
| Calendar | Google Calendar API |
| Canvas | Canvas iCal ingestion |
| AI | Gemini API, structured JSON output |
| Styling | Tailwind CSS |
| Hosting | Vercel |

## Privacy And Security

- TecCoach never asks for Tec credentials.
- Google OAuth is handled through Supabase Auth.
- Gemini, Google Calendar, and Supabase service-role keys are server-side only.
- User-owned tables are protected with Supabase Row Level Security.
- Calendar writes happen only after the student approves the suggested blocks.
- Demo mode uses local fixture data and does not write to Google Calendar.
- Public deployments can restrict real Google-backed access with
  `ALLOWED_USER_EMAILS`; visitors can still use the fixture-backed demo.

## Local Development

```bash
pnpm install
pnpm dev:frontend
```

The app runs at <http://localhost:3000>.

Create `apps/frontend/.env.local` from `apps/frontend/.env.example` and provide:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000

SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ALLOWED_USER_EMAILS=
```

Optional:

```bash
NEXT_PUBLIC_DEMO_MODE=1
```

## Deployment

Production is deployed by Vercel from the `main` branch.

- Do not run manual production deploys from local machines.
- Open a pull request into `main` for production changes.
- Keep Vercel connected to the GitHub repository with root directory
  `apps/frontend`.
- Merges to `main` should pass the frontend checks before production deploys.

## Data Setup

Study-plan JSON files live in `apps/frontend/data/planes`.
Seed them into Supabase with:

```bash
cd apps/frontend
npx tsx --env-file=.env.local scripts/seed-planes.ts
```

## Repository Structure

```text
apps/frontend/
  data/planes/       Tec study-plan JSON data
  scripts/           data seed scripts
  src/app/           Next.js pages, layouts, and API routes
  src/components/    auth, onboarding, dashboard, and UI components
  src/lib/           Supabase, Gemini, Google, Canvas, PDF, and scheduling logic
docs/
  architecture/      API and system design notes
  ai-governance.md   Gemini usage, validation, and safety boundaries
  demo/              showcase script
```

## License

MIT. See [`LICENSE`](LICENSE).
