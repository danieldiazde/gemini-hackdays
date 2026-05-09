import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clave: string }> },
) {
  const { clave } = await params;

  if (!clave) {
    return NextResponse.json(
      { error: "carreraClave requerido" },
      { status: 400 },
    );
  }

  try {
    const supabase = await getSupabaseServer({ allowCookieWriteFailure: true });
    const { data, error } = await supabase
      .from("planes_estudio")
      .select("carrera_clave, nombre, data")
      .eq("carrera_clave", clave)
      .maybeSingle();

    if (error) {
      console.error("[api/planes] supabase error:", error.message);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      carreraClave: data.carrera_clave,
      nombre: data.nombre,
      data: data.data,
    });
  } catch (err) {
    console.error("[api/planes] unexpected:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
