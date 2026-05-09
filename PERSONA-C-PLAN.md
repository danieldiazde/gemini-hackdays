# TecCoach — Persona C (Frontend & Demo) Plan

Living plan + progress tracker for the Frontend & Demo persona. Mirrors the prompt the team gave Persona C (TAREAS 1–6) but adapted to this repo (Tailwind v4, pnpm workspace, existing `apps/frontend`). Update at every phase boundary so a fresh session can pick up without re-deriving state.

Repo: this directory. Default base branch for PRs: `dev`.

---

## Context

TecCoach is a Gemini-powered academic coach for Tec students that turns weekly priorities into Google Calendar study blocks. The repo already has a `pnpm` workspace with `apps/frontend` running Next.js 15 App Router + **Tailwind v4** (CSS-first `@theme` in `src/app/globals.css`). API contracts (Supabase schema, endpoints, environment variables) are defined in `README.md`; do not invent endpoints.

Persona A (Data) and Persona B (AI) routes do not exist yet, so the UI consumes typed fixtures behind a `?demo=1` toggle and swaps to real `fetch` calls as endpoints come online. The README contracts are the source of truth for response shapes.

We execute one TAREA per phase: ship → commit → PR (`feat/c-<slug>` → `dev`) → review → next phase.

---

## Phase status

| Phase | TAREA | Branch | Status |
| --- | --- | --- | --- |
| 1 | Foundation (shadcn, palette, Supabase clients) | `feat/c-foundation` | ✅ Merged via #4 |
| 2 | Landing + Google login | `feat/c-landing-login` | ✅ Merged via #5 |
| 3 | Onboarding multi-step | `feat/c-onboarding` | ✅ Code done, opening PR |
| 4 | Dashboard | `feat/c-dashboard` | ⏳ Next |
| 5 | Polish + demo data | `feat/c-polish` | ☐ |
| 6 | Stretch | `feat/c-stretch` | ☐ |

---

## Phase 1 — TAREA 1: Project foundation (H+0 → H+2)

Goal: dependencies, shadcn (Tailwind v4 mode), Gemini palette, Supabase clients, Inter font. Verify `pnpm --filter frontend dev` renders a Gemini-branded "Hello World".

### Files (Phase 1)

Modified:

- `apps/frontend/package.json` — added `@supabase/ssr`, `@supabase/supabase-js`, `lucide-react`, `date-fns`, `clsx`, `tailwind-merge`, `class-variance-authority`. shadcn pulled `next-themes`, `sonner`, `tw-animate-css`, `@base-ui/react`, `shadcn`.
- `apps/frontend/src/app/globals.css` — Gemini palette `@theme` block + shadcn CSS variables. Old teal `--color-bg / --color-panel / ...` block removed.
- `apps/frontend/src/app/layout.tsx` — Inter via `next/font/google`, `next-themes` `ThemeProvider` (light fixed), `<Toaster richColors />`.
- `apps/frontend/src/app/page.tsx` — temporary sanity page with gradient title + buttons. Replaced wholesale in TAREA 2.
- `pnpm-workspace.yaml` — set `msw: false` (was `"set this to true or false"`, which made every `pnpm add` exit 1 with `ERR_PNPM_IGNORED_BUILDS`).

New:

- `apps/frontend/components.json` — shadcn config (`style: base-nova`, `baseColor: neutral`, alias `@/*`, icon `lucide`).
- `apps/frontend/src/components/ui/{button,card,input,label,select,textarea,badge,dialog,skeleton,sonner}.tsx`.
- `apps/frontend/src/lib/utils.ts` — `cn()`.
- `apps/frontend/src/lib/env.ts` — `requireEnv()` / `publicEnv()`.
- `apps/frontend/src/lib/supabase/client.ts` — `getSupabaseBrowser()`.
- `apps/frontend/src/lib/supabase/server.ts` — `getSupabaseServer()`.

### Done when (Phase 1)

- `pnpm install` clean.
- `pnpm --filter frontend dev` boots; `/` shows Inter + `bg-gemini-gradient` element.
- `pnpm --filter frontend typecheck` and `lint` pass.

