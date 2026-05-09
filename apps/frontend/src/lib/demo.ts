/**
 * Demo mode lets us hydrate every screen from local fixtures, with no
 * Supabase / Google / Gemini credentials. Triggered by `?demo=1` in the URL or
 * `NEXT_PUBLIC_DEMO_MODE=1` in the environment. Phase 5 wires this everywhere;
 * Phase 2 just exports the helper so later phases can drop it in without
 * another round-trip.
 */
export function isDemoMode(searchParams?: URLSearchParams | null): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "1") {
    return true;
  }
  return searchParams?.get("demo") === "1";
}
