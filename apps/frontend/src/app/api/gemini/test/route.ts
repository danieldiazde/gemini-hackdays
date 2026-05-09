import { NextResponse } from "next/server";
import { getGeminiClient, FLASH_MODEL } from "@/lib/gemini/client";

export async function POST() {
  const client = getGeminiClient();
  const response = await client.models.generateContent({
    model: FLASH_MODEL,
    contents: [{ role: "user", parts: [{ text: "Di hola en español en una sola línea." }] }],
  });
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return NextResponse.json({ ok: true, response: text });
}
