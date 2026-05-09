"use client";

import {
  differenceInMinutes,
  isSameDay,
  parseISO,
  setHours,
  setMilliseconds,
  setMinutes,
  setSeconds,
} from "date-fns";
import { Check } from "lucide-react";

import { formatDayHeader, type WeekRange } from "@/lib/dates";
import type { Evento } from "@/lib/types/eventos";
import type { BloqueSugerido } from "@/lib/types/insights";

const GRID_START_HOUR = 7;
const GRID_END_HOUR = 22;
const HOUR_PX = 44;
const TOTAL_HOURS = GRID_END_HOUR - GRID_START_HOUR;
const TOTAL_HEIGHT = TOTAL_HOURS * HOUR_PX;
const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => GRID_START_HOUR + i);

function gridStart(day: Date) {
  return setMilliseconds(
    setSeconds(setMinutes(setHours(day, GRID_START_HOUR), 0), 0),
    0,
  );
}

function rangeStyle(start: Date, end: Date, day: Date) {
  const dayStart = gridStart(day);
  const startMin = Math.max(0, differenceInMinutes(start, dayStart));
  const endMin = Math.min(TOTAL_HOURS * 60, differenceInMinutes(end, dayStart));
  const top = (startMin / 60) * HOUR_PX;
  const height = Math.max(28, ((endMin - startMin) / 60) * HOUR_PX);
  return { top, height };
}

function timeLabel(date: Date) {
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const FUENTE_LABEL: Record<Evento["fuente"], string> = {
  google_calendar: "GCal",
  canvas: "Canvas",
  teccoach: "TecCoach",
};

const FUENTE_STYLE: Record<Evento["fuente"], string> = {
  google_calendar: "bg-slate-100 text-slate-700 ring-slate-200",
  canvas: "bg-orange-50 text-orange-700 ring-orange-200",
  teccoach: "bg-gemini-blue/10 text-gemini-blue ring-gemini-blue/30",
};

export function blockKey(b: BloqueSugerido): string {
  return `${b.inicio_iso}::${b.titulo}`;
}

export function WeeklyCalendar({
  week,
  eventos,
  bloques,
  selected,
  onToggle,
}: {
  week: WeekRange;
  eventos: Evento[];
  bloques: BloqueSugerido[];
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      {/* Day header row */}
      <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-border bg-muted/40">
        <div />
        {week.days.map((d) => (
          <div
            key={d.toISOString()}
            className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {formatDayHeader(d)}
          </div>
        ))}
      </div>

      {/* Body: hour gutter + 7 day columns with absolute-positioned blocks */}
      <div
        className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]"
        style={{ height: TOTAL_HEIGHT }}
      >
        <div className="relative border-r border-border bg-muted/20">
          {HOURS.map((h, i) => (
            <div
              key={h}
              className="absolute left-0 right-0 -translate-y-1/2 px-2 text-right text-[10px] font-medium text-muted-foreground"
              style={{ top: i * HOUR_PX }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {week.days.map((day) => {
          const dayEventos = eventos.filter((e) =>
            isSameDay(parseISO(e.inicio), day),
          );
          const dayBloques = bloques.filter((b) =>
            isSameDay(parseISO(b.inicio_iso), day),
          );

          return (
            <div
              key={day.toISOString()}
              className="relative border-l border-border first-of-type:border-l-0"
            >
              {/* Hour grid lines */}
              {HOURS.map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-dashed border-border/60"
                  style={{ top: i * HOUR_PX }}
                />
              ))}

              {/* Existing events: render below suggested blocks */}
              {dayEventos.map((e) => {
                const start = parseISO(e.inicio);
                const end = parseISO(e.fin);
                const { top, height } = rangeStyle(start, end, day);
                return (
                  <div
                    key={e.id}
                    className={`absolute inset-x-1 z-10 overflow-hidden rounded-md p-2 text-[11px] leading-tight ring-1 ${FUENTE_STYLE[e.fuente]}`}
                    style={{ top, height }}
                    title={e.titulo}
                  >
                    <p className="line-clamp-1 font-semibold">{e.titulo}</p>
                    <p className="text-[10px] opacity-80">
                      {timeLabel(start)} – {timeLabel(end)} · {FUENTE_LABEL[e.fuente]}
                    </p>
                  </div>
                );
              })}

              {/* Suggested blocks: rendered on top, clickable */}
              {dayBloques.map((b) => {
                const start = parseISO(b.inicio_iso);
                const end = parseISO(b.fin_iso);
                const { top, height } = rangeStyle(start, end, day);
                const key = blockKey(b);
                const isSelected = selected.has(key);
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => onToggle(key)}
                    aria-pressed={isSelected}
                    className={`absolute inset-x-1 z-20 cursor-pointer overflow-hidden rounded-md p-2 text-left text-[11px] leading-tight text-white shadow-md transition-all ${
                      isSelected
                        ? "bg-gemini-gradient ring-2 ring-gemini-blue/70"
                        : "bg-gemini-gradient/85 hover:bg-gemini-gradient ring-1 ring-white/30"
                    }`}
                    style={{ top, height }}
                    title={b.razon}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="line-clamp-2 font-semibold">{b.titulo}</p>
                      {isSelected && (
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-white text-gemini-blue">
                          <Check className="size-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] opacity-90">
                      {timeLabel(start)} – {timeLabel(end)}
                    </p>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
