# Agent Instructions

Use [`AGENTS.md`](AGENTS.md) as the canonical agent instruction file for this repository.

Current critical decisions:

- `README.md` is correct and is the product source of truth.
- TecCoach is the selected product.
- FastAPI and the old generic Gemini scaffold have been removed.
- New backend behavior belongs in Next.js API routes.
- `main` is protected but not locked; changes should go through PRs with passing `Frontend CI`.
