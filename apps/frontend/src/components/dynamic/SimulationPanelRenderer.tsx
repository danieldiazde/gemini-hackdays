import type { Component } from "@/types/interpret";

interface Agent {
  id: string;
  x: number;
  y: number;
  heading?: string;
}

interface World {
  grid_w: number;
  grid_h: number;
}

export function SimulationPanelRenderer({
  component,
}: {
  component: Component;
}) {
  const world = (component.data.world as World | undefined) ?? {
    grid_w: 8,
    grid_h: 8,
  };
  const agents = (component.data.agents as Agent[] | undefined) ?? [];
  const tick = (component.data.tick as number | undefined) ?? 0;

  return (
    <div className="rounded-lg border border-[--color-border] bg-[--color-panel] p-5 sm:col-span-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold tracking-tight">
          {component.title}
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">
          Simulation · t={tick}
        </span>
      </div>
      {component.description && (
        <p className="mt-2 text-sm text-[--color-fg-dim]">
          {component.description}
        </p>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr]">
        <Grid world={world} agents={agents} />
        <AgentList agents={agents} />
      </div>
    </div>
  );
}

function Grid({ world, agents }: { world: World; agents: Agent[] }) {
  const cells: { x: number; y: number; agent?: Agent }[] = [];
  for (let y = 0; y < world.grid_h; y++) {
    for (let x = 0; x < world.grid_w; x++) {
      cells.push({ x, y, agent: agents.find((a) => a.x === x && a.y === y) });
    }
  }
  return (
    <div
      className="grid gap-px rounded border border-[--color-border] bg-[--color-border] p-px"
      style={{
        gridTemplateColumns: `repeat(${world.grid_w}, 1.5rem)`,
      }}
    >
      {cells.map((c) => (
        <div
          key={`${c.x}-${c.y}`}
          className="flex h-6 w-6 items-center justify-center bg-[--color-panel-hi] text-[10px]"
        >
          {c.agent ? (
            <span
              className="rounded-full bg-[--color-accent] px-1 font-semibold text-[--color-bg]"
              title={c.agent.id}
            >
              {c.agent.id.charAt(0).toUpperCase()}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function AgentList({ agents }: { agents: Agent[] }) {
  if (agents.length === 0) {
    return (
      <p className="text-xs text-[--color-fg-dim]">No agents in scene.</p>
    );
  }
  return (
    <ul className="space-y-1 text-xs">
      {agents.map((a) => (
        <li
          key={a.id}
          className="flex items-center gap-2 rounded border border-[--color-border] bg-[--color-panel-hi] px-2 py-1"
        >
          <span className="rounded-full bg-[--color-accent]/20 px-1.5 font-mono text-[--color-accent-hi]">
            {a.id}
          </span>
          <span className="font-mono text-[--color-fg-dim]">
            ({a.x},{a.y})
          </span>
          {a.heading && (
            <span className="ml-auto font-mono text-[--color-fg-dim]">
              hdg {a.heading}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
