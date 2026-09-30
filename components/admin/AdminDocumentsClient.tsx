"use client";

import { useState } from "react";
import { FileText, Download, Trash2, UploadCloud } from "lucide-react";
import { ALLOWED_LABEL, formatBytes } from "@/lib/documents";

type Doc = {
  id: string;
  owner_id: string;
  file_name: string;
  file_size: number;
  note: string | null;
  uploaded_by_role: "client" | "admin";
  created_at: string;
};
type ClientOption = { id: string; full_name: string | null };

export default function AdminDocumentsClient({
  initial,
  clients,
}: {
  initial: Doc[];
  clients: ClientOption[];
}) {
  const [docs, setDocs] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    if (!fileInput.files?.[0]) return;

    setBusy(true);
    setMsg("Uploading…");
    try {
      const res = await fetch("/api/admin/documents", { method: "POST", body: new FormData(form) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(body.error || "Upload failed.");
      } else {
        setMsg("Uploaded.");
        form.reset();
        location.reload();
      }
    } catch {
      setMsg("Upload failed — check your connection.");
    } finally {
      setBusy(false);
    }
  }

  async function download(id: string) {
    const res = await fetch(`/api/documents/${id}/download`);
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.url) window.location.href = body.url;
    else setMsg(body.error || "Could not open file.");
  }

  async function remove(id: string) {
    if (!confirm("Delete this document? This can't be undone.")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) setDocs((d) => d.filter((doc) => doc.id !== id));
    else setMsg("Could not delete.");
  }

  const nameFor = (ownerId: string) =>
    clients.find((c) => c.id === ownerId)?.full_name || "Unknown client";

  return (
    <div className="space-y-8">
      <form
        onSubmit={upload}
        className="flex flex-col gap-3 rounded-xl border border-ink-line bg-ink-soft p-6"
      >
        <p className="font-display text-lg text-paper-white">Send a file to a client</p>
        <label className="text-xs text-ash">
          Client
          <select
            name="ownerId"
            required
            className="mt-1 block w-full rounded-md border border-ink-line bg-ink px-3 py-2 text-sm text-paper-white focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="">Choose a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name || c.id}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-ash">Accepted: {ALLOWED_LABEL}. Max 15 MB.</p>
        <input
          type="file"
          name="file"
          required
          accept=".pdf,.png,.jpg,.jpeg,.zip"
          className="text-sm text-paper-white file:mr-3 file:rounded-md file:border file:border-gold file:bg-transparent file:px-3 file:py-1.5 file:text-gold"
        />
        <input
          type="text"
          name="note"
          maxLength={300}
          placeholder="Optional note about this file"
          className="rounded-md border border-ink-line bg-ink p-3 text-sm text-paper-white focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-fit items-center gap-2 rounded-md border border-gold px-4 py-2 text-sm text-gold transition-colors hover:bg-gold hover:text-ink disabled:opacity-50"
        >
          <UploadCloud size={16} /> Upload
        </button>
        {msg && (
          <span role="status" className="text-xs text-ash">
            {msg}
          </span>
        )}
      </form>

      {docs.length === 0 ? (
        <p className="text-ash">No documents yet.</p>
      ) : (
        <ul className="space-y-3">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-line bg-ink-soft p-4"
            >
              <div className="flex min-w-0 items-start gap-3">
                <FileText size={20} className="mt-0.5 shrink-0 text-gold" />
                <div className="min-w-0">
                  <p className="truncate text-paper-white">{d.file_name}</p>
                  <p className="text-xs text-ash">
                    {nameFor(d.owner_id)} · {formatBytes(d.file_size)} ·{" "}
                    {d.uploaded_by_role === "admin" ? "Sent by you" : "Client upload"} ·{" "}
                    {new Date(d.created_at).toLocaleDateString("en-NG")}
                  </p>
                  {d.note && <p className="mt-1 text-sm text-paper-white">{d.note}</p>}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => download(d.id)}
                  aria-label={`Download ${d.file_name}`}
                  className="rounded-md border border-ink-line p-2 text-ash hover:text-gold"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => remove(d.id)}
                  aria-label={`Delete ${d.file_name}`}
                  className="rounded-md border border-ink-line p-2 text-ash hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
