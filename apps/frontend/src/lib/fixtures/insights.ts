import { addDays, format, getISOWeek, getYear, startOfISOWeek } from "date-fns";

import type { Insight } from "@/lib/types/insights";

function iso(monday: Date, dayOffset: number, hour: number, minute: number): string {
  const d = addDays(monday, dayOffset);
  d.setHours(hour, minute, 0, 0);
  return `${format(d, "yyyy-MM-dd'T'HH:mm:ss")}-06:00`;
}

/**
 * Generate a demo insight for the ISO week containing `reference`. Built
 * dynamically so `?demo=1` works in any calendar year — pinning dates to
 * a specific 2026 week made the demo break the moment we crossed into a
 * new week.
 */
export function buildInsightFixture(reference: Date = new Date()): Insight {
  const monday = startOfISOWeek(reference);
  const semana_iso = `${getYear(reference)}-W${String(getISOWeek(reference)).padStart(2, "0")}`;
  return {
    semana_iso,
    contenido: {
      mensaje:
        "Andrés, esta semana tienes el examen parcial de Compiladores el viernes y dos entregas en Bases de Datos. Tu jueves está libre — buen momento para repasar antes del parcial.",
      prioridades: [
        {
          materia: "Compiladores",
          razon: "Examen parcial el viernes",
          urgencia: "alta",
        },
        {
          materia: "Bases de datos II",
          razon: "Entrega del proyecto el miércoles",
          urgencia: "media",
        },
        {
          materia: "Ética y ciudadanía",
          razon: "Lectura corta antes del jueves",
          urgencia: "baja",
        },
      ],
      bloques_sugeridos: [
        {
          titulo: "Repaso Compiladores: análisis sintáctico",
          materia: "Compiladores",
          inicio_iso: iso(monday, 1, 16, 0),
          fin_iso: iso(monday, 1, 18, 0),
          razon: "Tu horario productivo de tarde, antes del examen del viernes.",
        },
        {
          titulo: "Avanzar entrega de BD II",
          materia: "Bases de datos II",
          inicio_iso: iso(monday, 2, 10, 0),
          fin_iso: iso(monday, 2, 12, 0),
          razon: "Mañana del miércoles, justo antes de la entrega.",
        },
        {
          titulo: "Repaso integral de Compiladores",
          materia: "Compiladores",
          inicio_iso: iso(monday, 3, 15, 0),
          fin_iso: iso(monday, 3, 18, 0),
          razon: "Jueves libre — bloque largo para cerrar dudas del parcial.",
        },
        {
          titulo: "Lectura de Ética",
          materia: "Ética y ciudadanía",
          inicio_iso: iso(monday, 2, 19, 0),
          fin_iso: iso(monday, 2, 20, 0),
          razon: "Una hora ligera después de cenar.",
        },
      ],
    },
  };
}

/** Static fixture pinned to today's ISO week, kept for backwards compat. */
export const INSIGHT_FIXTURE: Insight = buildInsightFixture();
