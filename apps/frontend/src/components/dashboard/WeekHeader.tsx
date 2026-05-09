import { format } from "date-fns";
import { es } from "date-fns/locale";

import type { WeekRange } from "@/lib/dates";

export function WeekHeader({ week }: { week: WeekRange }) {
  const start = format(week.start, "d 'de' MMMM", { locale: es });
  const end = format(week.end, "d 'de' MMMM yyyy", { locale: es });

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Semana ISO {week.isoWeek}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Tu semana del{" "}
        <span className="bg-gemini-gradient bg-clip-text text-transparent">
          {start} al {end}
        </span>
      </h1>
    </div>
  );
}
