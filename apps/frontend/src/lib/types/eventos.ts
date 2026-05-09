export type EventoFuente = "google" | "canvas" | "ai_suggested" | "manual";

export type Evento = {
  id: string;
  fuente: EventoFuente;
  titulo: string;
  descripcion?: string | null;
  /** ISO 8601 start timestamp. */
  inicio: string;
  /** ISO 8601 end timestamp. */
  fin: string;
  metadata?: Record<string, unknown>;
};
