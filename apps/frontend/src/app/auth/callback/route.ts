import { NextResponse, type NextRequest } from "next/server";

import { isUserAllowed } from "@/lib/auth/access";
import { getSupabaseServer } from "@/lib/supabase/server";

const ALLOWED_NEXT_PATHS = new Set(["/onboarding", "/dashboard"]);

function getSafeNextPath(next: string | null) {
  if (!next || !ALLOWED_NEXT_PATHS.has(next)) {
    return null;
  }
  return next;
}


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
    return NextResponse.redirect(`${origin}/?error=auth_exchange_failed`);
  }

  const safeNext = getSafeNextPath(next);
  if (safeNext) {
    return NextResponse.redirect(`${origin}${safeNext}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/?error=no_user`);
  }

  if (!isUserAllowed(user)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/?error=access_denied`);
  }

  // If profile lookup fails or is incomplete, send the user through onboarding.
  let needsOnboarding = true;
  try {
    const { data, error: lookupError } = await supabase
      .from("profiles")
      .select("semestre")
      .eq("id", user.id)
      .maybeSingle();

    if (!lookupError && data?.semestre != null) {
      needsOnboarding = false;
    }
  } catch {
    // Treat lookup failures as incomplete onboarding.
  }

  return NextResponse.redirect(
    `${origin}${needsOnboarding ? "/onboarding" : "/dashboard"}`,
  );
}
