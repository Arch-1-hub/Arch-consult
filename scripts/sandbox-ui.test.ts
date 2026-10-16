import { simulate } from "../lib/sandbox/engine";
import { PRESETS, cloneInputs } from "../lib/sandbox/presets";
import { buildVerdict } from "../lib/sandbox/verdict";
import { isStepValid, TOTAL_STEPS } from "../lib/sandbox/step-rules";
import { naira, nairaCompact, percent } from "../lib/sandbox/format";
import { NIGERIAN_STATES } from "../lib/sandbox/nigeria";

let failed = 0;
function t(name: string, fn: () => void) {
  try { fn(); console.log("PASS " + name); } catch (e) { failed++; console.log("FAIL " + name + ": " + (e as Error).message); }
}
function eq(a: unknown, b: unknown, m = "") { if (a !== b) throw new Error(`${m} expected ${String(b)}, got ${String(a)}`); }

t("37 states/territories", () => eq(NIGERIAN_STATES.length, 37));
t("6 steps", () => eq(TOTAL_STEPS, 6));
for (const p of PRESETS.filter((x) => x.id !== "custom")) {
  t(`preset ${p.id} simulates with finite numbers`, () => {
    const r = simulate(cloneInputs(p.inputs));
    eq(r.rows.length, p.inputs.months);
    for (const row of r.rows) for (const v of Object.values(row)) if (typeof v === "number" && !Number.isFinite(v)) throw new Error("non-finite");
    buildVerdict(r.summary, r.inputs.months, r.inputs.startingCapital);
  });
}
t("custom blank preset is invalid on offer step", () => {
  const c = PRESETS.find((x) => x.id === "custom")!;
  eq(isStepValid(3, { presetId: "custom", stateName: "Lagos", inputs: cloneInputs(c.inputs) }), false);
});
t("step 1 needs preset and state", () => {
  const i = cloneInputs(PRESETS[0].inputs);
  eq(isStepValid(1, { presetId: null, stateName: "Lagos", inputs: i }), false);
  eq(isStepValid(1, { presetId: PRESETS[0].id, stateName: "", inputs: i }), false);
  eq(isStepValid(1, { presetId: PRESETS[0].id, stateName: "Lagos", inputs: i }), true);
});
t("loss-making plan gives critical verdict", () => {
  const i = cloneInputs(PRESETS[0].inputs);
  i.products = i.products.map((p) => ({ ...p, unitCost: p.unitPrice * 1.5 }));
  const r = simulate(i);
  eq(buildVerdict(r.summary, i.months, i.startingCapital).tone, "critical");
});
t("format helpers", () => {
  if (!naira(1234567).includes("1,234,567")) throw new Error("naira");
  if (!nairaCompact(2500000).includes("2.5")) throw new Error("compact " + nairaCompact(2500000));
  if (!percent(0.255, 1).includes("25.5")) throw new Error("percent");
});
console.log(failed ? `${failed} FAILED` : "ALL PASSED");
process.exit(failed ? 1 : 0);
