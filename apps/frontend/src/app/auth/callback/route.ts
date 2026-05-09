import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseServer } from "@/lib/supabase/server";

const ALLOWED_NEXT_PATHS = new Set(["/onboarding", "/dashboard"]);

function getSafeNextPath(next: string | null) {
  if (!next || !ALLOWED_NEXT_PATHS.has(next)) {
    return null;
  }
  return next;
}

function isMissingProfilesTable(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "42P01" ||
    /relation .*profiles.* does not exist/i.test(error?.message ?? "")
  );
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

    if (lookupError && !isMissingProfilesTable(lookupError)) {
      return NextResponse.redirect(`${origin}/?error=profile_lookup_failed`);
    }

    if (!lookupError && data?.semestre != null) {
      needsOnboarding = false;
    }
  } catch {
    return NextResponse.redirect(`${origin}/?error=profile_lookup_failed`);
  }

  return NextResponse.redirect(
    `${origin}${needsOnboarding ? "/onboarding" : "/dashboard"}`,
  );
}
