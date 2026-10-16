/** Display helpers for Naira amounts and months. No dependencies, safe on server and client. */

function group(n: number): string {
  return Math.round(Math.abs(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** ₦1,250,000 or -₦1,250,000 */
export function naira(n: number): string {
  if (!Number.isFinite(n)) return '₦0';
  const sign = Math.round(n) < 0 ? '-' : '';
  return `${sign}₦${group(n)}`;
}

/** ₦1.3m, ₦450k, ₦900 (for chart axes and tight spaces) */
export function nairaCompact(n: number): string {
  if (!Number.isFinite(n)) return '₦0';
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  const trim = (v: number) => v.toFixed(1).replace(/\.0$/, '');
  if (a >= 1e9) return `${sign}₦${trim(a / 1e9)}bn`;
  if (a >= 1e6) return `${sign}₦${trim(a / 1e6)}m`;
  if (a >= 1e3) return `${sign}₦${Math.round(a / 1e3)}k`;
  return `${sign}₦${Math.round(a)}`;
}

/** 0.534 -> "53%" */
export function percent(fraction: number, digits = 0): string {
  if (!Number.isFinite(fraction)) return '0%';
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function monthWord(n: number): string {
  return n === 1 ? '1 month' : `${n} months`;
}

/** Whole number with thousands separators: 12500 -> "12,500" */
export function whole(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return `${Math.round(n) < 0 ? '-' : ''}${group(n)}`;
}
