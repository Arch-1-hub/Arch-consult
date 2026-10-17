"use client";

import { useMemo, useState } from "react";
import { monthWord, naira } from "@/lib/sandbox/format";
import { RuleContext } from "@/lib/sandbox/nigeria-rules";
import { runWithRules } from "@/lib/sandbox/run";
import { SCENARIO_PRESETS } from "@/lib/sandbox/scenarios";
import { Scenario, SimulationInputs, SimulationResult } from "@/lib/sandbox/types";
import CashChart from "./CashChart";

const CUSTOM_ID = "custom";

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  format: (n: number) => string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-paper-white">
      <span className="flex items-baseline justify-between gap-4">
        {label}
        <span className="text-gold">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#B8934A]"
      />
    </label>
  );
}

const signed = (n: number) => (n > 0 ? `+${n}%` : `${n}%`);

function metrics(r: SimulationResult, months: number) {
  const s = r.summary;
  return [
    ["Lowest cash", naira(s.lowestCash)],
    [`Cash at month ${months}`, naira(s.endingCash)],
    ["Cash lasts", s.runwayMonths === null ? `All ${months} months` : monthWord(s.runwayMonths)],
    ["Break-even", s.breakEvenMonth === null ? "Not reached" : `Month ${s.breakEvenMonth}`],
    ["Extra capital needed", naira(s.additionalCapitalNeeded)],
  ] as const;
}

export default function ScenarioLab({
  inputs,
  ctx,
  base,
}: {
  inputs: SimulationInputs;
  ctx: RuleContext;
  base: SimulationResult;
}) {
  const months = inputs.months;
  const [selected, setSelected] = useState<string>(SCENARIO_PRESETS[1].id);
  const [demand, setDemand] = useState(-20);
  const [supplier, setSupplier] = useState(20);
  const [power, setPower] = useState(0);
  const [startMonth, setStartMonth] = useState(Math.min(4, months));

  // Rank every preset once, worst outcome first.
  const ranking = useMemo(
    () =>
      SCENARIO_PRESETS.map((sc) => ({ sc, run: runWithRules(inputs, ctx, sc).result })).sort(
        (a, b) => a.run.summary.endingCash - b.run.summary.endingCash,
      ),
    [inputs, ctx],
  );

  const custom: Scenario = useMemo(
    () => ({
      id: CUSTOM_ID,
      name: "Your own scenario",
      description: "The changes you set below.",
      startMonth,
      shocks: {
        demandFactor: 1 + demand / 100,
        supplierCostFactor: 1 + supplier / 100,
        utilityCostFactor: 1 + power / 100,
      },
    }),
    [demand, supplier, power, startMonth],
  );

  const active = selected === CUSTOM_ID ? custom : SCENARIO_PRESETS.find((s) => s.id === selected) ?? SCENARIO_PRESETS[0];
  const run = useMemo(() => runWithRules(inputs, ctx, active).result, [inputs, ctx, active]);

  const baseM = metrics(base, months);
  const scM = metrics(run, months);
  const diff = run.summary.endingCash - base.summary.endingCash;

  return (
    <section aria-labelledby="lab-heading" className="flex flex-col gap-6 print:break-before-page">
      <div className="flex flex-col gap-2">
        <h3 id="lab-heading" className="font-display text-xl text-paper-white">
          Scenario Lab: what if things go wrong?
        </h3>
        <p className="text-sm text-ash">
          Plans rarely run to script. Pick a shock and see what it does to your cash. Every scenario is a simulation, not a prediction.
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide2 text-ash">Hardest hits first</p>
        <ul className="flex flex-col gap-2">
          {ranking.map(({ sc, run: r }) => (
            <li key={sc.id}>
              <button
                type="button"
                onClick={() => setSelected(sc.id)}
                aria-pressed={selected === sc.id}
                className={`flex w-full flex-col gap-1 border px-4 py-3 text-left text-sm transition-colors sm:flex-row sm:items-center sm:justify-between ${
                  selected === sc.id ? "border-gold" : "border-ink-line hover:border-ash"
                }`}
              >
                <span>
                  <span className="text-paper-white">{sc.name}</span>
                  <span className="block text-xs text-ash">{sc.description}</span>
                </span>
                <span className={`shrink-0 text-xs ${r.summary.endingCash < 0 ? "text-red-400" : "text-paper-white"}`}>
                  Ends with {naira(r.summary.endingCash)}
                </span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setSelected(CUSTOM_ID)}
              aria-pressed={selected === CUSTOM_ID}
              className={`w-full border px-4 py-3 text-left text-sm transition-colors ${
                selected === CUSTOM_ID ? "border-gold text-paper-white" : "border-ink-line text-paper-white hover:border-ash"
              }`}
            >
              Build your own scenario
            </button>
          </li>
        </ul>
      </div>

      {selected === CUSTOM_ID ? (
        <div className="flex flex-col gap-5 border border-ink-line p-4">
          <Slider label="Demand" value={demand} min={-50} max={50} step={5} onChange={setDemand} format={signed} />
          <Slider label="Supplier prices" value={supplier} min={0} max={60} step={5} onChange={setSupplier} format={signed} />
          <Slider label="Power and fuel cost" value={power} min={0} max={100} step={10} onChange={setPower} format={signed} />
          <Slider label="Starts in month" value={startMonth} min={1} max={months} step={1} onChange={setStartMonth} format={(n) => `Month ${n}`} />
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <p className="font-display text-lg text-paper-white">
          {active.name}:{" "}
          <span className={diff < 0 ? "text-red-400" : "text-gold-light"}>
            {diff === 0 ? "no change in final cash" : `${diff < 0 ? "−" : "+"}${naira(Math.abs(diff))} by month ${months}`}
          </span>
        </p>
        <CashChart rows={base.rows} startingCapital={inputs.startingCapital} compare={run.rows} compareLabel={active.name} />
      </div>

      <div className="overflow-x-auto border border-ink-line">
        <table className="w-full min-w-[420px] text-sm">
          <caption className="sr-only">Your plan compared with {active.name}</caption>
          <thead className="text-xs text-ash">
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-medium">Measure</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Your plan</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">{active.name}</th>
            </tr>
          </thead>
          <tbody>
            {baseM.map(([label, v], i) => (
              <tr key={label} className="border-t border-ink-line">
                <th scope="row" className="px-3 py-2 text-left font-normal text-ash">{label}</th>
                <td className="px-3 py-2 text-right text-paper-white">{v}</td>
                <td className="px-3 py-2 text-right text-paper-white">{scM[i][1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
