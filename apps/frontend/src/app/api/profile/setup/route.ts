import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Light profile setup — only saves identity + carrera + modelo + semestre.
 * Materias and period dates come from the MiTec PDF parsed by
 * POST /api/profile/horario.
 */
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

    const body = (await request.json()) as {
      matricula?: string;
      nombre?: string;
      carreraClave: string;
      modelo: string;
      semestre: number;
      canvasIcalUrl?: string;
    };

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        matricula: body.matricula ?? null,
        nombre: body.nombre ?? null,
        carrera_clave: body.carreraClave,
        modelo: body.modelo,
        semestre: body.semestre,
        canvas_ical_url: body.canvasIcalUrl ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (profileError) throw profileError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[profile/setup]", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