### Verification (passed)

- `pnpm --filter frontend typecheck` ✅
- `pnpm --filter frontend lint` ✅
- `pnpm --filter frontend dev` → `curl localhost:3000` HTTP 200, HTML contains `bg-gemini-gradient`, Inter font variable, ThemeProvider, Toaster region. No console errors.

### PR (Phase 1)

`feat/c-foundation` → `dev`. Title: `feat(frontend): shadcn + gemini palette + supabase clients`.

---

## Phase 2 — TAREA 2: Landing + Login (H+2 → H+5)

Goal: Gemini-branded landing with a working "Iniciar sesión con Google" CTA via Supabase OAuth, redirecting to `/onboarding` (first time) or `/dashboard`.

### Files (Phase 2)

- `apps/frontend/src/app/page.tsx` — replace sanity page. Server Component. Wordmark with gradient text, Spanish hero copy, `<LoginButton />` CTA, three feature cards (`Card` from shadcn). `rounded-xl`, `shadow-sm`, generous whitespace.
- `apps/frontend/src/components/auth/LoginButton.tsx` — Client Component. `getSupabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo: \`${origin}/auth/callback\`, scopes: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events", queryParams: { access_type: "offline", prompt: "consent" } } })`. `Loader2` while pending. `toast.error(...)` if env vars missing.
- `apps/frontend/src/app/auth/callback/route.ts` — Route Handler. `exchangeCodeForSession(code)` → check `profiles.semestre`. Null/missing/table doesn't exist → `redirect("/onboarding")`. Else → `redirect("/dashboard")`.
- `apps/frontend/src/app/(app)/dashboard/page.tsx` — minimal placeholder Server Component.
- `apps/frontend/src/app/(app)/onboarding/page.tsx` — minimal placeholder Server Component.
- `apps/frontend/src/middleware.ts` — Supabase `updateSession` middleware (refreshes auth cookies). Standard `@supabase/ssr` snippet.
- `apps/frontend/src/lib/demo.ts` — `isDemoMode()` reading `searchParams.get("demo") === "1"` OR `process.env.NEXT_PUBLIC_DEMO_MODE === "1"`.

### Done when (Phase 2)

- Click CTA → Google consent screen (Calendar scopes shown) → returns to `/auth/callback` → lands on `/onboarding` or `/dashboard`.
- Without `NEXT_PUBLIC_SUPABASE_*`, button shows `toast.error("Configura NEXT_PUBLIC_SUPABASE_*")` instead of crashing.
- typecheck + lint clean. Mobile single-column layout doesn't break.

### PR (Phase 2)

`feat/c-landing-login` → `dev`. Title: `feat(frontend): gemini landing + google oauth login`.

---

## Phase 3 — TAREA 3: Onboarding multi-step (H+5 → H+12)

Goal: 3-step wizard that collects profile, then POSTs to `/api/profile/setup` (or writes the same payload to a local fixture if the route 404s).

### Plan (Phase 3)

- `app/(app)/onboarding/page.tsx` (Server Component) renders `<OnboardingFlow />`.
- `components/onboarding/OnboardingFlow.tsx` (Client) holds wizard state with `useReducer`. Three step components: `StepProfile`, `StepCareer`, `StepClasses`. Top progress bar (`<Progress />` from shadcn — add via `pnpm dlx shadcn@latest add progress`).
- **Step 1 — Datos personales:** `nombre completo`, `matrícula` (regex `^A0\d{7}$`).
- **Step 2 — Carrera:** dropdown of carreras (consume `/api/planes`; on 404 fall back to `lib/fixtures/planes.ts` with 4 hardcoded carreras like ITC, IMT, INA, LRI). Toast a small "Modo demo" badge when fixtures used. Modelo radio Tec21/Clásico. Semestre select 1–9.
- **Step 3 — Materias y Canvas:** `fetch(\`/api/planes/${carreraClave}\`) → semestres[N].materias`. Each subject row: `<Checkbox />` + `<Slider />` 1–5 for prioridad. Add `<Slider />` and `<Checkbox />` via shadcn. Canvas iCal: `<Input />` with helper text + a `<Dialog />` "¿Cómo obtengo el URL?" with a 4-step Lucide-iconed mini-tutorial.
- Submit: POST `/api/profile/setup` with the README-defined body. On 404, write to `localStorage` under `teccoach.demoProfile` so Phase 4 can read it. Toast success → `router.push("/dashboard")`.
- UX: progress bar on top (1/3, 2/3, 3/3), back button on steps 2 and 3, controlled inputs with `useState`/`useReducer`.

