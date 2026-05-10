# TecCoach

Gemini-powered academic coach for Tec de Monterrey students, built for **Major League Hacking · RoBorregos · Gemini Hackdays**.

TecCoach helps a student decide what to study this week, explains why those priorities matter, and turns approved recommendations into Google Calendar study blocks.

The project is no longer pursuing the original generic Gemini ideas. The committed direction is:

> A Tec21-aware academic planning assistant that uses Gemini API for structured weekly insights and schedule recommendations.

This README is the project source of truth.

---

## Vision

Product: intelligent academic coach for Tec de Monterrey students.

Primary user story:

> As a Tec student, I want an AI coach to tell me what to study this week and when, based on my current classes, Canvas deadlines, Google Calendar, and Tec21 academic context.

Pitch differentiators:

- Understands Tec21 context: Semanas Tec, life courses, academic blocks, and study plans.
- Goes beyond information: creates Google Calendar study blocks after student approval.
- Privacy-first: uses Google OAuth and never asks for Tec credentials.
- Contextualized: understands the student's degree, semester, and current classes.

---

## Current Status

- `apps/frontend`: Next.js 15 app shell for TecCoach.
- The previous FastAPI backend and generic `/api/interpret` dynamic UI scaffold have been removed.
- New backend work belongs in Next.js API routes.
- `main` is protected but not locked; changes should go through PRs with passing `Frontend CI`.

---

## Target Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 15 App Router, TypeScript |
| Backend | Next.js API routes, not a separate Python service |
| Auth + DB | Supabase Auth, Postgres, Row Level Security |
| OAuth | Google OAuth through Supabase |
| Calendar | Google Calendar API read/write |
| Canvas | Canvas iCal URL ingestion |
| AI | Gemini API, `gemini-2.5-flash` for structured insights |
| Styling | Tailwind CSS |
| Hosting | Vercel |
| Pre-processing | Local Playwright scraper to generate study-plan JSON |

Key architecture decision: everything runs through Next.js. API routes are the backend.

Data flow:

```text
User -> Google OAuth -> Supabase Auth
                    -> Onboarding: degree, semester, classes, Canvas iCal
                    -> Sync Google Calendar + Canvas iCal into Supabase
                    -> Gemini receives profile + classes + events
                    -> Dashboard shows structured insights
                    -> Student approves blocks
                    -> Google Calendar API writes approved events
```

---

## Team Roles

### Persona A: Data & Foundation

- SAMP scraper before the hackathon.
- Supabase schema and RLS.
- Canvas iCal sync.
- Google Calendar API read/write integration.

### Persona B: AI & Logic

- Academic coach prompts.
- `/api/insights/generate` with Gemini structured output.
- Conflict detection.
- Study-block recommendation logic.

### Persona C: Frontend & Demo

- Auth UI and onboarding.
- Dashboard with insights.
- Weekly calendar view.
- Polish and demo data.

---

## Supabase Schema

Persona A owns schema changes. Discuss contract changes before editing shared tables.

```sql
-- STATUS: already created in Supabase except `insights` (run that separately)

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  matricula text,
  nombre text,
  carrera_clave text,
  modelo text check (modelo in ('tec21','tec26')),
  semestre integer check (semestre between 1 and 10),
  periodo_nombre text,
  periodo_inicio date,
  periodo_fin date,
  canvas_ical_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- If profiles already exists, run this migration:
--   ALTER TABLE profiles DROP COLUMN IF EXISTS semestre_inicio;
--   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS periodo_nombre text;
--   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS periodo_inicio date;
--   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS periodo_fin date;

create table if not exists planes_estudio (
  carrera_clave text primary key,
  nombre text,
  data jsonb
);

create table if not exists materias_inscritas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  clave text not null,
  nombre text,
  crn text,
  creditos integer,
  prioridad integer,
  horas_clase integer,
  horas_auto integer,
  periodos jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- If materias_inscritas already exists:
--   ALTER TABLE materias_inscritas ADD COLUMN IF NOT EXISTS crn text;
--   ALTER TABLE materias_inscritas ADD COLUMN IF NOT EXISTS periodos jsonb default '[]'::jsonb;

-- NOTE: column names are fecha_inicio/fecha_fin (not inicio/fin) and source (not fuente)
create table if not exists eventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  external_id text,
  source text,
  titulo text,
  descripcion text,
  fecha_inicio timestamptz,
  fecha_fin timestamptz,
  created_at timestamptz default now(),
  unique (user_id, external_id)
);

-- MISSING — run this in Supabase SQL Editor:
create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  semana_iso text not null,
  contenido jsonb not null,
  generated_at timestamptz default now(),
  unique(user_id, semana_iso)
);

alter table profiles enable row level security;
alter table materias_inscritas enable row level security;
alter table eventos enable row level security;
alter table insights enable row level security;
alter table planes_estudio enable row level security;

create policy "users read own profile" on profiles for select using (auth.uid() = id);
create policy "users insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "users update own profile" on profiles for update using (auth.uid() = id);
create policy "users read own materias" on materias_inscritas for select using (auth.uid() = user_id);
create policy "users write own materias" on materias_inscritas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read own eventos" on eventos for select using (auth.uid() = user_id);
create policy "users write own eventos" on eventos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users see own insights" on insights for all using (auth.uid() = user_id);
create policy "anyone reads planes" on planes_estudio for select using (true);
```

