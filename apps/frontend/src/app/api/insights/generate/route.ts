import { NextRequest, NextResponse } from "next/server";
import { getISOWeek, getYear, isValid, parseISO } from "date-fns";

import { getGeminiClient, FLASH_MODEL } from "@/lib/gemini/client";
import {
  buildCoachPrompt,
  INSIGHT_RESPONSE_SCHEMA,
  type CoachContext,
  type EventoCtx,
  type MateriaCtx,
} from "@/lib/gemini/prompts";
import { resolveConflicts } from "@/lib/scheduling/conflicts";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  extractClavesFromText,
  getPeriodoActivo,
  type MateriaConPeriodos,
} from "@/lib/tec21/calendar";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  insightContenidoSchema,
  insightsGenerateBodySchema,
  parseOrFail,
} from "@/lib/validation/schemas";

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
    if (!text.trim()) {
      throw new Error("Gemini returned empty response");
    }
    return JSON.parse(text);
  } catch (err) {
    if (attempt < 2) {
      // Exponential backoff with jitter so concurrent failures don't all
      // retry on the same beat and stampede Gemini's rate limit.
      const base = 2 ** attempt * 1000;
      const jitter = Math.random() * 500;
      await new Promise((r) => setTimeout(r, base + jitter));
      return callGemini(prompt, attempt + 1);
    }
    throw err;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const parsedBody = parseOrFail(insightsGenerateBodySchema, rawBody);
    if (!parsedBody.ok) {
      return NextResponse.json({ error: parsedBody.error }, { status: 400 });
    }
    const forceRefresh = parsedBody.data.forceRefresh === true;

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = checkRateLimit({
      key: `insights:${user.id}`,
      limit: forceRefresh ? 2 : 4,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.ok) {
      return NextResponse.json(
        {
          error: `Demasiados intentos. Reintenta en ${limit.retryAfterSeconds} segundos.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfterSeconds),
          },
        },
      );
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
        return NextResponse.json({
          semana_iso: cached.semana_iso,
          contenido: cached.contenido,
        });
      }
    }

    const { data: perfil } = await supabase
      .from("profiles")
      .select("nombre, carrera_clave, modelo, semestre, periodo_inicio, periodo_fin")
      .eq("id", user.id)
      .maybeSingle();

    if (!perfil) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Materias with their periods (uploaded from MiTec PDF).
    const { data: materiasRows } = await supabase
      .from("materias_inscritas")
      .select("clave, nombre, creditos, prioridad, periodos")
      .eq("user_id", user.id);

    const enrolled: MateriaConPeriodos[] = (materiasRows ?? []).map((m) => ({
      clave: m.clave,
      nombre: m.nombre ?? m.clave,
      creditos: m.creditos ?? 0,
      prioridad: m.prioridad ?? 3,
      periodos: Array.isArray(m.periodos) ? m.periodos : [],
    }));

    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const { data: eventosRows } = await supabase
      .from("eventos")
      .select("titulo, fecha_inicio, fecha_fin, source")
      .eq("user_id", user.id)
      .gte("fecha_inicio", now.toISOString())
      .lte("fecha_inicio", weekLater.toISOString())
      .order("fecha_inicio", { ascending: true });

    // --- Compute current period from real schedule ---
    const periodo_activo = getPeriodoActivo(now, enrolled, perfil.periodo_inicio ?? null);

    // --- Filter to only materias active in the current period ---
    const activas = enrolled.filter((m) =>
      m.periodos.some((p) => {
        const t = now.getTime();
        const start = new Date(`${p.inicio}T00:00:00`).getTime();
        const end = new Date(`${p.fin}T00:00:00`).getTime() + 24 * 60 * 60 * 1000 - 1;
        return t >= start && t <= end;
      }),
    );

    const activasClaves = new Set(activas.map((m) => m.clave.toUpperCase().split(".")[0]));

    // --- Materias inferred from Canvas events ---
    const inferredClaves = new Set<string>();
    for (const ev of eventosRows ?? []) {
      if (ev.source !== "canvas") continue;
      for (const clave of extractClavesFromText(ev.titulo ?? "")) {
        if (!activasClaves.has(clave)) inferredClaves.add(clave);
      }
    }

    const materias: MateriaCtx[] = [
      ...activas.map((m) => ({
        clave: m.clave,
        nombre: m.nombre,
        creditos: m.creditos,
        prioridad: m.prioridad,
        es_semana_tec: m.periodos.some(
          (p) =>
            p.es_semana_tec &&
            new Date(`${p.inicio}T00:00:00`).getTime() <= now.getTime() &&
            now.getTime() <= new Date(`${p.fin}T00:00:00`).getTime() + 24 * 60 * 60 * 1000,
        ),
      })),
      ...[...inferredClaves].map((clave) => ({
        clave,
        nombre: clave,
        creditos: 0,
        prioridad: 4,
        inferida: true,
      })),
    ];

    const eventos_proximos: EventoCtx[] = (eventosRows ?? []).map((e) => ({
      titulo: e.titulo,
      inicio: e.fecha_inicio,
      fin: e.fecha_fin,
      fuente: (e.source ?? "manual") as EventoCtx["fuente"],
    }));

    const ctx: CoachContext = {
      perfil: {
        nombre: perfil.nombre ?? "Estudiante",
        carrera_nombre: perfil.carrera_clave ?? "",
        modelo: perfil.modelo ?? "tec21",
        semestre: perfil.semestre ?? 1,
      },
      periodo_activo,
      materias,
      eventos_proximos,
    };

    const raw = await callGemini(buildCoachPrompt(ctx));
    const parsedInsight = insightContenidoSchema.safeParse(raw);
    if (!parsedInsight.success) {
      console.error(
        "[insights/generate] invalid Gemini output:",
        parsedInsight.error.issues,
      );
      return NextResponse.json(
        { error: "Gemini devolvió una respuesta inválida. Inténtalo de nuevo." },
        { status: 502 },
      );
    }

    const contenido = parsedInsight.data;

    contenido.bloques_sugeridos = contenido.bloques_sugeridos.filter(
      (b) => isValid(parseISO(b.inicio_iso)) && isValid(parseISO(b.fin_iso)),
    );

    const eventRanges = (eventosRows ?? []).map((e) => ({
      inicio: e.fecha_inicio,
      fin: e.fecha_fin,
    }));
    contenido.bloques_sugeridos = resolveConflicts(
      contenido.bloques_sugeridos,
      eventRanges,
    );

    await supabase.from("insights").upsert(
      { user_id: user.id, semana_iso, contenido },
      { onConflict: "user_id,semana_iso" },
    );

    return NextResponse.json({ semana_iso, contenido });
  } catch (err) {
    console.error("[insights/generate]", err);
    return NextResponse.json(
      { error: "Failed to generate insight" },
      { status: 500 },
    );
  }
}
