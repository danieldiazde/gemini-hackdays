import { NextRequest, NextResponse } from "next/server";

import { parseHorarioPdf } from "@/lib/pdf/horario-parser";
import { getSupabaseServer } from "@/lib/supabase/server";

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("pdf");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing 'pdf' file" }, { status: 400 });
    }
    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: "PDF too large (max 10 MB)" }, { status: 413 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const parsed = await parseHorarioPdf(buffer);

    if (parsed.materias.length === 0) {
      return NextResponse.json(
        { error: "No materias found in PDF. ¿Es el horario correcto?" },
        { status: 422 },
      );
    }

    // Update profile period info. Don't touch nombre/matricula/carrera if they
    // already exist — onboarding step 1 set them.
    const profileUpdate: Record<string, unknown> = {
      id: user.id,
      periodo_nombre: parsed.periodo_nombre,
      periodo_inicio: parsed.periodo_inicio,
      periodo_fin: parsed.periodo_fin,
      updated_at: new Date().toISOString(),
    };
    if (parsed.matricula) profileUpdate.matricula = parsed.matricula;
    if (parsed.alumno_nombre) profileUpdate.nombre = parsed.alumno_nombre;

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profileUpdate, { onConflict: "id" });
    if (profileError) throw profileError;

    // Replace materias_inscritas with PDF data, but never wipe the user's
    // existing rows before the new ones are safely persisted. Snapshot the
    // current row IDs, insert new rows, and only after the insert succeeds
    // delete the snapshot. If the insert errors out, the user keeps their
    // previous schedule.
    const { data: existingRows } = await supabase
      .from("materias_inscritas")
      .select("id")
      .eq("user_id", user.id);

    const rows = parsed.materias.map((m) => ({
      user_id: user.id,
      clave: m.clave_completa, // keep section info to match Canvas titles
      nombre: m.nombre,
      crn: m.crn,
      creditos: 0,
      prioridad: m.periodos.some((p) => p.es_semana_tec) ? 5 : 3,
      periodos: m.periodos,
    }));

    const { error: materiasError } = await supabase
      .from("materias_inscritas")
      .insert(rows);
    if (materiasError) throw materiasError;

    if (existingRows && existingRows.length > 0) {
      await supabase
        .from("materias_inscritas")
        .delete()
        .in(
          "id",
          existingRows.map((r) => r.id),
        );
    }

    return NextResponse.json({
      success: true,
      alumno: parsed.alumno_nombre,
      matricula: parsed.matricula,
      periodo: parsed.periodo_nombre,
      materias: parsed.materias.length,
    });
  } catch (err) {
    console.error("[profile/horario]", err);
    const message = err instanceof Error ? err.message : "Failed to parse PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
