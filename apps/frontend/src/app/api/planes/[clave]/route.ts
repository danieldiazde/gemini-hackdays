import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clave: string }> },
) {
  const { clave: rawClave } = await params;

  if (!rawClave) {
    return NextResponse.json(
      { error: "carreraClave requerido" },
      { status: 400 },
    );
  }
  // Database keys are uppercase (e.g. ITC26). Accept any casing from the URL.
  const clave = rawClave.toUpperCase();

  try {
    const supabase = await getSupabaseServer({ allowCookieWriteFailure: true });
    const { data, error } = await supabase
      .from("planes_estudio")
      .select("carrera_clave, nombre, data")
      .eq("carrera_clave", clave)
      .maybeSingle();

    if (error) {
      console.error("[api/planes] supabase error:", error.message);
      return NextResponse.json(
        { error: "No pudimos cargar el plan." },
        { status: 500 },
      );
    }
    if (!data) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    return NextResponse.json(
      {
        carreraClave: data.carrera_clave,
        nombre: data.nombre,
        data: data.data,
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (err) {
    console.error("[api/planes] unexpected:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
