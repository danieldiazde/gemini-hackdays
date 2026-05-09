import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

import type { Prioridad, Urgencia } from "@/lib/types/insights";

const URGENCIA_STYLE: Record<
  Urgencia,
  { ring: string; bg: string; text: string; label: string; Icon: typeof AlertTriangle }
> = {
  alta: {
    ring: "ring-rose-200",
    bg: "bg-rose-50",
    text: "text-rose-700",
    label: "Alta",
    Icon: AlertTriangle,
  },
  media: {
    ring: "ring-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    label: "Media",
    Icon: ArrowRight,
  },
  baja: {
    ring: "ring-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    label: "Baja",
    Icon: CheckCircle2,
  },
};

export function PrioritiesGrid({ prioridades }: { prioridades: Prioridad[] }) {
  if (prioridades.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Prioridades de la semana
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {prioridades.map((p, i) => {
          const style = URGENCIA_STYLE[p.urgencia];
          const Icon = style.Icon;
          return (
            <article
              key={`${p.materia}-${p.razon}`}
              style={{ animationDelay: `${i * 80}ms` }}
              className={`flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-both ${style.ring}`}
            >
              <span
                className={`inline-flex items-center gap-1 self-start rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
              >
                <Icon className="size-3" />
                {style.label}
              </span>
              <h3 className="text-base font-semibold text-foreground">
                {p.materia}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {p.razon}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
