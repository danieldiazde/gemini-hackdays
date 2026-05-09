"use client";

import { useState } from "react";
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

  async function handleGenerate() {
    setPending(true);
    try {
      const res = await fetch("/api/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRefresh: false }),
      });

      if (res.status === 404) {
        toast.info("Aún no hay backend de insights", {
          description: "Mientras llega Persona B, usa modo demo (?demo=1).",
        });
        return;
      }
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `status ${res.status}`);
      }
      toast.success("Tu semana está lista");
      router.refresh();
    } catch (err) {
      const description =
        err instanceof Error
          ? err.message
          : "Inténtalo de nuevo en un momento.";
      toast.error("No pudimos generar tus insights", { description });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="mx-auto max-w-xl text-center">
      <CardHeader className="items-center gap-3">
        <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gemini-gradient text-white shadow-md">
          <WandSparkles className="size-6" />
        </span>
        <CardTitle className="text-xl">Vamos a planear tu semana</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Gemini va a analizar tus materias, tus entregas en Canvas y tu
          calendario para sugerir qué estudiar y cuándo.
        </p>
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={pending}
          className="bg-gemini-gradient text-white shadow-md hover:opacity-90"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Generando…
            </>
          ) : (
            <>
              <WandSparkles className="size-4" /> Generar mi semana
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
