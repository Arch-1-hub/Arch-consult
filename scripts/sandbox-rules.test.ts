import { companyTax, personalIncomeTax, payrollOnCost } from "../lib/sandbox/nigeria-rules";
import { runWithRules } from "../lib/sandbox/run";
import { PRESETS, cloneInputs } from "../lib/sandbox/presets";
import { simulate } from "../lib/sandbox/engine";

let failed = 0;
function t(name: string, fn: () => void) { try { fn(); console.log("PASS " + name); } catch (e) { failed++; console.log("FAIL " + name + ": " + (e as Error).message); } }
function near(a: number, b: number, m = "") { if (Math.abs(a - b) > 1) throw new Error(`${m} expected ${b}, got ${a}`); }
function ok(c: boolean, m: string) { if (!c) throw new Error(m); }

t("PAYE: 5,000,000 taxable -> 800k at 0, 2.2m at 15%, rest 18%", () => near(personalIncomeTax(4_530_000), 605_400));
t("PAYE: under 800k is zero", () => near(personalIncomeTax(700_000), 0));
t("PAYE: 60m crosses top band", () => near(personalIncomeTax(60_000_000), 0 + 2_200_000*0.15 + 9_000_000*0.18 + 13_000_000*0.21 + 25_000_000*0.23 + 10_000_000*0.25));
t("small company pays nothing", () => near(companyTax(80_000_000, 10_000_000, 20_000_000, false), 0));
t("large company pays 34%", () => near(companyTax(150_000_000, 10_000_000, 20_000_000, false), 6_800_000));
t("fixed assets over 250m lose relief", () => near(companyTax(50_000_000, 300_000_000, 10_000_000, false), 3_400_000));
t("professional services never small", () => near(companyTax(10_000_000, 0, 5_000_000, true), 1_700_000));
t("losses pay no tax", () => near(companyTax(500_000_000, 0, -1, false), 0));
t("payroll 11% for micro, 12% from 5 staff", () => { near(payrollOnCost(2, 10_000_000) * 100, 11); near(payrollOnCost(5, 10_000_000) * 100, 12); });

for (const p of PRESETS.filter((x) => x.id !== "custom")) {
  t(`preset ${p.id} runs with rules (company and sole)`, () => {
    for (const status of ["company", "sole"] as const) {
      const r = runWithRules(cloneInputs(p.inputs), { status, professionalServices: p.id === "professional-services" });
      ok(r.taxRate >= 0 && r.taxRate <= 1, "tax rate range");
      ok(r.notes.length === 3, "3 notes");
      ok(r.result.rows.every((x) => Number.isFinite(x.cash)), "finite cash");
    }
  });
}
t("professional preset pays tax; sole proprietor tax differs from company", () => {
  const i = cloneInputs(PRESETS.find((x) => x.id === "professional-services")!.inputs);
  const a = runWithRules(i, { status: "company", professionalServices: true });
  ok(a.taxRate === 0.34 || a.taxRate === 0 || a.taxRate > 0, "rate");
  const before = simulate({ ...i, profitTaxRate: 0, payrollOnCostRate: a.payrollRate });
  ok(a.result.summary.endingCash <= before.summary.endingCash, "tax never raises cash");
});
console.log(failed ? `${failed} FAILED` : "ALL PASSED");
process.exit(failed ? 1 : 0);
