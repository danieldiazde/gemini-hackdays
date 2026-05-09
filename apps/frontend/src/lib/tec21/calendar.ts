/**
 * Tec21 academic calendar helpers.
 *
 * The Tec21 model splits each semester into 3 blocks of 5 weeks each, with a
 * "Semana Tec" (intensive project week) between blocks. Regular classes are
 * suspended during Semana Tec. After block 3 there is usually a finals week.
 *
 * Layout (1-indexed weeks from semester start):
 *   - Weeks  1-5  → Block 1
 *   - Week   6    → Semana Tec 1
 *   - Weeks  7-11 → Block 2
 *   - Week   12   → Semana Tec 2
 *   - Weeks 13-17 → Block 3
 *   - Week   18+  → Finals / vacation
 */

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export type Tec21WeekInfo = {
  /** ISO date string (YYYY-MM-DD) of the semester start. */
  semestre_inicio: string;
  /** 1-indexed week number from semester start. */
  semana_actual: number;
  /** Block number 1 / 2 / 3, or null if outside the academic period. */
  bloque_actual: 1 | 2 | 3 | null;
  /** 1-indexed week within the current block (1-5), or 0 if Semana Tec / finales. */
  semana_en_bloque: number;
  /** True if the current week is a Semana Tec. */
  es_semana_tec: boolean;
  /** Human-readable label, e.g. "Bloque 2 — semana 3 de 5". */
  etiqueta: string;
};

export function getTec21WeekInfo(
  now: Date,
  semestreInicio: string,
): Tec21WeekInfo {
  const start = new Date(`${semestreInicio}T00:00:00`);
  const diff = now.getTime() - start.getTime();
  const semana_actual = Math.max(1, Math.floor(diff / MS_PER_WEEK) + 1);

  let bloque_actual: 1 | 2 | 3 | null = null;
  let semana_en_bloque = 0;
  let es_semana_tec = false;
  let etiqueta = "";

  if (semana_actual >= 1 && semana_actual <= 5) {
    bloque_actual = 1;
    semana_en_bloque = semana_actual;
    etiqueta = `Bloque 1 — semana ${semana_en_bloque} de 5`;
  } else if (semana_actual === 6) {
    bloque_actual = 1;
    es_semana_tec = true;
    etiqueta = "Semana Tec 1 (proyectos intensivos)";
  } else if (semana_actual >= 7 && semana_actual <= 11) {
    bloque_actual = 2;
    semana_en_bloque = semana_actual - 6;
    etiqueta = `Bloque 2 — semana ${semana_en_bloque} de 5`;
  } else if (semana_actual === 12) {
    bloque_actual = 2;
    es_semana_tec = true;
    etiqueta = "Semana Tec 2 (proyectos intensivos)";
  } else if (semana_actual >= 13 && semana_actual <= 17) {
    bloque_actual = 3;
    semana_en_bloque = semana_actual - 12;
    etiqueta = `Bloque 3 — semana ${semana_en_bloque} de 5`;
  } else {
    bloque_actual = null;
    etiqueta = semana_actual > 17 ? "Finales / vacaciones" : "Antes del semestre";
  }

  return {
    semestre_inicio: semestreInicio,
    semana_actual,
    bloque_actual,
    semana_en_bloque,
    es_semana_tec,
    etiqueta,
  };
}

/**
 * Try to extract Tec course claves from arbitrary text (e.g. Canvas event
 * titles like "TC2025 - Tarea 3" or "Bases de Datos II [TC2018]"). Returns
 * uppercase claves found, deduplicated.
 *
 * Pattern: 1-3 letters followed by 3-4 digits. Examples that should match:
 *   TC2025, MA1010, F1001, ET1011, ST5001
 */
const CLAVE_PATTERN = /\b([A-Z]{1,3}\d{3,4})\b/g;

export function extractClavesFromText(text: string): string[] {
  if (!text) return [];
  const matches = text.toUpperCase().matchAll(CLAVE_PATTERN);
  const out = new Set<string>();
  for (const m of matches) out.add(m[1]);
  return [...out];
}
