import { Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingPage() {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <div className="inline-flex size-10 items-center justify-center rounded-lg bg-gemini-gradient text-white shadow-sm">
          <Sparkles className="size-5" />
        </div>
        <CardTitle className="text-xl">Bienvenido a TecCoach</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          Aquí va el flujo de onboarding (matrícula, carrera, semestre, materias
          y URL de iCal de Canvas). Lo construye la TAREA 3.
        </p>
      </CardContent>
    </Card>
  );
}
