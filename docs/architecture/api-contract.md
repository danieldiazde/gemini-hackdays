# API contract

The source of truth is `PROJECT.md`. This file mirrors the active TecCoach API surface for architecture reference.

All endpoints are implemented as Next.js API routes. There is no separate FastAPI service.

---

## Data endpoints

### `POST /api/canvas/sync`

Syncs assignments/deadlines from a student-provided Canvas iCal URL into Supabase.

Request:

```ts
{ icalUrl: string }
```

Response:

```ts
{ success: true; eventsAdded: number }
```

### `POST /api/calendar/sync`

Reads the next 14 days from the authenticated student's primary Google Calendar and stores normalized events.

Request: empty body, uses session.

Response:

```ts
{ success: true; eventsAdded: number }
```

### `POST /api/calendar/create`

Writes student-approved study blocks to Google Calendar.

Request:

```ts
{
  events: Array<{
    titulo: string;
    descripcion?: string;
    inicio: string;
    fin: string;
  }>;
}
```

Response:

```ts
{ success: true; created: number; ids: string[] }
```

### `GET /api/planes/:carreraClave`

Returns seeded Tec study-plan data.

Response:

```ts
{
  carreraClave: string;
  nombre: string;
  data: {
    semestres: Array<{
      numero: number;
      materias: Array<{
        clave: string;
        nombre: string;
        creditos: number;
        tipo: "regular" | "life" | "semana_tec";
      }>;
    }>;
  };
}
```

---

## AI endpoints

### `POST /api/insights/generate`

Generates or refreshes weekly study insights using Gemini structured output.

Request:

```ts
{ forceRefresh?: boolean }
```

Response:

```ts
{
  semana_iso: string;
  contenido: {
    mensaje: string;
    prioridades: Array<{
      materia: string;
      razon: string;
      urgencia: "alta" | "media" | "baja";
    }>;
    bloques_sugeridos: Array<{
      titulo: string;
      materia: string;
      inicio_iso: string;
      fin_iso: string;
      razon: string;
    }>;
  };
}
```

### `GET /api/insights/current`

Returns the current week's cached insight, or `null`.

Response:

```ts
{ insight: Insight | null }
```

---

## Profile endpoint

### `POST /api/profile/setup`

Creates or updates the student's TecCoach onboarding profile.

Request:

```ts
{
  matricula: string;
  nombre: string;
  carreraClave: string;
  modelo: "tec21" | "clasico";
  semestre: number;
  materias: Array<{
    clave: string;
    nombre: string;
    creditos: number;
  }>;
  canvasIcalUrl?: string;
}
```

Response:

```ts
{ success: true }
```
