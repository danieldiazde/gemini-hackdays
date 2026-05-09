import type { TestContext, StepResult } from "../types";

export async function runStep(ctx: TestContext): Promise<StepResult> {
  void ctx;
  return { ok: false, durationMs: 0 };
}
