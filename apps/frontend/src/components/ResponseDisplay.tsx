"use client";

import type {
  Action,
  Component as DynamicComponent,
  InterpretResponse,
} from "@/types/interpret";
import { CardRenderer } from "./dynamic/CardRenderer";
import { ChartRenderer } from "./dynamic/ChartRenderer";
import { TableRenderer } from "./dynamic/TableRenderer";
import { TimelineRenderer } from "./dynamic/TimelineRenderer";
import { SimulationPanelRenderer } from "./dynamic/SimulationPanelRenderer";
import { JsonViewer } from "./JsonViewer";

interface Props {
  response: InterpretResponse;
}

export function ResponseDisplay({ response }: Props) {
  return (
    <section className="mt-8 space-y-6">
      <SummaryCard response={response} />
      <ComponentGrid components={response.components} />
      <ActionsList actions={response.actions} />
      <JsonViewer label="Raw response" value={response} />
    </section>
  );
}

function SummaryCard({ response }: { response: InterpretResponse }) {
  return (
    <div className="rounded-lg border border-[--color-border] bg-[--color-panel] p-5">
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-[--color-fg-dim]">
          Summary
        </span>
        {response.is_mock && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            Local mock mode
          </span>
        )}
        <span className="ml-auto rounded-full bg-[--color-panel-hi] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[--color-fg-dim]">
          mode · {response.mode}
        </span>
      </div>
      <p className="mt-2 text-[--color-fg]">{response.summary}</p>
    </div>
  );
}

function ComponentGrid({ components }: { components: DynamicComponent[] }) {
  if (components.length === 0) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {components.map((c, i) => (
        <DynamicRender key={i} component={c} />
      ))}
    </div>
  );
}

function DynamicRender({ component }: { component: DynamicComponent }) {
  switch (component.type) {
    case "card":
      return <CardRenderer component={component} />;
    case "chart":
      return <ChartRenderer component={component} />;
    case "table":
      return <TableRenderer component={component} />;
    case "timeline":
      return <TimelineRenderer component={component} />;
    case "simulation_panel":
      return <SimulationPanelRenderer component={component} />;
    default:
      return (
        <UnknownComponent
          // exhaustiveness check — surface unknown types instead of silently dropping
          type={(component as DynamicComponent).type}
        />
      );
  }
}

function UnknownComponent({ type }: { type: string }) {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
      Unknown component type: <code>{type}</code>
    </div>
  );
}

function ActionsList({ actions }: { actions: Action[] }) {
  if (actions.length === 0) return null;
  return (
    <div className="rounded-lg border border-[--color-border] bg-[--color-panel] p-5">
      <h2 className="text-xs uppercase tracking-wider text-[--color-fg-dim]">
        Actions
      </h2>
      <ul className="mt-3 space-y-2">
        {actions.map((a, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-md border border-[--color-border] bg-[--color-panel-hi] px-3 py-2 text-sm"
          >
            <span className="rounded-full bg-[--color-accent]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[--color-accent-hi]">
              {a.type}
            </span>
            <span className="font-mono text-[--color-fg]">{a.name}</span>
            <code className="ml-auto truncate text-xs text-[--color-fg-dim]">
              {JSON.stringify(a.arguments)}
            </code>
          </li>
        ))}
      </ul>
    </div>
  );
}
