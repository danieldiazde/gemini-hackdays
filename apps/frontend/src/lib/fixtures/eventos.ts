import { addDays, format, startOfISOWeek } from "date-fns";

import type { Evento } from "@/lib/types/eventos";

/**
 * Build the demo eventos relative to a reference date so `?demo=1` works
 * regardless of the calendar year. The dashboard anchors the calendar grid
 * to the same reference, so events line up visually with the suggested blocks.
 */
function iso(monday: Date, dayOffset: number, hour: number, minute: number): string {
  const d = addDays(monday, dayOffset);
  d.setHours(hour, minute, 0, 0);
  // Tag with Monterrey offset; keeps demo visually consistent across server
  // timezones.
  return `${format(d, "yyyy-MM-dd'T'HH:mm:ss")}-06:00`;
}

export function buildEventosFixture(reference: Date = new Date()): Evento[] {
  const monday = startOfISOWeek(reference);
  return [
    {
      id: "evt-1",
      fuente: "google",
      titulo: "Clase de Compiladores",
      inicio: iso(monday, 0, 9, 0),
      fin: iso(monday, 0, 10, 30),
    },
    {
      id: "evt-2",
      fuente: "google",
      titulo: "Clase de Bases de datos II",
      inicio: iso(monday, 0, 11, 0),
      fin: iso(monday, 0, 12, 30),
    },
    {
      id: "evt-3",
      fuente: "google",
      titulo: "Junta sociedad de alumnos",
      inicio: iso(monday, 1, 14, 0),
      fin: iso(monday, 1, 15, 0),
    },
    {
      id: "evt-4",
      fuente: "canvas",
      titulo: "Entrega proyecto BD II",
      descripcion: "Subir avance final del proyecto integrador",
      inicio: iso(monday, 2, 23, 0),
      fin: iso(monday, 2, 23, 59),
    },
    {
      id: "evt-5",
      fuente: "google",
      titulo: "Clase de Ética y ciudadanía",
      inicio: iso(monday, 2, 15, 0),
      fin: iso(monday, 2, 16, 30),
    },
    {
      id: "evt-6",
      fuente: "canvas",
      titulo: "Examen parcial · Compiladores",
      descripcion: "Aula 3-205. Llevar identificación.",
      inicio: iso(monday, 4, 9, 0),
      fin: iso(monday, 4, 11, 0),
    },
    {
      id: "evt-7",
      fuente: "google",
      titulo: "Comida con equipo de proyecto",
      inicio: iso(monday, 4, 13, 0),
      fin: iso(monday, 4, 14, 30),
    },
  ];
}

/** Static fixture pinned to today, kept for backwards compatibility. */
export const EVENTOS_FIXTURE: Evento[] = buildEventosFixture();
