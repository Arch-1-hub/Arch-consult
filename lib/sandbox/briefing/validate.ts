import { Briefing, BriefingItem, Impact } from "./types";

export interface Validated {
  ok: boolean;
  briefing: Briefing | null;
  /** Items removed because they cited a link that was not in the data. */
  dropped: string[];
  problems: string[];
}

const IMPACTS: Impact[] = ["high", "medium", "low"];

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").replace(/[<>]/g, "").trim().slice(0, max) : "";
}

/** Pulls the first JSON object out of a model reply, even if it is wrapped in a code fence. */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON found");
  return JSON.parse(body.slice(start, end + 1));
}

/**
 * Checks a model reply before anyone sees it. The key safety rule: an item may only cite links that
 * were really in the news we supplied. Anything else is removed, so the AI cannot invent a source.
 */
export function validateBriefing(raw: unknown, allowedUrls: Set<string>): Validated {
  const problems: string[] = [];
  const dropped: string[] = [];
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, briefing: null, dropped, problems: ["Reply was not a JSON object."] };
  }
  const r = raw as Record<string, unknown>;

  const headline = str(r.headline, 140);
  const summary = str(r.summary, 600);
  if (!headline) problems.push("Missing headline.");
  if (!summary) problems.push("Missing summary.");

  const items: BriefingItem[] = [];
  for (const it of Array.isArray(r.items) ? r.items.slice(0, 8) : []) {
    if (typeof it !== "object" || it === null) continue;
    const o = it as Record<string, unknown>;
    const title = str(o.title, 140);
    const urls = (Array.isArray(o.sourceUrls) ? o.sourceUrls : []).filter((u): u is string => typeof u === "string" && allowedUrls.has(u));
    const impact = IMPACTS.includes(o.impact as Impact) ? (o.impact as Impact) : "medium";
    const item: BriefingItem = {
      title,
      whatChanged: str(o.whatChanged, 450),
      whatToExpect: str(o.whatToExpect, 450),
      impact,
      suggestedAction: str(o.suggestedAction, 350),
      sourceUrls: [...new Set(urls)].slice(0, 3),
    };
    if (!title || !item.whatChanged || !item.whatToExpect) continue;
    if (item.sourceUrls.length === 0) {
      dropped.push(title);
      continue;
    }
    items.push(item);
    if (items.length === 5) break;
  }

  const seasonNotes = (Array.isArray(r.seasonNotes) ? r.seasonNotes : [])
    .slice(0, 4)
    .map((s) => {
      const o = (typeof s === "object" && s !== null ? s : {}) as Record<string, unknown>;
      return { title: str(o.title, 100), when: str(o.when, 100), note: str(o.note, 350) };
    })
    .filter((s) => s.title && s.note);

  const watchNext = (Array.isArray(r.watchNext) ? r.watchNext : [])
    .map((w) => str(w, 200))
    .filter(Boolean)
    .slice(0, 3);

  if (problems.length > 0) return { ok: false, briefing: null, dropped, problems };
  return { ok: true, briefing: { headline, summary, items, seasonNotes, watchNext }, dropped, problems };
}
