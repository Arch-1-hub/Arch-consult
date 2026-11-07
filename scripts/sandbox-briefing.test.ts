import { parseFeed, collectNews, cleanText } from "../lib/sandbox/briefing/rss";
import { selectItems } from "../lib/sandbox/briefing/relevance";
import { upcomingEvents, seasonsInWindow } from "../lib/sandbox/briefing/calendar";
import { validateBriefing, extractJson } from "../lib/sandbox/briefing/validate";
import { generateBriefing, monthLabel } from "../lib/sandbox/briefing/generate";
import { buildBriefingMessages } from "../lib/sandbox/briefing/prompt";
import { NewsItem } from "../lib/sandbox/briefing/types";
import { decideRecipients } from "../lib/sandbox/briefing/audience";
import { deliverChunk, recipientsFor, OutMessage } from "../lib/sandbox/briefing/deliver";
import { pickBriefing, renderBriefingEmail } from "../lib/sandbox/briefing/email";
import { signEmail, verifyEmailToken, unsubscribeUrl } from "../lib/sandbox/briefing/unsubscribe";
import { sendBatch } from "../lib/sandbox/briefing/resend";
import { buildPersonal } from "../lib/sandbox/briefing/personal";
import { PRESETS } from "../lib/sandbox/presets";
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

  const NICHE_SET = new Set(["restaurant", "retail-shop"]);
  const sims = [
    { user_id: "u1", business_type: "restaurant", state_name: "Lagos", created_at: "2026-11-01" },
    { user_id: "u1", business_type: "retail-shop", state_name: "Oyo", created_at: "2026-11-05" },
    { user_id: "u2", business_type: "restaurant", state_name: "Lagos", created_at: "2026-11-02" },
    { user_id: "u3", business_type: "restaurant", state_name: "Lagos", created_at: "2026-11-02" },
    { user_id: "u4", business_type: "restaurant", state_name: "Kano", created_at: "2026-11-02" },
    { user_id: "u5", business_type: "restaurant", state_name: "Kano", created_at: "2026-11-02" },
    { user_id: "u6", business_type: "nonsense", state_name: "Kano", created_at: "2026-11-02" },
  ];
  const users: any = {
    u1: { email: "A@x.com", confirmed: true }, u2: { email: "b@x.com", confirmed: true }, u3: { email: "c@x.com", confirmed: false },
    u4: { email: "d@x.com", confirmed: true }, u5: { email: "e@x.com", confirmed: true }, u6: { email: "f@x.com", confirmed: true },
  };
  await t("recipients: paid, verified, latest simulation, not opted out", () => {
    const r = decideRecipients({ sims, users, paidUserIds: new Set(["u1", "u3", "u6"]), paidEmails: new Set(["d@x.com"]), allowlist: "", optouts: new Set(["e@x.com"]), validNiches: NICHE_SET });
    const by = Object.fromEntries(r.map((x) => [x.email, x]));
    ok(by["a@x.com"]?.niche === "retail-shop" && by["a@x.com"].state === "Oyo", "u1 uses latest sim, email lowercased");
    ok(!by["b@x.com"], "u2 unpaid excluded");
    ok(!by["c@x.com"], "u3 unverified excluded");
    ok(!!by["d@x.com"], "u4 paid as guest by email");
    ok(!by["e@x.com"], "u5 unpaid anyway");
    ok(!by["f@x.com"], "u6 invalid niche excluded");
    const o = decideRecipients({ sims, users, paidUserIds: new Set(["u4"]), paidEmails: new Set(), allowlist: "", optouts: new Set(["d@x.com"]), validNiches: NICHE_SET });
    ok(o.length === 0, "opt-out excluded");
    const al = decideRecipients({ sims, users, paidUserIds: new Set(), paidEmails: new Set(), allowlist: "b@x.com", optouts: new Set(), validNiches: NICHE_SET });
    ok(al.length === 1 && al[0].email === "b@x.com", "allowlist counts as paid");
  });
  const bs = [
    { id: "n1", niche: "restaurant", state: "", status: "approved" },
    { id: "l1", niche: "restaurant", state: "Lagos", status: "approved" },
    { id: "k1", niche: "restaurant", state: "Kano", status: "draft" },
    { id: "r1", niche: "retail-shop", state: "", status: "rejected" },
  ];
  await t("pickBriefing: state first, then national; drafts and rejected never", () => {
    ok(pickBriefing(bs, "restaurant", "lagos")?.id === "l1", "state match, case-insensitive");
    ok(pickBriefing(bs, "restaurant", "Kano")?.id === "n1", "draft state falls back to national");
    ok(pickBriefing(bs, "retail-shop", "Oyo") === null, "rejected national gives nothing");
  });
  await t("recipientsFor splits people between briefings", () => {
    const rec = [
      { userId: "1", email: "a@x.com", niche: "restaurant", state: "Lagos" },
      { userId: "2", email: "b@x.com", niche: "restaurant", state: "Kano" },
      { userId: "3", email: "c@x.com", niche: "retail-shop", state: "" },
    ];
    ok(recipientsFor("l1", bs, rec).map((r) => r.email).join() === "a@x.com", "lagos");
    ok(recipientsFor("n1", bs, rec).map((r) => r.email).join() === "b@x.com", "national gets kano");
    ok(recipientsFor("r1", bs, rec).length === 0, "rejected gets none");
  });
  await t("deliverChunk: batches, never twice, releases on failure", async () => {
    const claimed = new Set<string>();
    const store = {
      delivered: async () => new Set(claimed),
      claim: async (_: string, e: string[]) => e.filter((x) => (claimed.has(x) ? false : (claimed.add(x), true))),
      release: async (_: string, e: string[]) => e.forEach((x) => claimed.delete(x)),
    };
    const aud = Array.from({ length: 5 }, (_, i) => ({ userId: "" + i, email: `p${i}@x.com`, niche: "restaurant", state: "" }));
    const sent: string[] = [];
    const mailer = async (m: OutMessage[]) => (m.forEach((x) => sent.push(x.to)), { ok: true });
    const build = (r: any): OutMessage => ({ to: r.email, subject: "s", html: "h", text: "t", headers: {} });
    const a = await deliverChunk({ briefingId: "b", audience: aud, store, mailer, build, limit: 2 });
    ok(a.sent === 2 && a.remaining === 3, "first batch " + JSON.stringify(a));
    const b2 = await deliverChunk({ briefingId: "b", audience: aud, store, mailer, build, limit: 10 });
    ok(b2.sent === 3 && b2.remaining === 0, "rest");
    const c = await deliverChunk({ briefingId: "b", audience: aud, store, mailer, build, limit: 10 });
    ok(c.sent === 0 && sent.length === 5 && new Set(sent).size === 5, "no repeats");
    claimed.clear(); sent.length = 0;
    const bad = await deliverChunk({ briefingId: "b", audience: aud, store, mailer: async () => ({ ok: false, error: "boom" }), build, limit: 10 });
    ok(!!bad.error && claimed.size === 0, "failure releases so it can be retried");
  });
  await t("unsubscribe links are signed per address", () => {
    const sec = "secret-123";
    const tok = signEmail("A@X.com", sec);
    ok(verifyEmailToken("a@x.com", tok, sec), "case-insensitive match");
    ok(!verifyEmailToken("b@x.com", tok, sec), "other address rejected");
    ok(!verifyEmailToken("a@x.com", tok, "other"), "other secret rejected");
    ok(!verifyEmailToken("a@x.com", "x".repeat(40), sec) && !verifyEmailToken("a@x.com", "", sec) && !verifyEmailToken("a@x.com", tok, ""), "garbage rejected");
    ok(unsubscribeUrl("https://s.com/", "a+b@x.com", sec).startsWith("https://s.com/sandbox/unsubscribe?e=a%2Bb%40x.com&t="), "url shape");
  });
  await t("email renders safely with unsubscribe and no unsafe links", () => {
    const m = renderBriefingEmail({
      briefing: { headline: "H <b>x</b>", summary: "S", items: [{ title: "T", impact: "high", whatChanged: "a", whatToExpect: "b", suggestedAction: "c", sourceUrls: ["https://ok.com/1", "javascript:alert(1)"] }], seasonNotes: [], watchNext: [] } as any,
      monthLabel: "November 2026", nicheLabel: "Restaurant", state: "", siteUrl: "https://s.com", unsubscribeUrl: "https://s.com/u?x=1&y=2",
    });
    ok(!m.html.includes("<b>x</b>") && m.html.includes("&lt;b&gt;"), "escaped");
    ok(!m.html.includes("javascript:") && !m.text.includes("javascript:"), "unsafe link dropped");
    ok(m.html.includes("Unsubscribe") && m.text.includes("Unsubscribe: https://s.com/u"), "unsubscribe present");
    ok(m.subject.startsWith("November 2026"), "subject");
  });
  await t("sendBatch posts to Resend and reports errors", async () => {
    let seen: any;
    const good = await sendBatch({ apiKey: "k", from: "A <a@x.com>", messages: [{ to: "b@x.com", subject: "s", html: "h", text: "t", headers: { H: "1" } }], fetchImpl: (async (u: any, init: any) => ((seen = { u, init }), new Response("{}", { status: 200 }))) as any });
    ok(good.ok && seen.u === "https://api.resend.com/emails/batch" && JSON.parse(seen.init.body)[0].to[0] === "b@x.com", "request shape");
    const bad = await sendBatch({ apiKey: "k", from: "f", messages: [], fetchImpl: (async () => new Response("no", { status: 422 })) as any });
    ok(!bad.ok && /422/.test(bad.error ?? ""), "error reported");
  });

  const item = (title: string, text = "") => ({ title, impact: "high", whatChanged: text, whatToExpect: "", suggestedAction: "x", sourceUrls: ["https://a.com"] });
  const bake = PRESETS.find((p) => p.id === "food-production")!.inputs;
  const ctxC: any = { status: "company", professionalServices: false };
  await t("personal section uses the client's own numbers and only matched topics", () => {
    const b: any = { headline: "h", summary: "s", seasonNotes: [], watchNext: [], items: [item("Diesel price rises again"), item("Flour and sugar prices climb", "naira weaker"), item("Cricket match results")] };
    const p = buildPersonal({ ...bake, businessName: "Ada's Bakes" }, ctxC, b)!;
    ok(!!p && p.heading === "What this means for Ada's Bakes", "heading with business name");
    ok(p.lines.length === 2, "two matched items, cricket ignored: " + p.lines.length);
    ok(/^Diesel price rises again: Power and fuel cost your business about ₦/.test(p.lines[0]), "energy line: " + p.lines[0]);
    ok(/Each 10% rise/.test(p.lines[1]) && /Flour and sugar/.test(p.lines[1]), "goods line: " + p.lines[1]);
    const none = buildPersonal(bake, ctxC, { headline: "h", summary: "s", seasonNotes: [], watchNext: [], items: [item("Cricket match results")] } as any);
    ok(none === null, "no match gives no section");
  });
  await t("personal section: different business gives different figures", () => {
    const b: any = { headline: "h", summary: "s", seasonNotes: [], watchNext: [], items: [item("Diesel price rises")] };
    const a = buildPersonal({ ...bake, monthlyUtilities: 100000 }, ctxC, b)!.lines[0];
    const c = buildPersonal({ ...bake, monthlyUtilities: 400000 }, ctxC, b)!.lines[0];
    ok(a !== c, "figures follow the client's utilities");
  });
  await t("personal section appears in the email, escaped", () => {
    const m = renderBriefingEmail({
      briefing: { headline: "H", summary: "S", items: [], seasonNotes: [], watchNext: [] } as any,
      monthLabel: "November 2026", nicheLabel: "R", state: "", siteUrl: "https://s.com", unsubscribeUrl: "https://s.com/u",
      personal: { heading: "What this means for <X>", lines: ["A & B"], footnote: "f" },
    });
    ok(m.html.includes("What this means for &lt;X&gt;") && m.html.includes("A &amp; B") && m.text.includes("- A & B"), "rendered");
  });
  console.log(failed ? `${failed} FAILED` : "ALL PASSED");
  process.exit(failed ? 1 : 0);
})();
