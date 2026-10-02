"use client";

import { useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { STATUS_LABEL, STATUS_COLOR, type Milestone } from "@/lib/projects";

type Project = {
  id: string;
  client_id: string;
  title: string;
  status: string;
  progress_percent: number;
  summary: string | null;
  milestones: Milestone[];
};
type ClientOption = { id: string; full_name: string | null };

const input =
  "mt-1 w-full rounded-md border border-ink-line bg-ink p-3 text-sm text-paper-white focus:outline-none focus:ring-2 focus:ring-gold";

function EditableProject({ p, onSaved }: { p: Project; onSaved: () => void }) {
  const [title, setTitle] = useState(p.title);
  const [status, setStatus] = useState(p.status);
  const [progress, setProgress] = useState(p.progress_percent);
  const [summary, setSummary] = useState(p.summary ?? "");
  const [milestones, setMilestones] = useState<Milestone[]>(p.milestones ?? []);
  const [newMilestone, setNewMilestone] = useState("");
  const [msg, setMsg] = useState("");

  function addMilestone() {
    const t = newMilestone.trim();
    if (!t) return;
    setMilestones((m) => [...m, { title: t, done: false }]);
    setNewMilestone("");
  }
  function toggleMilestone(i: number) {
    setMilestones((m) => m.map((x, idx) => (idx === i ? { ...x, done: !x.done } : x)));
  }
  function removeMilestone(i: number) {
    setMilestones((m) => m.filter((_, idx) => idx !== i));
  }

  async function save() {
    setMsg("Saving…");
    try {
      const res = await fetch(`/api/staff/projects/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status, progress_percent: progress, summary, milestones }),
      });
      const result = await res.json().catch(() => ({}));
      setMsg(res.ok ? "Saved" : result.error || "Could not save");
      if (res.ok) onSaved();
    } catch {
      setMsg("Could not save — check connection");
    }
  }

  return (
    <div className="rounded-xl border border-ink-line bg-ink-soft p-5">
      <input
        className={`${input} font-display text-lg`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-xs text-ash">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={input}
          >
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ash">
          Progress ({progress}%)
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="mt-3 block w-full accent-gold"
          />
        </label>
      </div>

      <label className="mt-4 block text-xs text-ash">
        Summary for the client
        <textarea
          className={input}
          rows={2}
          maxLength={1000}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </label>

      <div className="mt-4">
        <p className="text-xs text-ash">Milestones</p>
        <ul className="mt-2 space-y-1">
          {milestones.map((m, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-paper-white">
              <button type="button" onClick={() => toggleMilestone(i)} aria-label={m.done ? "Mark not done" : "Mark done"}>
                <Check size={16} className={m.done ? "text-gold" : "text-ash"} />
              </button>
              <span className={m.done ? "flex-1 line-through text-ash" : "flex-1"}>{m.title}</span>
              <button type="button" onClick={() => removeMilestone(i)} aria-label="Remove milestone">
                <Trash2 size={14} className="text-ash hover:text-red-400" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <input
            value={newMilestone}
            onChange={(e) => setNewMilestone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMilestone())}
            placeholder="Add a milestone"
            maxLength={150}
            className="flex-1 rounded-md border border-ink-line bg-ink p-2 text-sm text-paper-white focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <button type="button" onClick={addMilestone} className="rounded-md border border-ink-line px-3 text-ash hover:text-gold">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="rounded-md border border-gold px-4 py-2 text-sm text-gold transition-colors hover:bg-gold hover:text-ink"
        >
          Save
        </button>
        <span role="status" className="text-xs text-ash">{msg}</span>
      </div>
    </div>
  );
}

export default function ProjectsManager({
  initial,
  clients,
}: {
  initial: Project[];
  clients: ClientOption[];
}) {
  const [projects, setProjects] = useState(initial);
  const [newTitle, setNewTitle] = useState("");
  const [newClient, setNewClient] = useState("");
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState("");

  const nameFor = (id: string) => clients.find((c) => c.id === id)?.full_name || "Unknown client";

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newClient) return;
    setCreating(true);
    try {
      const res = await fetch("/api/staff/projects/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: newClient, title: newTitle.trim() }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(result.error || "Could not create project");
      } else {
        location.reload();
      }
    } catch {
      setMsg("Could not create — check connection");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={createProject} className="flex flex-wrap items-end gap-3 rounded-xl border border-ink-line bg-ink-soft p-5">
        <label className="text-xs text-ash">
          Client
          <select
            value={newClient}
            onChange={(e) => setNewClient(e.target.value)}
            required
            className="mt-1 block rounded-md border border-ink-line bg-ink px-3 py-2 text-sm text-paper-white focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="">Choose…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name || c.id}</option>
            ))}
          </select>
        </label>
        <label className="flex-1 text-xs text-ash">
          New project title
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            maxLength={120}
            className="mt-1 block w-full rounded-md border border-ink-line bg-ink px-3 py-2 text-sm text-paper-white focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </label>
        <button
          type="submit"
          disabled={creating}
          className="rounded-md border border-gold px-4 py-2 text-sm text-gold transition-colors hover:bg-gold hover:text-ink disabled:opacity-50"
        >
          Create
        </button>
      </form>
      {msg && <p className="text-xs text-ash">{msg}</p>}

      {projects.length === 0 ? (
        <p className="text-ash">No projects yet.</p>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <div key={p.id}>
              <p className="mb-2 text-xs text-ash">
                For <span className="text-paper-white">{nameFor(p.client_id)}</span> ·{" "}
                <span className={STATUS_COLOR[p.status]}>{STATUS_LABEL[p.status]}</span>
              </p>
              <EditableProject p={p} onSaved={() => setProjects((ps) => [...ps])} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
