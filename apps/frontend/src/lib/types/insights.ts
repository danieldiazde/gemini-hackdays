export type Urgencia = "alta" | "media" | "baja";

export type Prioridad = {
  materia: string;
  razon: string;
  urgencia: Urgencia;
};

export type BloqueSugerido = {
  titulo: string;
  materia: string;
  inicio_iso: string;
  fin_iso: string;
  razon: string;
};

export type InsightContenido = {
  mensaje: string;
  prioridades: Prioridad[];
  bloques_sugeridos: BloqueSugerido[];
};

export type Insight = {
  semana_iso: string;
  contenido: InsightContenido;
};

export type CalendarCreateBody = {
  events: Array<{
    titulo: string;
    descripcion?: string;
    inicio: string;
    fin: string;
  }>;
};

export type CalendarCreateResponse = {
  success: boolean;
  created: number;
  ids: string[];
};
