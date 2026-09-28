"use client";

import { useState } from "react";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;

type Booking = {
  id: string;
  user_id: string | null;
  consultation_type: string;
  preferred_date: string;
  preferred_time: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  goals: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

export default function BookingRow({ b }: { b: Booking }) {
  const [status, setStatus] = useState(b.status);
  const [notes, setNotes] = useState(b.admin_notes ?? "");
  const [msg, setMsg] = useState("");

  async function save(nextStatus: string) {
    setMsg("Saving…");
    try {
      const res = await fetch(`/api/admin/bookings/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, admin_notes: notes }),
      });
      setMsg(res.ok ? "Saved" : "Could not save — try again");
    } catch {
      setMsg("Could not save — check your connection");
    }
  }

  return (
    <li className="rounded-xl border border-ink-line bg-ink-soft p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-paper-white">
            {b.name}{" "}
            <span className="text-ash">
              · {b.user_id ? "Account" : "Guest"}
            </span>
          </p>
          <p className="break-all text-sm text-ash">
            {b.email}
            {b.phone ? ` · ${b.phone}` : ""}
          </p>
          {b.business_name && (
            <p className="text-sm text-ash">Business: {b.business_name}</p>
          )}
          <p className="mt-2 text-sm text-gold">
            {b.consultation_type} · {b.preferred_date} · {b.preferred_time}
          </p>
          {b.goals && (
            <p className="mt-2 whitespace-pre-line text-sm text-paper-white">
              {b.goals}
            </p>
          )}
        </div>

        <label className="text-xs text-ash">
          Status
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              save(e.target.value);
            }}
            className="mt-1 block rounded-md border border-ink-line bg-ink px-3 py-2 text-sm text-paper-white focus:outline-none focus:ring-2 focus:ring-gold"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block text-xs text-ash">
        Internal notes (never shown to the client)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={2000}
          className="mt-1 w-full rounded-md border border-ink-line bg-ink p-3 text-sm text-paper-white focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </label>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => save(status)}
          className="rounded-md border border-gold px-4 py-2 text-sm text-gold transition-colors hover:bg-gold hover:text-ink"
        >
          Save notes
        </button>
        <span role="status" className="text-xs text-ash">
          {msg}
        </span>
      </div>
    </li>
  );
}
