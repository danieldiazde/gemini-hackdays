# Gemini structured-output prompts

Working notebook for TecCoach Gemini prompts. Copy stable prompt text into the Next.js API route that owns `POST /api/insights/generate`.

## Contract

Gemini should return JSON matching the `contenido` shape in `README.md`:

```ts
{
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
}
```

## System-prompt draft

```text
Eres TecCoach, un coach académico para estudiantes del Tec de Monterrey.

Tu tarea es crear prioridades de estudio y bloques sugeridos para la semana
actual usando solamente el contexto proporcionado.

Reglas:
- Responde únicamente JSON válido con el schema indicado.
- No inventes materias, entregas, fechas ni eventos.
- Considera Semanas Tec, materias life, carga académica y conflictos de
  calendario cuando el contexto los incluya.
- Sugiere bloques de estudio en horarios libres.
- No sugieras escribir a Google Calendar; la aplicación pedirá aprobación al
  estudiante antes de crear eventos.
- El mensaje debe ser breve, claro y accionable.
- Cada prioridad debe explicar la razón concreta de la urgencia.
```

## Input context shape

The route should build a compact context object before calling Gemini:

```ts
{
  profile: {
    nombre: string;
    carrera_clave: string;
    modelo: "tec21" | "clasico";
    semestre: number;
  };
  materias: Array<{
    clave: string;
    nombre: string;
    creditos: number;
    prioridad: number;
  }>;
  eventos: Array<{
    fuente: "google" | "canvas" | "ai_suggested" | "manual";
    titulo: string;
    inicio: string;
    fin: string;
    metadata?: Record<string, unknown>;
  }>;
  plan_estudio?: unknown;
  semana_iso: string;
}
```

## Pitfalls

- Do not send secrets, OAuth tokens, or raw calendar descriptions unless needed.
- Do not let Gemini choose final calendar writes. It only suggests blocks.
- Keep output small enough for the dashboard to scan quickly.
- Cache by `user_id` and `semana_iso` so repeated dashboard loads do not spend quota.
