/**
 * Plain-assert tests for the sandbox engine. No test framework needed.
 * Run:  npx tsx scripts/sandbox-engine.test.ts
 */
import assert from 'node:assert/strict';
import {
  SCENARIO_PRESETS,
  SimulationInputError,
  SimulationInputs,
  compareScenarios,
  getScenario,
  simulate,
} from '../lib/sandbox';

// A small Lagos bakery. Illustrative numbers, not market data.
const bakery: SimulationInputs = {
  businessName: 'Test Bakery',
  months: 24,
  startingCapital: 6_000_000,
  setupCosts: 1_500_000,
  products: [
    { name: 'Bread loaf', unitPrice: 1500, unitCost: 800, mix: 6 },
    { name: 'Celebration cake', unitPrice: 12000, unitCost: 6000, mix: 1 },
  ],
  startingCustomers: 40,
  organicNewCustomersPerMonth: 10,
  marketingBudget: 100_000,
  costPerNewCustomer: 2500,
  monthlyRetention: 0.8,
  unitsPerCustomerPerMonth: 6,
  staff: [{ role: 'Baker', count: 3, monthlySalary: 120_000 }],
  payrollOnCostRate: 0.1,
  monthlyRent: 250_000,
  rentPaidYearlyUpfront: true,
  monthlyUtilities: 150_000,
  monthlyOtherOpex: 100_000,
  inventoryDays: 14,
  costInflationAnnual: 0.15,
  priceIncreaseAnnual: 0.1,
  profitTaxRate: 0,
};

const close = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);
let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`ok  ${name}`);
};

test('is deterministic', () => {
  assert.deepEqual(simulate(bakery), simulate(bakery));
});

test('returns one row per month with the disclaimer attached', () => {
  const r = simulate(bakery);
  assert.equal(r.rows.length, 24);
  assert.match(r.disclaimer, /not a forecast or a guarantee/);
});

test('cash identity: ending cash = capital - setup - opening stock + all cash flows', () => {
  const r = simulate(bakery);
  const openingStock = r.rows[0].inventory;
  const expected = bakery.startingCapital - bakery.setupCosts - openingStock + r.rows.reduce((a, x) => a + x.cashFlow, 0);
  close(r.summary.endingCash, expected, 1e-4);
});

test('profit identity: revenue - cogs - costs - tax = net profit', () => {
  const r = simulate(bakery);
  r.rows.forEach((x) => {
    close(x.netProfit, x.revenue - x.cogs - x.staffCost - x.rent - x.utilities - x.marketing - x.otherOpex - x.tax, 1e-4);
  });
});

test('yearly rent upfront dips cash in month 1 and 13 versus paying monthly', () => {
  const upfront = simulate(bakery);
  const monthly = simulate({ ...bakery, rentPaidYearlyUpfront: false });
  assert.ok(upfront.rows[0].cash < monthly.rows[0].cash);
  assert.ok(upfront.rows[12].cash < monthly.rows[12].cash);
  // Same total over a full lease year:
  close(upfront.rows[11].cash, monthly.rows[11].cash, 1e-4);
});

test('baseline bakery is viable: profitable with no cash-out', () => {
  const r = simulate(bakery);
  assert.equal(r.summary.cashOutMonth, null);
  assert.equal(r.summary.runwayMonths, null);
  assert.ok(r.summary.breakEvenMonth !== null);
  assert.ok(r.summary.totalNetProfit > 0);
});

test('weak demand earns less than baseline; strong demand earns more', () => {
  const base = simulate(bakery);
  const weak = simulate(bakery, getScenario('weak-demand'));
  const strong = simulate(bakery, getScenario('strong-demand'));
  assert.ok(weak.summary.totalRevenue < base.summary.totalRevenue);
  assert.ok(strong.summary.totalRevenue > base.summary.totalRevenue);
});

test('supplier price rise cuts gross margin only from its start month', () => {
  const base = simulate(bakery);
  const shocked = simulate(bakery, getScenario('supplier-price-rise')); // starts month 4
  close(shocked.rows[2].grossProfit, base.rows[2].grossProfit, 1e-6);
  assert.ok(shocked.rows[3].grossProfit < base.rows[3].grossProfit);
});

test('competitor entry reduces customers after its start month', () => {
  const base = simulate(bakery);
  const shocked = simulate(bakery, getScenario('competitor-enters')); // starts month 6
  close(shocked.rows[4].customers, base.rows[4].customers, 1e-6);
  assert.ok(shocked.rows[11].customers < base.rows[11].customers);
});

test('every preset runs and compareScenarios returns baseline plus each scenario', () => {
  const c = compareScenarios(bakery, SCENARIO_PRESETS);
  assert.equal(c.scenarios.length, SCENARIO_PRESETS.length);
  assert.equal(c.baseline.scenario, null);
});

test('capacity limit caps units and raises a signal', () => {
  const r = simulate({ ...bakery, maxUnitsPerMonth: 500 });
  assert.ok(r.rows.every((x) => x.units <= 500 + 1e-9));
  assert.ok(r.rows.some((x) => x.cappedByCapacity));
  assert.ok(r.signals.some((s) => s.code === 'CAPACITY_REACHED'));
});

test('a business that sells below cost is flagged critical and runs out of cash', () => {
  const r = simulate({
    ...bakery,
    products: [{ name: 'Loss leader', unitPrice: 1000, unitCost: 1200, mix: 1 }],
  });
  assert.ok(r.signals.some((s) => s.code === 'NEGATIVE_UNIT_MARGIN' && s.severity === 'critical'));
  assert.ok(r.summary.cashOutMonth !== null);
  assert.equal(r.summary.breakEvenUnitsPerMonth, null);
  assert.ok(r.summary.additionalCapitalNeeded > 0);
});

test('capital below launch cost is flagged', () => {
  const r = simulate({ ...bakery, startingCapital: 1_000_000 });
  assert.ok(r.signals.some((s) => s.code === 'CAPITAL_BELOW_LAUNCH_COST'));
});

test('profit tax only applies to positive profit', () => {
  const r = simulate({ ...bakery, profitTaxRate: 0.3 });
  r.rows.forEach((x) => {
    if (x.operatingProfit <= 0) assert.equal(x.tax, 0);
    else close(x.tax, x.operatingProfit * 0.3, 1e-6);
  });
});

test('break-even units matches month-1 maths', () => {
  const r = simulate(bakery);
  const avgPrice = (1500 * 6 + 12000) / 7;
  const avgCost = (800 * 6 + 6000) / 7;
  const fixed = 3 * 120_000 * 1.1 + 250_000 + 150_000 + 100_000 + 100_000;
  close(r.summary.breakEvenUnitsPerMonth as number, fixed / (avgPrice - avgCost), 1e-6);
});

test('invalid inputs throw a SimulationInputError with plain-language messages', () => {
  assert.throws(
    () => simulate({ ...bakery, months: 2, monthlyRetention: 1.4, products: [] }),
    (err: unknown) => {
      assert.ok(err instanceof SimulationInputError);
      assert.ok(err.errors.length >= 3);
      return true;
    },
  );
});

test('rejects NaN and negative values', () => {
  assert.throws(() => simulate({ ...bakery, startingCapital: Number.NaN }), SimulationInputError);
  assert.throws(() => simulate({ ...bakery, monthlyRent: -5 }), SimulationInputError);
  assert.throws(() => simulate({ ...bakery, costPerNewCustomer: 0 }), SimulationInputError);
});

console.log(`\n${passed} tests passed`);
