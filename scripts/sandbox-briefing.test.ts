import { parseFeed, collectNews, cleanText } from "../lib/sandbox/briefing/rss";
import { selectItems } from "../lib/sandbox/briefing/relevance";
import { upcomingEvents, seasonsInWindow } from "../lib/sandbox/briefing/calendar";
import { validateBriefing, extractJson } from "../lib/sandbox/briefing/validate";
import { generateBriefing, monthLabel } from "../lib/sandbox/briefing/generate";
import { buildBriefingMessages } from "../lib/sandbox/briefing/prompt";
import { NewsItem } from "../lib/sandbox/briefing/types";
import { planCombos, currentMonthLagos, isMonth, MAX_STATE_COMBOS } from "../lib/sandbox/briefing/plan";

let failed = 0;
function t(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve().then(fn).then(
    () => console.log("PASS " + name),
    (e) => { failed++; console.log("FAIL " + name + ": " + (e as Error).message); },
  );
}
function ok(c: boolean, m: string) { if (!c) throw new Error(m); }

const NOW = new Date("2026-11-06T09:00:00Z");
const RSS = `<?xml version="1.0"?><rss version="2.0"><channel><title>X</title>
<item><title><![CDATA[Naira falls as flour prices rise &amp; bakers worry]]></title><link>https://news.example/a</link><pubDate>Mon, 02 Nov 2026 08:00:00 +0000</pubDate>
<description><![CDATA[<p>Wheat &amp; flour costs went up in <b>Lagos</b>.</p>]]></description></item>
<item><title>Old story</title><link>https://news.example/old</link><pubDate>Mon, 01 Jun 2026 08:00:00 +0000</pubDate><description>Very old</description></item>
<item><title>Bad link</title><link>javascript:alert(1)</link><description>x</description></item>
</channel></rss>`;
const ATOM = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Diesel price hits record</title><link href="https://other.example/d" rel="alternate"/><updated>2026-11-04T10:00:00Z</updated><summary>Diesel costs for generators rise.&#8217;</summary></entry></feed>`;

