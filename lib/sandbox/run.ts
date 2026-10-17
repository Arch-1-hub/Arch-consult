import { simulate } from './engine';
import { buildRuleNotes, effectiveTaxRate, payrollOnCost, RuleContext, RuleNote } from './nigeria-rules';
import { Scenario, SimulationInputs, SimulationResult } from './types';

export interface RuleRun {
  result: SimulationResult;
  notes: RuleNote[];
  taxRate: number;
  payrollRate: number;
}

/**
 * Runs the engine with Nigeria's rules applied. Sales do not depend on tax or payroll cost,
 * so a first pass finds turnover, a second finds profit, and the final run uses the resulting rates.
 */
export function runWithRules(inputs: SimulationInputs, ctx: RuleContext, scenario: Scenario | null = null): RuleRun {
  const headcount = inputs.staff.reduce((s, p) => s + p.count, 0);
  const fixedAssets = inputs.setupCosts; // setup spend is the best proxy for fixed assets
  const zero = { ...inputs, profitTaxRate: 0, payrollOnCostRate: 0 };

  const pass1 = simulate(zero, scenario);
  const peak = Math.max(0, ...pass1.rows.reduce<number[]>((acc, r) => {
    const y = Math.floor((r.month - 1) / 12);
    acc[y] = (acc[y] ?? 0) + r.revenue;
    return acc;
  }, []));
  const payrollRate = payrollOnCost(headcount, peak);

  const pass2 = simulate({ ...zero, payrollOnCostRate: payrollRate }, scenario);
  const taxRate = effectiveTaxRate(pass2.rows, ctx, fixedAssets);

  const result = simulate({ ...inputs, payrollOnCostRate: payrollRate, profitTaxRate: taxRate }, scenario);
  const notes = buildRuleNotes({ ctx, rows: pass2.rows, fixedAssets, headcount, taxRate, payrollRate });
  return { result, notes, taxRate, payrollRate };
}
