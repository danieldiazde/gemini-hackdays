import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await getSupabaseServer({ allowCookieWriteFailure: true });
    const { data, error } = await supabase
      .from("planes_estudio")
      .select("carrera_clave, nombre")
      .order("carrera_clave", { ascending: true });

    if (error) {
      console.error("[api/planes] supabase error:", error.message);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    const carreras = (data ?? []).map((row) => ({
      carreraClave: row.carrera_clave,
      nombre: row.nombre ?? row.carrera_clave,
    }));

    return NextResponse.json({ carreras });
  } catch (err) {
    console.error("[api/planes] unexpected:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
