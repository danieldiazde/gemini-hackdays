export interface TestContext {
  baseUrl: string;
  jwt: string;
  userId: string;
  results: Record<string, unknown>;
}

export interface StepResult {
  ok: boolean;
  durationMs: number;
  data?: unknown;
  error?: string;
}
