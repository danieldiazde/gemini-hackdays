"use client";

import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FileUp,
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
import { isDemoMode } from "@/lib/demo";
import { CARRERAS_FIXTURE } from "@/lib/fixtures/planes";
import type { CarreraSummary, Modelo } from "@/lib/types/planes";

const MATRICULA_REGEX = /^A0\d{7}$/;
const ICAL_URL_REGEX = /^https:\/\/\S+\.ics(?:[?#]\S*)?$/i;
const TOTAL_STEPS = 3;
const SEMESTRES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type State = {
  step: 1 | 2 | 3;
  nombre: string;
  matricula: string;
  carreraClave: string;
  modelo: Modelo | "";
  semestre: number | null;
  pdfFile: File | null;
  canvasIcalUrl: string;
  submitting: boolean;
};

type Action =
  | { type: "SET"; field: keyof State; value: State[keyof State] }
  | { type: "NEXT" }
  | { type: "BACK" };

const INITIAL: State = {
  step: 1,
  nombre: "",
  matricula: "",
  carreraClave: "",
  modelo: "",
  semestre: null,
  pdfFile: null,
  canvasIcalUrl: "",
  submitting: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET":
      return { ...state, [action.field]: action.value };
    case "NEXT":
      return {
        ...state,
        step: Math.min(TOTAL_STEPS, state.step + 1) as State["step"],
      };
    case "BACK":
      return {
        ...state,
        step: Math.max(1, state.step - 1) as State["step"],
      };
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
    return (
      Boolean(state.carreraClave) &&
      Boolean(state.modelo) &&
      state.semestre != null
    );
  }
  if (step === 3) {
    return Boolean(state.pdfFile) && isCanvasIcalValid(state.canvasIcalUrl);
  }
  return false;
}

function isCanvasIcalValid(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length === 0 || ICAL_URL_REGEX.test(trimmed);
}

export function OnboardingFlow() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [carreras, setCarreras] = useState<CarreraSummary[]>(CARRERAS_FIXTURE);
  const [usingFixture, setUsingFixture] = useState(false);

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
        if (!cancelled) setUsingFixture(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (!isStepValid(3, state) || !state.carreraClave || !state.modelo || state.semestre == null || !state.pdfFile) {
      return;
    }
    if (state.submitting) return;

    dispatch({ type: "SET", field: "submitting", value: true });

    const demo = isDemoMode(
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null,
    );
    if (demo) {
      toast.success("Modo demo: saltando backend", {
        description: "El horario no se sube en demo.",
      });
      router.push("/dashboard?demo=1");
      return;
    }

    try {
      // Step A: save profile basics
      const setupRes = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matricula: state.matricula.trim(),
          nombre: state.nombre.trim(),
          carreraClave: state.carreraClave,
          modelo: state.modelo as Modelo,
          semestre: state.semestre,
          canvasIcalUrl: state.canvasIcalUrl.trim() || undefined,
        }),
      });
      if (!setupRes.ok) throw new Error(`Profile setup failed (${setupRes.status})`);

      // Step B: upload PDF horario
      toast.info("Procesando tu horario con Gemini…");
      const formData = new FormData();
      formData.append("pdf", state.pdfFile);
      const horarioRes = await fetch("/api/profile/horario", {
        method: "POST",
        body: formData,
      });
      if (!horarioRes.ok) {
        const err = await horarioRes.json().catch(() => ({}));
        throw new Error(err.error ?? `Horario upload failed (${horarioRes.status})`);
      }
      const horarioJson = (await horarioRes.json()) as {
        materias: number;
        periodo: string | null;
      };

      toast.success("Listo, vamos al dashboard", {
        description: `${horarioJson.materias} materias detectadas. ${horarioJson.periodo ?? ""}`,
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
            <Badge
              variant="outline"
              className="border-gemini-blue/40 text-gemini-blue"
            >
              <Sparkles className="size-3" /> Modo demo
            </Badge>
          )}
        </div>
        <Progress value={progress} className="h-2" />
        <CardTitle className="text-xl">
          {state.step === 1 && "Cuéntanos quién eres"}
          {state.step === 2 && "Tu carrera"}
          {state.step === 3 && "Sube tu horario"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {state.step === 1 && <StepProfile state={state} dispatch={dispatch} />}
        {state.step === 2 && (
          <StepCareer state={state} dispatch={dispatch} carreras={carreras} />
        )}
        {state.step === 3 && <StepHorario state={state} dispatch={dispatch} />}
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
              <Loader2 className="size-4 animate-spin" /> Procesando…
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
          onChange={(e) =>
            dispatch({ type: "SET", field: "nombre", value: e.target.value })
          }
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
            <span className="truncate text-xs text-muted-foreground">
              {selected.nombre}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">Elige tu carrera</span>
        )}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setQuery("");
        }}
      >
        <DialogContent className="flex max-h-[80vh] flex-col gap-0 p-0 sm:max-w-lg">
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
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sin resultados.
              </p>
            ) : (
              <ul>
                {filtered.map((c) => (
                  <li key={c.carreraClave}>
                    <button
                      type="button"
                      onClick={() => handleSelect(c.carreraClave)}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition hover:bg-muted/60 ${
                        value === c.carreraClave
                          ? "bg-gemini-blue/5 text-gemini-blue"
                          : ""
                      }`}
                    >
                      <span className="w-14 shrink-0 text-sm font-bold">
                        {c.carreraClave}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {c.nombre}
                      </span>
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
          onChange={(clave) =>
            dispatch({ type: "SET", field: "carreraClave", value: clave })
          }
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
          onValueChange={(value) =>
            dispatch({ type: "SET", field: "semestre", value: Number(value) })
          }
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

function StepHorario({
  state,
  dispatch,
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
}) {
  const canvasIcalInvalid = !isCanvasIcalValid(state.canvasIcalUrl);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.type !== "application/pdf") {
      toast.error("El archivo debe ser PDF");
      return;
    }
    dispatch({ type: "SET", field: "pdfFile", value: file });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Horario oficial (PDF de MiTec)</Label>
        <p className="text-xs text-muted-foreground">
          Entra a <code>mitec.itesm.mx → Horarios</code> y descarga el PDF.
          Lo procesamos con Gemini para detectar tus materias y los bloques
          Tec21 reales — incluyendo Semanas Tec.
        </p>
        <label
          htmlFor="pdf-upload"
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition ${
            state.pdfFile
              ? "border-gemini-blue/60 bg-gemini-blue/5"
              : "border-border hover:bg-muted/40"
          }`}
        >
          {state.pdfFile ? (
            <>
              <CheckCircle2 className="size-8 text-gemini-blue" />
              <span className="text-sm font-medium">{state.pdfFile.name}</span>
              <span className="text-xs text-muted-foreground">
                {(state.pdfFile.size / 1024).toFixed(0)} KB
              </span>
              <span className="text-xs text-muted-foreground underline">
                Click para cambiar
              </span>
            </>
          ) : (
            <>
              <FileUp className="size-8 text-muted-foreground" />
              <span className="text-sm font-medium">Click para subir tu horario PDF</span>
              <span className="text-xs text-muted-foreground">
                Tamaño máximo 10 MB
              </span>
            </>
          )}
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFile}
            className="hidden"
          />
        </label>
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
