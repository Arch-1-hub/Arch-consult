import { parseFeed, collectNews, cleanText } from "../lib/sandbox/briefing/rss";
import { upcomingEvents, seasonsInWindow } from "../lib/sandbox/briefing/calendar";
import { validateBriefing, extractJson } from "../lib/sandbox/briefing/validate";
import { generateClientBriefing, monthLabel } from "../lib/sandbox/briefing/generate";
import { buildClientMessages } from "../lib/sandbox/briefing/prompt";
import { keywordsOf, localFeeds, selectForClient } from "../lib/sandbox/briefing/local";
import { growthFacts, growthSection } from "../lib/sandbox/briefing/growth";
import { emptyProfile, sanitizeProfile, isProfileValid } from "../lib/sandbox/profile";
import { NewsItem } from "../lib/sandbox/briefing/types";
import { decideRecipients } from "../lib/sandbox/briefing/audience";
import { dispatchApproved, OutMessage } from "../lib/sandbox/briefing/dispatch";
import { renderBriefingEmail } from "../lib/sandbox/briefing/email";
import { signEmail, verifyEmailToken, unsubscribeUrl } from "../lib/sandbox/briefing/unsubscribe";
import { sendBatch } from "../lib/sandbox/briefing/resend";
import { PRESETS } from "../lib/sandbox/presets";
import { currentMonthLagos, isMonth } from "../lib/sandbox/briefing/plan";

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
  const bakery = { ...emptyProfile(), description: "I bake and sell cakes and small chops for birthdays and offices", customers: "Offices around Yaba", area: "Yaba", suppliers: "Flour and sugar from Mushin market" };
  await t("profile: sanitised and validated", () => {
    ok(isProfileValid(bakery), "valid");
    ok(sanitizeProfile({ ...bakery, description: "<b>Cakes</b> and pastries for offices" })!.description === "bCakes/b and pastries for offices", "angle brackets stripped");
    ok(sanitizeProfile({ ...bakery, description: "short" }) === null, "too short rejected");
    ok(sanitizeProfile("x") === null && sanitizeProfile(null) === null, "non-objects rejected");
  });
  await t("keywords come from the owner's own words, not a fixed list", () => {
    const k = keywordsOf(bakery);
    ok(k.includes("cakes") && k.includes("flour") && !k.includes("and") && !k.includes("sell"), k.join());
    ok(keywordsOf({ description: "I run a drone photography studio", customers: "weddings", suppliers: "" }).includes("drone"), "any business works");
  });
  await t("local feeds: area, state+business, nationwide business", () => {
    const f = localFeeds(bakery, "Lagos");
    ok(f.length === 3 && f[0].url.startsWith("https://news.google.com/rss/search?q=") && decodeURIComponent(f[0].url).includes("Yaba Lagos"), f.map((x) => x.url).join("\n"));
    ok(localFeeds({ ...bakery, area: "" }, "Lagos").length === 2, "no area, two feeds");
  });
  const mk = (title: string, summary: string, source = "BusinessDay", d = "2026-11-03T00:00:00Z") => ({ title, url: "https://n.example/" + encodeURIComponent(title), publishedAt: d, summary, source });
  await t("selection: only news touching this business in this place", () => {
    const items = [
      mk("Yaba traders protest new market levy", "Traders in Yaba say the levy hurts sales."),
      mk("Flour prices climb across Lagos", "Bakers in Lagos pay more for flour."),
      mk("Senate debates electoral act", "Politics."),
      mk("Celebrity wedding in Abuja", "Guests arrived."),
      mk("Wheat shortage hits bakers nationwide", "Flour supply is tight."),
      mk("Diesel price up", "Generators cost more.", "Nationwide news on your kind of business"),
    ];
    const sel = selectForClient(items, bakery, "Lagos", 10);
    const titles = sel.map((s) => s.title);
    ok(!titles.includes("Senate debates electoral act") && !titles.includes("Celebrity wedding in Abuja"), "irrelevant dropped: " + titles.join("|"));
    ok(sel[0].title.startsWith("Yaba") && sel[0].scope === "area", "area first: " + sel[0].title);
    ok(sel.find((s) => s.title.startsWith("Flour prices"))!.scope === "state", "state scope");
    ok(sel.find((s) => s.title.startsWith("Wheat shortage"))!.scope === "national", "national scope only if it matches the business");
  });
  const inputs = { ...PRESETS.find((p) => p.id === "food-production")!.inputs, businessName: "Ada's Bakes" };
  const ctxC: any = { status: "company", professionalServices: false };
  await t("growth facts: from the client's own simulation, levers ranked", () => {
    const f = growthFacts(inputs, ctxC)!;
    ok(!!f && f.months === inputs.months && f.levers.length > 0, "facts");
    for (let i = 1; i < f.levers.length; i++) ok(f.levers[i - 1].gain >= f.levers[i].gain, "sorted");
    const g = growthSection(f, "Ada's Bakes");
    ok(g.heading === "Where Ada's Bakes stands" && g.lines.length >= 3 && g.lines.some((l) => l.startsWith("Your strongest lever")), g.lines.join("|"));
    const g2 = growthFacts({ ...inputs, startingCapital: 50000, setupCosts: 40000 }, ctxC)!;
    ok(g2.lowestCash !== f.lowestCash, "different business, different numbers");
  });
  await t("prompt carries profile, facts and rules, never another client's data", () => {
    const sel = selectForClient([mk("Yaba traders protest new market levy", "Traders in Yaba.")], bakery, "Lagos", 5);
    const m = buildClientMessages({ profile: bakery, state: "Lagos", monthLabel: "November 2026", facts: growthFacts(inputs, ctxC), items: sel, events: [], seasons: [] });
    ok(m[0].content.includes("Never invent") && m[1].content.includes("whatItDoes") && m[1].content.includes("Yaba") && m[1].content.includes("strongestLevers"), "prompt");
  });
  await t("calendar: window and seasons", () => {
    const ev = upcomingEvents(new Date("2026-12-01T00:00:00Z"), 90).map((e) => e.name);
    ok(ev.includes("Christmas Day") && !ev.includes("Workers' Day"), ev.join("|"));
    const se = seasonsInWindow(new Date("2026-12-01T00:00:00Z"), 90).map((s) => s.name);
    ok(se.includes("Festive season") && !se.includes("Flood-risk peak"), se.join("|"));
  });
  await t("monthLabel and month helpers", () => {
    ok(monthLabel("2026-11") === "November 2026", "label");
    ok(currentMonthLagos(new Date("2026-11-30T23:30:00Z")) === "2026-12" && currentMonthLagos(new Date("2026-11-06T10:00:00Z")) === "2026-11", "lagos month");
    ok(isMonth("2026-11") && !isMonth("2026-13") && !isMonth("nov"), "isMonth");
  });
  const yaba = mk("Yaba traders protest new market levy", "Traders in Yaba say the levy hurts sales.");
  const good = {
    headline: "A market levy in Yaba could squeeze your margins",
    summary: "Your plan reaches profit steadily. A new levy near you is the main thing to watch.",
    items: [
      { title: "New levy on Yaba traders", whatChanged: "Traders protest a new levy.", whatToExpect: "Stall costs may rise.", impact: "high", suggestedAction: "Ask your landlord what applies to you.", sourceUrls: [yaba.url] },
      { title: "Made-up story", whatChanged: "Invented.", whatToExpect: "Nothing.", impact: "low", suggestedAction: "None.", sourceUrls: ["https://invented.example/x"] },
    ],
    growthActions: ["Raise prices 5% on your best seller.", "Plan stock early for December.", "x".repeat(400), "four", ],
    seasonNotes: [{ title: "Festive season", when: "December", note: "Demand usually rises." }],
    watchNext: ["Levy announcement"],
  };
  await t("validator: drops invented sources, caps growth actions", () => {
    const v = validateBriefing(good, new Set([yaba.url]));
    ok(v.ok && v.briefing!.items.length === 1 && v.dropped[0] === "Made-up story", JSON.stringify(v));
    ok(v.briefing!.growthActions!.length === 3 && v.briefing!.growthActions![2].length <= 300, "growth actions capped");
    ok(!validateBriefing("x", new Set()).ok && !validateBriefing({ summary: "s", items: [] }, new Set()).ok, "bad input rejected");
  });
  await t("extractJson handles code fences and chatter", () => {
    ok((extractJson("Sure!\n```json\n{\"a\":1}\n```") as any).a === 1, "fence");
    ok((extractJson("here {\"b\":2} done") as any).b === 2, "chatter");
    let threw = false; try { extractJson("no json"); } catch { threw = true; }
    ok(threw, "throws");
  });
  await t("generateClientBriefing: accepts good reply, tags scope, keeps only cited sources", async () => {
    const r = await generateClientBriefing({ month: "2026-12", profile: bakery, businessName: "Ada's Bakes", state: "Lagos", inputs, ctx: ctxC, news: [yaba, mk("Celebrity wedding", "x")], llm: async () => "```json\n" + JSON.stringify(good) + "\n```" });
    ok(r.ok && r.briefing!.items.length === 1 && r.briefing!.items[0].scope === "area", JSON.stringify(r.error));
    ok(r.sources.length === 1 && !!r.growth && r.growth.heading.includes("Ada"), "sources and growth block");
  });
  await t("generateClientBriefing: quiet month is fine; failures give clear errors", async () => {
    const quiet = { headline: "A quiet month", summary: "No news affects you this month.", items: [], growthActions: ["Focus on retention."], seasonNotes: [], watchNext: [] };
    const q = await generateClientBriefing({ month: "2026-12", profile: bakery, state: "Lagos", inputs, ctx: ctxC, news: [], llm: async () => JSON.stringify(quiet) });
    ok(q.ok && q.briefing!.items.length === 0, "quiet ok");
    const a = await generateClientBriefing({ month: "2026-12", profile: bakery, state: "Lagos", inputs, ctx: ctxC, news: [], llm: async () => { throw new Error("provider down"); } });
    ok(!a.ok && a.error === "provider down", String(a.error));
    const b = await generateClientBriefing({ month: "2026-12", profile: bakery, state: "Lagos", inputs, ctx: ctxC, news: [], llm: async () => "I cannot help" });
    ok(!b.ok && /not readable/.test(b.error!), String(b.error));
  });
  await t("recipients: paid, verified, latest simulation, not opted out", () => {
    const sims = [
      { id: "s1", user_id: "u1", state_name: "Lagos", created_at: "2026-11-01" },
      { id: "s2", user_id: "u1", state_name: "Oyo", created_at: "2026-11-05" },
      { id: "s3", user_id: "u2", state_name: "Lagos", created_at: "2026-11-02" },
      { id: "s4", user_id: "u3", state_name: "Lagos", created_at: "2026-11-02" },
      { id: "s5", user_id: "u4", state_name: "Kano", created_at: "2026-11-02" },
      { id: "s6", user_id: "u5", state_name: "Kano", created_at: "2026-11-02" },
    ];
    const users: any = { u1: { email: "A@x.com", confirmed: true }, u2: { email: "b@x.com", confirmed: true }, u3: { email: "c@x.com", confirmed: false }, u4: { email: "d@x.com", confirmed: true }, u5: { email: "e@x.com", confirmed: true } };
    const r = decideRecipients({ sims, users, paidUserIds: new Set(["u1", "u3"]), paidEmails: new Set(["d@x.com", "e@x.com"]), allowlist: "", optouts: new Set(["e@x.com"]) });
    const by = Object.fromEntries(r.map((x) => [x.email, x]));
    ok(by["a@x.com"]?.simId === "s2" && by["a@x.com"].state === "Oyo", "latest sim, lowercased email");
    ok(!by["b@x.com"] && !by["c@x.com"] && !by["e@x.com"] && !!by["d@x.com"], "unpaid, unverified and opted-out excluded; guest payer included");
    const al = decideRecipients({ sims, users, paidUserIds: new Set(), paidEmails: new Set(), allowlist: "b@x.com", optouts: new Set() });
    ok(al.length === 1 && al[0].email === "b@x.com", "allowlist counts as paid");
  });
  const mkStore = (n: number) => {
    const rows = Array.from({ length: n }, (_, i) => ({ id: "r" + i, email: `p${i}@x.com`, status: "approved" }));
    return {
      rows,
      store: {
        claim: async (limit: number) => rows.filter((r) => r.status === "approved").slice(0, limit).map((r) => ((r.status = "sent"), { id: r.id, email: r.email })),
        revert: async (ids: string[]) => rows.forEach((r) => ids.includes(r.id) && (r.status = "approved")),
        drop: async (ids: string[]) => rows.forEach((r) => ids.includes(r.id) && (r.status = "rejected")),
        waiting: async () => rows.filter((r) => r.status === "approved").length,
      },
    };
  };
  await t("dispatch: batches, never twice, skips opted-out, reverts on failure", async () => {
    const { rows, store } = mkStore(5);
    const sent: string[] = [];
    const mailer = async (m: OutMessage[]) => (m.forEach((x) => sent.push(x.to)), { ok: true });
    const build = async (r: { id: string; email: string }): Promise<OutMessage | null> => (r.email === "p1@x.com" ? null : { to: r.email, subject: "s", html: "h", text: "t", headers: {} });
    const a = await dispatchApproved({ store, mailer, build, limit: 2 });
    ok(a.sent === 1 && a.remaining === 3, "first batch (one skipped) " + JSON.stringify(a));
    const b = await dispatchApproved({ store, mailer, build, limit: 10 });
    ok(b.sent === 3 && b.remaining === 0, "rest");
    const c = await dispatchApproved({ store, mailer, build, limit: 10 });
    ok(c.sent === 0 && sent.length === 4 && !sent.includes("p1@x.com") && rows[1].status === "rejected", "no repeats, opted-out dropped");
    const f = mkStore(3);
    const bad = await dispatchApproved({ store: f.store, mailer: async () => ({ ok: false, error: "boom" }), build, limit: 10 });
    ok(!!bad.error && f.rows.filter((r) => r.status === "approved").length === 2, "failure puts them back for a retry");
  });
  await t("unsubscribe links are signed per address", () => {
    const sec = "secret-123";
    const tok = signEmail("A@X.com", sec);
    ok(verifyEmailToken("a@x.com", tok, sec) && !verifyEmailToken("b@x.com", tok, sec) && !verifyEmailToken("a@x.com", tok, "other"), "per address and secret");
    ok(!verifyEmailToken("a@x.com", "x".repeat(40), sec) && !verifyEmailToken("a@x.com", "", sec) && !verifyEmailToken("a@x.com", tok, ""), "garbage rejected");
    ok(unsubscribeUrl("https://s.com/", "a+b@x.com", sec).startsWith("https://s.com/sandbox/unsubscribe?e=a%2Bb%40x.com&t="), "url shape");
  });
  await t("email shows growth block, actions, scope, escapes everything", () => {
    const m = renderBriefingEmail({
      briefing: { headline: "H <b>x</b>", summary: "S", items: [{ title: "T", impact: "high", scope: "area", whatChanged: "a", whatToExpect: "b", suggestedAction: "c", sourceUrls: ["https://ok.com/1", "javascript:alert(1)"] }], seasonNotes: [], watchNext: [], growthActions: ["Do A & B"] } as any,
      monthLabel: "November 2026", nicheLabel: "Ada's Bakes", state: "Yaba, Lagos", siteUrl: "https://s.com", unsubscribeUrl: "https://s.com/u?x=1&y=2",
      personal: { heading: "Where <X> stands", lines: ["Profit from month 4."], footnote: "f" },
    });
    ok(!m.html.includes("<b>x</b>") && m.html.includes("&lt;b&gt;") && m.html.includes("Where &lt;X&gt; stands"), "escaped");
    ok(m.html.includes("in your area") && m.html.includes("Your next 30 days") && m.html.includes("Do A &amp; B"), "scope and actions");
    ok(!m.html.includes("javascript:") && !m.text.includes("javascript:") && m.text.includes("Unsubscribe: https://s.com/u") && m.text.includes("1. Do A & B"), "safe links, text version");
  });
  await t("sendBatch posts to Resend and reports errors", async () => {
    let seen: any;
    const good2 = await sendBatch({ apiKey: "k", from: "A <a@x.com>", messages: [{ to: "b@x.com", subject: "s", html: "h", text: "t", headers: { H: "1" } }], fetchImpl: (async (u: any, init: any) => ((seen = { u, init }), new Response("{}", { status: 200 }))) as any });
    ok(good2.ok && seen.u === "https://api.resend.com/emails/batch" && JSON.parse(seen.init.body)[0].to[0] === "b@x.com", "request shape");
    const bad = await sendBatch({ apiKey: "k", from: "f", messages: [], fetchImpl: (async () => new Response("no", { status: 422 })) as any });
    ok(!bad.ok && /422/.test(bad.error ?? ""), "error reported");
  });
  console.log(failed ? `${failed} FAILED` : "ALL PASSED");
})();
