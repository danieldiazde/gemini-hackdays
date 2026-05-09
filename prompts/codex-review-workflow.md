# Codex review workflow

Use this when reviewing TecCoach pull requests.

## Review focus

- Does the change follow `PROJECT.md` as the source of truth?
- Are new backend behaviors implemented as Next.js API routes?
- Are Gemini, Supabase service-role, and Google OAuth secrets kept server-side?
- Are Supabase RLS expectations preserved for user-owned data?
- Do API request and response shapes match `PROJECT.md` and `docs/architecture/api-contract.md`?
- Does the UI preserve the approval step before writing suggested blocks to Google Calendar?
- Are fallback fixtures or demo data clearly separated from real user data?

## Suggested prompt

```text
You are reviewing a TecCoach PR.

Prioritize bugs, security issues, privacy leaks, contract drift, and demo-breaking behavior.

Check:
1. New server behavior belongs in Next.js API routes.
2. No secret is exposed through NEXT_PUBLIC_*.
3. Supabase reads/writes are scoped to the authenticated user.
4. Calendar writes require explicit user approval.
5. Gemini output is structured and validated before use.
6. Docs and AGENTS.md are updated when architecture or product direction changes.
```
