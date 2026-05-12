# AI governance

TecCoach uses Gemini as a structured reasoning component, not as an autonomous
agent. The application owns authentication, data access, validation, scheduling
constraints, and calendar writes.

## Boundaries

- Gemini is called only from server-side Next.js code.
- The browser never receives the Gemini API key, Google OAuth secret, or
  Supabase service-role key.
- Prompts include only the planning context needed for the task: profile
  summary, active classes, upcoming Canvas deadlines, calendar conflicts, and
  Tec21 period metadata.
- OAuth tokens, raw credentials, and unrelated calendar details are not sent to
  Gemini.

## Structured outputs

TecCoach requests JSON responses with an explicit schema. The app validates the
returned object before saving it or rendering it:

- `mensaje`: short weekly coach message.
- `prioridades`: 1-4 academic priorities with an urgency level.
- `bloques_sugeridos`: 1-5 suggested study blocks with ISO timestamps.

Invalid model output is rejected and surfaced as a retryable error instead of
being stored.

## Human approval

Gemini never writes to Google Calendar. It only proposes study blocks.

The student reviews the suggested blocks, selects the ones they want, and then
explicitly confirms the write. Demo mode simulates this interaction without
calling Google Calendar.

## Abuse controls

- Real app usage can be restricted with `ALLOWED_USER_EMAILS` in production.
- Public visitors can use `?demo=1`, which hydrates the UI from fixtures and
  avoids external writes.
- Gemini-heavy endpoints have lightweight per-user throttles to reduce
  accidental quota drains.

## Prompting approach

The production prompt is kept close to the route that owns
`POST /api/insights/generate`. It encodes TecCoach-specific rules:

- prioritize Canvas deadlines over generic study advice;
- respect Google Calendar conflicts;
- account for Tec21 blocks and Semanas Tec;
- return concise, actionable Spanish output;
- never ask the model to perform final calendar writes.
