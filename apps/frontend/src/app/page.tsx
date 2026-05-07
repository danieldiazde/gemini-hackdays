"use client";

import { useState } from "react";
import { interpret } from "@/lib/api";
import type { InterpretMode, InterpretResponse } from "@/types/interpret";
import { PromptForm } from "@/components/PromptForm";
import { ResponseDisplay } from "@/components/ResponseDisplay";

export default function HomePage() {
  const [response, setResponse] = useState<InterpretResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(prompt: string, mode: InterpretMode) {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const result = await interpret({ prompt, mode });
      setResponse(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[--color-fg-dim]">
          MLH · RoBorregos · Gemini Hackdays
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          gemini-hackdays
        </h1>
        <p className="mt-3 max-w-2xl text-[--color-fg-dim]">
          Type a request. The backend asks Gemini to interpret it and returns
          structured JSON the UI renders as live components.
        </p>
      </header>

      <PromptForm onSubmit={handleSubmit} loading={loading} />

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <strong className="font-semibold">Request failed.</strong> {error}
          <p className="mt-1 text-red-300/80">
            Is the backend running on{" "}
            <code className="font-mono">localhost:8000</code>?
          </p>
        </div>
      )}

      {response && <ResponseDisplay response={response} />}
    </main>
  );
}
