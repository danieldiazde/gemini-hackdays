# Demo script

The demo follows the TecCoach flow from the repo README.

## Opening

TecCoach is an academic coach for Tec students. It connects calendar context, Canvas deadlines, and Tec21 study-plan context so Gemini can recommend what to study this week and schedule approved study blocks.

## Flow

1. Open TecCoach.
2. Click "Iniciar sesión con Google".
3. Complete onboarding (3 steps):
   - Step 1: nombre + matricula
   - Step 2: carrera + modelo (TEC21/TEC26) + semestre
   - Step 3: upload official MiTec schedule PDF + optional Canvas iCal URL
   - The PDF is parsed by Gemini multimodal to extract materias, periodos, CRNs and Semana Tec flags — no manual class selection.
4. Dashboard auto-syncs Google Calendar + Canvas iCal, then auto-generates the weekly insight. Show:
   - coach message (mentions current Tec21 block or Semana Tec)
   - prioridades (2-4 with urgency)
   - bloques sugeridos in the weekly grid (real Google + Canvas events appear underneath in gray)
5. Click "Aplicar X bloques".
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
