# Codex / AI review workflow

A short playbook for using Codex, ChatGPT, or Claude as a *reviewer* — not as the author — on this repo.

---

## Why review with AI

Hackathon reviews are uneven: tired humans miss things. AI reviewers are great for the boring layer:

- Type errors hidden by `as any` / `# type: ignore`.
- Forgotten error handling at API boundaries.
- Off-by-one bugs in renderers.
- Insecure patterns (CORS wildcards, raw HTML rendering, key leaks).
- Drift between the Pydantic schema and the TS types.

They are *not* a replacement for human review of:

- Product fit.
- Demo storytelling.
- Architectural decisions.

---

## Suggested PR review prompt

> You are reviewing a pull request for a hackathon project that uses FastAPI + Next.js + Gemini.
>
> Focus on:
>
> 1. Does the diff break the contract in `apps/backend/app/schemas/interpret.py` and `apps/frontend/src/types/interpret.ts`? They must stay in sync.
> 2. Are there any places where `GEMINI_API_KEY` could leak to the browser? (Anything in `NEXT_PUBLIC_*`, anything fetched directly from the frontend to Gemini.)
> 3. Did the diff add a new component type without updating the mock in `app/services/mock_data.py`?
> 4. Are the renderers in `apps/frontend/src/components/dynamic/` defensive against missing fields?
> 5. Are there `any` types or unchecked casts that hide real bugs?
> 6. Are there obvious performance footguns (N+1 fetches, unbounded loops, sync calls inside async handlers)?
>
> Be terse. Cite file paths and line numbers. If everything looks fine, say so.

Paste the unified diff after the prompt.

---

## What the reviewer should ignore

- Style noise that ruff / eslint already enforce.
- Suggestions to "add more tests" without a specific failing case to add.
- Suggestions to add `try/except` for things that can't fail.
- Suggestions to add comments explaining what the code already says.

---

## When the reviewer disagrees with you

The author is the tiebreaker. If the AI flags something and you've thought about it and disagree, write a one-line reason in the PR, not a defense-of-thesis. Move on.
