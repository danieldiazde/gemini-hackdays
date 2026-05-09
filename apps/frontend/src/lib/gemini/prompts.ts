import { GoogleGenAI, Type, Schema } from '@google/genai';

// Inicializa el cliente. Asegúrate de tener GEMINI_API_KEY en apps/frontend/.env.local
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. Definición estricta del esquema esperado (Structured Output)
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    mensaje: { 
      type: Type.STRING, 
      description: "Mensaje motivacional corto (2-3 líneas). Tono cálido pero directo, sin frases cliché." 
    },
    prioridades: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          materia: { type: Type.STRING },
          razon: { type: Type.STRING },
          urgencia: { type: Type.STRING, enum: ["alta", "media", "baja"] }
        },
        required: ["materia", "razon", "urgencia"]
      }
    },
    bloques_sugeridos: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          titulo: { type: Type.STRING },
          materia: { type: Type.STRING },
          inicio_iso: { type: Type.STRING, description: "Formato ISO 8601 con timezone (ej. 2026-05-13T16:00:00-06:00)" },
          fin_iso: { type: Type.STRING, description: "Formato ISO 8601 con timezone (ej. 2026-05-13T18:00:00-06:00)" },
          razon: { type: Type.STRING }
        },
        required: ["titulo", "materia", "inicio_iso", "fin_iso", "razon"]
      }
    }
  },
  required: ["mensaje", "prioridades", "bloques_sugeridos"]
};

// 2. Interfaz para tipar el contexto que recibimos de Supabase
export interface ContextoUsuario {
  perfil: {
    nombre: string;
    carrera_nombre?: string;
    modelo?: string;
    semestre: number;
  };
  materias: Array<{
    clave: string;
    nombre: string;
    creditos?: number;
    prioridad?: number;
  }>;
  eventos_proximos: Array<any>; // Aquí irán los eventos de Calendar/Canvas que pase Persona A
}

// 3. La función principal del Cerebro
export async function generateCoachInsights(contextoUsuario: ContextoUsuario) {
  const prompt = `
    Eres TecCoach, un coach académico experto para estudiantes del Tecnológico de Monterrey.
    Conoces perfectamente el modelo Tec21, las Semanas Tec y las materias Life.

    CONTEXTO DEL ALUMNO:
    - Nombre: ${contextoUsuario.perfil.nombre}
    - Semestre: ${contextoUsuario.perfil.semestre}
    - Materias actuales: ${JSON.stringify(contextoUsuario.materias)}
    - Eventos y entregas próximas (Canvas + Google Calendar): ${JSON.stringify(contextoUsuario.eventos_proximos)}
    
    INSTRUCCIONES:
    1. Analiza la carga de la semana actual del alumno.
    2. Identifica exactamente 3 prioridades de estudio basadas en sus entregas y clases.
    3. Sugiere entre 2 y 4 bloques de estudio específicos. 
       - Deben ser realistas (entre 60 y 120 min máximo cada uno).
       - NO deben solaparse ni chocar con los eventos ya existentes en su calendario.
    4. Escribe un mensaje dirigido al alumno por su nombre. Sé directo, cálido, como un mentor experimentado. NO uses frases cliché como "¡Tú puedes!" o "Échale ganas".
    
    Responde ÚNICAMENTE usando el esquema JSON proporcionado.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.2, // Temperatura baja para que el JSON sea estable y la lógica no alucine
      }
    });
    
    if (!response.text) {
      throw new Error("Gemini devolvió una respuesta vacía");
    }

    // El SDK devuelve un string, pero como forzamos el schema, sabemos que es parseable a JSON
    return JSON.parse(response.text);
  } catch (error) {
    console.error("❌ Error generando insights con Gemini:", error);
    throw new Error("Fallo en la comunicación con la IA. Revisa los logs.");
  }
}