import type {
  InterpretRequest,
  InterpretResponse,
} from "@/types/interpret";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function interpret(
  body: InterpretRequest,
): Promise<InterpretResponse> {
  const res = await fetch(`${API_URL}/api/interpret`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Backend ${res.status} ${res.statusText}: ${text || "(no body)"}`,
    );
  }
  return (await res.json()) as InterpretResponse;
}

export async function getHealth(): Promise<{
  status: string;
  mock_mode: boolean;
  model: string;
}> {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}
