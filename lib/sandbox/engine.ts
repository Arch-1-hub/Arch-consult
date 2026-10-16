import {
  MonthRow,
  Scenario,
  SIMULATION_DISCLAIMER,
  Signal,
  SimulationInputs,
  SimulationResult,
  Summary,
} from './types';

export class SimulationInputError extends Error {
  errors: string[];
  constructor(errors: string[]) {
    super(`Invalid simulation inputs: ${errors.join('; ')}`);
    this.name = 'SimulationInputError';
    this.errors = errors;
  }
}

const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** Returns a list of plain-language problems. Empty list means the inputs are valid. */
export function validateInputs(i: SimulationInputs): string[] {
  const e: string[] = [];
  const nonNeg = (label: string, v: unknown) => {
    if (!isNum(v) || v < 0) e.push(`${label} must be a number that is zero or more.`);
  };
  const frac = (label: string, v: unknown) => {
    if (!isNum(v) || v < 0 || v > 1) e.push(`${label} must be between 0 and 1.`);
  };

  if (!isNum(i.months) || !Number.isInteger(i.months) || i.months < 6 || i.months > 36) {
    e.push('Simulation length must be a whole number of months from 6 to 36.');
  }
  nonNeg('Starting capital', i.startingCapital);
  nonNeg('Setup costs', i.setupCosts);
  nonNeg('Starting customers', i.startingCustomers);
  nonNeg('Organic new customers', i.organicNewCustomersPerMonth);
  nonNeg('Marketing budget', i.marketingBudget);
  nonNeg('Units per customer', i.unitsPerCustomerPerMonth);
  nonNeg('Monthly rent', i.monthlyRent);
  nonNeg('Utilities', i.monthlyUtilities);
  nonNeg('Other operating costs', i.monthlyOtherOpex);
  nonNeg('Inventory days', i.inventoryDays);
  if (!isNum(i.costPerNewCustomer) || i.costPerNewCustomer <= 0) {
    e.push('Cost per new customer must be more than zero.');
  }
  frac('Monthly retention', i.monthlyRetention);
  frac('Payroll on-cost rate', i.payrollOnCostRate);
  frac('Profit tax rate', i.profitTaxRate);
  if (i.maxUnitsPerMonth !== undefined && (!isNum(i.maxUnitsPerMonth) || i.maxUnitsPerMonth <= 0)) {
    e.push('Capacity must be more than zero, or left empty.');
  }
  if (!isNum(i.costInflationAnnual) || i.costInflationAnnual < -0.5 || i.costInflationAnnual > 2) {
    e.push('Cost inflation must be between -50% and 200% a year.');
  }
  if (!isNum(i.priceIncreaseAnnual) || i.priceIncreaseAnnual < -0.5 || i.priceIncreaseAnnual > 2) {
    e.push('Price increase must be between -50% and 200% a year.');
  }

  if (!Array.isArray(i.products) || i.products.length === 0) {
    e.push('Add at least one product or service.');
  } else {
    let mixTotal = 0;
    i.products.forEach((p, idx) => {
      const n = p?.name || `Product ${idx + 1}`;
      if (!isNum(p?.unitPrice) || p.unitPrice <= 0) e.push(`${n}: price must be more than zero.`);
      if (!isNum(p?.unitCost) || p.unitCost < 0) e.push(`${n}: unit cost must be zero or more.`);
      if (!isNum(p?.mix) || p.mix < 0) e.push(`${n}: sales mix must be zero or more.`);
      else mixTotal += p.mix;
    });
    if (mixTotal <= 0) e.push('Sales mix must add up to more than zero.');
  }

  if (!Array.isArray(i.staff)) {
    e.push('Staff must be a list (it can be empty).');
  } else {
    i.staff.forEach((s, idx) => {
      const n = s?.role || `Staff ${idx + 1}`;
      if (!isNum(s?.count) || s.count < 0 || !Number.isInteger(s.count)) e.push(`${n}: headcount must be a whole number.`);
      if (!isNum(s?.monthlySalary) || s.monthlySalary < 0) e.push(`${n}: salary must be zero or more.`);
    });
  }
  return e;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/**
 * Runs a deterministic month-by-month simulation.
 * Same inputs and scenario always give the same result.
 */
export function simulate(inputs: SimulationInputs, scenario?: Scenario | null): SimulationResult {
  const errors = validateInputs(inputs);
  if (errors.length) throw new SimulationInputError(errors);

  const sc = scenario ?? null;
  const shocks = sc?.shocks ?? {};
  const shockStart = sc?.startMonth ?? 1;

  const mixTotal = sum(inputs.products.map((p) => p.mix));
  const avgPrice = sum(inputs.products.map((p) => p.unitPrice * p.mix)) / mixTotal;
  const avgUnitCost = sum(inputs.products.map((p) => p.unitCost * p.mix)) / mixTotal;
  const baseStaff = sum(inputs.staff.map((s) => s.count * s.monthlySalary));

  // Pass 1: everything that does not depend on the cash balance.
  const rows: MonthRow[] = [];
  const rentPaid: number[] = [];
  let customers = inputs.startingCustomers;

  for (let t = 1; t <= inputs.months; t++) {
    const shockOn = t >= shockStart;
    const leaseYear = Math.floor((t - 1) / 12);

    const costInfl = Math.pow(1 + inputs.costInflationAnnual, (t - 1) / 12);
    const extraInfl = shockOn && shocks.extraCostInflationAnnual
      ? Math.pow(1 + shocks.extraCostInflationAnnual, (t - shockStart + 1) / 12)
      : 1;
    const costFactor = costInfl * extraInfl;
    const priceInfl = Math.pow(1 + inputs.priceIncreaseAnnual, (t - 1) / 12);
    const yearlyStep = Math.pow(1 + inputs.costInflationAnnual, leaseYear);

    const comp = shockOn ? shocks.competitor : undefined;
    const acqFactor = comp ? comp.acquisitionFactor : 1;
    const churnAdd = comp ? comp.churnAddPoints : 0;

    const paidNew = inputs.marketingBudget / (inputs.costPerNewCustomer * costFactor);
    const newCustomers = (inputs.organicNewCustomersPerMonth + paidNew) * acqFactor;
    const retention = clamp01(inputs.monthlyRetention - churnAdd);
    customers = customers * retention + newCustomers;

    const demandFactor = shockOn ? shocks.demandFactor ?? 1 : 1;
    const rawUnits = customers * inputs.unitsPerCustomerPerMonth * demandFactor;
    const cap = inputs.maxUnitsPerMonth;
    const capped = cap !== undefined && rawUnits > cap;
    const units = capped ? (cap as number) : rawUnits;

    const price = avgPrice * priceInfl * (shockOn ? shocks.priceFactor ?? 1 : 1);
    const unitCost = avgUnitCost * costFactor * (shockOn ? shocks.supplierCostFactor ?? 1 : 1);

    const revenue = units * price;
    const cogs = units * unitCost;
    const grossProfit = revenue - cogs;

    const staffCost = baseStaff * yearlyStep * (1 + inputs.payrollOnCostRate);
    const rent = inputs.monthlyRent * yearlyStep;
    const utilities = inputs.monthlyUtilities * costFactor * (shockOn ? shocks.utilityCostFactor ?? 1 : 1);
    const otherOpex = inputs.monthlyOtherOpex * costFactor;
    const marketing = inputs.marketingBudget;

    const operatingProfit = grossProfit - staffCost - rent - utilities - otherOpex - marketing;
    const tax = Math.max(0, operatingProfit) * inputs.profitTaxRate;
    const netProfit = operatingProfit - tax;

    const inventory = (inputs.inventoryDays / 30) * cogs;

    // Rent leaves the bank account up front for the year, but is an expense each month.
    const paid = inputs.rentPaidYearlyUpfront ? (t - 1) % 12 === 0 ? rent * Math.min(12, inputs.months - t + 1) : 0 : rent;
    rentPaid.push(paid);

    rows.push({
      month: t,
      customers,
      newCustomers,
      units,
      cappedByCapacity: capped,
      revenue,
      cogs,
      grossProfit,
      staffCost,
      rent,
      utilities,
      marketing,
      otherOpex,
      operatingProfit,
      tax,
      netProfit,
      inventory,
      cashFlow: 0,
      cash: 0,
    });
  }

  // Pass 2: cash. Opening stock is bought before month 1 from your capital.
  const openingInventory = rows[0].inventory;
  let cash = inputs.startingCapital - inputs.setupCosts - openingInventory;
  let prevInventory = openingInventory;
  rows.forEach((r, idx) => {
    const rentAdjust = rentPaid[idx] - r.rent;
    const stockBuild = r.inventory - prevInventory;
    r.cashFlow = r.netProfit - rentAdjust - stockBuild;
    cash += r.cashFlow;
    r.cash = cash;
    prevInventory = r.inventory;
  });

  const summary = summarise(inputs, rows, avgPrice, avgUnitCost, baseStaff);
  const signals = buildSignals(inputs, rows, summary, avgPrice, avgUnitCost, openingInventory);

  return { inputs, scenario: sc, rows, summary, signals, disclaimer: SIMULATION_DISCLAIMER };
}

function summarise(
  inputs: SimulationInputs,
  rows: MonthRow[],
  avgPrice: number,
  avgUnitCost: number,
  baseStaff: number,
): Summary {
  let lowestCash = Infinity;
  let lowestCashMonth = 1;
  rows.forEach((r) => {
    if (r.cash < lowestCash) {
      lowestCash = r.cash;
      lowestCashMonth = r.month;
    }
  });

  const firstNegative = rows.find((r) => r.cash < 0);
  const cashOutMonth = firstNegative ? firstNegative.month : null;

  // Break-even: first month from which every later month is profitable.
  let breakEvenMonth: number | null = null;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].netProfit >= 0) breakEvenMonth = rows[i].month;
    else break;
  }

  const payback = rows.find((r) => r.cash >= inputs.startingCapital);

  const margin = avgPrice - avgUnitCost;
  const fixed1 = baseStaff * (1 + inputs.payrollOnCostRate) + inputs.monthlyRent + inputs.monthlyUtilities + inputs.monthlyOtherOpex + inputs.marketingBudget;
  const breakEvenUnitsPerMonth = margin > 0 ? fixed1 / margin : null;

  const totalRevenue = sum(rows.map((r) => r.revenue));
  const totalGross = sum(rows.map((r) => r.grossProfit));
  const tail = rows.slice(-12);
  const tailRevenue = sum(tail.map((r) => r.revenue));

  return {
    totalRevenue,
    totalNetProfit: sum(rows.map((r) => r.netProfit)),
    endingCash: rows[rows.length - 1].cash,
    lowestCash,
    lowestCashMonth,
    additionalCapitalNeeded: Math.max(0, -lowestCash),
    cashOutMonth,
    runwayMonths: cashOutMonth === null ? null : cashOutMonth - 1,
    breakEvenMonth,
    paybackMonth: payback ? payback.month : null,
    breakEvenUnitsPerMonth,
    averageGrossMargin: totalRevenue > 0 ? totalGross / totalRevenue : 0,
    endNetMargin: tailRevenue > 0 ? sum(tail.map((r) => r.netProfit)) / tailRevenue : 0,
  };
}

