"use client";

import { useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getSupabaseBrowser } from "@/lib/supabase/client";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export function LoginButton() {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const supabase = getSupabaseBrowser();
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          scopes: GOOGLE_SCOPES,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        toast.error("No pudimos iniciar sesión", {
          description: error.message,
        });
        setPending(false);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.";
      toast.error("Configuración pendiente", { description: message });
      setPending(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={pending}
      size="lg"
      className="bg-gemini-gradient h-12 px-6 text-base font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-70"
    >
      {pending ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <LogIn className="size-5" />
      )}
      {pending ? "Conectando…" : "Iniciar sesión con Google"}
    </Button>
  );
}
