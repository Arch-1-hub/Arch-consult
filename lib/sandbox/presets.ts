import { SimulationInputs } from './types';

/**
 * Starting points so nobody faces a blank form. These are ILLUSTRATIVE numbers, not market data.
 * The UI tells the user to replace every figure with their own.
 */
export interface BusinessPreset {
  id: string;
  label: string;
  description: string;
  inputs: SimulationInputs;
}

const BASE: SimulationInputs = {
  businessName: '',
  months: 24,
  startingCapital: 5_000_000,
  setupCosts: 1_500_000,
  products: [{ name: 'Main product', unitPrice: 0, unitCost: 0, mix: 1 }],
  startingCustomers: 0,
  organicNewCustomersPerMonth: 10,
  marketingBudget: 100_000,
  costPerNewCustomer: 3_000,
  monthlyRetention: 0.75,
  unitsPerCustomerPerMonth: 2,
  maxUnitsPerMonth: undefined,
  staff: [],
  payrollOnCostRate: 0.1,
  monthlyRent: 200_000,
  rentPaidYearlyUpfront: true,
  monthlyUtilities: 100_000,
  monthlyOtherOpex: 80_000,
  inventoryDays: 0,
  costInflationAnnual: 0.15,
  priceIncreaseAnnual: 0.1,
  profitTaxRate: 0,
};

function make(over: Partial<SimulationInputs>): SimulationInputs {
  return { ...BASE, ...over };
}

