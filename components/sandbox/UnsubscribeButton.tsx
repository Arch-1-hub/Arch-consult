"use client";

import { useState } from "react";

export default function UnsubscribeButton({ email, token }: { email: string; token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function go() {
    setState("busy");
    try {
      const res = await fetch(`/api/sandbox/unsubscribe?e=${encodeURIComponent(email)}&t=${encodeURIComponent(token)}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setState("done");
      else {
        setMessage(data.error || "Something went wrong. Please try again.");
        setState("error");
      }
    } catch {
      setMessage("Could not reach the server. Please try again.");
      setState("error");
    }
  }

  if (state === "done") {
    return <p role="status" className="text-sm text-gold-light">Done. You will not receive the monthly briefing any more.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={go}
        disabled={state === "busy"}
        className="inline-flex w-fit items-center justify-center bg-gold px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-gold-light disabled:opacity-60"
      >
        {state === "busy" ? "Working…" : "Yes, unsubscribe me"}
      </button>
      {state === "error" ? <p role="alert" className="text-sm text-red-400">{message}</p> : null}
    </div>
  );
}
