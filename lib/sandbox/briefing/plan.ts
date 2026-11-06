import { NICHES } from "./generate";

export interface Combo {
  niche: string;
  /** Empty string means the national briefing for that business type. */
  state: string;
}

export const MAX_STATE_COMBOS = 24;

/**
 * Which briefings to draft: one national briefing per business type, plus one for every
 * business-type and state pair that real people have simulated recently (capped).
 */
export function planCombos(pairs: { business_type: string | null; state_name: string | null }[]): Combo[] {
  const valid = new Set(NICHES.map((n) => n.id));
  const combos: Combo[] = NICHES.map((n) => ({ niche: n.id, state: "" }));
  const seen = new Set<string>();
  for (const p of pairs) {
    const niche = p.business_type ?? "";
    const state = (p.state_name ?? "").trim().slice(0, 60);
    if (!valid.has(niche) || !state) continue;
    const key = `${niche}|${state}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (seen.size <= MAX_STATE_COMBOS) combos.push({ niche, state });
  }
  return combos;
}

/** The current month in Nigerian time (UTC+1), as "YYYY-MM". */
export function currentMonthLagos(now: Date): string {
  const lagos = new Date(now.getTime() + 60 * 60 * 1000);
  return `${lagos.getUTCFullYear()}-${String(lagos.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const isMonth = (v: unknown): v is string => typeof v === "string" && /^20\d{2}-(0[1-9]|1[0-2])$/.test(v);
