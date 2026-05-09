import { NextResponse } from 'next/server';
import { generateCoachInsights } from '@/lib/gemini/prompts'; // Ajusta el import si tu path es distinto

export async function GET() {
  // Mock data realista para alimentar a Gemini
  const dummyContext = {
    perfil: {
      nombre: "Rodrigo",
      semestre: 5
    },
    materias: [
      { clave: "TC2038", nombre: "Análisis y diseño de algoritmos" },
      { clave: "TC2006", nombre: "Sistemas Operativos" },
      { clave: "H1018", nombre: "Ética, profesión y ciudadanía" } // Materia Life de ejemplo
    ],
    eventos_proximos: [
      { titulo: "Examen parcial de Algoritmos", fecha: "2026-05-15T08:00:00" },
      { titulo: "Entrega de proyecto SO", fecha: "2026-05-13T23:59:00" }
    ]
  };

  try {
    console.log("Llamando a Gemini...");
    const insight = await generateCoachInsights(dummyContext);
    
    // Devolvemos el JSON estructurado al navegador
    return NextResponse.json({ 
      success: true, 
      data: insight 
    });
    
  } catch (error: any) {
    console.error("Error en el endpoint de prueba:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}