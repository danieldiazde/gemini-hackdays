# Agent workflow prompts

Use these prompts when asking a coding agent to work on TecCoach.

## Add a Next.js API route

```text
Implement the TecCoach route `<route>` from PROJECT.md as a Next.js API route.
Keep secrets server-side, validate request bodies, scope Supabase data to the
authenticated user, and update docs if the contract changes.
```

## Add Gemini structured output

```text
Implement Gemini structured output for `/api/insights/generate`.
Use the schema from PROJECT.md, validate the model response before saving,
cache by `user_id` and `semana_iso`, and keep Google Calendar writes out of
the Gemini route.
```

## Add dashboard UI

```text
Build the TecCoach dashboard view. It should show the coach message,
priorities, suggested study blocks, and an explicit apply button that writes
approved blocks to Google Calendar through `/api/calendar/create`.
```
