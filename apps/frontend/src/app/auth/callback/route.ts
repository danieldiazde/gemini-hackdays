import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_code`);
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(error.message)}`,
    );
  }

  if (next) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/?error=no_user`);
  }

  // Persona A's `profiles` table may not exist yet. If the lookup fails for
  // any reason — missing table, missing row, null semestre — push the user
  // through onboarding and let them fill it in.
  let needsOnboarding = true;
  try {
    const { data, error: lookupError } = await supabase
      .from("profiles")
      .select("semestre")
      .eq("id", user.id)
      .maybeSingle();

    if (!lookupError && data && data.semestre != null) {
      needsOnboarding = false;
    }
  } catch {
    // table missing or RLS not configured yet — onboarding is the safe default
  }

  return NextResponse.redirect(
    `${origin}${needsOnboarding ? "/onboarding" : "/dashboard"}`,
  );
}
