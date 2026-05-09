"use client";

import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { IcalHelpDialog } from "@/components/onboarding/IcalHelpDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { isDemoMode } from "@/lib/demo";
import {
  CARRERAS_FIXTURE,
  getFixturePlan,
} from "@/lib/fixtures/planes";
import type {
  CarreraSummary,
  Materia,
  Modelo,
  PlanEstudio,
  ProfileSetupBody,
} from "@/lib/types/planes";

const MATRICULA_REGEX = /^A0\d{7}$/;
const ICAL_URL_REGEX = /^https:\/\/\S+\.ics(?:[?#]\S*)?$/i;
const TOTAL_STEPS = 3;
const SEMESTRES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type SelectedMateria = {
  clave: string;
  nombre: string;
  creditos: number;
  prioridad: number;
};

type State = {
  step: 1 | 2 | 3;
  nombre: string;
  matricula: string;
  carreraClave: string;
  modelo: Modelo | "";
  semestre: number | null;
  materias: Record<string, SelectedMateria>;
  canvasIcalUrl: string;
  submitting: boolean;
};

type Action =
  | { type: "SET"; field: keyof State; value: State[keyof State] }
  | { type: "TOGGLE_MATERIA"; materia: Materia }
  | { type: "SET_PRIORIDAD"; clave: string; prioridad: number }
  | { type: "RESET_MATERIAS" }
  | { type: "NEXT" }
  | { type: "BACK" };

const INITIAL: State = {
  step: 1,
  nombre: "",
  matricula: "",
  carreraClave: "",
  modelo: "",
  semestre: null,
  materias: {},
  canvasIcalUrl: "",
  submitting: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET":
      return { ...state, [action.field]: action.value };
    case "TOGGLE_MATERIA": {
      const { materia } = action;
      const next = { ...state.materias };
      if (next[materia.clave]) {
        delete next[materia.clave];
      } else {
        next[materia.clave] = {
          clave: materia.clave,
          nombre: materia.nombre,
          creditos: materia.creditos,
          prioridad: 3,
        };
      }
      return { ...state, materias: next };
    }
    case "SET_PRIORIDAD":
      if (!state.materias[action.clave]) return state;
      return {
        ...state,
        materias: {
          ...state.materias,
          [action.clave]: {
            ...state.materias[action.clave],
            prioridad: action.prioridad,
          },
        },
      };
    case "RESET_MATERIAS":
      return { ...state, materias: {} };
    case "NEXT":
      return { ...state, step: Math.min(TOTAL_STEPS, state.step + 1) as State["step"] };
    case "BACK":
      return { ...state, step: Math.max(1, state.step - 1) as State["step"] };
    default:
      return state;
  }
}

function isStepValid(step: number, state: State): boolean {
  if (step === 1) {
    return (
      state.nombre.trim().length >= 2 &&
      MATRICULA_REGEX.test(state.matricula.trim())
    );
  }
  if (step === 2) {
    return Boolean(state.carreraClave) && Boolean(state.modelo) && state.semestre != null;
  }
  if (step === 3) {
    return (
      Object.keys(state.materias).length >= 1 &&
      isCanvasIcalValid(state.canvasIcalUrl)
    );
  }
  return false;
}

function isCanvasIcalValid(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length === 0 || ICAL_URL_REGEX.test(trimmed);
}

function toDemoProfile(body: ProfileSetupBody) {
  const safeBody: Omit<ProfileSetupBody, "canvasIcalUrl"> = {
    matricula: body.matricula,
    nombre: body.nombre,
    carreraClave: body.carreraClave,
    modelo: body.modelo,
    semestre: body.semestre,
    materias: body.materias,
  };
  return safeBody;
}

export function OnboardingFlow() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [carreras, setCarreras] = useState<CarreraSummary[]>(CARRERAS_FIXTURE);
  const [plan, setPlan] = useState<PlanEstudio | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [usingFixture, setUsingFixture] = useState(false);

  // Try real /api/planes for the carrera list. Fall back to fixture on 404 or error.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/planes")
      .then(async (res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as { carreras: CarreraSummary[] };
        if (!cancelled && Array.isArray(json.carreras) && json.carreras.length > 0) {
          setCarreras(json.carreras);
          setUsingFixture(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUsingFixture(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch the plan for the selected carrera. Fall back to fixture on 404 / error.
  useEffect(() => {
    if (!state.carreraClave) {
      setPlan(null);
      return;
    }
    let cancelled = false;
    setPlanLoading(true);
    fetch(`/api/planes/${encodeURIComponent(state.carreraClave)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as PlanEstudio;
        if (!cancelled) {
          setPlan(json);
          setPlanLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          const fallback = getFixturePlan(state.carreraClave) ?? null;
          setPlan(fallback);
          setPlanLoading(false);
          setUsingFixture(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [state.carreraClave]);

  const semestreMaterias =
    plan?.data.semestres.find((s) => s.numero === state.semestre)?.materias ?? [];

  const canAdvance = !state.submitting && isStepValid(state.step, state);
  const progress = (state.step / TOTAL_STEPS) * 100;

  function handleNext() {
    if (state.submitting) return;
    if (state.step < TOTAL_STEPS) {
      dispatch({ type: "NEXT" });
    } else {
      void handleSubmit();
    }
  }

  async function handleSubmit() {
    if (!isStepValid(3, state) || !state.carreraClave || !state.modelo || state.semestre == null) {
      return;
    }
    if (state.submitting) return;

    const body: ProfileSetupBody = {
      matricula: state.matricula.trim(),
      nombre: state.nombre.trim(),
      carreraClave: state.carreraClave,
      modelo: state.modelo as Modelo,
      semestre: state.semestre,
      materias: Object.values(state.materias).map(({ clave, nombre, creditos, prioridad }) => ({
        clave,
        nombre,
        creditos,
        prioridad,
      })),
      canvasIcalUrl: state.canvasIcalUrl.trim() || undefined,
    };

    dispatch({ type: "SET", field: "submitting", value: true });

    const demo = isDemoMode(
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null,
    );
    if (demo) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "teccoach.demoProfile",
          JSON.stringify(toDemoProfile(body)),
        );
      }
      toast.success("Perfil guardado en modo demo", {
        description: "Saltando el backend para mantener el demo limpio.",
      });
      const next =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("demo") === "1"
          ? "/dashboard?demo=1"
          : "/dashboard";
      router.push(next);
      return;
    }

    try {
      const res = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        if (res.status === 404) {
          // Persona A's endpoint doesn't exist yet — persist locally so Phase 4
          // can read the profile.
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              "teccoach.demoProfile",
              JSON.stringify(toDemoProfile(body)),
            );
          }
          toast.success("Perfil guardado en modo demo", {
            description: "Lo conectamos al backend en cuanto esté listo.",
          });
          router.push("/dashboard");
          return;
        }
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `status ${res.status}`);
      }

      toast.success("Listo, ahora a estudiar", {
        description: "Tu perfil de TecCoach está configurado.",
      });
      router.push("/dashboard");
    } catch (err) {
      const description =
        err instanceof Error ? err.message : "Inténtalo de nuevo en un momento.";
      toast.error("No pudimos guardar tu perfil", { description });
      dispatch({ type: "SET", field: "submitting", value: false });
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Paso {state.step} de {TOTAL_STEPS}
          </span>
          {usingFixture && (
            <Badge variant="outline" className="border-gemini-blue/40 text-gemini-blue">
              <Sparkles className="size-3" /> Modo demo
            </Badge>
          )}
        </div>
        <Progress value={progress} className="h-2" />
        <CardTitle className="text-xl">
          {state.step === 1 && "Cuéntanos quién eres"}
          {state.step === 2 && "Tu carrera y tu semestre"}
          {state.step === 3 && "Tus materias y Canvas"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {state.step === 1 && <StepProfile state={state} dispatch={dispatch} />}
        {state.step === 2 && (
          <StepCareer state={state} dispatch={dispatch} carreras={carreras} />
        )}
        {state.step === 3 && (
          <StepClasses
            state={state}
            dispatch={dispatch}
            materias={semestreMaterias}
            loading={planLoading}
          />
        )}
      </CardContent>

      <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => dispatch({ type: "BACK" })}
          disabled={state.step === 1 || state.submitting}
        >
          <ArrowLeft className="size-4" /> Atrás
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={!canAdvance}
          className="bg-gemini-gradient text-white shadow-md hover:opacity-90 disabled:opacity-60"
        >
          {state.submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Guardando…
            </>
          ) : state.step === TOTAL_STEPS ? (
            <>
              <CheckCircle2 className="size-4" /> Terminar
            </>
          ) : (
            <>
              Siguiente <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

function StepProfile({
  state,
  dispatch,
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
}) {
  const matriculaInvalid =
    state.matricula.length > 0 && !MATRICULA_REGEX.test(state.matricula.trim());

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre completo</Label>
        <Input
          id="nombre"
          autoComplete="name"
          placeholder="Andrés Hernández"
          value={state.nombre}
          onChange={(e) => dispatch({ type: "SET", field: "nombre", value: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="matricula">Matrícula</Label>
        <Input
          id="matricula"
          inputMode="text"
          placeholder="A01234567"
          value={state.matricula}
          onChange={(e) =>
            dispatch({ type: "SET", field: "matricula", value: e.target.value.toUpperCase() })
          }
          aria-invalid={matriculaInvalid}
        />
        <p className="text-xs text-muted-foreground">
          Formato: A0 seguido de 7 dígitos (ej. A01234567).
        </p>
      </div>
    </div>
  );
}

function CarreraPicker({
  carreras,
  value,
  onChange,
}: {
  carreras: CarreraSummary[];
  value: string;
  onChange: (clave: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? carreras.filter(
        (c) =>
          c.carreraClave.toLowerCase().includes(query.toLowerCase()) ||
          c.nombre.toLowerCase().includes(query.toLowerCase()),
      )
    : carreras;

  const selected = carreras.find((c) => c.carreraClave === value);

  function handleSelect(clave: string) {
    onChange(clave);
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <GraduationCap className="size-3.5 text-muted-foreground" />
            <span className="font-semibold">{selected.carreraClave}</span>
            <span className="truncate text-xs text-muted-foreground">{selected.nombre}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">Elige tu carrera</span>
        )}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery(""); }}>
        <DialogContent
          className="flex max-h-[80vh] flex-col gap-0 p-0 sm:max-w-lg"
        >
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle>Elige tu carrera</DialogTitle>
          </DialogHeader>

          <div className="relative px-4 pb-2">
            <Search className="absolute left-7 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Buscar por siglas o nombre…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="overflow-y-auto px-2 pb-3">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Sin resultados.</p>
            ) : (
              <ul>
                {filtered.map((c) => (
                  <li key={c.carreraClave}>
                    <button
                      type="button"
                      onClick={() => handleSelect(c.carreraClave)}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition hover:bg-muted/60 ${
                        value === c.carreraClave ? "bg-gemini-blue/5 text-gemini-blue" : ""
                      }`}
                    >
                      <span className="w-14 shrink-0 text-sm font-bold">{c.carreraClave}</span>
                      <span className="text-sm text-muted-foreground">{c.nombre}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StepCareer({
  state,
  dispatch,
  carreras,
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  carreras: CarreraSummary[];
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Carrera</Label>
        <CarreraPicker
          carreras={carreras}
          value={state.carreraClave}
          onChange={(clave) => {
            dispatch({ type: "SET", field: "carreraClave", value: clave });
            dispatch({ type: "RESET_MATERIAS" });
          }}
        />
      </div>

      <div className="space-y-2">
        <Label>Modelo educativo</Label>
        <RadioGroup
          value={state.modelo}
          onValueChange={(value) =>
            dispatch({ type: "SET", field: "modelo", value: String(value) as Modelo })
          }
          className="grid grid-cols-2 gap-3"
        >
          {(
            [
              { value: "tec21", label: "TEC21", hint: "Modelo actual con Semanas Tec." },
              { value: "tec26", label: "TEC26", hint: "Nuevo modelo a partir de 2026." },
            ] as const
          ).map((opt) => (
            <Label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                state.modelo === opt.value
                  ? "border-gemini-blue/60 bg-gemini-blue/5"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <RadioGroupItem value={opt.value} className="mt-1" />
              <div>
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.hint}</p>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Semestre</Label>
        <Select
          value={state.semestre != null ? String(state.semestre) : ""}
          onValueChange={(value) => {
            dispatch({ type: "SET", field: "semestre", value: Number(value) });
            dispatch({ type: "RESET_MATERIAS" });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tu semestre actual" />
          </SelectTrigger>
          <SelectContent className="bg-card border border-border shadow-lg">
            {SEMESTRES.map((n) => (
              <SelectItem key={n} value={String(n)}>
                Semestre {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function StepClasses({
  state,
  dispatch,
  materias,
  loading,
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  materias: Materia[];
  loading: boolean;
}) {
  const canvasIcalInvalid = !isCanvasIcalValid(state.canvasIcalUrl);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <Label>Materias que cursas</Label>
          <span className="text-xs text-muted-foreground">
            {Object.keys(state.materias).length} seleccionadas
          </span>
        </div>

        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        )}

        {!loading && materias.length === 0 && (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            No hay materias para este semestre todavía. Cambia el semestre o
            avísanos.
          </p>
        )}

        {!loading && materias.length > 0 && (
          <ul className="space-y-2">
            {materias.map((m) => {
              const selected = state.materias[m.clave];
              return (
                <li
                  key={m.clave}
                  className={`rounded-md border p-3 transition ${
                    selected ? "border-gemini-blue/60 bg-gemini-blue/5" : "border-border"
                  }`}
                >
                  <Label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      className="mt-0.5"
                      checked={Boolean(selected)}
                      onCheckedChange={() => dispatch({ type: "TOGGLE_MATERIA", materia: m })}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{m.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {m.clave} · {m.creditos} créditos
                        </span>
                      </div>
                      {m.tipo !== "regular" && (
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          {m.tipo === "life" ? "Life course" : "Semana Tec"}
                        </Badge>
                      )}
                    </div>
                  </Label>

                  {selected && (
                    <div className="mt-3 flex items-center gap-3 pl-7">
                      <span className="text-xs font-medium text-muted-foreground">
                        Prioridad
                      </span>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[selected.prioridad]}
                        onValueChange={(v) =>
                          dispatch({
                            type: "SET_PRIORIDAD",
                            clave: m.clave,
                            prioridad: Array.isArray(v) ? v[0] : Number(v),
                          })
                        }
                        className="flex-1"
                      />
                      <span className="w-6 text-center text-sm font-semibold text-gemini-blue">
                        {selected.prioridad}
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="canvas">URL de Canvas iCal (opcional)</Label>
          <IcalHelpDialog />
        </div>
        <Input
          id="canvas"
          inputMode="url"
          placeholder="https://canvas.tec.mx/feeds/calendars/...ics"
          value={state.canvasIcalUrl}
          aria-invalid={canvasIcalInvalid}
          onChange={(e) =>
            dispatch({ type: "SET", field: "canvasIcalUrl", value: e.target.value })
          }
        />
        <p className="text-xs text-muted-foreground">
          Solo lectura. Debe ser una URL https que termine en .ics.
        </p>
      </div>
    </div>
  );
}
