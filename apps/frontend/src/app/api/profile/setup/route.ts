import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      matricula: string;
      nombre: string;
      carreraClave: string;
      modelo: string;
      semestre: number;
      semestreInicio?: string;
      materias: Array<{ clave: string; nombre: string; creditos: number; prioridad?: number }>;
      canvasIcalUrl?: string;
    };

    // Upsert profile
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        matricula: body.matricula,
        nombre: body.nombre,
        carrera_clave: body.carreraClave,
        modelo: body.modelo,
        semestre: body.semestre,
        semestre_inicio: body.semestreInicio ?? null,
        canvas_ical_url: body.canvasIcalUrl ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (profileError) throw profileError;

    // Replace enrolled classes
    await supabase.from("materias_inscritas").delete().eq("user_id", user.id);
    if (body.materias.length > 0) {
      const { error: materiasError } = await supabase.from("materias_inscritas").insert(
        body.materias.map((m) => ({
          user_id: user.id,
          clave: m.clave,
          nombre: m.nombre,
          creditos: m.creditos,
          prioridad: m.prioridad ?? 3,
        })),
      );
      if (materiasError) throw materiasError;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[profile/setup]", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
