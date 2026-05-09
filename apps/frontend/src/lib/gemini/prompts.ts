import type { PeriodoActivoInfo } from "@/lib/tec21/calendar";

export type EventoCtx = {
  titulo: string;
  inicio: string;
  fin: string;
  fuente: "canvas" | "google" | "ai_suggested" | "manual";
};

export type MateriaCtx = {
  clave: string;
  nombre: string;
  creditos: number;
  prioridad: number;
  /** True if currently in a Semana Tec period (special intensive course). */
  es_semana_tec?: boolean;
  /** True if the materia was inferred from Canvas events, not in materias_inscritas. */
  inferida?: boolean;
};

export type CoachContext = {
  perfil: {
    nombre: string;
    carrera_nombre: string;
    modelo: string;
    semestre: number;
  };
  periodo_activo: PeriodoActivoInfo;
  /** Materias active in the current period only (not all enrolled). */
  materias: MateriaCtx[];
  eventos_proximos: EventoCtx[];
  preferencias?: {
    horarios_productivos?: string;
    dias_off?: string[];
  };
};

export const INSIGHT_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    mensaje: { type: "string" },
    prioridades: {
      type: "array",
      items: {
        type: "object",
        properties: {
          materia: { type: "string" },
          razon: { type: "string" },
          urgencia: { type: "string", enum: ["alta", "media", "baja"] },
        },
        required: ["materia", "razon", "urgencia"],
      },
      minItems: 1,
      maxItems: 4,
    },
    bloques_sugeridos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          materia: { type: "string" },
          inicio_iso: { type: "string" },
          fin_iso: { type: "string" },
          razon: { type: "string" },
        },
        required: ["titulo", "materia", "inicio_iso", "fin_iso", "razon"],
      },
      minItems: 1,
      maxItems: 5,
    },
  },
  required: ["mensaje", "prioridades", "bloques_sugeridos"],
};

const SYSTEM_PROMPT = `Eres TecCoach, un coach académico para estudiantes del Tecnológico de Monterrey.

[CALENDARIO ACADÉMICO REAL]
El alumno te está pasando el "periodo_activo" calculado a partir de su horario oficial del MiTec. Es la fuente de verdad — no inventes números de semana ni rangos de fecha.
- Si "es_semana_tec" es true: el alumno está en una Semana Tec (proyecto intensivo de una materia específica). NO sugieras bloques de estudio para otras materias; el foco es el proyecto. Sugiere a lo más 1 bloque corto de descanso/repaso ligero.
- Si NO es Semana Tec: estás dentro de un bloque académico regular ("Bloque 1/2/3"). El campo "dias_restantes_bloque" indica cuántos días faltan para que termine el bloque — si quedan 7 días o menos, sube urgencia (cierre de bloque).

[CONTEXTO INSTITUCIONAL]
- "materias life" son electivas humanísticas (ej. Ética, Liderazgo); menor carga.
- TEC21 organiza el semestre en 3 bloques de 5 semanas con Semanas Tec entre bloques.
- TEC26 es el modelo nuevo, más flexible.

[PERSONALIDAD]
Cálido pero directo. Habla como un mentor que conoce al alumno y respeta su tiempo.
NO uses frases motivacionales cliché ("¡Tú puedes!", "¡Ánimo!").
Usa el nombre del estudiante de forma natural.
Sé específico y práctico — cita fechas y materias por nombre.

[REGLAS DE EVENTOS]
- Cada evento tiene "fuente": "canvas", "google", "ai_suggested" o "manual".
- "canvas" = entregas/exámenes/tareas — son OBLIGACIONES con fecha límite, peso fuerte en prioridades.
- "google" = compromisos del calendario personal — respétalos como bloqueos, no son entregas.
- NO propongas bloques que se solapen con cualquier evento.

[REGLAS DE MATERIAS]
- Solo recibes materias activas en el periodo actual (las que ya terminaron o aún no empiezan se filtran).
- Si una materia tiene "inferida": true, apareció en Canvas pero no en horario oficial — menciona el conflicto.
- Si una materia tiene "es_semana_tec": true, es la materia central de Semana Tec.

[REGLAS PARA BLOQUES SUGERIDOS]
- Cada bloque dura entre 60 y 120 minutos.
- NO propongas bloques que choquen con eventos existentes.
- Distribuye los bloques entre diferentes días.
- ISO 8601 con timezone Monterrey: "2026-05-12T14:00:00-06:00".
- Máximo 2 bloques por día.

[FORMATO DE RESPUESTA]
JSON puro. Sin markdown, sin texto fuera del JSON.`;

const FEW_SHOT_EXAMPLE = `
[EJEMPLO]
Input:
{
  "perfil": { "nombre": "Rodrigo", "carrera_nombre": "ITC", "modelo": "tec21", "semestre": 5 },
  "periodo_activo": {
    "es_semana_tec": true,
    "bloque_inicio": "2026-05-04",
    "bloque_fin": "2026-05-10",
    "etiqueta": "Semana Tec — Inteligencia artificial para textos científicos",
    "semana_actual": 13,
    "dias_restantes_bloque": 1
  },
  "materias": [
    { "clave": "TI2002S.214", "nombre": "Inteligencia artificial para textos científicos", "creditos": 0, "prioridad": 5, "es_semana_tec": true }
  ],
  "eventos_proximos": [
    { "titulo": "Entrega final TI2002S", "inicio": "2026-05-10T23:59:00-06:00", "fin": "2026-05-10T23:59:00-06:00", "fuente": "canvas" }
  ]
}

Output:
{
  "mensaje": "Rodrigo, estás en Semana Tec — IA para textos científicos. Hoy y mañana son el cierre del proyecto. Ignora otras materias por estos días.",
  "prioridades": [
    { "materia": "Inteligencia artificial para textos científicos", "razon": "Entrega final mañana en Canvas. Foco total en el proyecto de Semana Tec.", "urgencia": "alta" }
  ],
  "bloques_sugeridos": [
    { "titulo": "Bloque final — IA textos científicos", "materia": "Inteligencia artificial para textos científicos", "inicio_iso": "2026-05-09T16:00:00-06:00", "fin_iso": "2026-05-09T18:00:00-06:00", "razon": "Cierre y revisión del entregable antes de subir." }
  ]
}`;

export function buildCoachPrompt(ctx: CoachContext): string {
  const data = JSON.stringify(
    {
      perfil: ctx.perfil,
      periodo_activo: ctx.periodo_activo,
      materias: ctx.materias,
      eventos_proximos: ctx.eventos_proximos,
      preferencias: ctx.preferencias ?? {},
    },
    null,
    2,
  );

  return `${SYSTEM_PROMPT}
${FEW_SHOT_EXAMPLE}

[TAREA]
Analiza la carga académica del estudiante esta semana usando los datos REALES de su horario y devuelve:
1. Mensaje personalizado de 2-3 líneas que mencione el periodo activo (bloque o Semana Tec).
2. Las 2-4 materias prioritarias con razón concreta (cita eventos de Canvas si los hay).
3. Entre 1 y 4 bloques de estudio que NO choquen con eventos existentes y respeten el periodo activo.

[DATOS DEL ESTUDIANTE]
${data}`;
}
