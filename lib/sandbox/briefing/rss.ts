import { FeedConfig, FeedStatus, NewsItem } from "./types";

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : "";
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** Turns a raw feed field into plain text: unwraps CDATA, decodes entities, drops tags. */
export function cleanText(raw: string): string {
  return decode(raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function blocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>[\\s\\S]*?</${tag}>`, "gi");
  return xml.match(re) ?? [];
}

function field(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1] : null;
}

function link(block: string): string | null {
  const href = block.match(/<link[^>]*\shref=["']([^"']+)["'][^>]*>/i);
  if (href) return decode(href[1]).trim();
  const text = field(block, "link");
  return text ? cleanText(text) : null;
}

function safeUrl(u: string | null): string | null {
  if (!u) return null;
  try {
    const p = new URL(u);
    return p.protocol === "http:" || p.protocol === "https:" ? p.toString() : null;
  } catch {
    return null;
  }
}

function toIso(d: string | null): string | null {
  if (!d) return null;
  const t = Date.parse(cleanText(d));
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

/** Reads RSS 2.0 and Atom feeds without any extra library. */
export function parseFeed(xml: string, source: string): NewsItem[] {
  const entries = [...blocks(xml, "item"), ...blocks(xml, "entry")];
  const items: NewsItem[] = [];
  for (const b of entries) {
    const title = cleanText(field(b, "title") ?? "");
    const url = safeUrl(link(b));
    if (!title || !url) continue;
    const summaryRaw = field(b, "description") ?? field(b, "summary") ?? field(b, "content:encoded") ?? field(b, "content") ?? "";
    items.push({
      title: title.slice(0, 220),
      url,
      publishedAt: toIso(field(b, "pubDate") ?? field(b, "published") ?? field(b, "updated") ?? field(b, "dc:date")),
      summary: cleanText(summaryRaw).slice(0, 400),
      source,
    });
  }
  return items;
}

export type FetchLike = (url: string, init?: { signal?: AbortSignal; headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

const MAX_BYTES = 1_500_000;

/** Fetches every feed, skipping any that fail. Returns the fresh items and a status per feed. */
export async function collectNews(
  feeds: FeedConfig[],
  fetchImpl: FetchLike,
  now: Date,
  maxAgeDays: number,
): Promise<{ items: NewsItem[]; status: FeedStatus[] }> {
  const cutoff = now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000;
  const status: FeedStatus[] = [];
  const all: NewsItem[] = [];

  await Promise.all(
    feeds.map(async (f) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12_000);
      try {
        const res = await fetchImpl(f.url, {
          signal: controller.signal,
          headers: { "User-Agent": "ArchConsultBriefingBot/1.0", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = (await res.text()).slice(0, MAX_BYTES);
        const parsed = parseFeed(xml, f.name).filter((i) => !i.publishedAt || Date.parse(i.publishedAt) >= cutoff);
        if (parsed.length === 0) throw new Error("No readable items");
        all.push(...parsed);
        status.push({ id: f.id, ok: true, count: parsed.length });
      } catch (e) {
        status.push({ id: f.id, ok: false, count: 0, error: e instanceof Error ? e.message.slice(0, 120) : "Failed" });
      } finally {
        clearTimeout(timer);
      }
    }),
  );

  const seen = new Set<string>();
  const items = all
    .filter((i) => (seen.has(i.url) ? false : (seen.add(i.url), true)))
    .sort((a, b) => (Date.parse(b.publishedAt ?? "") || 0) - (Date.parse(a.publishedAt ?? "") || 0));
  return { items, status };
}
