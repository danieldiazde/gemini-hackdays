import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase/server";
import {
  parseOrFail,
  profileSetupBodySchema,
} from "@/lib/validation/schemas";

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

    const raw = await request.json().catch(() => null);
    const parsed = parseOrFail(profileSetupBodySchema, raw);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const body = parsed.data;

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
    if (profileError) {
      console.error("[profile/setup] supabase:", profileError.message);
      return NextResponse.json(
        { error: "No pudimos guardar tu perfil." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[profile/setup]", err);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 },
    );
  }
}
