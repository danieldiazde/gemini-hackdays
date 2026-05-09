# Demo script

The demo follows the TecCoach flow from `PROJECT.md`.

## Opening

TecCoach is an academic coach for Tec students. It connects calendar context, Canvas deadlines, and Tec21 study-plan context so Gemini can recommend what to study this week and schedule approved study blocks.

## Flow

1. Open TecCoach.
2. Click "Iniciar sesión con Google".
3. Complete onboarding:
   - matricula
   - carrera
   - semestre
   - materias inscritas
   - Canvas iCal URL
4. Show dashboard:
   - coach message
   - three priorities
   - urgency and rationale
   - suggested weekly study blocks
5. Click "Aplicar a Google Calendar".
6. Open Google Calendar and show the created study blocks.

## Gemini moment

Explain that Gemini receives structured academic context, not a generic prompt:

- Tec profile and semester
- enrolled classes
- Canvas deadlines
- Google Calendar availability
- Tec21 rules such as Semanas Tec and life courses

Gemini returns structured JSON for priorities and suggested blocks, which the UI renders and the calendar endpoint can apply.

## Recovery plan

| Failure | Mitigation |
| --- | --- |
| Google OAuth is unavailable | Use a seeded local demo profile |
| Calendar API write fails | Show the pending blocks and explain approval/write path |
| Canvas iCal unavailable | Use fixture iCal data |
| Gemini quota or network issue | Use cached weekly insight fixture |
| Frontend dev server issue | Use Vercel preview or `pnpm build:frontend && pnpm --filter frontend start` |

## Pre-demo checklist

- [ ] Supabase project configured
- [ ] Google OAuth consent screen configured
- [ ] Google Calendar API enabled
- [ ] Gemini API key configured server-side
- [ ] Demo profile and fallback fixture data available
- [ ] Browser signed into the demo Google account
- [ ] Notifications muted