(async () => {
  await t("cleanText unwraps CDATA, entities and tags", () => ok(cleanText("<![CDATA[<p>A &amp; B&#8217;s</p>]]>") === "A & B’s", cleanText("<![CDATA[<p>A &amp; B&#8217;s</p>]]>")));
  await t("RSS parsed, unsafe links dropped", () => {
    const items = parseFeed(RSS, "Src");
    ok(items.length === 2, "count " + items.length);
    ok(items[0].title === "Naira falls as flour prices rise & bakers worry", items[0].title);
    ok(items[0].summary === "Wheat & flour costs went up in Lagos .", items[0].summary);
    ok(items[0].publishedAt === "2026-11-02T08:00:00.000Z", String(items[0].publishedAt));
  });
  await t("Atom parsed", () => {
    const items = parseFeed(ATOM, "Atom");
    ok(items.length === 1 && items[0].url === "https://other.example/d" && items[0].publishedAt === "2026-11-04T10:00:00.000Z", JSON.stringify(items));
  });
  const fakeFetch = async (url: string) => {
    if (url.includes("good")) return { ok: true, status: 200, text: async () => RSS };
    if (url.includes("atom")) return { ok: true, status: 200, text: async () => ATOM };
    if (url.includes("empty")) return { ok: true, status: 200, text: async () => "<rss></rss>" };
    if (url.includes("boom")) throw new Error("network down");
    return { ok: false, status: 404, text: async () => "" };
  };
  let news: NewsItem[] = [];
  await t("collectNews skips failures, old items and duplicates", async () => {
    const feeds = [
      { id: "good", name: "Good", url: "https://good.example/feed" },
      { id: "good2", name: "Good2", url: "https://good.example/feed2" },
      { id: "atom", name: "Atom", url: "https://atom.example/feed" },
      { id: "missing", name: "Missing", url: "https://x.example/404" },
      { id: "empty", name: "Empty", url: "https://empty.example/feed" },
      { id: "boom", name: "Boom", url: "https://boom.example/feed" },
    ];
    const r = await collectNews(feeds, fakeFetch, NOW, 35);
    news = r.items;
    ok(r.items.length === 2, "items " + r.items.length + " " + r.items.map((i) => i.url));
    ok(r.items[0].url === "https://other.example/d" || r.items[0].url === "https://news.example/a", "sorted newest first");
    ok(r.status.filter((s) => s.ok).length === 3 && r.status.filter((s) => !s.ok).length === 3, JSON.stringify(r.status));
    ok(r.status.find((s) => s.id === "boom")!.error === "network down", "error text");
  });
  await t("relevance: bakery sees flour/diesel news, ignores unrelated", () => {
    const extra: NewsItem[] = [...news, { title: "Celebrity wedding in Abuja", url: "https://x.example/c", publishedAt: "2026-11-05T00:00:00Z", summary: "Guests arrived.", source: "S" }];
    const sel = selectItems(extra, "food-production", "Lagos", 10);
    ok(sel.length === 2 && !sel.some((i) => i.title.includes("Celebrity")), sel.map((i) => i.title).join("|"));
    ok(sel[0].title.includes("flour"), "flour story first for bakery in Lagos");
  });
  await t("calendar: window and seasons", () => {
    const ev = upcomingEvents(new Date("2026-12-01T00:00:00Z"), 90).map((e) => e.name);
    ok(ev.includes("Christmas Day") && ev.includes("Valentine's Day") && !ev.includes("Workers' Day"), ev.join("|"));
    const se = seasonsInWindow(new Date("2026-12-01T00:00:00Z"), 90).map((s) => s.name);
    ok(se.includes("Festive season") && se.includes("Harmattan") && !se.includes("Flood-risk peak"), se.join("|"));
  });
  await t("monthLabel", () => ok(monthLabel("2026-11") === "November 2026", monthLabel("2026-11")));
  await t("prompt contains data and rules", () => {
    const m = buildBriefingMessages({ nicheLabel: "Bakery", state: "Lagos", monthLabel: "November 2026", items: news, events: [], seasons: [] });
    ok(m[0].content.includes("Never invent") && m[1].content.includes("https://news.example/a"), "prompt");
  });
  const good = {
    headline: "Flour and diesel costs are rising for bakers",
    summary: "Two cost pressures matter most. Plan your December stock early.",
    items: [
      { title: "Flour is more expensive", whatChanged: "Flour prices rose in Lagos.", whatToExpect: "Your cost per loaf may rise over the next months.", impact: "high", suggestedAction: "Ask two suppliers for a fixed price now.", sourceUrls: ["https://news.example/a"] },
      { title: "Made-up story", whatChanged: "Something invented.", whatToExpect: "Nothing real.", impact: "low", suggestedAction: "None.", sourceUrls: ["https://invented.example/x"] },
    ],
    seasonNotes: [{ title: "Festive season", when: "December", note: "Demand usually rises." }],
    watchNext: ["Diesel prices"],
  };
  await t("validator drops items citing links we never supplied", () => {
    const v = validateBriefing(good, new Set(["https://news.example/a", "https://other.example/d"]));
    ok(v.ok && v.briefing!.items.length === 1 && v.dropped[0] === "Made-up story", JSON.stringify(v));
  });
  await t("validator rejects non-objects and missing headline", () => {
    ok(!validateBriefing("x", new Set()).ok, "string");
    ok(!validateBriefing({ summary: "s", items: [] }, new Set()).ok, "no headline");
  });
  await t("validator strips angle brackets and fixes bad impact", () => {
    const v = validateBriefing({ headline: "<b>H</b>", summary: "S", items: [{ title: "T", whatChanged: "a", whatToExpect: "b", impact: "extreme", suggestedAction: "c", sourceUrls: ["https://u"] }] }, new Set(["https://u"]));
    ok(v.ok && v.briefing!.headline === "bH/b" && v.briefing!.items[0].impact === "medium", JSON.stringify(v.briefing));
  });
  await t("extractJson handles code fences and chatter", () => {
    ok((extractJson("Sure!\n```json\n{\"a\":1}\n```") as any).a === 1, "fence");
    ok((extractJson("here {\"b\":2} done") as any).b === 2, "chatter");
    let threw = false; try { extractJson("no json"); } catch { threw = true; }
    ok(threw, "throws");
  });
  await t("generateBriefing: good reply accepted, only cited sources kept", async () => {
    const r = await generateBriefing({ month: "2026-12", niche: "food-production", state: "Lagos", news, llm: async () => "```json\n" + JSON.stringify(good) + "\n```" });
    ok(r.ok && r.briefing!.items.length === 1 && r.sources.length === 1 && r.sources[0].url === "https://news.example/a", JSON.stringify(r));
  });
  await t("generateBriefing: AI failure and unreadable reply give clear errors", async () => {
    const a = await generateBriefing({ month: "2026-12", niche: "restaurant", state: null, news, llm: async () => { throw new Error("provider down"); } });
    ok(!a.ok && a.error === "provider down", String(a.error));
    const b = await generateBriefing({ month: "2026-12", niche: "restaurant", state: null, news, llm: async () => "I cannot help" });
    ok(!b.ok && /not readable/.test(b.error!), String(b.error));
    const c = await generateBriefing({ month: "2026-12", niche: "nonsense", state: null, news, llm: async () => "{}" });
    ok(!c.ok, "unknown niche");
  });
  await t("planCombos: national per business type, plus real state pairs, deduped and validated", () => {
    const c = planCombos([
      { business_type: "restaurant", state_name: "Lagos" },
      { business_type: "restaurant", state_name: "Lagos" },
      { business_type: "custom", state_name: "Kano" },
      { business_type: "beauty-salon", state_name: "  " },
      { business_type: null, state_name: "Abuja" },
      { business_type: "retail-shop", state_name: "Oyo" },
    ]);
    ok(c.filter((x) => x.state === "").length === 6, "6 national");
    ok(c.filter((x) => x.state !== "").length === 2, "2 state combos: " + JSON.stringify(c.filter((x) => x.state)));
  });
  await t("planCombos caps state pairs", () => {
    const many = Array.from({ length: 80 }, (_, i) => ({ business_type: "restaurant", state_name: "S" + i }));
    ok(planCombos(many).filter((x) => x.state).length === MAX_STATE_COMBOS, "cap");
  });
  await t("month helpers use Nigerian time", () => {
    ok(currentMonthLagos(new Date("2026-11-30T23:30:00Z")) === "2026-12", "month rolls over at 00:30 Lagos");
    ok(currentMonthLagos(new Date("2026-11-06T10:00:00Z")) === "2026-11", "mid month");
    ok(isMonth("2026-11") && !isMonth("2026-13") && !isMonth("nov"), "isMonth");
  });
  console.log(failed ? `${failed} FAILED` : "ALL PASSED");
  process.exit(failed ? 1 : 0);
})();
