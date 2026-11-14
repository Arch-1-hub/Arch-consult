import { buildBookingNotes, UUID_RE } from "../lib/sandbox/booking-summary";
let failed = 0;
function t(n: string, f: () => void) { try { f(); console.log("PASS " + n); } catch (e) { failed++; console.log("FAIL " + n + ": " + (e as Error).message); } }
function ok(c: boolean, m: string) { if (!c) throw new Error(m); }
const base = { simId: "11111111-2222-3333-4444-555555555555", title: "Ada Bakes", description: "Bakery selling bread", area: "Yaba", state: "Lagos" };
t("notes include numbers and admin link", () => {
  const n = buildBookingNotes({ ...base, facts: { months: 12, startRevenue: 1, latestRevenue: 2, revenueGrowthPct: 5, breakEvenMonth: 4, lowestCash: -250000, lowestCashMonth: 3, cashOutMonth: null, endNetMargin: 0.1, totalNetProfit: 900000, levers: [{ label: "raising your prices by 5%", gain: 120000 }, { label: "cutting costs", gain: 300000 }] } });
  ok(n.includes("Break-even: month 4"), "be");
  ok(n.includes("-₦250,000 in month 3"), "cash");
  ok(n.includes("Strongest lever: cutting costs"), "lever");
  ok(n.includes("/admin/simulations/" + base.simId), "link");
  ok(n.includes("Ada Bakes (Yaba, Lagos)"), "title");
});
t("works without facts", () => { ok(buildBookingNotes({ ...base, facts: null }).includes("Simulation reference"), "ref"); });
t("uuid check", () => { ok(UUID_RE.test(base.simId), "ok"); ok(!UUID_RE.test("x' or 1=1"), "bad"); });
if (failed) process.exit(1);
