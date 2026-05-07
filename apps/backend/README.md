# Backend (FastAPI)

FastAPI service that exposes a single Gemini-powered endpoint, `POST /api/interpret`.

## Run

```bash
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

- API: <http://localhost:8000>
- Health: <http://localhost:8000/health>
- Swagger UI: <http://localhost:8000/docs>

## Mock mode

If `GEMINI_API_KEY` is unset, the service returns a clearly-labeled mock response that exercises every component type. This keeps the frontend renderable on day one and lets CI run without a real key.

## Layout

```text
app/
├── main.py                  FastAPI app, CORS, route registration
├── api/routes.py            /health and /api/interpret
├── core/config.py           pydantic-settings env loader
├── schemas/interpret.py     request/response Pydantic models
└── services/
    ├── gemini_client.py     thin wrapper around google-genai
    └── mock_data.py         rich mock response for local dev
tests/
├── test_health.py
└── test_interpret.py        runs in mock mode
```
