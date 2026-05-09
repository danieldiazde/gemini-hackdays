import {
  CalendarRange,
  GraduationCap,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { LoginButton } from "@/components/auth/LoginButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: GraduationCap,
    title: "Entiende Tec21",
    description:
      "Sabe de Semanas Tec, materias life y bloques académicos. Tus prioridades respetan tu modelo educativo.",
  },
  {
    icon: CalendarRange,
    title: "Conecta Canvas + Calendar",
    description:
      "Sincroniza entregas de Canvas y eventos de Google Calendar. Sin compartir contraseñas del Tec.",
  },
  {
    icon: WandSparkles,
    title: "Bloques con un click",
    description:
      "Aprueba los bloques sugeridos y se crean directo en tu Google Calendar. Sin copiar y pegar.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gemini-bg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[480px] max-w-5xl bg-gemini-gradient opacity-15 blur-3xl"
      />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="bg-gemini-gradient bg-clip-text text-xl font-bold tracking-tight text-transparent">
            TecCoach
          </span>
        </div>
        <span className="hidden rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm sm:inline-block">
          MLH · RoBorregos · Gemini Hackdays
        </span>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 pt-10 pb-16 text-center sm:pt-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-gemini-blue/30 bg-card/80 px-3 py-1 text-xs font-medium text-gemini-blue shadow-sm backdrop-blur motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500">
          <Sparkles className="size-3.5" />
          Tu coach académico, impulsado por Gemini
        </span>

        <h1 className="text-balance text-5xl font-semibold tracking-tight text-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-700 sm:text-6xl md:text-7xl">
          Estudia lo correcto,{" "}
          <span className="bg-gemini-gradient bg-clip-text text-transparent">
            en el momento correcto
          </span>
          .
        </h1>

        <p className="max-w-2xl text-balance text-lg leading-8 text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-700 motion-safe:delay-150">
          TecCoach lee tu carga real desde Canvas y Google Calendar, entiende tu
          plan Tec21 y te dice qué estudiar esta semana, cuándo y por qué.
          Aprueba los bloques sugeridos y se agendan con un click.
        </p>

        <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-500 motion-safe:delay-300">
          <LoginButton />
        </div>

        <p className="text-xs text-muted-foreground">
          Solo Google OAuth. Nunca pedimos tus credenciales del Tec.
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, description }, i) => (
          <Card
            key={title}
            style={{ animationDelay: `${400 + i * 100}ms` }}
            className="bg-card/90 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both"
          >
            <CardHeader>
              <div className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-gemini-gradient text-white shadow-sm">
                <Icon className="size-5" />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </section>
    </main>
  );
}
