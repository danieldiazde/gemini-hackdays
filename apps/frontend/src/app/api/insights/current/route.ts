import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getISOWeek, getYear } from "date-fns";

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const semana_iso = `${getYear(now)}-W${String(getISOWeek(now)).padStart(2, "0")}`;

    const { data } = await supabase
      .from("insights")
      .select("id, semana_iso, contenido, generated_at")
      .eq("user_id", user.id)
      .eq("semana_iso", semana_iso)
      .maybeSingle();

    return NextResponse.json({ insight: data ?? null });
  } catch (err) {
    console.error("[insights/current]", err);
    return NextResponse.json({ error: "Failed to fetch insight" }, { status: 500 });
  }
}
