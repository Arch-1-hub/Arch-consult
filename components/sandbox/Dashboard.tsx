"use client";

import { Printer } from "lucide-react";
import Button from "@/components/ui/Button";
import { monthWord, naira, percent, whole } from "@/lib/sandbox/format";
import { buildVerdict } from "@/lib/sandbox/verdict";
import { SignalSeverity, SimulationResult } from "@/lib/sandbox/types";
import CashChart from "./CashChart";

const SEVERITY_STYLE: Record<SignalSeverity, { bar: string; label: string }> = {
  critical: { bar: "border-red-400", label: "Serious" },
  warning: { bar: "border-gold", label: "Watch" },
  info: { bar: "border-ash", label: "Note" },
};

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 border border-ink-line bg-ink-soft p-4">
      <span className="text-xs uppercase tracking-wide2 text-ash">{label}</span>
      <span className="font-display text-2xl text-paper-white">{value}</span>
      {sub ? <span className="text-xs text-ash">{sub}</span> : null}
    </div>
  );
}

interface DashboardProps {
  result: SimulationResult;
  businessLabel: string;
  stateName: string;
  onEdit: () => void;
  onRestart: () => void;
}

export default function Dashboard({ result, businessLabel, stateName, onEdit, onRestart }: DashboardProps) {
  const { summary: s, rows, signals, inputs } = result;
  const months = inputs.months;
  const verdict = buildVerdict(s, months, inputs.startingCapital);
  const title = inputs.businessName?.trim() || businessLabel;

  const toneBorder =
    verdict.tone === "critical" ? "border-red-400" : verdict.tone === "warning" ? "border-gold" : "border-gold-light";
  const toneLabel = verdict.tone === "critical" ? "Verdict: serious risk" : verdict.tone === "warning" ? "Verdict: proceed with care" : "Verdict: holds up";

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center border border-gold px-3 py-1 text-xs uppercase tracking-wide2 text-gold">
          Simulation
        </span>
        <h2 className="font-display text-3xl text-paper-white">{title}</h2>
        <p className="text-sm text-ash">
          {stateName}, Nigeria. {monthWord(months)} ahead. Starting capital {naira(inputs.startingCapital)}.
        </p>
      </header>

      <section aria-labelledby="verdict-heading" className={`flex flex-col gap-2 border-l-4 bg-ink-soft p-5 ${toneBorder}`}>
        <span id="verdict-heading" className="text-xs uppercase tracking-wide2 text-ash">
          {toneLabel}
        </span>
        <p className="font-display text-2xl leading-snug text-paper-white">{verdict.headline}</p>
        <p className="text-sm leading-relaxed text-ash">{verdict.detail}</p>
      </section>

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Kpi
          label="Break-even"
          value={s.breakEvenMonth === null ? "Not reached" : `Month ${s.breakEvenMonth}`}
          sub="Steady profit from this month"
        />
        <Kpi
          label="Cash lasts"
          value={s.runwayMonths === null ? `All ${months} months` : monthWord(s.runwayMonths)}
          sub={s.cashOutMonth === null ? "Cash never hits zero" : `Zero in month ${s.cashOutMonth}`}
        />
        <Kpi label="Lowest cash" value={naira(s.lowestCash)} sub={`In month ${s.lowestCashMonth}`} />
        <Kpi
          label="Extra capital needed"
          value={naira(s.additionalCapitalNeeded)}
          sub={s.additionalCapitalNeeded > 0 ? "To never run out of cash" : "Your capital is enough"}
        />
        <Kpi
          label="Capital back in cash"
          value={s.paybackMonth === null ? "Not reached" : `Month ${s.paybackMonth}`}
          sub="Cash returns to your starting capital"
        />
        <Kpi
          label="Break-even sales"
          value={s.breakEvenUnitsPerMonth === null ? "Never" : `${whole(s.breakEvenUnitsPerMonth)} items`}
          sub={s.breakEvenUnitsPerMonth === null ? "Each sale loses money" : "Needed every month at the start"}
        />
        <Kpi label={`Cash at month ${months}`} value={naira(s.endingCash)} />
        <Kpi label="Gross margin" value={percent(s.averageGrossMargin)} sub="Average, after direct costs" />
        <Kpi label="Net margin" value={percent(s.endNetMargin)} sub="Over the final 12 months" />
      </section>

      <section aria-labelledby="chart-heading" className="flex flex-col gap-4">
        <h3 id="chart-heading" className="font-display text-xl text-paper-white">
          Your cash, month by month
        </h3>
        <CashChart rows={rows} startingCapital={inputs.startingCapital} />
      </section>

      {signals.length > 0 ? (
        <section aria-labelledby="signals-heading" className="flex flex-col gap-4">
          <h3 id="signals-heading" className="font-display text-xl text-paper-white">
            What the numbers are telling you
          </h3>
          <ul className="flex flex-col gap-3">
            {signals.map((sig) => (
              <li key={sig.code} className={`flex flex-col gap-1 border-l-2 bg-ink-soft px-4 py-3 ${SEVERITY_STYLE[sig.severity].bar}`}>
                <span className="text-xs uppercase tracking-wide2 text-ash">{SEVERITY_STYLE[sig.severity].label}</span>
                <span className="text-sm leading-relaxed text-paper-white">{sig.message}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <details className="border border-ink-line">
        <summary className="cursor-pointer px-4 py-3 text-sm text-paper-white">See every month</summary>
        <div className="overflow-x-auto border-t border-ink-line">
          <table className="w-full min-w-[640px] text-right text-xs">
            <caption className="sr-only">Month by month results</caption>
            <thead className="text-ash">
              <tr>
                {["Month", "Customers", "Items sold", "Revenue", "Gross profit", "Running costs", "Net profit", "Cash"].map((h, i) => (
                  <th key={h} scope="col" className={`px-3 py-2 font-medium ${i === 0 ? "text-left" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.month} className="border-t border-ink-line text-paper-white">
                  <th scope="row" className="px-3 py-2 text-left font-normal text-ash">
                    {r.month}
                  </th>
                  <td className="px-3 py-2">{whole(r.customers)}</td>
                  <td className="px-3 py-2">{whole(r.units)}</td>
                  <td className="px-3 py-2">{naira(r.revenue)}</td>
                  <td className="px-3 py-2">{naira(r.grossProfit)}</td>
                  <td className="px-3 py-2">{naira(r.staffCost + r.rent + r.utilities + r.marketing + r.otherOpex)}</td>
                  <td className={`px-3 py-2 ${r.netProfit < 0 ? "text-red-400" : ""}`}>{naira(r.netProfit)}</td>
                  <td className={`px-3 py-2 ${r.cash < 0 ? "text-red-400" : ""}`}>{naira(r.cash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <p className="border-t border-ink-line pt-6 text-xs leading-relaxed text-ash">{result.disclaimer}</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap print:hidden">
        <Button href="/book-consultation" variant="primary" size="lg" showArrow>
          Talk this through with a consultant
        </Button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center justify-center border border-ink-line px-6 py-3 text-sm font-medium text-paper-white transition-colors duration-200 hover:border-gold"
        >
          Change my assumptions
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 border border-ink-line px-6 py-3 text-sm font-medium text-paper-white transition-colors duration-200 hover:border-gold"
        >
          <Printer size={16} aria-hidden="true" /> Save as PDF
        </button>
        <button type="button" onClick={onRestart} className="px-2 py-3 text-sm text-ash transition-colors hover:text-paper-white">
          Start over
        </button>
      </div>
    </div>
  );
}
