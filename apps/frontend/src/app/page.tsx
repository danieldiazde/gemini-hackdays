import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gemini-bg">
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-8 px-6 text-center">
        <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
          MLH · RoBorregos · Gemini Hackdays
        </span>

        <h1 className="bg-gemini-gradient bg-clip-text text-5xl font-semibold tracking-tight text-balance text-transparent sm:text-6xl">
          TecCoach
        </h1>

        <p className="max-w-xl text-lg leading-8 text-muted-foreground">
          Foundation listo. Inter cargada, paleta Gemini activa, shadcn/ui
          operativo. La landing real llega en la TAREA 2.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button className="bg-gemini-gradient text-white shadow-md hover:opacity-90">
            <Sparkles className="size-4" />
            Botón con gradiente Gemini
          </Button>
          <Button variant="outline">Botón outline</Button>
        </div>

        <div className="mt-4 h-2 w-64 rounded-full bg-gemini-gradient" />
      </section>
    </main>
  );
}
