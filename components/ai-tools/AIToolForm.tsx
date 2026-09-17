"use client";

import { useState, FormEvent } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import type { AITool } from "@/lib/ai-tools-data";
import AIToolOutput from "./AIToolOutput";

type Status = "idle" | "loading" | "success" | "error";

export default function AIToolForm({ tool }: { tool: AITool }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const fields = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const res = await fetch("/api/ai-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: tool.slug, fields }),
      });
      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(json.error || "Something went wrong. Please try again.");
        return;
      }

      setResult(json.result);
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Network error — please check your connection and try again.");
    }
  }

  if (status === "success" && result) {
    return <AIToolOutput result={result} onReset={() => setStatus("idle")} />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {tool.fields.map((field) => (
        <label key={field.key} className="flex flex-col gap-2 text-sm text-paper-white">
          {field.label}
          {field.type === "textarea" ? (
            <textarea
              name={field.key}
              required={field.required}
              placeholder={field.placeholder}
              rows={3}
              maxLength={2000}
              className="resize-none border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none placeholder:text-ash/60 focus-visible:border-gold"
            />
          ) : field.type === "select" ? (
            <select
              name={field.key}
              required={field.required}
              defaultValue=""
              className="border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none focus-visible:border-gold"
            >
              <option value="" disabled>
                Select an option
              </option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              name={field.key}
              required={field.required}
              placeholder={field.placeholder}
              className="border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none placeholder:text-ash/60 focus-visible:border-gold"
            />
          )}
        </label>
      ))}

      {status === "error" && error && (
        <div className="flex items-start gap-2 border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-2 inline-flex items-center justify-center gap-2 bg-gold px-6 py-3.5 text-sm font-medium text-ink transition-colors duration-200 ease-arch hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" && <Loader2 size={16} className="animate-spin" />}
        {status === "loading" ? "Generating..." : `Generate`}
      </button>
    </form>
  );
}
