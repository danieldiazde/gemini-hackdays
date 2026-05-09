# Frontend (Next.js)

TecCoach app shell built with Next.js 15 App Router, TypeScript, and Tailwind CSS v4.

## Run

```bash
pnpm install   # from repo root, the workspace handles this
pnpm dev
```

App: <http://localhost:3000>

Backend behavior should be implemented with Next.js API routes. There is no separate FastAPI service.

## Layout

```text
src/
├── app/
│   ├── layout.tsx              root layout, fonts, metadata
│   ├── page.tsx                TecCoach app shell
│   └── globals.css             Tailwind v4 entry
```

Next implementation steps are defined in the repo README.
