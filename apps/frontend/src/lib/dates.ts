import {
  addDays,
  endOfISOWeek,
  format,
  getISOWeek,
  startOfISOWeek,
} from "date-fns";
import { es } from "date-fns/locale";

export type WeekRange = {
  start: Date;
  end: Date;
  /** Monday → Sunday as Date objects, useful for the calendar grid columns. */
  days: Date[];
  isoWeek: number;
  /** e.g. "Mayo 2026". */
  monthLabel: string;
};

export function getWeekRange(reference: Date = new Date()): WeekRange {
  const start = startOfISOWeek(reference);
  const end = endOfISOWeek(reference);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return {
    start,
    end,
    days,
    isoWeek: getISOWeek(reference),
    monthLabel: format(start, "MMMM yyyy", { locale: es }),
  };
}

export function formatHour(date: Date): string {
  return format(date, "HH:mm");
}

/** Day-of-week header label, e.g. "Lun 11" — capitalized. */
export function formatDayHeader(date: Date): string {
  const raw = format(date, "EEE d", { locale: es });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
