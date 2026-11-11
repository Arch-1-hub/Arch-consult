import { runWithRules } from "../run";
import { RuleContext } from "../nigeria-rules";
import { SimulationInputs } from "../types";

export interface GrowthLever {
  label: string;
  /** Extra total net profit over the simulation if this change were achieved. */
  gain: number;
}

export interface GrowthFacts {
  months: number;
  startRevenue: number;
  latestRevenue: number;
  revenueGrowthPct: number | null;
  breakEvenMonth: number | null;
  lowestCash: number;
  lowestCashMonth: number;
  cashOutMonth: number | null;
  endNetMargin: number;
  totalNetProfit: number;
  levers: GrowthLever[];
}

export interface GrowthSection {
  heading: string;
  lines: string[];
  footnote: string;
}

const naira = (n: number) => `${n < 0 ? "-" : ""}₦${Math.round(Math.abs(n)).toLocaleString("en-NG")}`;
const round = (n: number) => Math.round(n);

/** Everything below is plain arithmetic on the person's own saved simulation. No AI is involved. */
export function growthFacts(inputs: SimulationInputs, ctx: RuleContext): GrowthFacts | null {
  try {
    const base = runWithRules(inputs, ctx).result;
    const rows = base.rows;
    if (!rows.length) return null;
    const last = rows[Math.min(11, rows.length - 1)];
    const first = rows[0];
    const totalNet = (r: ReturnType<typeof runWithRules>["result"]) => r.rows.reduce((s, x) => s + x.netProfit, 0);
    const baseNet = totalNet(base);

    const tries: { label: string; inputs: SimulationInputs }[] = [
      {
        label: "raising your prices by 5%",
        inputs: { ...inputs, products: inputs.products.map((p) => ({ ...p, unitPrice: p.unitPrice * 1.05 })) },
      },
      {
        label: "cutting what each item costs you by 5%",
        inputs: { ...inputs, products: inputs.products.map((p) => ({ ...p, unitCost: p.unitCost * 0.95 })) },
      },
      {
        label: "keeping 5 more customers out of every 100 each month",
        inputs: { ...inputs, monthlyRetention: Math.min(0.99, inputs.monthlyRetention + 0.05) },
      },
      {
        label: "paying 10% less to win each new customer",
        inputs: { ...inputs, costPerNewCustomer: inputs.costPerNewCustomer * 0.9 },
      },
    ];
    const levers: GrowthLever[] = tries
      .map((t) => ({ label: t.label, gain: totalNet(runWithRules(t.inputs, ctx).result) - baseNet }))
      .filter((l) => l.gain > 0)
      .sort((a, b) => b.gain - a.gain);

    return {
      months: rows.length,
      startRevenue: first.revenue,
      latestRevenue: last.revenue,
      revenueGrowthPct: first.revenue > 0 ? ((last.revenue - first.revenue) / first.revenue) * 100 : null,
      breakEvenMonth: base.summary.breakEvenMonth,
      lowestCash: base.summary.lowestCash,
      lowestCashMonth: base.summary.lowestCashMonth,
      cashOutMonth: base.summary.cashOutMonth,
      endNetMargin: base.summary.endNetMargin,
      totalNetProfit: baseNet,
      levers,
    };
  } catch {
    return null;
  }
}

/** The "where your numbers stand" block shown in every email. */
export function growthSection(f: GrowthFacts, businessName?: string): GrowthSection {
  const lines: string[] = [];
  if (f.breakEvenMonth) lines.push(`Your plan starts making a steady profit from month ${f.breakEvenMonth}.`);
  else lines.push(`Your plan does not reach steady profit within ${f.months} months as entered, so growth should start with your prices, costs and customers.`);

  if (f.cashOutMonth) lines.push(`Cash runs out in month ${f.cashOutMonth}. The lowest point is ${naira(f.lowestCash)} in month ${f.lowestCashMonth}.`);
  else lines.push(`Cash stays above zero. The lowest point is ${naira(f.lowestCash)} in month ${f.lowestCashMonth}.`);

  if (f.revenueGrowthPct !== null && f.months > 1) {
    const dir = f.revenueGrowthPct >= 0 ? "grows" : "falls";
    lines.push(
      `Monthly sales ${dir} from ${naira(f.startRevenue)} in month 1 to ${naira(f.latestRevenue)} by month ${Math.min(12, f.months)} (${Math.abs(round(f.revenueGrowthPct))}%).`,
    );
  }
  f.levers.slice(0, 3).forEach((l, i) => {
    lines.push(`${i === 0 ? "Your strongest lever" : "Another lever"}: ${l.label} would add about ${naira(l.gain)} to your profit over ${f.months} months.`);
  });
  return {
    heading: businessName?.trim() ? `Where ${businessName.trim()} stands` : "Where your business stands",
    lines,
    footnote: "These figures come from the numbers in your latest Sandbox simulation. If your business has changed, run it again for sharper figures.",
  };
}