function buildSignals(
  inputs: SimulationInputs,
  rows: MonthRow[],
  s: Summary,
  avgPrice: number,
  avgUnitCost: number,
  openingInventory: number,
): Signal[] {
  const out: Signal[] = [];

  if (avgUnitCost >= avgPrice) {
    out.push({
      severity: 'critical',
      code: 'NEGATIVE_UNIT_MARGIN',
      message: 'Each unit costs you as much as or more than you sell it for. Selling more will lose more money.',
    });
  }
  if (s.cashOutMonth !== null) {
    out.push({
      severity: 'critical',
      code: 'CASH_RUNS_OUT',
      message: `Cash runs out in month ${s.cashOutMonth}. You would need about ₦${Math.round(s.additionalCapitalNeeded).toLocaleString('en-NG')} more capital to get through.`,
    });
  } else if (s.lowestCash < inputs.startingCapital * 0.1) {
    out.push({
      severity: 'warning',
      code: 'THIN_CASH_BUFFER',
      message: `Cash falls to ₦${Math.round(s.lowestCash).toLocaleString('en-NG')} in month ${s.lowestCashMonth}. One bad month could break you.`,
    });
  }
  if (s.breakEvenMonth === null) {
    out.push({
      severity: 'critical',
      code: 'NO_BREAK_EVEN',
      message: 'The business does not settle into steady profit within the simulation.',
    });
  } else if (s.breakEvenMonth > 12) {
    out.push({
      severity: 'warning',
      code: 'SLOW_BREAK_EVEN',
      message: `Steady profit only starts in month ${s.breakEvenMonth}. Check you can fund more than a year of losses.`,
    });
  }
  if (inputs.setupCosts + openingInventory > inputs.startingCapital) {
    out.push({
      severity: 'critical',
      code: 'CAPITAL_BELOW_LAUNCH_COST',
      message: 'Your setup costs and opening stock are more than your starting capital, before you sell anything.',
    });
  }
  if (rows.some((r) => r.cappedByCapacity)) {
    out.push({
      severity: 'info',
      code: 'CAPACITY_REACHED',
      message: 'Demand is higher than your capacity in some months. Sales are limited by what you can produce.',
    });
  }
  if (inputs.monthlyRetention < 0.6) {
    out.push({
      severity: 'warning',
      code: 'LOW_RETENTION',
      message: 'You lose more than 4 in 10 customers every month. Growth will depend entirely on constant new customers.',
    });
  }
  if (s.averageGrossMargin > 0 && s.averageGrossMargin < 0.2) {
    out.push({
      severity: 'warning',
      code: 'THIN_GROSS_MARGIN',
      message: 'Gross margin is below 20%. Small cost rises can wipe out profit.',
    });
  }
  return out;
}