export const PRESETS: BusinessPreset[] = [
  {
    id: 'food-production',
    label: 'Bakery or food production',
    description: 'You make food and sell it to repeat customers.',
    inputs: make({
      startingCapital: 6_000_000,
      setupCosts: 1_500_000,
      products: [
        { name: 'Bread loaf', unitPrice: 1_500, unitCost: 800, mix: 6 },
        { name: 'Celebration cake', unitPrice: 12_000, unitCost: 6_000, mix: 1 },
      ],
      startingCustomers: 40,
      organicNewCustomersPerMonth: 10,
      marketingBudget: 100_000,
      costPerNewCustomer: 2_500,
      monthlyRetention: 0.8,
      unitsPerCustomerPerMonth: 6,
      staff: [{ role: 'Baker', count: 3, monthlySalary: 120_000 }],
      monthlyRent: 250_000,
      monthlyUtilities: 150_000,
      monthlyOtherOpex: 100_000,
      inventoryDays: 14,
    }),
  },
  {
    id: 'retail-shop',
    label: 'Retail or provision store',
    description: 'You buy goods and resell them from a shop.',
    inputs: make({
      startingCapital: 8_000_000,
      setupCosts: 2_500_000,
      products: [
        { name: 'Groceries', unitPrice: 4_000, unitCost: 3_300, mix: 5 },
        { name: 'Drinks and snacks', unitPrice: 1_500, unitCost: 1_150, mix: 3 },
      ],
      startingCustomers: 120,
      organicNewCustomersPerMonth: 40,
      marketingBudget: 60_000,
      costPerNewCustomer: 1_500,
      monthlyRetention: 0.85,
      unitsPerCustomerPerMonth: 4,
      staff: [{ role: 'Sales attendant', count: 2, monthlySalary: 100_000 }],
      monthlyRent: 200_000,
      monthlyUtilities: 120_000,
      monthlyOtherOpex: 80_000,
      inventoryDays: 30,
    }),
  },
  {
    id: 'restaurant',
    label: 'Restaurant or food vendor',
    description: 'You cook and serve meals on site or for delivery.',
    inputs: make({
      startingCapital: 10_000_000,
      setupCosts: 4_000_000,
      products: [
        { name: 'Meal plate', unitPrice: 3_500, unitCost: 1_400, mix: 6 },
        { name: 'Drinks', unitPrice: 800, unitCost: 300, mix: 4 },
      ],
      startingCustomers: 60,
      organicNewCustomersPerMonth: 30,
      marketingBudget: 150_000,
      costPerNewCustomer: 3_000,
      monthlyRetention: 0.65,
      unitsPerCustomerPerMonth: 5,
      staff: [
        { role: 'Cook', count: 2, monthlySalary: 100_000 },
        { role: 'Server', count: 3, monthlySalary: 80_000 },
      ],
      monthlyRent: 350_000,
      monthlyUtilities: 300_000,
      monthlyOtherOpex: 150_000,
      inventoryDays: 7,
    }),
  },
  {
    id: 'beauty-salon',
    label: 'Salon or personal services',
    description: 'You sell your time and skill to clients.',
    inputs: make({
      startingCapital: 4_000_000,
      setupCosts: 1_800_000,
      products: [
        { name: 'Haircut or styling', unitPrice: 6_000, unitCost: 1_000, mix: 6 },
        { name: 'Treatment', unitPrice: 15_000, unitCost: 4_000, mix: 1 },
      ],
      startingCustomers: 30,
      organicNewCustomersPerMonth: 12,
      marketingBudget: 80_000,
      costPerNewCustomer: 3_000,
      monthlyRetention: 0.75,
      unitsPerCustomerPerMonth: 1.5,
      maxUnitsPerMonth: 700,
      staff: [{ role: 'Stylist', count: 3, monthlySalary: 80_000 }],
      monthlyRent: 150_000,
      monthlyUtilities: 120_000,
      monthlyOtherOpex: 60_000,
      inventoryDays: 21,
    }),
  },
  {
    id: 'online-store',
    label: 'Online store',
    description: 'You sell products online and deliver them.',
    inputs: make({
      startingCapital: 5_000_000,
      setupCosts: 800_000,
      products: [
        { name: 'Main item', unitPrice: 18_000, unitCost: 11_000, mix: 3 },
        { name: 'Accessory', unitPrice: 6_000, unitCost: 3_000, mix: 2 },
      ],
      startingCustomers: 20,
      organicNewCustomersPerMonth: 8,
      marketingBudget: 250_000,
      costPerNewCustomer: 6_000,
      monthlyRetention: 0.55,
      unitsPerCustomerPerMonth: 1.2,
      staff: [{ role: 'Operations', count: 2, monthlySalary: 100_000 }],
      monthlyRent: 100_000,
      monthlyUtilities: 40_000,
      monthlyOtherOpex: 120_000,
      inventoryDays: 45,
    }),
  },
  {
    id: 'professional-services',
    label: 'Professional or business services',
    description: 'You sell expertise through retainers or projects.',
    inputs: make({
      startingCapital: 3_000_000,
      setupCosts: 600_000,
      products: [
        { name: 'Monthly retainer', unitPrice: 150_000, unitCost: 20_000, mix: 2 },
        { name: 'Project', unitPrice: 400_000, unitCost: 80_000, mix: 1 },
      ],
      startingCustomers: 3,
      organicNewCustomersPerMonth: 0.5,
      marketingBudget: 100_000,
      costPerNewCustomer: 80_000,
      monthlyRetention: 0.9,
      unitsPerCustomerPerMonth: 1,
      staff: [{ role: 'Consultant', count: 2, monthlySalary: 250_000 }],
      monthlyRent: 200_000,
      monthlyUtilities: 60_000,
      monthlyOtherOpex: 100_000,
      inventoryDays: 0,
    }),
  },
  {
    id: 'custom',
    label: 'Something else',
    description: 'Start from a blank plan and fill in your own numbers.',
    inputs: make({}),
  },
];

export function getPreset(id: string): BusinessPreset | undefined {
  return PRESETS.find((p) => p.id === id);
}

/** A fresh copy so editing the form never changes the preset itself. */
export function cloneInputs(i: SimulationInputs): SimulationInputs {
  return {
    ...i,
    products: i.products.map((p) => ({ ...p })),
    staff: i.staff.map((s) => ({ ...s })),
  };
}
