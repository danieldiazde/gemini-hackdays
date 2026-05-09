import { CalendarRange } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <div className="inline-flex size-10 items-center justify-center rounded-lg bg-gemini-gradient text-white shadow-sm">
          <CalendarRange className="size-5" />
        </div>
        <CardTitle className="text-xl">Tu semana, en un vistazo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          Aquí va el dashboard con el mensaje del coach, las prioridades y el
          calendario semanal con bloques sugeridos. Lo construye la TAREA 4.
        </p>
      </CardContent>
    </Card>
  );
}
