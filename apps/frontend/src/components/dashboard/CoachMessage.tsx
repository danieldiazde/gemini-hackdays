import { Sparkles } from "lucide-react";

export function CoachMessage({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-5 ring-1 ring-foreground/5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-gemini-gradient text-white shadow-md">
          <Sparkles className="size-5" />
        </span>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Mensaje del coach
          </p>
          <p className="text-base leading-7 text-foreground">{mensaje}</p>
        </div>
      </div>
    </div>
  );
}
