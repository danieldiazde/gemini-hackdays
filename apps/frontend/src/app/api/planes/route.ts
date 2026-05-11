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
      return NextResponse.json(
        { error: "No pudimos cargar las carreras." },
        { status: 500 },
      );
    }

    const carreras = (data ?? []).map((row) => ({
      carreraClave: row.carrera_clave,
      nombre: row.nombre ?? row.carrera_clave,
    }));

    // Catalog data is essentially static (changes when we re-seed planes).
    // Tell browsers + CDN edges to hold it for 5 minutes with a long
    // stale-while-revalidate window.
    return NextResponse.json(
      { carreras },
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
