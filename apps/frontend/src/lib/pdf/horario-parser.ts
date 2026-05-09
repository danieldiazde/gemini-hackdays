import { getGeminiClient, FLASH_MODEL } from "@/lib/gemini/client";

export type HorarioPeriodo = {
  /** ISO date YYYY-MM-DD */
  inicio: string;
  /** ISO date YYYY-MM-DD */
  fin: string;
  /** e.g. "Lu-Ju", "Ma-Vi", null if no schedule */
  dias: string | null;
  /** "HH:MM" 24h or null */
  hora_inicio: string | null;
  hora_fin: string | null;
  /** "Edificio CIAP / Salón 517" or similar */
  ubicacion: string | null;
  /** True if attributes mention "Semana Tec". */
  es_semana_tec: boolean;
};

export type HorarioMateria = {
  /** Just the alphanumeric clave, e.g. "TC2037" (the part before the dot). */
  clave: string;
  /** Full clave including section, e.g. "TC2037.602". */
  clave_completa: string;
  nombre: string;
  crn: string;
  periodos: HorarioPeriodo[];
};

export type HorarioParsed = {
  alumno_nombre: string | null;
  matricula: string | null;
  periodo_nombre: string | null;
  /** Earliest periodo inicio across all materias. */
  periodo_inicio: string | null;
  /** Latest periodo fin across all materias. */
  periodo_fin: string | null;
  materias: HorarioMateria[];
};

const HORARIO_SCHEMA = {
  type: "object",
  properties: {
    alumno_nombre: { type: "string", nullable: true },
    matricula: { type: "string", nullable: true },
    periodo_nombre: { type: "string", nullable: true },
    materias: {
      type: "array",
      items: {
        type: "object",
        properties: {
          clave: { type: "string" },
          clave_completa: { type: "string" },
          nombre: { type: "string" },
          crn: { type: "string" },
          periodos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                inicio: { type: "string" },
                fin: { type: "string" },
                dias: { type: "string", nullable: true },
                hora_inicio: { type: "string", nullable: true },
                hora_fin: { type: "string", nullable: true },
                ubicacion: { type: "string", nullable: true },
                es_semana_tec: { type: "boolean" },
              },
              required: [
                "inicio",
                "fin",
                "dias",
                "hora_inicio",
                "hora_fin",
                "ubicacion",
                "es_semana_tec",
              ],
            },
          },
        },
        required: ["clave", "clave_completa", "nombre", "crn", "periodos"],
      },
    },
  },
  required: ["alumno_nombre", "matricula", "periodo_nombre", "materias"],
};

const SYSTEM_PROMPT = `Vas a recibir un PDF del MiTec (Tec de Monterrey) con el horario académico de un estudiante.

Extrae:
- Nombre completo del alumno y matrícula (formato A0XXXXXXX).
- Nombre del periodo (e.g. "Semestral Ene - Jun de 2026").
- Cada materia única (deduplicada por clave + CRN).
- Para cada materia, todos sus periodos de fechas con horario.

REGLAS:
- "clave" es solo la parte alfanumérica antes del punto, ej. "TC2037" para "TC2037.602".
- "clave_completa" incluye todo, ej. "TC2037.602".
- "nombre" es el título completo de la materia.
- "crn" es el número CRN tal cual aparece.
- Las fechas deben estar en formato ISO YYYY-MM-DD.
- Los días vienen como "Lu-Ju", "Ma-Vi", "Lu-Mi-Ju", etc. Si dice "No Aplica" pon null.
- Los horarios deben estar en formato HH:MM 24h. Si "No Aplica" pon null.
- "ubicacion" combina edificio + salón, ej. "Edificio CIAP / Salón 517". Si "No Aplica" pon null.
- "es_semana_tec" = true SOLO si los atributos del curso mencionan "Semana Tec".
- Si una materia aparece varias veces con diferentes rangos de fechas (porque corre en múltiples periodos del semestre), agrúpala como UNA sola materia con un array de "periodos".
- Ignora la sección "Actividades Formativas" si dice "Curso Sin Crédito Académico"; sí incluye las que tienen créditos.

Devuelve JSON puro siguiendo el schema. Sin texto fuera del JSON.`;

export async function parseHorarioPdf(pdfBytes: Uint8Array): Promise<HorarioParsed> {
  const client = getGeminiClient();

  const base64 = Buffer.from(pdfBytes).toString("base64");

  const response = await client.models.generateContent({
    model: FLASH_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: HORARIO_SCHEMA,
      temperature: 0.1,
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const parsed = JSON.parse(text) as Omit<HorarioParsed, "periodo_inicio" | "periodo_fin">;

  // Compute overall semester start and end from materia periods.
  const allInicios = parsed.materias.flatMap((m) => m.periodos.map((p) => p.inicio));
  const allFines = parsed.materias.flatMap((m) => m.periodos.map((p) => p.fin));
  const periodo_inicio = allInicios.length ? allInicios.sort()[0] : null;
  const periodo_fin = allFines.length ? allFines.sort().at(-1) ?? null : null;

  return { ...parsed, periodo_inicio, periodo_fin };
}
