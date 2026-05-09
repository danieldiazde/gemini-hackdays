import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { requireEnv } from "@/lib/env";

type SupabaseServerOptions = {
  allowCookieWriteFailure?: boolean;
};

export async function getSupabaseServer(options: SupabaseServerOptions = {}) {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch (error) {
            if (!options.allowCookieWriteFailure) {
              throw error;
            }
            // Server Components cannot write cookies. Callers that opt into
            // this mode must rely on middleware to refresh the session.
          }
        },
      },
    },
  );
}
