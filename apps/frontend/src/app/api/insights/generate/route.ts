import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, FLASH_MODEL } from "@/lib/gemini/client";
import { buildCoachPrompt, INSIGHT_RESPONSE_SCHEMA, type CoachContext } from "@/lib/gemini/prompts";
import { resolveConflicts } from "@/lib/scheduling/conflicts";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getISOWeek, getYear } from "date-fns";

function currentSemanaISO(): string {
  const now = new Date();
  return `${getYear(now)}-W${String(getISOWeek(now)).padStart(2, "0")}`;
}

async function callGemini(prompt: string, attempt = 0): Promise<unknown> {
  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: FLASH_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: INSIGHT_RESPONSE_SCHEMA,
        temperature: 0.7,
      },
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return JSON.parse(text);
  } catch (err) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
      return callGemini(prompt, attempt + 1);
    }
    throw err;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as { forceRefresh?: boolean };
    const forceRefresh = body.forceRefresh === true;

    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const semana_iso = currentSemanaISO();

    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from("insights")
        .select("semana_iso, contenido")
        .eq("user_id", user.id)
        .eq("semana_iso", semana_iso)
        .maybeSingle();
      if (cached) {
        return NextResponse.json({ semana_iso: cached.semana_iso, contenido: cached.contenido });
      }
    }

    // Load profile
    const { data: perfil } = await supabase
      .from("profiles")
      .select("nombre, carrera_clave, modelo, semestre")
      .eq("id", user.id)
      .maybeSingle();

    if (!perfil) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Load enrolled classes
    const { data: materias } = await supabase
      .from("materias_inscritas")
      .select("clave, nombre, creditos, prioridad")
      .eq("user_id", user.id);

    // Load upcoming events (next 7 days)
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const { data: eventos } = await supabase
      .from("eventos")
      .select("titulo, fecha_inicio, fecha_fin")
      .eq("user_id", user.id)
      .gte("fecha_inicio", now.toISOString())
      .lte("fecha_inicio", weekLater.toISOString())
      .order("fecha_inicio", { ascending: true });

    const ctx: CoachContext = {
      perfil: {
        nombre: perfil.nombre ?? "Estudiante",
        carrera_nombre: perfil.carrera_clave ?? "",
        modelo: perfil.modelo ?? "tec21",
        semestre: perfil.semestre ?? 1,
      },
      semana_actual: getISOWeek(now),
      materias: (materias ?? []).map((m) => ({
        clave: m.clave,
        nombre: m.nombre ?? m.clave,
        creditos: m.creditos ?? 0,
        prioridad: m.prioridad ?? 3,
      })),
      eventos_proximos: (eventos ?? []).map((e) => ({
        titulo: e.titulo,
        inicio: e.fecha_inicio,
        fin: e.fecha_fin,
      })),
    };

    const raw = await callGemini(buildCoachPrompt(ctx)) as {
      mensaje: string;
      prioridades: unknown[];
      bloques_sugeridos: Array<{ inicio_iso: string; fin_iso: string; [key: string]: unknown }>;
    };

    // Conflict resolution
    const eventRanges = (eventos ?? []).map((e) => ({ inicio: e.fecha_inicio, fin: e.fecha_fin }));
    raw.bloques_sugeridos = resolveConflicts(raw.bloques_sugeridos, eventRanges);

    // Cache in Supabase
    await supabase.from("insights").upsert(
      { user_id: user.id, semana_iso, contenido: raw },
      { onConflict: "user_id,semana_iso" },
    );

    return NextResponse.json({ semana_iso, contenido: raw });
  } catch (err) {
    console.error("[insights/generate]", err);
    return NextResponse.json(
      { error: "Failed to generate insight" },
      { status: 500 },
    );
  }
}
