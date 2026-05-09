import { getISOWeek, getYear, parseISO } from "date-fns";

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

  // Anchor the calendar week to TODAY for real data. Fixtures use the seed
  // reference so demo events line up. Stale cached insights (from a previous
  // ISO week) get treated as "no insight yet" so the user is prompted to
  // regenerate instead of seeing last week's blocks on this week's calendar.
  const today = new Date();
  const currentSemanaISO = `${getYear(today)}-W${String(getISOWeek(today)).padStart(2, "0")}`;
  if (!usingFixture && insight.semana_iso !== currentSemanaISO) {
    return <EmptyInsightCard />;
  }
  const reference = usingFixture ? FIXTURE_REFERENCE_DATE : today;
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

