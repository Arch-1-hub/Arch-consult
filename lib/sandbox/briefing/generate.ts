import { PRESETS } from "../presets";
import { seasonsInWindow, upcomingEvents } from "./calendar";
import { buildBriefingMessages } from "./prompt";
import { selectItems } from "./relevance";
import { Briefing, ChatMessage, NewsItem } from "./types";
import { extractJson, validateBriefing } from "./validate";

export type Llm = (messages: ChatMessage[]) => Promise<string>;

export const NICHES = PRESETS.filter((p) => p.id !== "custom").map((p) => ({ id: p.id, label: p.label }));

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-11" to "November 2026". */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[(m || 1) - 1]} ${y}`;
}

export interface GenerateResult {
  ok: boolean;
  briefing: Briefing | null;
  sources: NewsItem[];
  dropped: string[];
  error?: string;
}

/**
 * Drafts one briefing. Only news matching this business type and state is sent to the AI,
 * and the reply is checked before it is accepted.
 */
export async function generateBriefing(args: {
  month: string;
  niche: string;
  state: string | null;
  news: NewsItem[];
  llm: Llm;
}): Promise<GenerateResult> {
  const niche = NICHES.find((n) => n.id === args.niche);
  if (!niche) return { ok: false, briefing: null, sources: [], dropped: [], error: "Unknown business type." };

  const from = new Date(`${args.month}-01T00:00:00Z`);
  const items = selectItems(args.news, args.niche, args.state, 12);
  const messages = buildBriefingMessages({
    nicheLabel: niche.label,
    state: args.state,
    monthLabel: monthLabel(args.month),
    items,
    events: upcomingEvents(from, 90),
    seasons: seasonsInWindow(from, 90),
  });

  let reply: string;
  try {
    reply = await args.llm(messages);
  } catch (e) {
    return { ok: false, briefing: null, sources: items, dropped: [], error: e instanceof Error ? e.message : "The AI call failed." };
  }

  let parsed: unknown;
  try {
    parsed = extractJson(reply);
  } catch {
    return { ok: false, briefing: null, sources: items, dropped: [], error: "The AI reply was not readable." };
  }

  const v = validateBriefing(parsed, new Set(items.map((i) => i.url)));
  if (!v.ok || !v.briefing) return { ok: false, briefing: null, sources: items, dropped: v.dropped, error: v.problems.join(" ") };

  const cited = new Set(v.briefing.items.flatMap((i) => i.sourceUrls));
  return { ok: true, briefing: v.briefing, sources: items.filter((i) => cited.has(i.url)), dropped: v.dropped };
}

/** The same provider choice the rest of the site uses: OpenAI first, then Groq. Null if neither key is set. */
export function llmFromEnv(env: Record<string, string | undefined>): Llm | null {
  const openaiKey = env.OPENAI_API_KEY;
  const groqKey = env.GROQ_API_KEY;
  const provider = openaiKey
    ? { apiKey: openaiKey, url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini" }
    : groqKey
      ? { apiKey: groqKey, url: "https://api.groq.com/openai/v1/chat/completions", model: "openai/gpt-oss-120b" }
      : null;
  if (!provider) return null;
  return async (messages) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);
    try {
      const res = await fetch(provider.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.apiKey}` },
        body: JSON.stringify({ model: provider.model, temperature: 0.2, messages }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`AI provider returned ${res.status}`);
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) throw new Error("Empty AI reply");
      return content;
    } finally {
      clearTimeout(timer);
    }
  };
}
