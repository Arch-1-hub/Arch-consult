import { MonthRow } from './types';

/**
 * Nigeria rules layer. Every number here comes from the Nigeria Tax Act 2025 and related
 * rules in force from 1 January 2026, as reported by the sources listed in RULE_SOURCES.
 * These are planning assumptions, NOT tax advice. Re-check before each release.
 */
export const RULES_VERIFIED = '2026-10-17';

export const NIGERIA_RULES = {
  /** A "small company" pays 0% company tax (and no development levy) when BOTH tests are met. */
  smallCompanyTurnoverMax: 100_000_000,
  smallCompanyFixedAssetsMax: 250_000_000,
  companyIncomeTaxRate: 0.3,
  developmentLevyRate: 0.04,
  vatRate: 0.075,
  /**
   * Sources disagree on the VAT small-business limit (N50m or N100m). We use the LOWER figure
   * so the tool never tells someone they are exempt when they may not be.
   */
  vatSmallBusinessTurnoverConservative: 50_000_000,
  vatSmallBusinessTurnoverHigh: 100_000_000,
  pensionEmployerRate: 0.1,
  nsitfRate: 0.01,
  itfRate: 0.01,
  itfStaffThreshold: 5,
  itfTurnoverThreshold: 50_000_000,
  /** Personal income tax bands (annual chargeable income), used for sole proprietors. */
  payeBands: [
    { upTo: 800_000, rate: 0 },
    { upTo: 3_000_000, rate: 0.15 },
    { upTo: 12_000_000, rate: 0.18 },
    { upTo: 25_000_000, rate: 0.21 },
    { upTo: 50_000_000, rate: 0.23 },
    { upTo: Infinity, rate: 0.25 },
  ],
} as const;

export const RULE_SOURCES = [
  { label: 'PwC Worldwide Tax Summaries: Nigeria corporate tax (reviewed 29 May 2026)', url: 'https://taxsummaries.pwc.com/nigeria/corporate/taxes-on-corporate-income' },
  { label: 'Forvis Mazars: 2025 VAT changes', url: 'https://www.forvismazars.com/ng/en/services/tax/nigeria-s-tax-reform-in-focus/2025-nta-vat-key-business-changes' },
  { label: 'Techpoint Africa: tax reform for small businesses', url: 'https://techpoint.africa/guide/nigerian-tax-reform-acts/' },
  { label: 'Afrotools: 2026 PAYE bands', url: 'https://afrotools.com/blog/how-to-calculate-paye-nigeria-2026/' },
  { label: 'Afrotools: employer payroll compliance', url: 'https://afrotools.com/blog/nigeria-employer-payroll-compliance-2026/' },
] as const;

export type TaxStatus = 'company' | 'sole';

export interface RuleContext {
  status: TaxStatus;
  /** Law, accounting, medical, consulting and similar: no small-company or small-VAT relief. */
  professionalServices: boolean;
}

export interface RuleNote {
  code: string;
  title: string;
  text: string;
}

/** Tax on annual personal income across the 2026 bands. */
export function personalIncomeTax(annualIncome: number): number {
  let tax = 0;
  let lower = 0;
  for (const b of NIGERIA_RULES.payeBands) {
    if (annualIncome <= lower) break;
    tax += (Math.min(annualIncome, b.upTo) - lower) * b.rate;
    lower = b.upTo;
  }
  return tax;
}

/** Company tax plus development levy on one year's assessable profit. */
export function companyTax(turnover: number, fixedAssets: number, profit: number, professional: boolean): number {
  const small =
    !professional &&
    turnover <= NIGERIA_RULES.smallCompanyTurnoverMax &&
    fixedAssets <= NIGERIA_RULES.smallCompanyFixedAssetsMax;
  if (small || profit <= 0) return 0;
  return profit * (NIGERIA_RULES.companyIncomeTaxRate + NIGERIA_RULES.developmentLevyRate);
}

/** Employer on-cost on salaries: pension 10%, NSITF 1%, plus ITF 1% for larger employers. */
export function payrollOnCost(headcount: number, annualTurnover: number): number {
  const itf =
    headcount >= NIGERIA_RULES.itfStaffThreshold || annualTurnover >= NIGERIA_RULES.itfTurnoverThreshold
      ? NIGERIA_RULES.itfRate
      : 0;
  return NIGERIA_RULES.pensionEmployerRate + NIGERIA_RULES.nsitfRate + itf;
}

function byYear(rows: MonthRow[]) {
  const years: { turnover: number; profit: number }[] = [];
  rows.forEach((r) => {
    const y = Math.floor((r.month - 1) / 12);
    years[y] = years[y] ?? { turnover: 0, profit: 0 };
    years[y].turnover += r.revenue;
    years[y].profit += r.operatingProfit;
  });
  return years;
}

