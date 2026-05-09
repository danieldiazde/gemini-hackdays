import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase/server";

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  if (hasSupabaseConfig()) {
    const supabase = await getSupabaseServer({
      allowCookieWriteFailure: true,
    });
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      redirect("/?error=auth_required");
    }
  }

  return (
    <div className="min-h-screen bg-gemini-bg">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="bg-gemini-gradient bg-clip-text text-lg font-bold tracking-tight text-transparent">
            TecCoach
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
