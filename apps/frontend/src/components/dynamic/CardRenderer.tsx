import type { Component } from "@/types/interpret";

export function CardRenderer({ component }: { component: Component }) {
  return (
    <div className="rounded-lg border border-[--color-border] bg-[--color-panel] p-5">
      <ComponentHeader title={component.title} kind="Card" />
      {component.description && (
        <p className="mt-2 text-sm text-[--color-fg]">{component.description}</p>
      )}
      <KeyValueGrid data={component.data} />
    </div>
  );
}

function ComponentHeader({ title, kind }: { title: string; kind: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <span className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">
        {kind}
      </span>
    </div>
  );
}

function KeyValueGrid({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return null;
  return (
    <dl className="mt-3 grid gap-1 text-xs">
      {entries.map(([k, v]) => (
        <div
          key={k}
          className="flex items-start gap-2 border-t border-[--color-border]/60 pt-1"
        >
          <dt className="w-28 shrink-0 truncate font-mono text-[--color-fg-dim]">
            {k}
          </dt>
          <dd className="font-mono text-[--color-fg]">
            {typeof v === "object" ? JSON.stringify(v) : String(v)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
