"use client";

import { useState } from "react";

interface Props {
  label: string;
  value: unknown;
}

export function JsonViewer({ label, value }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="rounded-lg border border-[--color-border] bg-[--color-panel]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-xs uppercase tracking-wider text-[--color-fg-dim]">
        <span>{label}</span>
        <span className="text-[10px]">{open ? "hide" : "show"}</span>
      </summary>
      <pre className="overflow-x-auto border-t border-[--color-border] bg-[--color-panel-hi] px-5 py-4 text-xs leading-relaxed text-[--color-fg]">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}
