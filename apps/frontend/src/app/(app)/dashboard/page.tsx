import { parseISO } from "date-fns";

import { DashboardView } from "@/components/dashboard/DashboardView";
import { EmptyInsightCard } from "@/components/dashboard/EmptyInsightCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWeekRange } from "@/lib/dates";
import { EVENTOS_FIXTURE } from "@/lib/fixtures/eventos";
import { INSIGHT_FIXTURE } from "@/lib/fixtures/insights";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Evento } from "@/lib/types/eventos";
import type { Insight } from "@/lib/types/insights";

const FIXTURE_REFERENCE_DATE = parseISO("2026-05-13");

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

async function loadCurrentInsight(): Promise<Insight | null | "missing" | "error"> {
  if (!hasSupabaseConfig()) return "missing";
  try {
    const supabase = await getSupabaseServer({ allowCookieWriteFailure: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "error";

    const { data, error } = await supabase
      .from("insights")
      .select("semana_iso, contenido")
      .eq("user_id", user.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return "error";
    if (!data) return null;
    return data as Insight;
  } catch {
    return "error";
  }
}

async function loadWeekEventos(start: Date, end: Date): Promise<Evento[] | "missing" | "error"> {
  if (!hasSupabaseConfig()) return "missing";
  try {
    const supabase = await getSupabaseServer({ allowCookieWriteFailure: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "error";

    const { data, error } = await supabase
      .from("eventos")
      .select("id, source, titulo, descripcion, fecha_inicio, fecha_fin")
      .eq("user_id", user.id)
      .gte("fecha_inicio", start.toISOString())
      .lte("fecha_inicio", end.toISOString())
      .order("fecha_inicio", { ascending: true });

    if (error) return "error";
    // Map DB columns to the Evento type the UI expects
    return (data ?? []).map((e) => ({
      id: e.id,
      fuente: (e.source ?? "manual") as Evento["fuente"],
      titulo: e.titulo,
      descripcion: e.descripcion,
      inicio: e.fecha_inicio,
      fin: e.fecha_fin,
    }));
  } catch {
    return "error";
  }
}

type DashboardSearchParams = {
  empty?: string;
  demo?: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const params = await searchParams;
  const demo = params.demo === "1";
  const showEmpty = params.empty === "1";

  const realInsight = demo ? "missing" : await loadCurrentInsight();
  const insight: Insight | null | "error" =
    realInsight === "missing"
      ? showEmpty
        ? null
        : INSIGHT_FIXTURE
      : realInsight === "error"
        ? "error"
      : realInsight;

  if (insight === "error") {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="text-xl">No pudimos cargar tu semana</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Revisa la configuración de Supabase o usa <code>?demo=1</code> para
          continuar el demo.
        </CardContent>
      </Card>
    );
  }

  if (!insight) {
    return <EmptyInsightCard />;
  }

  const usingFixture = realInsight === "missing";

  // Anchor the calendar week to whatever data we're showing. With fixtures, use
  // the seed reference date so the demo events line up. With real data, parse
  // the insight's semana_iso (ISO week) or fall back to today.
  const reference = usingFixture
    ? FIXTURE_REFERENCE_DATE
    : parseIsoWeekToDate(insight.semana_iso) ?? new Date();
  const week = getWeekRange(reference);

  const realEventos = demo ? "missing" : await loadWeekEventos(week.start, week.end);
  const eventos: Evento[] =
    realEventos === "missing"
      ? EVENTOS_FIXTURE
      : realEventos === "error"
        ? []
        : realEventos;

  return (
    <DashboardView
      insight={insight}
      eventos={eventos}
      week={week}
      usingFixture={usingFixture}
    />
  );
}

/** Convert "2026-W20" to the Monday of that ISO week. */
function parseIsoWeekToDate(semanaIso: string): Date | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(semanaIso);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  // ISO week 1 is the week with the year's first Thursday. Construct from
  // simple date math: take Jan 4 of the year (always in week 1), back up to
  // Monday, then add (week - 1) weeks.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
  const target = new Date(week1Monday);
  target.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return target;
}
