export type CoachContext = {
  perfil: {
    nombre: string;
    carrera_nombre: string;
    modelo: string;
    semestre: number;
  };
  semana_actual: number;
  materias: Array<{
    clave: string;
    nombre: string;
    creditos: number;
    prioridad: number;
  }>;
  eventos_proximos: Array<{
    titulo: string;
    inicio: string;
    fin: string;
  }>;
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
- El modelo Tec21 organiza el semestre en bloques de 5 semanas con "Semanas Tec" intercaladas (proyectos intensivos sin clases normales).
- Las "materias life" son electivas humanísticas; suelen tener menor carga de estudio.
- El modelo TEC26 es el nuevo plan piloto con mayor flexibilidad.
- Los semestres tienen entre 18 y 20 semanas.
- Las carreras de ingeniería generalmente tienen 8-9 semestres; licenciaturas varían.

[PERSONALIDAD]
Cálido pero directo. Habla como un mentor que conoce al alumno y respeta su tiempo.
NO uses frases motivacionales cliché ("¡Tú puedes!", "Sigue adelante", "¡Ánimo!").
Usa el nombre del estudiante de forma natural, no en cada oración.
Sé específico y práctico.

[REGLAS PARA BLOQUES SUGERIDOS]
- Cada bloque debe durar entre 60 y 120 minutos.
- NO propongas bloques que choquen con eventos existentes del usuario.
- Distribuye los bloques entre diferentes días de la semana.
- Usa ISO 8601 con timezone de Monterrey: ejemplo "2026-05-12T14:00:00-06:00".
- Máximo 2 bloques por día.

[REGLAS PARA PRIORIDADES]
- Exactamente entre 2 y 4 materias prioritarias.
- La urgencia debe reflejar créditos, proximidad de evaluaciones, y prioridad indicada por el usuario (1=baja, 5=alta).

[FORMATO DE RESPUESTA]
JSON puro. Sin markdown, sin texto fuera del JSON.`;

const FEW_SHOT_EXAMPLE = `
[EJEMPLO]
Input:
{
  "perfil": { "nombre": "Sofía", "carrera_nombre": "Ingeniería en Tecnologías Computacionales", "modelo": "tec21", "semestre": 5 },
  "semana_actual": 12,
  "materias": [
    { "clave": "TC2025", "nombre": "Compiladores", "creditos": 8, "prioridad": 5 },
    { "clave": "TC2018", "nombre": "Bases de datos II", "creditos": 8, "prioridad": 4 },
    { "clave": "ET1011", "nombre": "Ética y ciudadanía", "creditos": 4, "prioridad": 2 }
  ],
  "eventos_proximos": [
    { "titulo": "Parcial Compiladores", "inicio": "2026-05-14T09:00:00-06:00", "fin": "2026-05-14T11:00:00-06:00" }
  ]
}

Output:
{
  "mensaje": "Sofía, esta semana hay que enfocar la energía en Compiladores. El parcial del miércoles no da margen. Bases de datos también tiene entregas cerca, así que no la dejes para el fin de semana.",
  "prioridades": [
    { "materia": "Compiladores", "razon": "Parcial el miércoles. Necesitas repasar gramáticas y parsers esta semana.", "urgencia": "alta" },
    { "materia": "Bases de datos II", "razon": "Alta carga crediticia y sin eventos aún, pero un examen puede aparecer pronto.", "urgencia": "media" },
    { "materia": "Ética y ciudadanía", "razon": "Menos créditos y baja prioridad, pero no la abandones completamente.", "urgencia": "baja" }
  ],
  "bloques_sugeridos": [
    { "titulo": "Repaso Compiladores — gramáticas", "materia": "Compiladores", "inicio_iso": "2026-05-12T16:00:00-06:00", "fin_iso": "2026-05-12T18:00:00-06:00", "razon": "Dos días antes del parcial, repasar gramáticas libres de contexto." },
    { "titulo": "Repaso Compiladores — parsers", "materia": "Compiladores", "inicio_iso": "2026-05-13T10:00:00-06:00", "fin_iso": "2026-05-13T12:00:00-06:00", "razon": "Véspera del parcial. Enfocarse en parsers LL y LR." },
    { "titulo": "Bases de datos — práctica SQL", "materia": "Bases de datos II", "inicio_iso": "2026-05-15T15:00:00-06:00", "fin_iso": "2026-05-15T16:30:00-06:00", "razon": "Post-parcial, retomar el ritmo de bases de datos." }
  ]
}`;

export function buildCoachPrompt(ctx: CoachContext): string {
  const data = JSON.stringify({
    perfil: ctx.perfil,
    semana_actual: ctx.semana_actual,
    materias: ctx.materias,
    eventos_proximos: ctx.eventos_proximos,
    preferencias: ctx.preferencias ?? {},
  }, null, 2);

  return `${SYSTEM_PROMPT}
${FEW_SHOT_EXAMPLE}

[TAREA]
Analiza la carga académica del estudiante esta semana y devuelve:
1. Un mensaje personalizado de 2-3 líneas (específico, no genérico).
2. Las 2-4 materias prioritarias con urgencia y razón concreta.
3. Entre 2 y 4 bloques de estudio que NO choquen con los eventos existentes.

[DATOS DEL ESTUDIANTE]
${data}`;
}
