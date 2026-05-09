"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const TYPEWRITER_TARGET_MS = 2400;
const MIN_STEP_MS = 12;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CoachMessage({ mensaje }: { mensaje: string }) {
  const [revealed, setRevealed] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setRevealed(mensaje.length);
      setDone(true);
      return;
    }

    setRevealed(0);
    setDone(false);
    const total = mensaje.length;
    const step = Math.max(MIN_STEP_MS, Math.floor(TYPEWRITER_TARGET_MS / Math.max(total, 1)));
    const id = window.setInterval(() => {
      setRevealed((prev) => {
        const next = prev + 1;
        if (next >= total) {
          window.clearInterval(id);
          setDone(true);
          return total;
        }
        return next;
      });
    }, step);

    return () => window.clearInterval(id);
  }, [mensaje]);

  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-5 ring-1 ring-foreground/5 shadow-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-500">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-gemini-gradient text-white shadow-md">
          <Sparkles className="size-5" />
        </span>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Mensaje del coach
          </p>
          <p className="text-base leading-7 text-foreground">
            {mensaje.slice(0, revealed)}
            {!done && (
              <span
                aria-hidden
                className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-gemini-blue align-middle"
              />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
