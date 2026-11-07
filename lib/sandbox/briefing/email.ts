import { Briefing } from "./types";
import type { PersonalSection } from "./personal";

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Only ordinary web links are allowed into an email. */
export function safeUrl(u: string): string | null {
  try {
    const url = new URL(u);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export interface BriefingRef {
  id: string;
  niche: string;
  state: string;
  status: string;
}

/**
 * The briefing a person should get: the one for their state if it has been approved,
 * otherwise the national one for their business type. Draft and rejected briefings never count.
 */
export function pickBriefing<T extends BriefingRef>(all: T[], niche: string, state: string): T | null {
  const live = all.filter((b) => (b.status === "approved" || b.status === "sent") && b.niche === niche);
  const wanted = state.trim().toLowerCase();
  if (wanted) {
    const exact = live.find((b) => b.state.trim().toLowerCase() === wanted);
    if (exact) return exact;
  }
  return live.find((b) => b.state === "") ?? null;
}

const GOLD = "#b8923f";
const IMPACT_COLOUR = { high: "#b3261e", medium: GOLD, low: "#6b6b6b" } as const;

export interface RenderArgs {
  briefing: Briefing;
  monthLabel: string;
  nicheLabel: string;
  state: string;
  siteUrl: string;
  unsubscribeUrl: string;
  personal?: PersonalSection | null;
}

export function renderBriefingEmail(a: RenderArgs): { subject: string; html: string; text: string } {
  const b = a.briefing;
  const where = a.state || "Nigeria";
  const subject = `${a.monthLabel}: ${b.headline}`.slice(0, 150);
  const sandbox = `${a.siteUrl.replace(/\/+$/, "")}/sandbox`;

  const items = b.items
    .map((it) => {
      const links = it.sourceUrls
        .map(safeUrl)
        .filter((u): u is string => !!u)
        .map((u, i) => `<a href="${escapeHtml(u)}" style="color:${GOLD}">Source ${i + 1}</a>`)
        .join(" &nbsp;·&nbsp; ");
      return `<tr><td style="padding:16px 0;border-top:1px solid #e5e0d5">
<p style="margin:0 0 6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${IMPACT_COLOUR[it.impact]}">${escapeHtml(it.impact)} impact</p>
<p style="margin:0 0 8px;font-size:17px;font-weight:bold;color:#111">${escapeHtml(it.title)}</p>
<p style="margin:0 0 6px;font-size:14px;line-height:1.5"><strong>What changed:</strong> ${escapeHtml(it.whatChanged)}</p>
<p style="margin:0 0 6px;font-size:14px;line-height:1.5"><strong>What to expect:</strong> ${escapeHtml(it.whatToExpect)}</p>
<p style="margin:0 0 8px;font-size:14px;line-height:1.5"><strong>What to do:</strong> ${escapeHtml(it.suggestedAction)}</p>
<p style="margin:0;font-size:13px">${links}</p></td></tr>`;
    })
    .join("");

  const seasons = b.seasonNotes.length
    ? `<h2 style="font-size:16px;margin:28px 0 8px">Seasons and festivities ahead</h2><ul style="padding-left:18px;margin:0;font-size:14px;line-height:1.5">${b.seasonNotes
        .map((s) => `<li><strong>${escapeHtml(s.title)}</strong> (${escapeHtml(s.when)}): ${escapeHtml(s.note)}</li>`)
        .join("")}</ul>`
    : "";
  const watch = b.watchNext.length
    ? `<h2 style="font-size:16px;margin:28px 0 8px">Watch next</h2><ul style="padding-left:18px;margin:0;font-size:14px;line-height:1.5">${b.watchNext
        .map((w) => `<li>${escapeHtml(w)}</li>`)
        .join("")}</ul>`
    : "";

  const personal = a.personal
    ? `<div style="margin:24px 0 0;padding:16px 18px;background:#faf6ea;border-left:4px solid ${GOLD}"><h2 style="font-size:16px;margin:0 0 10px;color:#111">${escapeHtml(a.personal.heading)}</h2><ul style="padding-left:18px;margin:0;font-size:14px;line-height:1.55">${a.personal.lines
        .map((l) => `<li style="margin-bottom:8px">${escapeHtml(l)}</li>`)
        .join("")}</ul><p style="margin:10px 0 0;font-size:12px;color:#6b6b6b">${escapeHtml(a.personal.footnote)}</p></div>`
    : "";

  const html = `<!doctype html><html><body style="margin:0;background:#f6f3ec;font-family:Arial,Helvetica,sans-serif;color:#222">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;padding:28px">
<tr><td>
<p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${GOLD}">Arch Consult · Business Sandbox</p>
<p style="margin:0 0 16px;font-size:13px;color:#6b6b6b">${escapeHtml(a.monthLabel)} · ${escapeHtml(a.nicheLabel)} · ${escapeHtml(where)}</p>
<h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#111">${escapeHtml(b.headline)}</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6">${escapeHtml(b.summary)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
${seasons}${watch}${personal}
<p style="margin:28px 0 0"><a href="${escapeHtml(sandbox)}" style="display:inline-block;background:${GOLD};color:#111;padding:12px 22px;text-decoration:none;font-size:14px;font-weight:bold">Re-run your numbers in the Sandbox</a></p>
<p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#6b6b6b">This briefing is general information drawn from published news. It is not legal, tax or financial advice, and seasonal notes describe what is typical, not a forecast. Check the sources before acting.</p>
<p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:#6b6b6b">You receive this because you have Sandbox access with Arch Consult. <a href="${escapeHtml(a.unsubscribeUrl)}" style="color:#6b6b6b">Unsubscribe</a></p>
</td></tr></table></td></tr></table></body></html>`;

  const text = [
    `${a.monthLabel} · ${a.nicheLabel} · ${where}`,
    "",
    b.headline,
    "",
    b.summary,
    "",
    ...b.items.flatMap((it) => [
      `[${it.impact.toUpperCase()}] ${it.title}`,
      `What changed: ${it.whatChanged}`,
      `What to expect: ${it.whatToExpect}`,
      `What to do: ${it.suggestedAction}`,
      ...it.sourceUrls.map(safeUrl).filter((u): u is string => !!u),
      "",
    ]),
    ...(b.seasonNotes.length ? ["Seasons and festivities ahead:", ...b.seasonNotes.map((s) => `- ${s.title} (${s.when}): ${s.note}`), ""] : []),
    ...(b.watchNext.length ? ["Watch next:", ...b.watchNext.map((w) => `- ${w}`), ""] : []),
    ...(a.personal ? [a.personal.heading + ":", ...a.personal.lines.map((l) => `- ${l}`), a.personal.footnote, ""] : []),
    `Re-run your numbers: ${sandbox}`,
    "",
    "General information from published news; not legal, tax or financial advice.",
    `Unsubscribe: ${a.unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}
