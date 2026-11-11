/** What the owner tells us about their business or idea, in their own words. */
export type BusinessStage = "idea" | "starting" | "running";

export interface BusinessProfile {
  stage: BusinessStage;
  /** What the business does or will do, in the owner's words. */
  description: string;
  /** Who buys, and where those customers are. */
  customers: string;
  /** Town, area or neighbourhood, for example "Yaba" or "Ikeja GRA". */
  area: string;
  /** Where materials, stock or supplies come from. Optional. */
  suppliers: string;
  /** What worries the owner, or what they want in the next year. Optional. */
  goal: string;
  /** True for law, accounting, medical, consulting and similar work (affects Nigerian tax relief). */
  professional: boolean;
}

export const STAGES: { value: BusinessStage; label: string; description: string }[] = [
  { value: "idea", label: "Just an idea", description: "Not started yet" },
  { value: "starting", label: "Just started", description: "Less than a year old" },
  { value: "running", label: "Already running", description: "A year or more" },
];

export const LIMITS = { description: 600, customers: 400, area: 80, suppliers: 300, goal: 400 } as const;
export const MIN_DESCRIPTION = 15;

export const emptyProfile = (): BusinessProfile => ({
  stage: "starting",
  description: "",
  customers: "",
  area: "",
  suppliers: "",
  goal: "",
  professional: false,
});

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max) : "";

/** Cleans whatever the browser sent. Returns null if it is not a usable profile. */
export function sanitizeProfile(raw: unknown): BusinessProfile | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const stage: BusinessStage = r.stage === "idea" || r.stage === "starting" || r.stage === "running" ? r.stage : "starting";
  const p: BusinessProfile = {
    stage,
    description: clean(r.description, LIMITS.description),
    customers: clean(r.customers, LIMITS.customers),
    area: clean(r.area, LIMITS.area),
    suppliers: clean(r.suppliers, LIMITS.suppliers),
    goal: clean(r.goal, LIMITS.goal),
    professional: r.professional === true,
  };
  return isProfileValid(p) ? p : null;
}

export function isProfileValid(p: BusinessProfile): boolean {
  return p.description.trim().length >= MIN_DESCRIPTION && p.customers.trim().length >= 3 && p.area.trim().length >= 2;
}

/** One short line for headings and admin lists. */
export function profileTitle(p: BusinessProfile | null, businessName?: string): string {
  if (businessName?.trim()) return businessName.trim();
  if (!p) return "Your business";
  const d = p.description.trim();
  return d.length > 60 ? `${d.slice(0, 57).trim()}…` : d || "Your business";
}