---

## API Contracts

Do not change shared endpoint contracts without telling the team.

### Data APIs

`POST /api/canvas/sync`

```ts
// Body
{ icalUrl: string }

// Response 200
{ success: true; eventsAdded: number }

// Response 400
{ error: string }
```

`POST /api/calendar/sync`

Reads the next 14 days from the user's primary Google Calendar and stores them in `eventos`.

```ts
// Body: empty, uses session
// Response 200
{ success: true; eventsAdded: number }
```

`POST /api/calendar/create`

Creates approved study blocks in Google Calendar.

```ts
// Body
{
  events: Array<{
    titulo: string;
    descripcion?: string;
    inicio: string;
    fin: string;
  }>;
}

// Response 200
{ success: true; created: number; ids: string[] }
```

`GET /api/planes/:carreraClave`

```ts
// Response 200
{
  carreraClave: string;
  nombre: string;
  data: {
    semestres: Array<{
      numero: number;
      materias: Array<{
        clave: string;
        nombre: string;
        creditos: number;
        tipo: "regular" | "life" | "semana_tec";
      }>;
    }>;
  };
}
```

### AI APIs

`POST /api/insights/generate`

Generates insights for the current week. Uses cache unless `forceRefresh` is true.

```ts
// Body
{ forceRefresh?: boolean }

// Response 200
{
  semana_iso: string;
  contenido: {
    mensaje: string;
    prioridades: Array<{
      materia: string;
      razon: string;
      urgencia: "alta" | "media" | "baja";
    }>;
    bloques_sugeridos: Array<{
      titulo: string;
      materia: string;
      inicio_iso: string;
      fin_iso: string;
      razon: string;
    }>;
  };
}
```

`GET /api/insights/current`

```ts
// Response 200
{ insight: Insight | null }
```

### Profile API

`POST /api/profile/setup`

Lightweight profile save (identity + carrera + modelo + semestre). Materias come from the PDF endpoint below.

```ts
// Body
{
  matricula?: string;
  nombre?: string;
  carreraClave: string;
  modelo: "tec21" | "tec26";
  semestre: number; // 1-10
  canvasIcalUrl?: string;
}

// Response 200
{ success: true }
```

`POST /api/profile/horario`

Parses the student's official MiTec schedule PDF via Gemini multimodal. Replaces `materias_inscritas` and writes `periodo_*` columns on `profiles`.

```ts
// Body: multipart/form-data with field "pdf" (max 10 MB, application/pdf)

// Response 200
{
  success: true;
  alumno: string | null;
  matricula: string | null;
  periodo: string | null;
  materias: number;
}
```

`POST /api/gemini/test`

Auth-gated smoke test for the Gemini integration. Returns a one-line response.

### Frontend Components

- `<OnboardingFlow />`: 3-step flow (datos → carrera → upload PDF), writes to `/api/profile/setup` then `/api/profile/horario`.
- `<DashboardView />`: server component reads `insights` + `eventos` directly from Supabase; the page also auto-syncs Google Calendar + Canvas iCal on load.
- `<ApplyBlocksButton />`: posts selected blocks to `/api/calendar/create`.

---

## Environment Variables

