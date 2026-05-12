"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

function fireApplyConfetti() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#1A73E8", "#9168C0", "#D96570", "#E94235"];
  const origin = { x: 0.85, y: 0.92 };
  confetti({
    particleCount: 70,
    spread: 65,
    startVelocity: 38,
    origin,
    colors,
    scalar: 0.9,
  });
  window.setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 90,
      startVelocity: 28,
      origin,
      colors,
      scalar: 0.7,
    });
  }, 180);
}
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type {
  BloqueSugerido,
  CalendarCreateBody,
  CalendarCreateResponse,
} from "@/lib/types/insights";

function describeBlock(b: BloqueSugerido) {
  const start = parseISO(b.inicio_iso);
  const end = parseISO(b.fin_iso);
  return `${format(start, "EEEE d 'de' MMMM, HH:mm", { locale: es })} – ${format(end, "HH:mm")}`;
}

export function ApplyBlocksButton({
  bloques,
  selectedKeys,
  demoMode = false,
}: {
  bloques: BloqueSugerido[];
  selectedKeys: Set<string>;
  demoMode?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const selectedBlocks = bloques.filter((b) =>
    selectedKeys.has(`${b.inicio_iso}::${b.titulo}`),
  );
  const count = selectedBlocks.length;
  const disabled = count === 0;

  async function handleConfirm() {
    if (selectedBlocks.length === 0) return;
    if (pending) return;

    const body: CalendarCreateBody = {
      events: selectedBlocks.map((b) => ({
        titulo: b.titulo,
        descripcion: `${b.razon}\n\nSugerido por TecCoach.`,
        inicio: b.inicio_iso,
        fin: b.fin_iso,
      })),
    };

    setPending(true);
    try {
      if (demoMode) {
        toast.success("Modo demo: bloques aplicados", {
          description: `Habríamos creado ${count} ${count === 1 ? "evento" : "eventos"} en tu Google Calendar.`,
        });
        fireApplyConfetti();
        setOpen(false);
        return;
      }

      const res = await fetch("/api/calendar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `status ${res.status}`);
      }

      const json = (await res.json()) as CalendarCreateResponse;
      toast.success(
        `${json.created} ${json.created === 1 ? "bloque agendado" : "bloques agendados"}`,
        {
          description:
            selectedBlocks[0] && `Primer bloque: ${selectedBlocks[0].titulo}`,
        },
      );

      fireApplyConfetti();
      setOpen(false);
      router.refresh();
    } catch (err) {
      const description =
        err instanceof Error
          ? err.message
          : "Inténtalo de nuevo en un momento.";
      toast.error("No pudimos agendar los bloques", { description });
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        disabled={disabled}
        className="fixed right-6 z-30 inline-flex items-center gap-2 rounded-full bg-gemini-gradient px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-gemini-blue/25 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ bottom: "max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom)))" }}
      >
        <CalendarPlus className="size-4" />
        {disabled
          ? "Selecciona bloques"
          : `Aplicar ${count} ${count === 1 ? "bloque" : "bloques"}`}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {demoMode
              ? "Simular bloques en Google Calendar"
              : "Crear bloques en Google Calendar"}
          </DialogTitle>
          <DialogDescription>
            {demoMode
              ? `Modo demo: se simularían ${count} ${count === 1 ? "evento" : "eventos"} sin escribir en Google Calendar.`
              : `Vamos a agregar ${count} ${count === 1 ? "evento" : "eventos"} a tu calendario primario. Puedes editarlos o borrarlos desde Google Calendar después.`}
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {selectedBlocks.map((b) => (
            <li
              key={`${b.inicio_iso}::${b.titulo}`}
              className="rounded-md border border-border p-3"
            >
              <p className="text-sm font-medium">{b.titulo}</p>
              <p className="text-xs text-muted-foreground">
                {describeBlock(b)}
              </p>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="bg-gemini-gradient text-white shadow-md hover:opacity-90"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Creando…
              </>
            ) : (
              <>
                <CalendarPlus className="size-4" /> Confirmar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
