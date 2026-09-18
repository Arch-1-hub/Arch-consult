"use client";

import { useState } from "react";
import Link from "next/link";
import { Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error" | "needs-login";

export default function SaveReportButton({
  type,
  title,
  data,
}: {
  type: "health_check" | "launch_plan" | "ai_consultation";
  title: string;
  data: unknown;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, data }),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.requiresLogin) {
          setStatus("needs-login");
        } else {
          setStatus("error");
          setError(json.error || "Couldn't save this report.");
        }
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Network error — please try again.");
    }
  }

  if (status === "success") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-gold">
        <CheckCircle2 size={14} /> Saved to your account
      </span>
    );
  }

  if (status === "needs-login") {
    return (
      <span className="text-xs text-ash">
        <Link href="/login" className="text-gold hover:text-gold-light">
          Log in
        </Link>{" "}
        to save this report to your account.
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSave}
        disabled={status === "loading"}
        className="flex items-center gap-1.5 text-xs text-ash transition-colors hover:text-gold disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {status === "loading" ? "Saving..." : "Save to my account"}
      </button>
      {status === "error" && error && (
        <span className="flex items-center gap-1.5 text-xs text-red-300">
          <AlertCircle size={12} /> {error}
        </span>
      )}
    </div>
  );
}
