import type { Tec21WeekInfo } from "@/lib/tec21/calendar";

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
  calendario_tec21: Tec21WeekInfo;
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

[CONTEXTO INSTITUCIONAL]
- El modelo Tec21 organiza el semestre en 3 bloques de 5 semanas cada uno, con una "Semana Tec" (proyectos intensivos) entre bloques.
  Patrón: Bloque 1 (5 semanas) → Semana Tec → Bloque 2 (5 semanas) → Semana Tec → Bloque 3 (5 semanas) → Finales.
- En Semana Tec las clases regulares se suspenden. NO sugieras bloques de estudio normales en Semana Tec; sugiere trabajo de proyecto si aplica.
- El final de cada bloque (semanas 4 y 5) suele tener exámenes y entregas — sube la urgencia.
- Las "materias life" son electivas humanísticas; suelen tener menor carga.
- TEC26 es el nuevo plan piloto con mayor flexibilidad.

[PERSONALIDAD]
Cálido pero directo. Habla como un mentor que conoce al alumno y respeta su tiempo.
NO uses frases motivacionales cliché ("¡Tú puedes!", "Sigue adelante", "¡Ánimo!").
Usa el nombre del estudiante de forma natural, no en cada oración.
Sé específico y práctico.

[REGLAS DE EVENTOS]
- Cada evento tiene una "fuente": "canvas", "google", "ai_suggested" o "manual".
- Eventos con fuente="canvas" son entregas/exámenes/tareas de Canvas — son OBLIGACIONES con fecha límite y deben pesar fuerte en las prioridades.
- Eventos con fuente="google" son compromisos del calendario personal — respétalos como bloqueos de tiempo, no son entregas.
- Trata cada evento como bloqueo: NO propongas bloques de estudio que se solapen.

[REGLAS DE MATERIAS]
- Algunas materias pueden venir marcadas como "inferida": true. Significa que aparecieron en eventos de Canvas pero el alumno no las metió en su perfil. Inclúyelas como prioridad si tienen entregas próximas, y menciona en la razón que detectaste el conflicto.

[REGLAS PARA BLOQUES SUGERIDOS]
- Cada bloque debe durar entre 60 y 120 minutos.
- NO propongas bloques que choquen con eventos existentes (de cualquier fuente).
- Distribuye los bloques entre diferentes días de la semana.
- Usa ISO 8601 con timezone de Monterrey: ejemplo "2026-05-12T14:00:00-06:00".
- Máximo 2 bloques por día.
- Si la semana actual es Semana Tec, sugiere máximo 1-2 bloques cortos para asuntos pendientes; el foco es el proyecto.

[REGLAS PARA PRIORIDADES]
- Exactamente entre 2 y 4 materias prioritarias.
- Urgencia "alta" si tiene evento de Canvas en los próximos 3 días, o si estamos al final de un bloque (semanas 4-5).
- Urgencia "media" si tiene entrega esta semana pero no urgente, o créditos altos sin evento próximo.
- Urgencia "baja" si baja prioridad declarada por el alumno y sin entregas próximas.

[FORMATO DE RESPUESTA]
JSON puro. Sin markdown, sin texto fuera del JSON.`;

const FEW_SHOT_EXAMPLE = `
[EJEMPLO]
Input:
{
  "perfil": { "nombre": "Sofía", "carrera_nombre": "Ingeniería en Tecnologías Computacionales", "modelo": "tec21", "semestre": 5 },
  "calendario_tec21": { "semestre_inicio": "2026-02-09", "semana_actual": 11, "bloque_actual": 2, "semana_en_bloque": 5, "es_semana_tec": false, "etiqueta": "Bloque 2 — semana 5 de 5" },
  "materias": [
    { "clave": "TC2025", "nombre": "Compiladores", "creditos": 8, "prioridad": 5 },
    { "clave": "TC2018", "nombre": "Bases de datos II", "creditos": 8, "prioridad": 4 },
    { "clave": "ET1011", "nombre": "Ética y ciudadanía", "creditos": 4, "prioridad": 2 }
  ],
  "eventos_proximos": [
    { "titulo": "TC2025 Parcial Compiladores", "inicio": "2026-05-14T09:00:00-06:00", "fin": "2026-05-14T11:00:00-06:00", "fuente": "canvas" },
    { "titulo": "Comida con familia", "inicio": "2026-05-15T14:00:00-06:00", "fin": "2026-05-15T16:00:00-06:00", "fuente": "google" }
  ]
}

Output:
{
  "mensaje": "Sofía, estás en la semana 5 del Bloque 2 — última semana antes de la Semana Tec. Compiladores tiene parcial el miércoles según Canvas, prioridad total esta semana. Bases de datos puede esperar al siguiente bloque.",
  "prioridades": [
    { "materia": "Compiladores", "razon": "Parcial confirmado en Canvas el miércoles 14 de mayo. Última semana del bloque, repasa gramáticas y parsers.", "urgencia": "alta" },
    { "materia": "Bases de datos II", "razon": "Alta carga crediticia. Sin entregas inmediatas pero conviene avanzar antes de Semana Tec.", "urgencia": "media" },
    { "materia": "Ética y ciudadanía", "razon": "Baja prioridad declarada y sin eventos próximos.", "urgencia": "baja" }
  ],
  "bloques_sugeridos": [
    { "titulo": "Repaso Compiladores — gramáticas", "materia": "Compiladores", "inicio_iso": "2026-05-12T16:00:00-06:00", "fin_iso": "2026-05-12T18:00:00-06:00", "razon": "Dos días antes del parcial, gramáticas libres de contexto." },
    { "titulo": "Repaso Compiladores — parsers", "materia": "Compiladores", "inicio_iso": "2026-05-13T10:00:00-06:00", "fin_iso": "2026-05-13T12:00:00-06:00", "razon": "Víspera del parcial. Parsers LL y LR." },
    { "titulo": "Bases de datos — práctica SQL", "materia": "Bases de datos II", "inicio_iso": "2026-05-15T17:00:00-06:00", "fin_iso": "2026-05-15T18:30:00-06:00", "razon": "Después de la comida familiar, retomar BD." }
  ]
}`;

export function buildCoachPrompt(ctx: CoachContext): string {
  const data = JSON.stringify(
    {
      perfil: ctx.perfil,
      calendario_tec21: ctx.calendario_tec21,
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
Analiza la carga académica del estudiante esta semana y devuelve:
1. Un mensaje personalizado de 2-3 líneas (específico, no genérico, mencionando bloque/Semana Tec si aplica).
2. Las 2-4 materias prioritarias con urgencia y razón concreta (cita eventos de Canvas si los hay).
3. Entre 2 y 4 bloques de estudio que NO choquen con los eventos existentes.

[DATOS DEL ESTUDIANTE]
${data}`;
}
