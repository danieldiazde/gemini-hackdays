type TimeRange = { inicio: string; fin: string };
type BloquesSugerido = { inicio_iso: string; fin_iso: string; [key: string]: unknown };

function overlaps(a: TimeRange, b: TimeRange): boolean {
  const aStart = new Date(a.inicio).getTime();
  const aEnd = new Date(a.fin).getTime();
  const bStart = new Date(b.inicio).getTime();
  const bEnd = new Date(b.fin).getTime();
  return aStart < bEnd && bStart < aEnd;
}

export function detectConflict(bloque: BloquesSugerido, eventos: TimeRange[]): boolean {
  return eventos.some((e) =>
    overlaps({ inicio: bloque.inicio_iso, fin: bloque.fin_iso }, e),
  );
}

const SHIFT_MINUTES = [30, 60, 120, -30, -60, -120];

export function resolveConflicts(
  bloques: BloquesSugerido[],
  eventos: TimeRange[],
): BloquesSugerido[] {
  return bloques.flatMap((bloque) => {
    if (!detectConflict(bloque, eventos)) return [bloque];

    for (const shiftMin of SHIFT_MINUTES) {
      const shiftMs = shiftMin * 60_000;
      const shifted: BloquesSugerido = {
        ...bloque,
        inicio_iso: new Date(new Date(bloque.inicio_iso).getTime() + shiftMs).toISOString(),
        fin_iso: new Date(new Date(bloque.fin_iso).getTime() + shiftMs).toISOString(),
      };
      if (!detectConflict(shifted, eventos)) return [shifted];
    }

    return []; // discard if no valid slot found
  });
}
