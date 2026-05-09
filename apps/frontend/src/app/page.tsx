const priorities = [
  ["Compiladores", "Alta", "Entrega crítica en Canvas"],
  ["Bases de datos", "Media", "Examen en 5 días"],
  ["Semana Tec", "Baja", "Bloque corto de repaso"],
];

const planItems = [
  "Supabase Auth con Google OAuth",
  "Onboarding de carrera, semestre, materias e iCal Canvas",
  "Sync de Canvas iCal y Google Calendar",
  "Gemini structured output para insights semanales",
  "Dashboard con prioridades y bloques sugeridos",
  "Aplicar bloques aprobados a Google Calendar",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[--color-bg] text-[--color-fg]">
      <section className="mx-auto grid min-h-screen max-w-6xl content-center gap-8 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-medium text-[--color-accent]">
            MLH · RoBorregos · Gemini Hackdays
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance">
            TecCoach
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[--color-fg-dim]">
            Coach académico inteligente para alumnos del Tec. Conecta Canvas,
            Google Calendar y el contexto Tec21 para recomendar qué estudiar,
            cuándo estudiarlo y por qué.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#plan"
              className="rounded-md bg-[--color-accent] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-[--color-accent-hi]"
            >
              Ver plan
            </a>
            <a
              href="https://aistudio.google.com/app/apikey"
              className="rounded-md border border-[--color-border] px-4 py-2 text-sm font-semibold text-[--color-fg] transition hover:bg-[--color-panel]"
            >
              Gemini API key
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-[--color-border] bg-[--color-panel] p-5 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-[--color-border] pb-4">
            <div>
              <p className="text-sm text-[--color-fg-dim]">Semana actual</p>
              <h2 className="text-xl font-semibold">Prioridades de estudio</h2>
            </div>
            <span className="rounded-full bg-[--color-accent]/15 px-3 py-1 text-xs font-medium text-[--color-accent-hi]">
              Demo UI
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {priorities.map(([materia, urgencia, razon]) => (
              <div
                key={materia}
                className="rounded-md border border-[--color-border] bg-[--color-panel-hi] p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold">{materia}</h3>
                  <span className="text-sm text-[--color-accent-hi]">
                    {urgencia}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[--color-fg-dim]">{razon}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="plan"
        className="border-t border-[--color-border] bg-white text-slate-950"
      >
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-2xl font-semibold">Plan de implementación</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {planItems.map((item) => (
              <div key={item} className="rounded-md border border-slate-200 p-4">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
