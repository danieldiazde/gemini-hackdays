import { NextResponse } from "next/server";

import { getGeminiClient, FLASH_MODEL } from "@/lib/gemini/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Smoke-test endpoint for the Gemini integration. Auth-gated because each
 * call costs Gemini quota — leaving it open lets anyone drain it via scripted
 * requests.
 */
export async function POST() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = checkRateLimit({
    key: `gemini-test:${user.id}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds),
        },
      },
    );
  }

  const client = getGeminiClient();
  const response = await client.models.generateContent({
    model: FLASH_MODEL,
    contents: [{ role: "user", parts: [{ text: "Di hola en español en una sola línea." }] }],
  });
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return NextResponse.json({ ok: true, response: text });
}