/**
 * Turns the rules into the single yearly-averaged rate the engine applies to monthly profit.
 * `rows` must come from a run with the profit tax rate set to 0.
 */
export function effectiveTaxRate(rows: MonthRow[], ctx: RuleContext, fixedAssets: number): number {
  const positive = rows.reduce((s, r) => s + Math.max(0, r.operatingProfit), 0);
  if (positive <= 0) return 0;
  const total = byYear(rows).reduce(
    (s, y) =>
      s +
      (ctx.status === 'company'
        ? companyTax(y.turnover, fixedAssets, y.profit, ctx.professionalServices)
        : personalIncomeTax(Math.max(0, y.profit))),
    0,
  );
  return Math.min(1, Math.max(0, total / positive));
}

const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

/** Plain-language list of the rules that were applied to this run. */
export function buildRuleNotes(args: {
  ctx: RuleContext;
  rows: MonthRow[];
  fixedAssets: number;
  headcount: number;
  taxRate: number;
  payrollRate: number;
}): RuleNote[] {
  const { ctx, rows, fixedAssets, headcount, taxRate, payrollRate } = args;
  const years = byYear(rows);
  const peak = Math.max(0, ...years.map((y) => y.turnover));
  const notes: RuleNote[] = [];
  const R = NIGERIA_RULES;

  if (ctx.status === 'company') {
    const small = !ctx.professionalServices && peak <= R.smallCompanyTurnoverMax && fixedAssets <= R.smallCompanyFixedAssetsMax;
    if (ctx.professionalServices) {
      notes.push({
        code: 'cit-professional',
        title: 'Company tax: 30% plus 4% development levy',
        text: 'Professional and advisory firms do not get the small-company relief, however small they are, so the full rate is applied to profit.',
      });
    } else if (small) {
      notes.push({
        code: 'cit-small',
        title: 'Company tax: 0% (small company)',
        text: `Your yearly sales stay at or under ${naira(R.smallCompanyTurnoverMax)} and your fixed assets under ${naira(R.smallCompanyFixedAssetsMax)}, so no company tax or development levy is applied. If your sales go above ${naira(R.smallCompanyTurnoverMax)} in any year, 30% tax plus a 4% levy starts on profit.`,
      });
    } else {
      notes.push({
        code: 'cit-large',
        title: 'Company tax: 30% plus 4% development levy',
        text: `Your yearly sales rise above ${naira(R.smallCompanyTurnoverMax)} (peak ${naira(peak)}), which takes you out of the small-company band. The simulation averages this to ${(taxRate * 100).toFixed(1)}% of operating profit.`,
      });
    }
  } else {
    notes.push({
      code: 'pit',
      title: 'Personal income tax on profit',
      text: `As a business name or sole proprietor you pay personal income tax on profit: nothing on the first ${naira(800_000)}, then 15% to 25% in bands. The simulation averages this to ${(taxRate * 100).toFixed(1)}% of operating profit. Reliefs such as rent and pension are not modelled.`,
    });
  }

  notes.push({
    code: 'payroll',
    title: `Payroll costs on top of salaries: ${(payrollRate * 100).toFixed(0)}%`,
    text: `Employer pension (10%), NSITF (1%)${payrollRate > 0.11 ? ' and ITF (1%, applies from 5 staff or ₦50m sales)' : ''}. Pension is compulsory for larger employers; it is included here for everyone to stay on the careful side.${headcount === 0 ? ' You listed no staff, so this has no effect.' : ''}`,
  });

  const vatLine =
    ctx.professionalServices || peak > R.vatSmallBusinessTurnoverHigh
      ? { title: 'VAT: you will need to charge 7.5%', text: 'Your type of business or size means VAT applies. Prices in the simulation exclude VAT. VAT is money you collect for the government, not income, and it can strain cash if you spend it before you pay it over. Input VAT on costs may be recoverable.' }
      : peak > R.vatSmallBusinessTurnoverConservative
        ? { title: 'VAT: grey zone', text: `Your sales pass ${naira(R.vatSmallBusinessTurnoverConservative)}. Sources disagree on whether the small-business VAT limit is ${naira(R.vatSmallBusinessTurnoverConservative)} or ${naira(R.vatSmallBusinessTurnoverHigh)}. Assume VAT applies and confirm with a tax adviser. Prices in the simulation exclude VAT.` }
        : { title: 'VAT: probably exempt for now', text: `Your yearly sales stay under ${naira(R.vatSmallBusinessTurnoverConservative)}, so you likely do not have to charge VAT yet. Above that, 7.5% VAT starts. Prices in the simulation exclude VAT.` };
  notes.push({ code: 'vat', ...vatLine });

  return notes;
}
