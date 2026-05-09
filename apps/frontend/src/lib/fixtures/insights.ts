import type { Insight } from "@/lib/types/insights";

/**
 * Fallback insight for the dashboard when `/api/insights/current` isn't
 * available yet. Shape matches the README contract exactly so swapping in
 * real Gemini output is a no-op. Keep the dates in the demo week
 * (2026-05-11 → 2026-05-17) so the calendar grid lines up with the demo
 * eventos fixture.
 */
export const INSIGHT_FIXTURE: Insight = {
  semana_iso: "2026-W20",
  contenido: {
    mensaje:
      "Andrés, esta semana tienes el examen parcial de Compiladores el viernes y dos entregas en Bases de Datos. Tu jueves está libre — buen momento para repasar antes del parcial.",
    prioridades: [
      {
        materia: "Compiladores",
        razon: "Examen parcial el viernes 15 de mayo",
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
        inicio_iso: "2026-05-12T16:00:00-06:00",
        fin_iso: "2026-05-12T18:00:00-06:00",
        razon: "Tu horario productivo de tarde, antes del examen del viernes.",
      },
      {
        titulo: "Avanzar entrega de BD II",
        materia: "Bases de datos II",
        inicio_iso: "2026-05-13T10:00:00-06:00",
        fin_iso: "2026-05-13T12:00:00-06:00",
        razon: "Mañana del miércoles, justo antes de la entrega.",
      },
      {
        titulo: "Repaso integral de Compiladores",
        materia: "Compiladores",
        inicio_iso: "2026-05-14T15:00:00-06:00",
        fin_iso: "2026-05-14T18:00:00-06:00",
        razon: "Jueves libre — bloque largo para cerrar dudas del parcial.",
      },
      {
        titulo: "Lectura de Ética",
        materia: "Ética y ciudadanía",
        inicio_iso: "2026-05-13T19:00:00-06:00",
        fin_iso: "2026-05-13T20:00:00-06:00",
        razon: "Una hora ligera después de cenar.",
      },
    ],
  },
};
