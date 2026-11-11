import { BusinessProfile } from "../profile";
import { CalendarEvent, Season } from "./calendar";
import { collectNews, FetchLike } from "./rss";
import { FeedConfig, NewsItem } from "./types";

const STOP = new Set(
  ("a an the and or of to in on at for with from by is are was were be been will would i we my our your you it its this that these those " +
    "sell sells selling selected make makes making made buy buys buying business businesses small medium big new old some any all more most " +
    "also just very really like want wants need needs help get got have has had do does doing about around near into than then them they their " +
    "people customer customers client clients nigeria nigerian lagos abuja state town area shop store company service services product products " +
    "idea start started starting run running open opening plan using use used day days week weeks month months year years").split(" "),
);

/** The few words in the owner's own description that best name what the business is. */
export function keywordsOf(profile: Pick<BusinessProfile, "description" | "suppliers" | "customers">): string[] {
  const text = `${profile.description} ${profile.suppliers}`.toLowerCase();
  const counts = new Map<string, { n: number; first: number }>();
  let pos = 0;
  for (const w of text.match(/[a-z][a-z'-]{2,}/g) ?? []) {
    pos++;
    const word = w.replace(/^'+|'+$/g, "");
    if (word.length < 4 || STOP.has(word)) continue;
    const c = counts.get(word);
    if (c) c.n++;
    else counts.set(word, { n: 1, first: pos });
  }
  // Words said more than once come first, then the order the owner wrote them in.
  return Array.from(counts.entries())
    .sort((a, b) => b[1].n - a[1].n || a[1].first - b[1].first)
    .slice(0, 8)
    .map(([w]) => w);
}

const cleanState = (s: string) => s.replace(/\s*\(.*\)\s*$/, "").trim();

/** Google News search feeds for this one business and place. */
export function localFeeds(profile: Pick<BusinessProfile, "description" | "suppliers" | "customers" | "area">, state: string): FeedConfig[] {
  const st = cleanState(state);
  const area = profile.area.trim();
  const kw = keywordsOf(profile);
  const top = kw.slice(0, 3).join(" ");
  const feed = (id: string, name: string, q: string): FeedConfig => ({
    id,
    name,
    url: `https://news.google.com/rss/search?q=${encodeURIComponent(`${q} when:35d`)}&hl=en-NG&gl=NG&ceid=NG:en`,
  });
  const feeds: FeedConfig[] = [];
  if (area) feeds.push(feed("local-area", `News for ${area}`, `${area} ${st}`));
  if (top && st) feeds.push(feed("local-state-business", `${st} news on your kind of business`, `${st} ${top}`));
  if (top) feeds.push(feed("national-business", "Nationwide news on your kind of business", `Nigeria ${top}`));
  return feeds;
}

export type Scope = "area" | "state" | "national";

export interface ScopedItem extends NewsItem {
  scope: Scope;
  score: number;
}

const MACRO = [
  "naira", "exchange rate", "inflation", "interest rate", "tax", "vat", "customs", "tariff", "fuel", "petrol", "diesel", "electricity",
  "tariff", "minimum wage", "flood", "emergency", "curfew", "protest", "strike", "market", "road", "bridge", "demolition", "levy",
  "cost of living", "price", "prices", "subsidy", "regulation", "policy", "ban", "loan", "grant",
];

const count = (hay: string, words: string[]) => words.reduce((n, w) => (w && hay.includes(w) ? n + 1 : n), 0);

/**
 * Keeps only news that touches this business in this place. An item must either mention the client's
 * area or state, or match words from their own business description. Pure national noise is dropped.
 */
export function selectForClient(
  items: NewsItem[],
  profile: Pick<BusinessProfile, "description" | "suppliers" | "customers" | "area">,
  state: string,
  max: number,
): ScopedItem[] {
  const kw = keywordsOf(profile);
  const area = profile.area.toLowerCase().trim();
  const areaWords = area.split(/[\s,/]+/).filter((w) => w.length >= 4);
  const st = cleanState(state).toLowerCase();
  const out: ScopedItem[] = [];
  for (const i of items) {
    const t = `${i.title} ${i.summary}`.toLowerCase();
    const inArea = (area && t.includes(area)) || areaWords.some((w) => t.includes(w));
    const inState = !!st && t.includes(st);
    const biz = count(t, kw);
    const macro = count(t, MACRO);
    const fromLocalFeed = i.source.startsWith("News for ") || i.source.includes(" news on your kind");
    if (!(inArea || inState || biz > 0)) continue;
    // Must also relate to running a business like theirs.
    if (!(biz > 0 || macro > 0 || fromLocalFeed)) continue;
    const scope: Scope = inArea ? "area" : inState ? "state" : "national";
    const score = (inArea ? 10 : 0) + (inState ? 3 : 0) + biz * 3 + Math.min(macro, 3) + (fromLocalFeed ? 1 : 0);
    out.push({ ...i, scope, score });
  }
  out.sort((a, b) => b.score - a.score || (Date.parse(b.publishedAt ?? "") || 0) - (Date.parse(a.publishedAt ?? "") || 0));
  return out.slice(0, max);
}

/** Fetches this client's local news. A feed that fails is skipped, so a briefing is never blocked by one. */
export async function fetchLocalNews(
  profile: Pick<BusinessProfile, "description" | "suppliers" | "customers" | "area">,
  state: string,
  fetchImpl: FetchLike,
  now: Date,
  maxAgeDays: number,
): Promise<NewsItem[]> {
  const feeds = localFeeds(profile, state);
  if (feeds.length === 0) return [];
  const { items } = await collectNews(feeds, fetchImpl, now, maxAgeDays);
  return items;
}

export type { CalendarEvent, Season };
