import { getISOWeek, getYear, isValid, parseISO } from "date-fns";

import { DashboardView } from "@/components/dashboard/DashboardView";
import { EmptyInsightCard } from "@/components/dashboard/EmptyInsightCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWeekRange } from "@/lib/dates";
import { buildEventosFixture } from "@/lib/fixtures/eventos";
import { buildInsightFixture } from "@/lib/fixtures/insights";
import { syncGoogleCalendarToDb } from "@/lib/google/calendar";
import { syncCanvasIcalToDb } from "@/lib/ical/parser";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Evento } from "@/lib/types/eventos";
import type { Insight } from "@/lib/types/insights";

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

/**
 * Pulls fresh events from the user's Google Calendar and Canvas iCal feed
 * before the dashboard reads from the `eventos` table. Errors are swallowed
 * — a stale cache is better than a broken dashboard. We run both syncs in
 * parallel since they hit different external APIs.
 */
async function autoSyncExternalCalendars() {
  if (!hasSupabaseConfig()) return;
  try {
    const supabase = await getSupabaseServer({ allowCookieWriteFailure: true });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: perfil } = await supabase
      .from("profiles")
      .select("canvas_ical_url")
      .eq("id", user.id)
      .maybeSingle();

    await Promise.allSettled([
      syncGoogleCalendarToDb(supabase, user.id).catch((err) => {
        console.warn("[dashboard] google sync failed:", err);
      }),
      perfil?.canvas_ical_url
        ? syncCanvasIcalToDb(supabase, user.id, perfil.canvas_ical_url).catch((err) => {
            console.warn("[dashboard] canvas sync failed:", err);
          })
        : Promise.resolve(),
    ]);
  } catch (err) {
    console.warn("[dashboard] autoSync skipped:", err);
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

  // Auto-sync external calendars (Google + Canvas) before reading eventos so
  // the user sees fresh data without clicking anything. Skipped in demo mode.
  if (!demo) {
    await autoSyncExternalCalendars();
  }

  const today = new Date();
  const realInsight = demo ? "missing" : await loadCurrentInsight();
  const insight: Insight | null | "error" =
    realInsight === "missing"
      ? showEmpty
        ? null
        : buildInsightFixture(today)
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

  // Always anchor the calendar to today. Stale cached insights (from a
  // previous ISO week) get treated as "no insight yet" so the user is
  // prompted to regenerate instead of seeing last week's blocks on this
  // week's calendar.
  const currentSemanaISO = `${getYear(today)}-W${String(getISOWeek(today)).padStart(2, "0")}`;
  if (!usingFixture && insight.semana_iso !== currentSemanaISO) {
    return <EmptyInsightCard />;
  }
  const week = getWeekRange(today);

  const realEventos = demo ? "missing" : await loadWeekEventos(week.start, week.end);
  const eventos: Evento[] =
    realEventos === "missing"
      ? buildEventosFixture(today)
      : realEventos === "error"
        ? []
        : realEventos;

  const cleanInsight: Insight = {
    ...insight,
    contenido: {
      ...insight.contenido,
      bloques_sugeridos: insight.contenido.bloques_sugeridos.filter(
        (b) => isValid(parseISO(b.inicio_iso)) && isValid(parseISO(b.fin_iso)),
      ),
    },
  };

  return (
    <DashboardView
      insight={cleanInsight}
      eventos={eventos}
      week={week}
      usingFixture={usingFixture}
    />
  );
}

