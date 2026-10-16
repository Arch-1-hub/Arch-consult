import { validateInputs } from './engine';
import { SimulationInputs } from './types';

export const TOTAL_STEPS = 6;

export interface StepContext {
  presetId: string | null;
  stateName: string;
  inputs: SimulationInputs;
}

/** Whether the user may move on from a step. Kept pure so it can be tested without a browser. */
export function isStepValid(step: number, ctx: StepContext): boolean {
  const i = ctx.inputs;
  switch (step) {
    case 1:
      return Boolean(ctx.presetId) && ctx.stateName.trim().length > 0;
    case 2:
      return i.startingCapital > 0 && [12, 24, 36].includes(i.months);
    case 3:
      return i.products.length >= 1 && i.products.every((p) => p.unitPrice > 0 && p.unitCost >= 0 && p.mix > 0);
    case 4:
      return (
        i.unitsPerCustomerPerMonth > 0 &&
        i.costPerNewCustomer > 0 &&
        i.monthlyRetention > 0 &&
        i.monthlyRetention <= 1 &&
        i.startingCustomers + i.organicNewCustomersPerMonth + i.marketingBudget > 0
      );
    case 5:
      return i.staff.every((s) => Number.isInteger(s.count) && s.count >= 0 && s.monthlySalary >= 0);
    case 6:
      return validateInputs(i).length === 0;
    default:
      return false;
  }
}

/** Total fixed monthly costs at month 1, for the review screen. */
export function monthlyFixedCosts(i: SimulationInputs): number {
  const payroll = i.staff.reduce((a, s) => a + s.count * s.monthlySalary, 0) * (1 + i.payrollOnCostRate);
  return payroll + i.monthlyRent + i.monthlyUtilities + i.monthlyOtherOpex + i.marketingBudget;
}