### Done when (Phase 3)

- New user can complete the 3-step flow with mock data and arrive at `/dashboard`.
- Back button works on steps 2 and 3.

### PR (Phase 3)

`feat/c-onboarding` → `dev`.

---

## Phase 4 — TAREA 4: Dashboard (H+12 → H+22)

Goal: the demo's hero screen — coach message, 3 priorities, weekly calendar grid, "Aplicar al GCal" flow.

### Plan (Phase 4)

- `app/(app)/dashboard/page.tsx` (Server Component): `getSupabaseServer()` → fetch `/api/insights/current` and `/api/eventos?week=current` (or fixture fallback). Pass props down to client components.
- `components/dashboard/WeekHeader.tsx` — uses `date-fns` `getISOWeek()` + `format(..., "MMMM yyyy", { locale: es })`.
- `components/dashboard/CoachMessage.tsx` — gradient-tint card (`bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50`), Lucide `Sparkles`, renders `insight.contenido.mensaje`.
- `components/dashboard/PrioritiesGrid.tsx` — 3 cards, color by `urgencia` (`alta` → `gemini-red`, `media` → amber, `baja` → emerald). Skeleton state when loading.
- `components/dashboard/WeeklyCalendar.tsx` — pure CSS Grid (7 cols × hours rows from 7am to 10pm). NO FullCalendar. Two layers: existing `eventos` (gray) and `bloques_sugeridos` (Gemini gradient bg, `opacity-90`). Click a suggested block → toggle `selected` set in parent state.
- `components/dashboard/ApplyBlocksButton.tsx` — fixed bottom-right `<Button />`. Disabled when no blocks selected. Click → shadcn `<Dialog />` confirm → POST `/api/calendar/create` with `{ events: selectedBlocks.map(toCreatePayload) }` → success toast with first event preview → `router.refresh()`. On 404, simulate success in demo mode.
- `lib/fixtures/insights.ts` and `lib/fixtures/eventos.ts` — copy verbatim from the prompt's "Si algo se complica" example so the dashboard renders before B/A endpoints exist.
- Empty state: if `insight === null`, render a centered card with Lucide `WandSparkles` and a "Generar mi semana" button → POST `/api/insights/generate`.
- Loading state: shadcn `<Skeleton />` blocks that match the layout.

### Done when (Phase 4)

- Dashboard renders end-to-end with fixtures alone.
- When real `/api/insights/current` is wired, it just works because the data shape matches the fixture.
- Apply flow creates events when `/api/calendar/create` exists; otherwise demo-mode success path still toasts.

### PR (Phase 4)

`feat/c-dashboard` → `dev`.

---

## Phase 5 — TAREA 5: Polish + demo data (H+22 → H+28)

- Stagger fade-in on cards via Tailwind v4 `animate-in` utilities (already imported through `tw-animate-css`).
- Hover micro-interactions on every clickable surface.
- `?demo=1` → bypass auth, hydrate every screen from `lib/fixtures/*`. **Critical** for live demo recovery.
- Replace every "Loading..." with a layout-respecting skeleton.
- Empty states with simple Lucide-illustrated cards + CTA.
- Quick mobile sweep: ensure landing, onboarding, dashboard don't horizontal-scroll under 375px.

PR: `feat/c-polish`.

## Phase 6 — TAREA 6: Stretch (H+28+)

Only if time remains:

- Coach-message typewriter effect (3–4s on first paint).
- Confetti burst on successful "Aplicar al GCal" (`canvas-confetti`).
- Dark-mode toggle (Tailwind v4 `class` strategy + shadcn `.dark` block).
- Onboarding SVG illustrations.

PR: `feat/c-stretch`.

---

