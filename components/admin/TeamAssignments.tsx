"use client";

import { useState } from "react";

type Person = { id: string; full_name: string | null; role: string };
type Assignment = { client_id: string; consultant_id: string };

export default function TeamAssignments({
  clients,
  consultants,
  assignments,
}: {
  clients: Person[];
  consultants: Person[];
  assignments: Assignment[];
}) {
  const initial: Record<string, string> = {};
  assignments.forEach((a) => (initial[a.client_id] = a.consultant_id));

  const [map, setMap] = useState(initial);
  const [msg, setMsg] = useState<Record<string, string>>({});

  async function assign(clientId: string, consultantId: string) {
    setMap((m) => ({ ...m, [clientId]: consultantId }));
    setMsg((m) => ({ ...m, [clientId]: "Saving…" }));
    try {
      const res = await fetch("/api/admin/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, consultantId: consultantId || null }),
      });
      setMsg((m) => ({ ...m, [clientId]: res.ok ? "Saved" : "Could not save" }));
    } catch {
      setMsg((m) => ({ ...m, [clientId]: "Could not save — check connection" }));
    }
  }

  if (consultants.length === 0) {
    return (
      <p className="text-ash">
        No consultant accounts yet. Create one by signing them up normally,
        then in Supabase (Table Editor → profiles) set their{" "}
        <code className="text-gold">role</code> to <code className="text-gold">consultant</code>.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-ink-line">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="bg-ink-soft text-ash">
          <tr>
            <th className="p-3 font-normal">Client</th>
            <th className="p-3 font-normal">Assigned consultant</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="border-t border-ink-line text-paper-white">
              <td className="p-3">{c.full_name || "—"}</td>
              <td className="p-3">
                <select
                  value={map[c.id] || ""}
                  onChange={(e) => assign(c.id, e.target.value)}
                  className="rounded-md border border-ink-line bg-ink px-3 py-1.5 text-sm text-paper-white focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  <option value="">Unassigned</option>
                  {consultants.map((con) => (
                    <option key={con.id} value={con.id}>
                      {con.full_name || con.id}
                    </option>
                  ))}
                </select>
                <span role="status" className="ml-3 text-xs text-ash">
                  {msg[c.id]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
