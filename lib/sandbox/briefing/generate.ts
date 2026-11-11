import { BusinessProfile } from "../profile";
import { RuleContext } from "../nigeria-rules";
import { SimulationInputs } from "../types";
import { seasonsInWindow, upcomingEvents } from "./calendar";
import { growthFacts, growthSection, GrowthSection } from "./growth";
import { ScopedItem, selectForClient } from "./local";
import { buildClientMessages } from "./prompt";
import { Briefing, ChatMessage, NewsItem } from "./types";
import { extractJson, validateBriefing } from "./validate";

export type Llm = (messages: ChatMessage[]) => Promise<string>;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-11" to "November 2026". */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[(m || 1) - 1]} ${y}`;
}

export interface GenerateResult {
  ok: boolean;
  briefing: Briefing | null;
  growth: GrowthSection | null;
  sources: NewsItem[];
  dropped: string[];
  error?: string;
}

/**
 * Drafts one briefing for one client. Only news that touches their business in their place is sent to the
 * AI, and the reply is checked before it is accepted: it may only cite links we really supplied.
 */
export async function generateClientBriefing(args: {
  month: string;
  profile: BusinessProfile;
  businessName?: string;
  state: string;
  inputs: SimulationInputs;
  ctx: RuleContext;
  news: NewsItem[];
  llm: Llm;
}): Promise<GenerateResult> {
  const fail = (error: string, extra: Partial<GenerateResult> = {}): GenerateResult => ({
    ok: false, briefing: null, growth: null, sources: [], dropped: [], error, ...extra,
  });

  const from = new Date(`${args.month}-01T00:00:00Z`);
  const items: ScopedItem[] = selectForClient(args.news, args.profile, args.state, 10);
  const facts = growthFacts(args.inputs, args.ctx);
  const messages = buildClientMessages({
    profile: args.profile,
    businessName: args.businessName,
    state: args.state,
    monthLabel: monthLabel(args.month),
    facts,
    items,
    events: upcomingEvents(from, 90),
    seasons: seasonsInWindow(from, 90),
  });

  let reply: string;
  try {
    reply = await args.llm(messages);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "The AI call failed.", { sources: items });
  }
  let parsed: unknown;
  try {
    parsed = extractJson(reply);
  } catch {
    return fail("The AI reply was not readable.", { sources: items });
  }

  const v = validateBriefing(parsed, new Set(items.map((i) => i.url)));
  if (!v.ok || !v.briefing) return fail(v.problems.join(" "), { sources: items, dropped: v.dropped });

  const byUrl = new Map(items.map((i) => [i.url, i]));
  for (const it of v.briefing.items) {
    const scopes = it.sourceUrls.map((u) => byUrl.get(u)?.scope).filter(Boolean);
    it.scope = scopes.includes("area") ? "area" : scopes.includes("state") ? "state" : "national";
  }
  const cited = new Set(v.briefing.items.flatMap((i) => i.sourceUrls));
  return {
    ok: true,
    briefing: v.briefing,
    growth: facts ? growthSection(facts, args.businessName) : null,
    sources: items.filter((i) => cited.has(i.url)),
    dropped: v.dropped,
  };
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
