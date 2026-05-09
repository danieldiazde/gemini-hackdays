"use client";

import { CheckCircle2, Copy, ExternalLink, Settings } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const STEPS = [
  {
    icon: ExternalLink,
    title: "Abre Canvas",
    description:
      "Entra a canvas.tec.mx y ve al menú lateral izquierdo, hasta el ícono de Calendario.",
  },
  {
    icon: Settings,
    title: "Calendar Feed",
    description:
      "En la parte inferior derecha del calendario, haz click en \"Calendar Feed\".",
  },
  {
    icon: Copy,
    title: "Copia el URL",
    description:
      "Copia la URL que termina en `.ics`. Es privada — no la compartas con nadie más.",
  },
  {
    icon: CheckCircle2,
    title: "Pégala aquí",
    description:
      "Pega ese URL en el campo de Canvas iCal. TecCoach leerá tus entregas para sugerirte bloques.",
  },
];

export function IcalHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger className="text-xs font-medium text-gemini-blue underline-offset-4 hover:underline">
        ¿Cómo obtengo el URL?
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tu URL de Canvas iCal en 4 pasos</DialogTitle>
          <DialogDescription>
            Canvas expone tus entregas como un feed iCal privado. Solo
            necesitamos ese URL.
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3">
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <li key={title} className="flex gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-gemini-gradient text-white shadow-sm">
                <Icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">
                  {i + 1}. {title}
                </p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
