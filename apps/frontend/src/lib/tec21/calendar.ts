/**
 * Tec21 academic calendar helpers — period-aware version.
 *
 * Instead of computing block boundaries from a single semester start date,
 * we read the real periods uploaded from the student's MiTec horario PDF.
 * Each materia carries an array of `periodos` with explicit start/end dates
 * and a `es_semana_tec` flag.
 */

export type MateriaPeriodo = {
  inicio: string;
  fin: string;
  dias: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  ubicacion: string | null;
  es_semana_tec: boolean;
};

export type MateriaConPeriodos = {
  clave: string;
  nombre: string;
  crn?: string | null;
  creditos: number;
  prioridad: number;
  periodos: MateriaPeriodo[];
};

export type PeriodoActivoInfo = {
  /** True if today falls inside any Semana Tec period. */
  es_semana_tec: boolean;
  /** ISO date YYYY-MM-DD where the current "block" started. */
  bloque_inicio: string | null;
  /** ISO date YYYY-MM-DD where the current "block" ends. */
  bloque_fin: string | null;
  /** Human label, e.g. "Bloque 2 (23-mar al 3-may)" or "Semana Tec — Inteligencia artificial para textos científicos". */
  etiqueta: string;
  /** Total weeks since semester start. */
  semana_actual: number;
  /** Days remaining until current block ends. */
  dias_restantes_bloque: number | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function isWithin(now: Date, inicioIso: string, finIso: string): boolean {
  const t = now.getTime();
  return t >= toDate(inicioIso).getTime() && t <= toDate(finIso).getTime() + MS_PER_DAY - 1;
}

/**
 * Materias activas hoy: aquellas con al menos un periodo que contenga la fecha.
 */
export function materiasActivas(
  now: Date,
  materias: MateriaConPeriodos[],
): MateriaConPeriodos[] {
  return materias.filter((m) =>
    m.periodos.some((p) => isWithin(now, p.inicio, p.fin)),
  );
}

/**
 * Computes the current period info from the union of all materias' periodos.
 * Returns a label that distinguishes Semana Tec from regular blocks, and the
 * boundaries of the current period so we can talk about days-remaining.
 */
export function getPeriodoActivo(
  now: Date,
  materias: MateriaConPeriodos[],
  semestreInicioIso: string | null,
): PeriodoActivoInfo {
  const activas = materiasActivas(now, materias);

  // Detect Semana Tec — it's a 1-week period explicitly flagged.
  const semanaTec = activas
    .flatMap((m) =>
      m.periodos
        .filter((p) => p.es_semana_tec && isWithin(now, p.inicio, p.fin))
        .map((p) => ({ materia: m, periodo: p })),
    )
    .at(0);

  let bloque_inicio: string | null = null;
  let bloque_fin: string | null = null;
  let etiqueta = "Periodo desconocido";
  let dias_restantes_bloque: number | null = null;

  if (semanaTec) {
    bloque_inicio = semanaTec.periodo.inicio;
    bloque_fin = semanaTec.periodo.fin;
    etiqueta = `Semana Tec — ${semanaTec.materia.nombre}`;
  } else {
    // Compute the current "block" as the intersection of all active periods
    // that aren't Semana Tec. Take the LATEST inicio and EARLIEST fin among
    // active non-tec periods.
    const periodosRegulares = activas
      .flatMap((m) => m.periodos.filter((p) => !p.es_semana_tec))
      .filter((p) => isWithin(now, p.inicio, p.fin));

    if (periodosRegulares.length > 0) {
      bloque_inicio = periodosRegulares
        .map((p) => p.inicio)
        .sort()
        .at(-1) ?? null;
      bloque_fin = periodosRegulares
        .map((p) => p.fin)
        .sort()
        .at(0) ?? null;

      if (bloque_inicio && bloque_fin) {
        // Identify which "block" number this is, by counting how many
        // distinct period intervals end before this one starts.
        const allPeriodos = materias.flatMap((m) => m.periodos);
        const earlierEnds = new Set(
          allPeriodos
            .filter((p) => !p.es_semana_tec)
            .filter((p) => toDate(p.fin).getTime() < toDate(bloque_inicio!).getTime())
            .map((p) => p.fin),
        );
        const numero = earlierEnds.size + 1;
        const fmt = (iso: string) => {
          const d = toDate(iso);
          return `${d.getDate()}-${["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][d.getMonth()]}`;
        };
        etiqueta = `Bloque ${numero} (${fmt(bloque_inicio)} al ${fmt(bloque_fin)})`;
      }
    } else {
      etiqueta = "Periodo de transición o vacaciones";
    }
  }

  if (bloque_fin) {
    dias_restantes_bloque = Math.max(
      0,
      Math.ceil((toDate(bloque_fin).getTime() - now.getTime()) / MS_PER_DAY),
    );
  }

  // Weeks since semester start (informational — uses periodo_inicio if present).
  const semana_actual = semestreInicioIso
    ? Math.max(1, Math.floor((now.getTime() - toDate(semestreInicioIso).getTime()) / MS_PER_WEEK) + 1)
    : 1;

  return {
    es_semana_tec: !!semanaTec,
    bloque_inicio,
    bloque_fin,
    etiqueta,
    semana_actual,
    dias_restantes_bloque,
  };
}

/**
 * Try to extract Tec course claves from arbitrary text (e.g. Canvas event
 * titles). Returns uppercase claves found, deduplicated.
 *
 * Pattern: 1-3 letters followed by 3-4 digits, optionally followed by a dot
 * and a section number.
 */
const CLAVE_PATTERN = /\b([A-Z]{1,3}\d{3,4})(?:\.\d+)?\b/g;

export function extractClavesFromText(text: string): string[] {
  if (!text) return [];
  const matches = text.toUpperCase().matchAll(CLAVE_PATTERN);
  const out = new Set<string>();
  for (const m of matches) out.add(m[1]);
  return [...out];
}
