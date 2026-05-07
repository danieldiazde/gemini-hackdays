# Frontend (Next.js)

Next.js 15 (App Router) + TypeScript + Tailwind CSS v4.

## Run

```bash
pnpm install   # from repo root, the workspace handles this
pnpm dev
```

App: <http://localhost:3000>

The frontend talks to the backend via `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). The Gemini API key never reaches the browser.

## Layout

```text
src/
├── app/
│   ├── layout.tsx              root layout, fonts, metadata
│   ├── page.tsx                home page (prompt form + response)
│   └── globals.css             Tailwind v4 entry
├── components/
│   ├── PromptForm.tsx          textarea + mode selector + submit
│   ├── ResponseDisplay.tsx     summary + components + actions + JSON
│   ├── JsonViewer.tsx          collapsible raw-JSON view
│   └── dynamic/                one renderer per ComponentType
│       ├── CardRenderer.tsx
│       ├── ChartRenderer.tsx
│       ├── TableRenderer.tsx
│       ├── TimelineRenderer.tsx
│       └── SimulationPanelRenderer.tsx
├── lib/
│   └── api.ts                  fetch wrapper for /api/interpret
└── types/
    └── interpret.ts            mirrors apps/backend/app/schemas/interpret.py
```
