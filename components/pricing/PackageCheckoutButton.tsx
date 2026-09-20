"use client";

import { useState, FormEvent } from "react";
import { Loader2, AlertCircle } from "lucide-react";

export default function PackageCheckoutButton({
  itemName,
  amount,
  highlighted,
}: {
  itemName: string;
  amount: number;
  highlighted?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "package",
          itemName,
          amount,
          customerEmail: data.email,
          customerName: data.name,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.link) {
        setStatus("error");
        setError(json.error || "Couldn't start checkout. Please try again.");
        return;
      }

      window.location.href = json.link;
    } catch {
      setStatus("error");
      setError("Network error — please try again.");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`mt-8 w-full px-6 py-3 text-sm font-medium transition-colors duration-200 ease-arch ${
          highlighted
            ? "bg-gold text-ink hover:bg-gold-light"
            : "border border-ink-line text-paper-white hover:border-gold hover:text-gold"
        }`}
      >
        Pay Now
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 border-t border-ink-line pt-6">
      <input
        name="name"
        placeholder="Your name"
        required
        className="border border-ink-line bg-ink px-3 py-2.5 text-xs text-paper-white outline-none focus-visible:border-gold"
      />
      <input
        name="email"
        type="email"
        placeholder="Your email"
        required
        className="border border-ink-line bg-ink px-3 py-2.5 text-xs text-paper-white outline-none focus-visible:border-gold"
      />
      {status === "error" && error && (
        <div className="flex items-start gap-1.5 text-xs text-red-300">
          <AlertCircle size={12} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="flex items-center justify-center gap-2 bg-gold px-4 py-2.5 text-xs font-medium text-ink hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" && <Loader2 size={13} className="animate-spin" />}
        {status === "loading" ? "Redirecting..." : "Continue to Payment"}
      </button>
    </form>
  );
}
