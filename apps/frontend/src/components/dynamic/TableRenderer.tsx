import type { Component } from "@/types/interpret";

export function TableRenderer({ component }: { component: Component }) {
  const columns = (component.data.columns as string[] | undefined) ?? [];
  const rows = (component.data.rows as unknown[][] | undefined) ?? [];

  return (
    <div className="rounded-lg border border-[--color-border] bg-[--color-panel] p-5 sm:col-span-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold tracking-tight">
          {component.title}
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">
          Table
        </span>
      </div>
      {component.description && (
        <p className="mt-2 text-sm text-[--color-fg-dim]">
          {component.description}
        </p>
      )}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[--color-border]">
              {columns.map((c) => (
                <th
                  key={c}
                  className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-[--color-fg-dim]"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-[--color-border]/40 last:border-0"
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="py-2 pr-4 font-mono text-[--color-fg]"
                  >
                    {typeof cell === "object" && cell !== null
                      ? JSON.stringify(cell)
                      : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
