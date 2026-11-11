/** "2026-11" for the current month in Nigerian time (UTC+1). */
export function currentMonthLagos(now: Date): string {
  const l = new Date(now.getTime() + 60 * 60 * 1000);
  return `${l.getUTCFullYear()}-${String(l.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const isMonth = (v: unknown): v is string => typeof v === "string" && /^20\d{2}-(0[1-9]|1[0-2])$/.test(v);
