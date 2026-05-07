import type { Component } from "@/types/interpret";

interface Event {
  t?: string;
  label?: string;
}

export function TimelineRenderer({ component }: { component: Component }) {
  const events = (component.data.events as Event[] | undefined) ?? [];
  return (
    <div className="rounded-lg border border-[--color-border] bg-[--color-panel] p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold tracking-tight">
          {component.title}
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">
          Timeline
        </span>
      </div>
      {component.description && (
        <p className="mt-2 text-sm text-[--color-fg-dim]">
          {component.description}
        </p>
      )}
      <ol className="mt-4 space-y-3">
        {events.map((e, i) => (
          <li key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-2 w-2 rounded-full bg-[--color-accent]" />
              {i < events.length - 1 && (
                <div className="mt-1 w-px flex-1 bg-[--color-border]" />
              )}
            </div>
            <div className="pb-2">
              <div className="font-mono text-xs text-[--color-fg-dim]">
                {e.t ?? "—"}
              </div>
              <div className="text-sm text-[--color-fg]">{e.label ?? ""}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
