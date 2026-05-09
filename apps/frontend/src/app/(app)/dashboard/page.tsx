import { parseISO } from "date-fns";

import { DashboardView } from "@/components/dashboard/DashboardView";
import { EmptyInsightCard } from "@/components/dashboard/EmptyInsightCard";
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

async function loadCurrentInsight(): Promise<Insight | null | "missing"> {
  if (!hasSupabaseConfig()) return "missing";
  try {
    const supabase = await getSupabaseServer({ allowCookieWriteFailure: true });
    const { data, error } = await supabase
      .from("insights")
      .select("semana_iso, contenido")
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as Insight;
  } catch {
    return "missing";
  }
}

async function loadWeekEventos(start: Date, end: Date): Promise<Evento[] | "missing"> {
  if (!hasSupabaseConfig()) return "missing";
  try {
    const supabase = await getSupabaseServer({ allowCookieWriteFailure: true });
    const { data, error } = await supabase
      .from("eventos")
      .select("id, fuente, titulo, descripcion, inicio, fin, metadata")
      .gte("inicio", start.toISOString())
      .lte("inicio", end.toISOString())
      .order("inicio", { ascending: true });

    if (error) return "missing";
    return (data ?? []) as Evento[];
  } catch {
    return "missing";
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
  const insight: Insight | null =
    realInsight === "missing"
      ? showEmpty
        ? null
        : INSIGHT_FIXTURE
      : realInsight;

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
    realEventos === "missing" || realEventos.length === 0
      ? EVENTOS_FIXTURE
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
