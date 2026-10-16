import { naira } from './format';
import { Summary } from './types';

export type VerdictTone = 'critical' | 'warning' | 'good';

export interface Verdict {
  tone: VerdictTone;
  headline: string;
  detail: string;
}

/** One plain sentence about the result, in the direct tone of the product. */
export function buildVerdict(s: Summary, months: number, startingCapital: number): Verdict {
  if (s.cashOutMonth !== null) {
    return {
      tone: 'critical',
      headline: `Cash runs out in month ${s.cashOutMonth}.`,
      detail: `As planned, you would need about ${naira(s.additionalCapitalNeeded)} more capital to get through, or a plan that sells more or costs less.`,
    };
  }
  if (s.breakEvenMonth === null) {
    return {
      tone: 'warning',
      headline: 'You survive, but never settle into steady profit.',
      detail: `Cash lasts the full ${months} months, but the business is still not making a steady profit at the end. Cash stands at ${naira(s.endingCash)}.`,
    };
  }
  if (s.lowestCash < startingCapital * 0.1) {
    return {
      tone: 'warning',
      headline: `Steady profit from month ${s.breakEvenMonth}, but cash gets dangerously thin.`,
      detail: `Cash falls to ${naira(s.lowestCash)} in month ${s.lowestCashMonth}. One bad month in that stretch could break you.`,
    };
  }
  return {
    tone: 'good',
    headline: `Steady profit from month ${s.breakEvenMonth}.`,
    detail: `Cash is lowest at ${naira(s.lowestCash)} in month ${s.lowestCashMonth}, and stands at ${naira(s.endingCash)} by month ${months}. This is a simulation of your assumptions, so test it against weaker demand and higher costs next.`,
  };
}
