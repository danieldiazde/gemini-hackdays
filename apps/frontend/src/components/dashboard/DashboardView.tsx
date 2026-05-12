"use client";

import { useState } from "react";

import { ApplyBlocksButton } from "@/components/dashboard/ApplyBlocksButton";
import { CoachMessage } from "@/components/dashboard/CoachMessage";
import { PrioritiesGrid } from "@/components/dashboard/PrioritiesGrid";
import { WeekHeader } from "@/components/dashboard/WeekHeader";
import {
  blockKey,
  WeeklyCalendar,
} from "@/components/dashboard/WeeklyCalendar";
import { Badge } from "@/components/ui/badge";
import type { WeekRange } from "@/lib/dates";
import type { Evento } from "@/lib/types/eventos";
import type { Insight } from "@/lib/types/insights";

export function DashboardView({
  insight,
  eventos,
  week,
  usingFixture,
}: {
  insight: Insight;
  eventos: Evento[];
  week: WeekRange;
  usingFixture: boolean;
}) {
  const bloques = insight.contenido.bloques_sugeridos;
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(bloques.map((b) => blockKey(b))),
  );

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6 pb-32">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <WeekHeader week={week} />
        {usingFixture && (
          <Badge
            variant="outline"
            className="border-gemini-blue/40 text-gemini-blue"
          >
            Modo demo
          </Badge>
        )}
      </div>

      <CoachMessage mensaje={insight.contenido.mensaje} />

      <PrioritiesGrid prioridades={insight.contenido.prioridades} />

      <div className="space-y-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500 motion-safe:delay-300 motion-safe:fill-mode-both">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Bloques sugeridos
          </h2>
          <p className="text-xs text-muted-foreground">
            Toca un bloque para alternar selección. Tus eventos existentes están
            en gris.
          </p>
        </div>
        <WeeklyCalendar
          week={week}
          eventos={eventos}
          bloques={bloques}
          selected={selected}
          onToggle={toggle}
        />
      </div>

      <ApplyBlocksButton
        bloques={bloques}
        selectedKeys={selected}
        demoMode={usingFixture}
      />
    </div>
  );
}
