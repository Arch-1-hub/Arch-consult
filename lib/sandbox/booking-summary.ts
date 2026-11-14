import { GrowthFacts } from "./briefing/growth";
import { naira } from "./format";

export const SITE_URL = "https://archbrandingconsult.online";
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface BookingNotesInput {
  simId: string;
  title: string;
  description: string;
  area: string;
  state: string;
  facts: GrowthFacts | null;
}

/** The text that pre-fills the booking form's notes box. Plain language, editable by the client before sending. */
export function buildBookingNotes(i: BookingNotesInput): string {
  const place = [i.area, i.state].map((s) => s.trim()).filter(Boolean).join(", ");
  const lines: string[] = [];
  lines.push(`I ran my business through the Arch Consult Sandbox and would like to talk through the numbers.`);
  lines.push("");
  lines.push(`Business: ${i.title}${place ? ` (${place})` : ""}`);
  const d = i.description.trim();
  if (d) lines.push(`About it: ${d.length > 300 ? `${d.slice(0, 297).trim()}...` : d}`);
  const f = i.facts;
  if (f) {
    lines.push(
      f.breakEvenMonth ? `Break-even: month ${f.breakEvenMonth}` : `Break-even: not reached within ${f.months} months`,
    );
    lines.push(`Lowest cash point: ${naira(f.lowestCash)} in month ${f.lowestCashMonth}`);
    if (f.cashOutMonth) lines.push(`Cash runs out in month ${f.cashOutMonth}`);
    const top = f.levers.length ? [...f.levers].sort((a, b) => b.gain - a.gain)[0] : null;
    if (top && top.gain > 0) lines.push(`Strongest lever: ${top.label} (about ${naira(top.gain)} more profit)`);
  }
  lines.push("");
  lines.push("What I want help with: ");
  lines.push("");
  lines.push(`Simulation reference (for Arch Consult): ${SITE_URL}/admin/simulations/${i.simId}`);
  return lines.join("\n");
}
