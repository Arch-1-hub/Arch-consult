import { runWithRules } from "../run";
import { SimulationInputs } from "../types";
import { RuleContext } from "../nigeria-rules";
import { Briefing, BriefingItem } from "./types";

export interface PersonalSection {
  heading: string;
  lines: string[];
  footnote: string;
}

interface Snapshot {
  revenue: number;
  cogs: number;
  staff: number;
  rent: number;
  utilities: number;
  operatingProfit: number;
  tax: number;
  lowestCash: number;
  lowestCashMonth: number;
  startingCapital: number;
}

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const pct = (n: number) => `${Math.round(n)}%`;

/** Typical month of the client's own plan: the average of months 4 to 6 (or what exists). */
export function snapshotOf(inputs: SimulationInputs, ctx: RuleContext): Snapshot | null {
  try {
    const run = runWithRules(inputs, ctx);
    const rows = run.result.rows;
    if (!rows.length) return null;
    const from = Math.min(3, rows.length - 1);
    const pick = rows.slice(from, Math.max(from + 1, Math.min(6, rows.length)));
    const avg = (f: (r: (typeof rows)[number]) => number) => pick.reduce((s, r) => s + f(r), 0) / pick.length;
    return {
      revenue: avg((r) => r.revenue),
      cogs: avg((r) => r.cogs),
      staff: avg((r) => r.staffCost),
      rent: inputs.monthlyRent,
      utilities: avg((r) => r.utilities),
      operatingProfit: avg((r) => r.operatingProfit),
      tax: avg((r) => r.tax),
      lowestCash: run.result.summary.lowestCash,
      lowestCashMonth: run.result.summary.lowestCashMonth,
      startingCapital: inputs.startingCapital,
    };
  } catch {
    return null;
  }
}

interface Rule {
  id: string;
  test: RegExp;
  write: (s: Snapshot) => string | null;
}

const profitLine = (s: Snapshot, extra: number) => {
  if (s.operatingProfit > 0 && extra > 0) {
    return ` That would take about ${pct((extra / s.operatingProfit) * 100)} off your monthly operating profit of ${naira(s.operatingProfit)}.`;
  }
  if (s.operatingProfit <= 0) return " Your plan is not yet in profit in a typical month, so there is little room to absorb it.";
  return "";
};

const RULES: Rule[] = [
  {
    id: "energy",
    test: /\b(diesel|petrol|fuel|pms|ago|electricity|power|tariff|nerc|band a|grid|generator|gas|lpg|energy)\b/i,
    write: (s) =>
      s.utilities > 0
        ? `Power and fuel cost your business about ${naira(s.utilities)} a month. Each 10% rise adds about ${naira(s.utilities * 0.1)} a month (${naira(s.utilities * 1.2)} over a year).${profitLine(s, s.utilities * 0.1)}`
        : null,
  },
  {
    id: "goods",
    test: /\b(exchange rate|naira|forex|dollar|import|customs|tariffs?|supplier|raw material|ingredient|flour|sugar|rice|food price|commodity|inflation|cpi|wholesale|freight|logistics|price of goods)\b/i,
    write: (s) =>
      s.cogs > 0
        ? `The goods you buy to sell cost about ${naira(s.cogs)} a month (${pct((s.cogs / Math.max(1, s.revenue)) * 100)} of what you sell). Each 10% rise in supplier prices adds about ${naira(s.cogs * 0.1)} a month unless you raise prices.${profitLine(s, s.cogs * 0.1)}`
        : null,
  },
  {
    id: "wages",
    test: /\b(minimum wage|wage|salary|salaries|pension|nsitf|itf|payroll|labour|labor|staff)\b/i,
    write: (s) =>
      s.staff > 0
        ? `Your payroll is about ${naira(s.staff)} a month. Each 10% rise in staff costs adds about ${naira(s.staff * 0.1)} a month.${profitLine(s, s.staff * 0.1)}`
        : null,
  },
  {
    id: "rent",
    test: /\b(rent|landlord|lease|property|real estate|shop space|office space)\b/i,
    write: (s) =>
      s.rent > 0 ? `Your rent is about ${naira(s.rent)} a month. Each 10% rise adds about ${naira(s.rent * 0.1)} a month (${naira(s.rent * 1.2)} over a year).` : null,
  },
  {
    id: "demand",
    test: /\b(consumer|spending|demand|purchasing power|disposable|customers? (?:are|will)|festive|festival|christmas|ramadan|eid|easter|holiday|season|school fees|back to school|harmattan|rainy)\b/i,
    write: (s) =>
      s.revenue > 0
        ? `You bring in about ${naira(s.revenue)} a month in a typical month of your plan. A 10% change in customer demand moves that by about ${naira(s.revenue * 0.1)} a month, so plan stock and staff for both a busier and a quieter month.`
        : null,
  },
  {
    id: "money",
    test: /\b(loan|credit|interest rate|mpr|cbn|bank|financing|finance|grant|fund|funding|boi|sme|microfinance|cac|working capital)\b/i,
    write: (s) =>
      s.lowestCash < 0
        ? `Your plan runs short of cash: its lowest point is ${naira(s.lowestCash)} in month ${s.lowestCashMonth}. Funding or cheaper credit like this matters to you, so compare terms before month ${s.lowestCashMonth}.`
        : `Your plan keeps cash above zero, with a lowest balance of ${naira(s.lowestCash)} in month ${s.lowestCashMonth}. Borrowing is optional for you, so only take credit if the cost is clearly lower than what it earns.`,
  },
  {
    id: "tax",
    test: /\b(tax|vat|firs|levy|levies|duty|duties|filing|compliance|revenue service|withholding)\b/i,
    write: (s) =>
      s.tax > 0
        ? `Your plan pays about ${naira(s.tax)} a month in tax. Keep your records and filings up to date, because penalties cost more than the tax itself.`
        : `Your simulated plan pays little or no income tax in a typical month, but filing and record-keeping duties can still apply, so confirm what applies to you.`,
  },
];

function itemText(it: BriefingItem): string {
  return `${it.title} ${it.whatChanged} ${it.whatToExpect}`;
}

/**
 * A short "what this means for your business" block, built only from the approved briefing items
 * and the person's own saved simulation. It adds no new news and makes no forecasts.
 */
export function buildPersonal(inputs: SimulationInputs, ctx: RuleContext, briefing: Briefing, max = 4): PersonalSection | null {
  const snap = snapshotOf(inputs, ctx);
  if (!snap) return null;

  const lines: string[] = [];
  const used = new Set<string>();
  for (const it of briefing.items) {
    if (lines.length >= max) break;
    const text = itemText(it);
    for (const rule of RULES) {
      if (used.has(rule.id) || !rule.test.test(text)) continue;
      const sentence = rule.write(snap);
      if (!sentence) continue;
      used.add(rule.id);
      lines.push(`${it.title}: ${sentence}`);
      break;
    }
  }
  if (lines.length === 0) return null;

  const name = inputs.businessName?.trim();
  return {
    heading: name ? `What this means for ${name}` : "What this means for your business",
    lines,
    footnote: "These figures come from the numbers in your latest Sandbox simulation. If your business has changed, run it again for sharper figures.",
  };
}
