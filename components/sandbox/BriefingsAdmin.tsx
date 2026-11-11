"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GrowthSection } from "@/lib/sandbox/briefing/growth";
import { NEWS_FEEDS } from "@/lib/sandbox/briefing/sources";
import { Briefing, BriefingStatus, FeedStatus } from "@/lib/sandbox/briefing/types";

export interface BriefingRow {
  id: string;
  month: string;
  email: string;
  title: string;
  area: string;
  state: string;
  status: BriefingStatus;
  content: Briefing;
  growth: GrowthSection | null;
  created_at: string;
}

export interface RunRow {
  id: string;
  created_at: string;
  feed_status: FeedStatus[];
  items_collected: number;
  briefings_drafted: number;
  briefings_failed: number;
}

const STATUS_STYLE: Record<BriefingStatus, string> = {
  draft: "border-gold text-gold",
  approved: "border-gold-light text-gold-light",
  rejected: "border-red-400 text-red-400",
  sent: "border-ash text-ash",
};

const IMPACT_STYLE = { high: "text-red-400", medium: "text-gold", low: "text-ash" } as const;
const SCOPE_LABEL = { area: "in their area", state: "in their state", national: "nationwide" } as const;

const PAUSE_MS = 8000;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function monthShift(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function call(body: Record<string, unknown>) {
  const res = await fetch("/api/admin/sandbox-briefings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && !data.error) data.error = "Request failed.";
  return data as Record<string, any>;
}

export default function BriefingsAdmin({ month, briefings, lastRun }: { month: string; briefings: BriefingRow[]; lastRun: RunRow | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [failures, setFailures] = useState<string[]>([]);
  const [rowNote, setRowNote] = useState<Record<string, string>>({});

  const counts = (s: BriefingStatus) => briefings.filter((b) => b.status === s).length;
  const where = (b: BriefingRow) => [b.area, b.state].filter(Boolean).join(", ") || "Nigeria";

  async function runAll() {
    setBusy(true);
    setError("");
    setFailures([]);
    setProgress("Reading the news and finding your clients…");
    try {
      const plan = await call({ action: "collect", month });
      if (!plan.ok) throw new Error(plan.error || "Could not collect the news.");
      const clients: { userId: string; simId: string; email: string }[] = plan.clients;
      if (clients.length === 0) {
        setProgress("No clients need a briefing right now. Clients must have paid for a package and run the Sandbox.");
        return;
      }
      let drafted = 0;
      const failed: string[] = [];
      for (let i = 0; i < clients.length; i++) {
        const c = clients[i];
        setProgress(`Writing ${i + 1} of ${clients.length}: ${c.email}`);
        let r = await call({ action: "generate", runId: plan.runId, userId: c.userId, simId: c.simId });
        // The AI provider limits how fast we can ask. On a 429, wait and try again.
        for (let attempt = 1; attempt <= 3 && !r.ok && /429/.test(String(r.error ?? "")); attempt++) {
          for (let s = 30; s > 0; s--) {
            setProgress(`The AI needs a short rest. Trying ${c.email} again in ${s}s (attempt ${attempt} of 3)`);
            await sleep(1000);
          }
          r = await call({ action: "generate", runId: plan.runId, userId: c.userId, simId: c.simId });
        }
        if (r.ok) drafted++;
        else failed.push(`${c.email}: ${r.error ?? "failed"}`);
        if (r.error && /No AI key/.test(r.error)) break;
        if (i < clients.length - 1) await sleep(PAUSE_MS);
      }
      await call({ action: "finish", runId: plan.runId, drafted, failed: failed.length });
      setFailures(failed);
      setProgress(`Done. ${drafted} written${failed.length ? `, ${failed.length} could not be written` : ""}.`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setProgress("");
    } finally {
      setBusy(false);
    }
  }

  async function review(id: string, status: "approved" | "rejected" | "remove-item", index?: number) {
    setError("");
    const r = await call({ action: "review", id, status, index });
    if (!r.ok) setError(r.error || "Could not save that.");
    router.refresh();
  }

  async function approveAll() {
    if (!window.confirm(`Approve all ${counts("draft")} drafts for ${month}? Skim them first if you have not.`)) return;
    setBusy(true);
    setError("");
    const r = await call({ action: "approve-all", month });
    setProgress(r.ok ? `${r.approved} briefings approved.` : "");
    if (!r.ok) setError(r.error || "Could not approve.");
    setBusy(false);
    router.refresh();
  }

  async function sendAll() {
    const waiting = counts("approved");
    if (!window.confirm(`Email ${waiting} approved briefings now? This cannot be undone.`)) return;
    setBusy(true);
    setError("");
    try {
      let total = 0;
      for (let round = 0; round < 300; round++) {
        setProgress(`Sending… ${total} sent so far`);
        const r = await call({ action: "send", month });
        if (!r.ok) {
          setError(`${total} sent, then stopped: ${r.error ?? "failed"}. Press Send again to continue; nobody gets it twice.`);
          setProgress("");
          router.refresh();
          return;
        }
        total += Number(r.sent) || 0;
        if (!r.remaining) break;
        await sleep(1000);
      }
      setProgress(total === 0 ? "Nothing left to send." : `Done. ${total} emails sent.`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function sendTest(id: string) {
    setRowNote((n) => ({ ...n, [id]: "Sending a test to you…" }));
    const r = await call({ action: "send", id, test: true });
    setRowNote((n) => ({ ...n, [id]: r.ok ? `Test sent to ${r.sentTo}. Check your inbox and spam folder.` : r.error || "Could not send the test." }));
  }

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Month" className="flex items-center gap-4 text-sm">
        <a href={`?month=${monthShift(month, -1)}`} className="text-ash hover:text-paper-white">← Previous</a>
        <span className="font-display text-xl text-paper-white">{month}</span>
        <a href={`?month=${monthShift(month, 1)}`} className="text-ash hover:text-paper-white">Next →</a>
      </nav>

      <div className="flex flex-col gap-4 border border-ink-line bg-ink-soft p-5">
        <p className="text-sm text-paper-white">
          {briefings.length === 0
            ? "No briefings yet for this month."
            : `${counts("draft")} to review · ${counts("approved")} approved · ${counts("rejected")} rejected · ${counts("sent")} sent`}
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={runAll} disabled={busy} className="inline-flex items-center justify-center bg-gold px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Working…" : briefings.length ? "Collect news and redraft" : "Collect news and write briefings"}
          </button>
          {counts("draft") > 0 ? (
            <button type="button" onClick={approveAll} disabled={busy} className="border border-gold px-5 py-3 text-sm text-gold hover:bg-gold hover:text-ink disabled:opacity-50">
              Approve all {counts("draft")} drafts
            </button>
          ) : null}
          {counts("approved") > 0 ? (
            <button type="button" onClick={sendAll} disabled={busy} className="border border-paper-white px-5 py-3 text-sm text-paper-white hover:bg-paper-white hover:text-ink disabled:opacity-50">
              Send {counts("approved")} approved
            </button>
          ) : null}
        </div>
        {progress ? <p role="status" className="text-sm text-gold-light">{progress}</p> : null}
        {error ? <p role="alert" className="text-sm text-red-400">{error}</p> : null}
        {failures.length > 0 ? <ul className="list-disc pl-5 text-xs text-red-400">{failures.map((f) => <li key={f}>{f}</li>)}</ul> : null}
        <p className="text-xs text-ash">Approved and sent briefings are kept when you redraft. Only drafts and rejected ones are replaced. Nothing is emailed until you press Send.</p>
      </div>

      {lastRun ? (
        <details className="border border-ink-line">
          <summary className="cursor-pointer px-4 py-3 text-sm text-paper-white">
            Nationwide news sources in the last run ({lastRun.feed_status.filter((f) => f.ok).length} of {lastRun.feed_status.length} answered, {lastRun.items_collected} stories)
          </summary>
          <ul className="flex flex-col gap-1 border-t border-ink-line p-4 text-xs">
            {lastRun.feed_status.map((f) => (
              <li key={f.id} className={f.ok ? "text-paper-white" : "text-red-400"}>
                {NEWS_FEEDS.find((n) => n.id === f.id)?.name ?? f.id}: {f.ok ? `${f.count} stories` : `failed (${f.error ?? "unknown"})`}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <ul className="flex flex-col gap-4">
        {briefings.map((b) => (
          <li key={b.id} className="border border-ink-line">
            <details>
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-paper-white">{b.title}</span>
                  <span className="text-xs text-ash">{b.email} · {where(b)}</span>
                </span>
                <span className={`border px-2 py-1 text-xs uppercase tracking-wide2 ${STATUS_STYLE[b.status]}`}>{b.status}</span>
              </summary>
              <div className="flex flex-col gap-4 border-t border-ink-line p-5">
                <h2 className="font-display text-xl text-paper-white">{b.content.headline}</h2>
                <p className="text-sm leading-relaxed text-ash">{b.content.summary}</p>

                {b.growth ? (
                  <div className="border-l-2 border-gold bg-ink-soft px-4 py-3 text-xs text-ash">
                    <p className="mb-1 uppercase tracking-wide2 text-paper-white">{b.growth.heading}</p>
                    <ul className="list-disc pl-4">{b.growth.lines.map((l) => <li key={l}>{l}</li>)}</ul>
                  </div>
                ) : null}

                {b.content.items.length === 0 ? <p className="text-sm text-ash">No local news affects this business this month.</p> : null}
                <ul className="flex flex-col gap-3">
                  {b.content.items.map((it, idx) => (
                    <li key={idx} className="flex flex-col gap-1 border-l-2 border-ink-line bg-ink-soft px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-paper-white">
                          <span className={`mr-2 text-xs uppercase ${IMPACT_STYLE[it.impact]}`}>{it.impact}</span>
                          {it.scope ? <span className="mr-2 text-xs text-ash">({SCOPE_LABEL[it.scope]})</span> : null}
                          {it.title}
                        </p>
                        {b.status !== "sent" ? (
                          <button type="button" onClick={() => review(b.id, "remove-item", idx)} className="shrink-0 text-xs text-ash hover:text-red-400" aria-label={`Remove: ${it.title}`}>
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <p className="text-xs text-ash"><strong className="text-paper-white">What changed:</strong> {it.whatChanged}</p>
                      <p className="text-xs text-ash"><strong className="text-paper-white">What to expect:</strong> {it.whatToExpect}</p>
                      <p className="text-xs text-ash"><strong className="text-paper-white">Do this:</strong> {it.suggestedAction}</p>
                      <p className="text-xs">
                        {it.sourceUrls.map((u, i) => (
                          <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="mr-3 text-gold underline">Source {i + 1}</a>
                        ))}
                      </p>
                    </li>
                  ))}
                </ul>

                {b.content.growthActions?.length ? (
                  <div className="text-xs text-ash">
                    <p className="mb-1 uppercase tracking-wide2">Next 30 days</p>
                    <ol className="list-decimal pl-5">{b.content.growthActions.map((g) => <li key={g}>{g}</li>)}</ol>
                  </div>
                ) : null}
                {b.content.seasonNotes.length > 0 ? (
                  <div className="text-xs text-ash">
                    <p className="mb-1 uppercase tracking-wide2">Seasons and festivities</p>
                    <ul className="list-disc pl-5">{b.content.seasonNotes.map((s) => <li key={s.title}><span className="text-paper-white">{s.title}</span> ({s.when}): {s.note}</li>)}</ul>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  {b.status !== "sent" ? (
                    <>
                      <button type="button" onClick={() => review(b.id, "approved")} disabled={b.status === "approved"} className="bg-gold px-5 py-2 text-sm font-medium text-ink hover:bg-gold-light disabled:opacity-50">
                        {b.status === "approved" ? "Approved" : "Approve"}
                      </button>
                      <button type="button" onClick={() => review(b.id, "rejected")} disabled={b.status === "rejected"} className="border border-ink-line px-5 py-2 text-sm text-paper-white hover:border-red-400 disabled:opacity-50">
                        Reject
                      </button>
                    </>
                  ) : null}
                  <button type="button" onClick={() => sendTest(b.id)} className="border border-ink-line px-5 py-2 text-xs text-paper-white hover:border-gold">
                    Send me a test
                  </button>
                </div>
                {rowNote[b.id] ? <p role="status" className="text-xs text-gold-light">{rowNote[b.id]}</p> : null}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
