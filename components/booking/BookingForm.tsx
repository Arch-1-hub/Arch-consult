"use client";

import { useState, FormEvent } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { consultationTypes, bookingTimeSlots } from "@/lib/constants";
import BookingConfirmation from "./BookingConfirmation";

type Status = "idle" | "loading" | "success" | "error";

function minDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function BookingForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Record<string, string> | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationType: data.consultationType,
          preferredDate: data.preferredDate,
          preferredTime: data.preferredTime,
          name: data.name,
          email: data.email,
          phone: data.phone,
          businessName: data.businessName,
          goals: data.goals,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(json.error || "Something went wrong. Please try again.");
        return;
      }

      setConfirmed(data);
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Network error — please check your connection and try again.");
    }
  }

  if (status === "success" && confirmed) {
    return <BookingConfirmation details={confirmed} />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-sm text-paper-white">
        Consultation type
        <select
          name="consultationType"
          required
          defaultValue=""
          className="border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none focus-visible:border-gold"
        >
          <option value="" disabled>
            Select a consultation type
          </option>
          {consultationTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-paper-white">
          Preferred date
          <input
            name="preferredDate"
            type="date"
            required
            min={minDate()}
            className="border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none focus-visible:border-gold"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-paper-white">
          Preferred time
          <select
            name="preferredTime"
            required
            defaultValue=""
            className="border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none focus-visible:border-gold"
          >
            <option value="" disabled>
              Select a time
            </option>
            {bookingTimeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-xs text-ash">
        Times shown are fixed slots for now — final confirmation of exact
        timing will come from Arch Consult directly.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-paper-white">
          Name
          <input
            name="name"
            required
            autoComplete="name"
            className="border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none focus-visible:border-gold"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-paper-white">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none focus-visible:border-gold"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-paper-white">
          Phone (optional)
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            className="border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none focus-visible:border-gold"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-paper-white">
          Business name (optional)
          <input
            name="businessName"
            autoComplete="organization"
            className="border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none focus-visible:border-gold"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm text-paper-white">
        What would you like to cover? (optional)
        <textarea
          name="goals"
          rows={4}
          maxLength={2000}
          className="resize-none border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none focus-visible:border-gold"
        />
      </label>

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
        {status === "loading" ? "Booking..." : "Book Consultation"}
      </button>
    </form>
  );
}
