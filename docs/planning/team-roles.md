# Team roles (suggested)

We are a 4-person beginner/intermediate team:

- 2 data science students
- 1 computer science student
- 1 mechatronics student

Roles are suggestions, not contracts — pair on what's hard, swap on what's stuck.

---

## Frontend / UI lead

Owns `apps/frontend/`. Builds and polishes:

- The prompt form and mode selector (`PromptForm.tsx`).
- The dynamic component renderers (`src/components/dynamic/*`).
- Visual polish — Tailwind v4, layout, demo-day clarity.

**Good fit.** The CS student or whichever DS student is most comfortable with TypeScript.

---

## Backend / API lead

Owns `apps/backend/`. Builds and polishes:

- The FastAPI routes and request/response schemas.
- Auth-free CORS for local + production frontends.
- Tests in `tests/`.
- Deployment to Render / Railway / Fly.

**Good fit.** The CS student or one DS student who wants to stretch into backend.

---

## Gemini / structured output lead

Owns `apps/backend/app/services/gemini_client.py` and `prompts/gemini-structured-output.md`. Builds:

- The system prompt and few-shot examples that get Gemini to emit our schema reliably.
- Function-calling integration once we know which tools we need.
- (Optional) multimodal — image input for robotics, screenshot interpretation, etc.

**Good fit.** Either DS student — this is the most ML-flavored work.

---

## Data / simulation / demo lead

Owns the *content* of the demo:

- The vertical / dataset / scenario.
- The exact 60-second demo flow.
- The simulation world model (if Direction 2).
- The mock data and demo prompts that always work on stage.

**Good fit.** The mechatronics student (especially for Direction 2), or the second DS student.

---

## Cross-cutting responsibilities

| Concern             | Owner                                |
| ------------------- | ------------------------------------ |
| Daily standup       | Rotates                              |
| README + docs       | Whoever lands a feature updates them |
| Demo-day pitch      | One designated speaker, everyone rehearses |
| `dev` → `main` PRs  | Two-person sign-off when possible    |
