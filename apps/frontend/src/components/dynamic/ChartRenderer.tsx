import type { Component } from "@/types/interpret";

interface Series {
  label: string;
  value: number;
}

export function ChartRenderer({ component }: { component: Component }) {
  const series = (component.data.series as Series[] | undefined) ?? [];
  const max = series.reduce((m, s) => Math.max(m, s.value), 1);
  const xLabel = (component.data.x_label as string | undefined) ?? "";
  const yLabel = (component.data.y_label as string | undefined) ?? "";

  return (
    <div className="rounded-lg border border-[--color-border] bg-[--color-panel] p-5 sm:col-span-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold tracking-tight">
          {component.title}
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">
          Chart
        </span>
      </div>
      {component.description && (
        <p className="mt-2 text-sm text-[--color-fg-dim]">
          {component.description}
        </p>
      )}
      <div className="mt-4 space-y-2">
        {series.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-24 shrink-0 truncate text-xs text-[--color-fg-dim]">
              {s.label}
            </div>
            <div className="relative h-5 flex-1 rounded bg-[--color-panel-hi]">
              <div
                className="absolute inset-y-0 left-0 rounded bg-[--color-accent]"
                style={{ width: `${(s.value / max) * 100}%` }}
              />
            </div>
            <div className="w-12 text-right font-mono text-xs text-[--color-fg]">
              {s.value}
            </div>
          </div>
        ))}
      </div>
      {(xLabel || yLabel) && (
        <p className="mt-3 text-[10px] uppercase tracking-wider text-[--color-fg-dim]">
          {yLabel} / {xLabel}
        </p>
      )}
    </div>
  );
}