## Decisions worth remembering

- shadcn 4.7 default style is **`base-nova`**, built on **`@base-ui/react`** (not Radix). Components import from `@base-ui/react/<primitive>`.
- Tailwind v4 is **CSS-first**. No `tailwind.config.ts`; Gemini tokens live in `@theme { --color-gemini-* }` inside `globals.css`. Generated utilities: `bg-gemini-blue|purple|pink|red|bg|card`, `text-gemini-*`, `border-gemini-*`, `bg-gemini-gradient`.
- **Fonts: system fonts only.** The team's build env can't reach `fonts.gstatic.com`, so `next/font/google` is out. `--font-sans` is `ui-sans-serif, system-ui, sans-serif` in `globals.css`. Don't reintroduce Inter via `next/font/google` (commit `54fff17` removed it).
- `next-themes` wraps the tree even though dark mode is off — the shadcn `Toaster` calls `useTheme()`, so the provider must exist.
- Use `pnpm dlx shadcn@latest` from `apps/frontend` (NOT `pnpm --filter ... dlx`).
- **Auth gate** lives in `app/(app)/layout.tsx`: when Supabase env vars are set, unauthenticated requests get redirected to `/?error=auth_required`. The gate is bypassed when env is missing so local dev / `?demo=1` still works. Anything new under `(app)` inherits this.
- **`/auth/callback` `next` allow-list**: only `/onboarding` and `/dashboard` are accepted. Add new safe destinations to the `ALLOWED_NEXT_PATHS` set in `route.ts` if needed.
- **Missing-table detection**: `isMissingProfilesTable()` in the callback handler matches Postgres code `42P01` or the `relation .* does not exist` error message — same pattern works for any table that may not be seeded yet.
- **Google OAuth scope** is narrowed to `calendar.events` only (was `calendar` + `calendar.events`). The "Aplicar al GCal" flow only writes events, so least privilege is the right call. If Persona A needs read access to the user's other calendars later, widen this in `LoginButton.tsx` and re-prompt.
- **`getSupabaseServer({ allowCookieWriteFailure: true })`** is the right call from Server Components (`app/(app)/layout.tsx` uses it). The default rethrows cookie-write errors so Route Handlers fail loudly.

## What this plan deliberately avoids

- No `tailwind.config.ts` (Tailwind v4 is CSS-first).
- No `react-hook-form`, SWR, React Query, Redux, Zustand — controlled `useState` / `useReducer` everywhere per the prompt.
- No new tests this round (hackathon).
- No edits to Persona A schema or Persona B Gemini code.
- No re-running `create-next-app` (would nuke the existing workspace).

---

## Verification (run after each phase)

```bash
pnpm install
pnpm --filter frontend typecheck
pnpm --filter frontend lint
pnpm --filter frontend dev
```

Then walk the phase-specific flow:

| Phase | Manual check |
| --- | --- |
| 1 | `/` shows Gemini-gradient + Inter; no console errors |
| 2 | Click CTA → Google consent → land on `/onboarding` or `/dashboard` |
| 3 | Complete the 3 steps → toast success → `/dashboard` reachable |
| 4 | Coach message + 3 priorities + calendar grid render with fixture data; "Aplicar" toasts success |
| 5 | `?demo=1` route works without any creds; mobile ≥375px doesn't break |

Between phases: commit on `feat/c-<slug>`, open PR into `dev`, review, merge, branch off `dev` again for the next phase.

---

## Useful one-liners

- Run dev: `pnpm dev:frontend`
- Typecheck + lint: `pnpm check:frontend`
- Add shadcn component: `cd apps/frontend && pnpm dlx shadcn@latest add <name>`
- Stack the next branch (foundation not yet merged): `git checkout feat/c-foundation && git checkout -b feat/c-landing-login`

## Open questions / risks

- Supabase project not yet provisioned (Persona A). Login flow can't be exercised E2E until it is.
- The `profiles` table won't exist until Persona A's schema lands. The callback handler must catch the "relation does not exist" error and default to `/onboarding`.
- `(app)` route group has no shared layout yet. Add one in Phase 3 (the dashboard navbar belongs there).