Use `.env.local`. Do not commit real values.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GEMINI_API_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: when set to 1, the app skips Supabase/Gemini/Google calls and
# renders fixture data so you can run the UI without any external credentials.
NEXT_PUBLIC_DEMO_MODE=
```

Server-only variables must never be exposed through `NEXT_PUBLIC_*`.

---

## Target App Structure

```text
apps/frontend/
├── data/planes/              # 53 study-plan JSONs, seeded into planes_estudio
├── scripts/
│   └── seed-planes.ts        # node script that upserts data/planes/* into Supabase
└── src/
    ├── app/
    │   ├── page.tsx          # landing + LoginButton
    │   ├── (app)/dashboard/
    │   ├── (app)/onboarding/
    │   ├── auth/callback/
    │   └── api/
    │       ├── canvas/sync/
    │       ├── calendar/sync/
    │       ├── calendar/create/
    │       ├── insights/generate/
    │       ├── insights/current/
    │       ├── gemini/test/
    │       ├── planes/[clave]/
    │       ├── planes/
    │       ├── profile/setup/
    │       └── profile/horario/
    ├── components/
    │   ├── auth/
    │   ├── onboarding/
    │   ├── dashboard/
    │   └── ui/
    ├── lib/
    │   ├── supabase/
    │   ├── gemini/
    │   ├── google/
    │   ├── ical/
    │   ├── pdf/              # MiTec horario parser via Gemini multimodal
    │   ├── scheduling/       # study-block conflict resolver
    │   ├── tec21/            # period helpers
    │   ├── validation/       # zod schemas for API inputs
    │   ├── fixtures/         # demo-mode data
    │   └── types/
    └── middleware.ts
```

---

## Implementation Plan

### Phase 1: Next.js App Foundation

- Add Supabase browser/server clients.
- Add Google OAuth sign-in flow.
- Add protected routes for onboarding and dashboard.
- Add environment handling for Supabase, Gemini, Google OAuth, and app URL.

### Phase 2: Data Model

- Create Supabase schema from this README.
- Enable RLS for user-owned tables.
- Seed `planes_estudio` from local pre-processing output.
- Add typed data access helpers in the Next.js app.

### Phase 3: Integrations

- Implement Canvas iCal parser and `POST /api/canvas/sync`.
- Implement Google Calendar read sync via `POST /api/calendar/sync`.
- Implement Google Calendar event creation via `POST /api/calendar/create`.
- Store synced events in Supabase as cached planning context.

### Phase 4: Gemini Structured Insights

- Implement `POST /api/insights/generate`.
- Send Gemini only the minimum student profile, classes, deadlines, and calendar context needed for planning.
- Require structured JSON matching the contract in this README.
- Cache generated weekly insights in Supabase.
- Add `GET /api/insights/current`.

### Phase 5: Demo UI

- Build onboarding flow.
- Build dashboard with priorities, rationale, and weekly calendar view.
- Add approval flow for suggested blocks.
- Add demo data fallback for local development when external credentials are not configured.

---

## Demo Script

What must work for judges:

1. Landing page -> "Iniciar sesión con Google".
2. OAuth consent screen -> return to the app.
3. Onboarding: matricula, career, semester, enrolled classes, Canvas iCal URL.
4. Dashboard:
   - coach message
   - three priorities with urgency
   - suggested weekly study blocks
   - "Aplicar a Google Calendar" button
5. Click apply -> loading -> success toast.
6. Open Google Calendar and show the created blocks.

If a feature is unreliable, cut it from the live demo.

---

## Out Of Scope

- Finance / HEB module.
- Perfect mobile responsive polish.
- Multiple languages; Spanish is the demo language.
- Push notifications or email.
- Multiple Google calendars; only the primary calendar.
- Editing existing Google Calendar events.
- Refactors that do not move the demo forward.

---

## Conventions

- Branches: `feat/<persona>-<feature>`, for example `feat/a-canvas-sync`.
- Commits: conventional commits such as `feat:`, `fix:`, `chore:`, `docs:`.
- TypeScript: strict; avoid `any`.
- Comments: explain non-obvious why, not obvious what.
- Domain names may use Spanish (`materias`, `bloques`); technical helpers should remain consistent.

---

## Sync Points

The team should sync every 8 hours during the hackathon:

- H+0: kickoff.
- H+8: auth, schema, scraper status.
- H+16: insights API and onboarding status.
- H+24: dashboard consumes real insights.
- H+32: end-to-end works; polish starts.
- H+40: full demo run-through.
- H+44: backup video recorded.

If someone is blocked for more than 2 hours, raise it.

---

## Local Setup

```bash
pnpm install
pnpm dev:frontend
```

App: <http://localhost:3000>

---

## Branch Workflow

- `main` is the stable branch and requires PRs plus passing `Frontend CI`.
- `dev` is the integration branch.
- Feature branches should start from `dev`.
- Changes should flow through PRs.

```text
feature/<name> -> dev -> main
```

---

## Pitch

> "Most Tec students plan their week in a notebook or in their head. They lose time, miss deadlines, and study at the last minute.
>
> TecCoach connects Google Calendar, Canvas, and the SAMP study plan. Gemini analyzes the student's real workload and explains what to study, when, and why, then schedules approved blocks with one click.
>
> It is not generic chat. It understands Tec21, Semanas Tec, life courses, and academic blocks."

---

## License

MIT. See [`LICENSE`](LICENSE).
