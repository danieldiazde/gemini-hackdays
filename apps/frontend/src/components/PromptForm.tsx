"use client";

import { useState } from "react";
import type { InterpretMode } from "@/types/interpret";

interface Props {
  onSubmit: (prompt: string, mode: InterpretMode) => void | Promise<void>;
  loading: boolean;
}

const MODES: { value: InterpretMode; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Let Gemini decide." },
  { value: "dynamic_ui", label: "Dynamic UI", hint: "Render data as widgets." },
  {
    value: "agentic_simulation",
    label: "Agentic simulation",
    hint: "Plans and actions over time.",
  },
];

export function PromptForm({ onSubmit, loading }: Props) {
  const [prompt, setPrompt] = useState(
    "Show me a live dashboard for our robotics team's hackathon progress.",
  );
  const [mode, setMode] = useState<InterpretMode>("auto");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!prompt.trim() || loading) return;
        onSubmit(prompt.trim(), mode);
      }}
      className="rounded-lg border border-[--color-border] bg-[--color-panel] p-5"
    >
      <label
        htmlFor="prompt"
        className="block text-sm font-medium text-[--color-fg]"
      >
        Your request
      </label>
      <textarea
        id="prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        className="mt-2 w-full resize-y rounded-md border border-[--color-border] bg-[--color-panel-hi] px-3 py-2 text-sm text-[--color-fg] placeholder:text-[--color-fg-dim] focus:border-[--color-accent] focus:outline-none"
        placeholder="What should Gemini interpret?"
      />

      <fieldset className="mt-4">
        <legend className="text-xs uppercase tracking-wider text-[--color-fg-dim]">
          Mode
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {MODES.map((m) => {
            const active = mode === m.value;
            return (
              <button
                type="button"
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                  active
                    ? "border-[--color-accent] bg-[--color-accent]/15 text-[--color-fg]"
                    : "border-[--color-border] bg-[--color-panel-hi] text-[--color-fg-dim] hover:text-[--color-fg]"
                }`}
              >
                <div className="font-medium">{m.label}</div>
                <div className="text-xs text-[--color-fg-dim]">{m.hint}</div>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="rounded-md bg-[--color-accent] px-4 py-2 text-sm font-medium text-[--color-bg] transition hover:bg-[--color-accent-hi] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Interpreting…" : "Send to Gemini"}
        </button>
      </div>
    </form>
  );
}
