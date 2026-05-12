import { z } from "zod";

/** A0 followed by 7 digits — Tec student ID format. */
const matriculaSchema = z.string().regex(/^A0\d{7}$/, "Matrícula inválida");

const modeloSchema = z.enum(["tec21", "tec26"]);

/** ISO 8601 datetime with timezone offset or Z suffix. */
const isoDatetimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
    "Fecha ISO 8601 inválida",
  );

export const profileSetupBodySchema = z.object({
  matricula: matriculaSchema.optional(),
  nombre: z.string().trim().min(1).max(120).optional(),
  carreraClave: z.string().min(1).max(20),
  modelo: modeloSchema,
  semestre: z.number().int().min(1).max(10),
  canvasIcalUrl: z.string().url().optional(),
});

export const calendarCreateBodySchema = z.object({
  events: z
    .array(
      z.object({
        titulo: z.string().trim().min(1).max(255),
        descripcion: z.string().max(2000).optional(),
        inicio: isoDatetimeSchema,
        fin: isoDatetimeSchema,
      }),
    )
    .min(1)
    .max(20),
});

export const canvasSyncBodySchema = z.object({
  icalUrl: z.string().url(),
});

export const insightsGenerateBodySchema = z.object({
  forceRefresh: z.boolean().optional(),
});

export const insightContenidoSchema = z.object({
  mensaje: z.string().trim().min(1).max(1000),
  prioridades: z
    .array(
      z.object({
        materia: z.string().trim().min(1).max(160),
        razon: z.string().trim().min(1).max(1000),
        urgencia: z.enum(["alta", "media", "baja"]),
      }),
    )
    .min(1)
    .max(4),
  bloques_sugeridos: z
    .array(
      z.object({
        titulo: z.string().trim().min(1).max(160),
        materia: z.string().trim().min(1).max(160),
        inicio_iso: isoDatetimeSchema,
        fin_iso: isoDatetimeSchema,
        razon: z.string().trim().min(1).max(1000),
      }),
    )
    .min(1)
    .max(5),
});

/**
 * Helper: validate a request body or return a NextResponse-friendly error
 * payload. Caller decides what to do with the error (typically NextResponse.json).
 */
export function parseOrFail<T>(
  schema: z.ZodType<T>,
  body: unknown,
): { ok: true; data: T } | { ok: false; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first.path.length > 0 ? `${first.path.join(".")}: ` : "";
    return { ok: false, error: `${path}${first.message}` };
  }
  return { ok: true, data: result.data };
}
