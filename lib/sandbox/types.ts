/**
 * Sandbox simulation engine: shared types.
 * All money values are in Nigerian Naira (NGN), per month unless stated.
 */

export interface ProductInput {
  name: string;
  /** Selling price per unit, ex-VAT. */
  unitPrice: number;
  /** Direct cost per unit (ingredients, goods bought for resale, packaging). */
  unitCost: number;
  /** Relative share of units sold. Mix 6 and 1 means 6 of every 7 units are the first product. */
  mix: number;
}

export interface StaffInput {
  role: string;
  count: number;
  /** Gross monthly salary per person. */
  monthlySalary: number;
}

export interface SimulationInputs {
  businessName?: string;
  /** Simulation length in months (6 to 36). */
  months: number;

  // Money in
  startingCapital: number;
  /** One-off costs before opening: fit-out, equipment, registration, licences. */
  setupCosts: number;

  // Offer
  products: ProductInput[];

  // Customers (acquisition and retention)
  startingCustomers: number;
  /** New customers per month that arrive without paid marketing (word of mouth, walk-ins). */
  organicNewCustomersPerMonth: number;
  /** Monthly marketing spend. */
  marketingBudget: number;
  /** Cost to win one new customer through marketing (CAC). */
  costPerNewCustomer: number;
  /** Share of customers who stay from one month to the next (0 to 1). */
  monthlyRetention: number;
  /** Units each active customer buys per month. */
  unitsPerCustomerPerMonth: number;
  /** Optional hard limit on units you can produce or serve per month. */
  maxUnitsPerMonth?: number;

  // Costs
  staff: StaffInput[];
  /** Employer on-cost on salaries, as a fraction (pension, insurance, levies). */
  payrollOnCostRate: number;
  monthlyRent: number;
  /** In Nigeria rent is commonly paid a year ahead. If true, 12 months are paid up front each lease year. */
  rentPaidYearlyUpfront: boolean;
  /** Electricity, diesel, generator fuel, internet and water. */
  monthlyUtilities: number;
  /** Everything else: transport, software, packaging not in unit cost, insurance, repairs. */
  monthlyOtherOpex: number;
  /** Days of cost of goods held as stock. 0 means no inventory. */
  inventoryDays: number;

  // Economy
  /** Yearly rise in costs (inputs, wages, rent, utilities). */
  costInflationAnnual: number;
  /** Yearly rise in your selling prices. */
  priceIncreaseAnnual: number;
  /** Tax charged on positive monthly operating profit (simplified in Stage 1). */
  profitTaxRate: number;
}

/** Shocks applied from `startMonth` onward. Leave a field out for no change. */
export interface Shocks {
  /** Multiplies units demanded. 0.7 means 30% less demand. */
  demandFactor?: number;
  /** Multiplies selling price. */
  priceFactor?: number;
  /** Multiplies unit cost (supplier price rise). */
  supplierCostFactor?: number;
  /** Multiplies utilities (for example a diesel price spike). */
  utilityCostFactor?: number;
  /** Extra yearly cost inflation added on top, compounding from the start month. */
  extraCostInflationAnnual?: number;
  /** A new competitor opens: fewer new customers and more churn. */
  competitor?: {
    /** Multiplies new customers (organic and paid). */
    acquisitionFactor: number;
    /** Added to monthly churn, as a fraction. 0.04 means 4 points more customers lost each month. */
    churnAddPoints: number;
  };
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  /** First month the shocks apply (1 to months). */
  startMonth: number;
  shocks: Shocks;
}

export interface MonthRow {
  month: number;
  customers: number;
  newCustomers: number;
  units: number;
  cappedByCapacity: boolean;
  revenue: number;
  cogs: number;
  grossProfit: number;
  staffCost: number;
  rent: number;
  utilities: number;
  marketing: number;
  otherOpex: number;
  operatingProfit: number;
  tax: number;
  netProfit: number;
  /** Value of stock held at month end. */
  inventory: number;
  /** Cash in or out for the month, including prepaid rent and stock build-up. */
  cashFlow: number;
  /** Cash balance at month end. */
  cash: number;
}

export type SignalSeverity = 'critical' | 'warning' | 'info';

export interface Signal {
  severity: SignalSeverity;
  code: string;
  message: string;
}

export interface Summary {
  totalRevenue: number;
  totalNetProfit: number;
  endingCash: number;
  lowestCash: number;
  lowestCashMonth: number;
  /** Extra capital you would have needed to never run out of cash. 0 if you never run out. */
  additionalCapitalNeeded: number;
  /** First month cash goes below zero. null means cash stays positive for the whole simulation. */
  cashOutMonth: number | null;
  /** Full months you can operate before cash runs out. null means beyond the simulation. */
  runwayMonths: number | null;
  /** First month from which the business makes a profit every month after. null if never. */
  breakEvenMonth: number | null;
  /** First month the cash balance is back to your starting capital. null if never. */
  paybackMonth: number | null;
  /** Units per month needed to cover fixed costs, using month 1 prices and costs. null if each unit loses money. */
  breakEvenUnitsPerMonth: number | null;
  averageGrossMargin: number;
  /** Net margin over the last 12 months (or all months if fewer). */
  endNetMargin: number;
}

export interface SimulationResult {
  inputs: SimulationInputs;
  scenario: Scenario | null;
  rows: MonthRow[];
  summary: Summary;
  signals: Signal[];
  /** Always attached so every output is labelled as a simulation. */
  disclaimer: string;
}

export const SIMULATION_DISCLAIMER =
  'This is a simulation based on the assumptions you entered. It is not a forecast or a guarantee of results.';
