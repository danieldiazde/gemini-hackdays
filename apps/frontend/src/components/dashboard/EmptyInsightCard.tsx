"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, WandSparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EmptyInsightCard() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const autoTriggered = useRef(false);

  async function handleGenerate(force = false) {
    setPending(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRefresh: force }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `status ${res.status}`);
      }
      toast.success("Tu semana está lista");
      router.refresh();
    } catch (err) {
      const description =
        err instanceof Error ? err.message : "Inténtalo de nuevo en un momento.";
      setErrorMessage(description);
      toast.error("No pudimos generar tus insights", { description });
      setPending(false); // only reset on error; success path triggers refresh
    }
  }

  // Auto-trigger generation once per browser session. We persist a flag in
  // sessionStorage so navigating away and coming back, or React Strict-mode
  // double mounts, don't repeatedly drain Gemini quota when generation keeps
  // failing. The user can still manually retry with the button.
  useEffect(() => {
    if (autoTriggered.current) return;
    autoTriggered.current = true;
    if (typeof window === "undefined") return;
    const KEY = "teccoach.insight_auto_attempt";
    if (window.sessionStorage.getItem(KEY) === "done") return;
    window.sessionStorage.setItem(KEY, "done");
    void handleGenerate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="mx-auto max-w-xl text-center">
      <CardHeader className="items-center gap-3">
        <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gemini-gradient text-white shadow-md">
          {pending ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <WandSparkles className="size-6" />
          )}
        </span>
        <CardTitle className="text-xl">
          {pending ? "Generando tu semana…" : "Vamos a planear tu semana"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-4">
        <p className="text-sm text-muted-foreground">
          {pending
            ? "Gemini está analizando tu horario, materias y entregas. Toma 5-15 segundos."
            : "Gemini va a analizar tus materias, tus entregas en Canvas y tu calendario para sugerir qué estudiar y cuándo."}
        </p>
        {errorMessage && (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {errorMessage}
          </p>
        )}
        <Button
          type="button"
          onClick={() => handleGenerate(true)}
          disabled={pending}
          className="bg-gemini-gradient text-white shadow-md hover:opacity-90"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Generando…
            </>
          ) : (
            <>
              <WandSparkles className="size-4" />{" "}
              {errorMessage ? "Reintentar" : "Generar mi semana"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
