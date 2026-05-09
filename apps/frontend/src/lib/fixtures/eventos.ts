import type { Evento } from "@/lib/types/eventos";

/** Demo week: 2026-05-11 (Mon) → 2026-05-17 (Sun). Matches insights fixture. */
export const EVENTOS_FIXTURE: Evento[] = [
  {
    id: "evt-1",
    fuente: "google_calendar",
    titulo: "Clase de Compiladores",
    inicio: "2026-05-11T09:00:00-06:00",
    fin: "2026-05-11T10:30:00-06:00",
  },
  {
    id: "evt-2",
    fuente: "google_calendar",
    titulo: "Clase de Bases de datos II",
    inicio: "2026-05-11T11:00:00-06:00",
    fin: "2026-05-11T12:30:00-06:00",
  },
  {
    id: "evt-3",
    fuente: "google_calendar",
    titulo: "Junta sociedad de alumnos",
    inicio: "2026-05-12T14:00:00-06:00",
    fin: "2026-05-12T15:00:00-06:00",
  },
  {
    id: "evt-4",
    fuente: "canvas",
    titulo: "Entrega proyecto BD II",
    descripcion: "Subir avance final del proyecto integrador",
    inicio: "2026-05-13T23:00:00-06:00",
    fin: "2026-05-13T23:59:00-06:00",
  },
  {
    id: "evt-5",
    fuente: "google_calendar",
    titulo: "Clase de Ética y ciudadanía",
    inicio: "2026-05-13T15:00:00-06:00",
    fin: "2026-05-13T16:30:00-06:00",
  },
  {
    id: "evt-6",
    fuente: "canvas",
    titulo: "Examen parcial · Compiladores",
    descripcion: "Aula 3-205. Llevar identificación.",
    inicio: "2026-05-15T09:00:00-06:00",
    fin: "2026-05-15T11:00:00-06:00",
  },
  {
    id: "evt-7",
    fuente: "google_calendar",
    titulo: "Comida con equipo de proyecto",
    inicio: "2026-05-15T13:00:00-06:00",
    fin: "2026-05-15T14:30:00-06:00",
  },
];
