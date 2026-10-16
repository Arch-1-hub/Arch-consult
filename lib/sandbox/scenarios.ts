import { simulate } from './engine';
import { Scenario, SimulationInputs, SimulationResult } from './types';

/**
 * Preset stress tests. The sizes are illustrative starting points the user can change,
 * not predictions. Stage 3 adds Nigeria-specific presets tied to researched data.
 */
export const SCENARIO_PRESETS: Scenario[] = [
  {
    id: 'strong-demand',
    name: 'Strong demand',
    description: '25% more demand than planned from the start.',
    startMonth: 1,
    shocks: { demandFactor: 1.25 },
  },
  {
    id: 'weak-demand',
    name: 'Weak demand',
    description: '30% less demand than planned from the start.',
    startMonth: 1,
    shocks: { demandFactor: 0.7 },
  },
  {
    id: 'competitor-enters',
    name: 'Competitor enters',
    description: 'From month 6 a rival opens nearby: 40% fewer new customers, more churn, and you cut prices 5%.',
    startMonth: 6,
    shocks: {
      priceFactor: 0.95,
      competitor: { acquisitionFactor: 0.6, churnAddPoints: 0.04 },
    },
  },
  {
    id: 'supplier-price-rise',
    name: 'Supplier price rise',
    description: 'From month 4 your suppliers charge 25% more and you cannot raise prices to match.',
    startMonth: 4,
    shocks: { supplierCostFactor: 1.25 },
  },
  {
    id: 'diesel-spike',
    name: 'Power and diesel spike',
    description: 'From month 3 your power and fuel bill is 50% higher.',
    startMonth: 3,
    shocks: { utilityCostFactor: 1.5 },
  },
  {
    id: 'naira-shock',
    name: 'Naira shock',
    description: 'From month 4 costs rise an extra 25% a year and suppliers charge 15% more.',
    startMonth: 4,
    shocks: { extraCostInflationAnnual: 0.25, supplierCostFactor: 1.15 },
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIO_PRESETS.find((s) => s.id === id);
}

export interface Comparison {
  baseline: SimulationResult;
  scenarios: SimulationResult[];
}

/** Runs the plan as entered, then once for each scenario, for side-by-side comparison. */
export function compareScenarios(inputs: SimulationInputs, scenarios: Scenario[]): Comparison {
  return {
    baseline: simulate(inputs, null),
    scenarios: scenarios.map((s) => simulate(inputs, s)),
  };
}
