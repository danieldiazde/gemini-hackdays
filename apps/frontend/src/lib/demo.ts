/**
 * Demo mode lets us hydrate every screen from local fixtures and bypass auth,
 * with no Supabase / Google / Gemini credentials. Two ways to trigger it:
 *
 * - `NEXT_PUBLIC_DEMO_MODE=1` in the environment (server + client).
 *   Required for Server Components and the (app) auth gate, since layouts
 *   can't see `?demo=1` in the URL.
 * - `?demo=1` in the URL. Useful for ad-hoc demo recovery on a deployed env
 *   that has Supabase configured. Read by pages from `searchParams`.
 */
export function isDemoModeEnv(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "1";
}

export function isDemoMode(searchParams?: URLSearchParams | null): boolean {
  if (isDemoModeEnv()) return true;
  return searchParams?.get("demo") === "1";
}
