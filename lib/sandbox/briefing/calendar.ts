/**
 * Nigerian festivities, public holidays and seasons that affect business.
 * Dates are from published holiday calendars (officeholidays.com, calendarific.com), checked 2026-11-06.
 * Islamic holidays follow moon sighting and can move by a day or two: `firm: false` marks those.
 * Seasonal notes are TYPICAL patterns, never forecasts.
 */
export type EventKind = "holiday" | "festival" | "observance";

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  name: string;
  kind: EventKind;
  firm: boolean;
  note: string;
}

export interface Season {
  name: string;
  /** Months, 1 to 12, in which the season typically applies. */
  months: number[];
  note: string;
}

export const EVENTS: CalendarEvent[] = [
  { date: "2026-12-24", name: "Christmas Eve", kind: "festival", firm: true, note: "Last-minute shopping, food and travel peak." },
  { date: "2026-12-25", name: "Christmas Day", kind: "holiday", firm: true, note: "Public holiday. Many shops close; food, drinks and event services are busy." },
  { date: "2026-12-26", name: "Boxing Day", kind: "holiday", firm: true, note: "Public holiday." },
  { date: "2026-12-31", name: "New Year's Eve", kind: "festival", firm: true, note: "Parties, events and travel." },
  { date: "2027-01-01", name: "New Year's Day", kind: "holiday", firm: true, note: "Public holiday. Slow start for many businesses." },
  { date: "2027-02-08", name: "Ramadan begins (about)", kind: "festival", firm: false, note: "Date follows moon sighting, expected around 8 to 9 February. Food demand and opening hours change in many Muslim-majority areas." },
  { date: "2027-02-14", name: "Valentine's Day", kind: "observance", firm: true, note: "Gifts, flowers, restaurants and beauty services are busy." },
  { date: "2027-03-09", name: "Eid-el-Fitr (Sallah)", kind: "holiday", firm: false, note: "Public holiday, date follows moon sighting. Strong demand for clothing, beauty, food and gifts before it." },
  { date: "2027-03-26", name: "Good Friday", kind: "holiday", firm: true, note: "Public holiday." },
  { date: "2027-03-29", name: "Easter Monday", kind: "holiday", firm: true, note: "Public holiday." },
  { date: "2027-05-01", name: "Workers' Day", kind: "holiday", firm: true, note: "Public holiday." },
  { date: "2027-05-16", name: "Id el Kabir (Eid-al-Adha)", kind: "holiday", firm: false, note: "Public holiday, date follows moon sighting. Ram and food prices usually rise beforehand." },
  { date: "2027-06-12", name: "Democracy Day", kind: "holiday", firm: true, note: "Public holiday." },
  { date: "2027-08-15", name: "Eid-el-Mawlid", kind: "holiday", firm: false, note: "Public holiday, date follows moon sighting." },
  { date: "2027-10-01", name: "Independence Day", kind: "holiday", firm: true, note: "Public holiday." },
  { date: "2027-12-25", name: "Christmas Day", kind: "holiday", firm: true, note: "Public holiday." },
  { date: "2027-12-26", name: "Boxing Day", kind: "holiday", firm: true, note: "Public holiday." },
];

export const SEASONS: Season[] = [
  { name: "Festive season", months: [12], note: "December is usually the busiest spending month for food, drinks, clothing, beauty, events and travel. Supplier prices for popular items also tend to rise." },
  { name: "Harmattan", months: [11, 12, 1, 2, 3], note: "Dry, dusty, cooler weather, stronger in the north. It affects skin and hair care demand, cold drinks, transport and some perishable stock." },
  { name: "Back-to-school and January pressure", months: [1, 9], note: "School fees and resumption squeeze household budgets, so spending on non-essentials often dips." },
  { name: "Rainy season", months: [4, 5, 6, 7, 8, 9, 10], note: "Heavy rain slows deliveries and foot traffic and can raise transport costs and damage stock stored badly." },
  { name: "Flood-risk peak", months: [8, 9, 10], note: "Flooding is most likely in low-lying and river-side areas. Protect stock and equipment and have a plan for road closures." },
];

const DAY = 24 * 60 * 60 * 1000;

/** Events from `from` for the next `days` days, soonest first. */
export function upcomingEvents(from: Date, days: number): CalendarEvent[] {
  const start = from.getTime();
  const end = start + days * DAY;
  return EVENTS.filter((e) => {
    const t = Date.parse(`${e.date}T00:00:00Z`);
    return t >= start && t <= end;
  }).sort((a, b) => a.date.localeCompare(b.date));
}

/** Seasons that apply in any month of the window. */
export function seasonsInWindow(from: Date, days: number): Season[] {
  const months = new Set<number>();
  for (let d = 0; d <= days; d += 7) months.add(new Date(from.getTime() + d * DAY).getUTCMonth() + 1);
  return SEASONS.filter((s) => s.months.some((m) => months.has(m)));
}
