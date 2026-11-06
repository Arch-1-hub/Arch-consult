/** Rules for who may use the sandbox. Pure functions, so they can be tested without a server. */

export const FREE_SIMULATIONS = 1;
/** Anti-abuse ceiling for paying users. Raise it if real customers ever hit it. */
export const PAID_SIMULATIONS_PER_DAY = 20;
/** A successful payment of any of these kinds unlocks the sandbox (Starter and every higher package). */
export const ENTITLING_ITEM_TYPES = ["package"] as const;

export type Plan = "free" | "paid";

export type AccessKind = "anon" | "unverified" | "upgrade" | "ready" | "setup";

export interface PageAccess {
  kind: AccessKind;
  plan?: Plan;
  email?: string;
}

/** What the sandbox page shows a visitor. */
export function pageAccess(args: {
  signedIn: boolean;
  verified: boolean;
  paid: boolean;
  freeUsed: boolean;
  email?: string;
}): PageAccess {
  if (!args.signedIn) return { kind: "anon" };
  if (!args.verified) return { kind: "unverified", email: args.email };
  if (args.paid) return { kind: "ready", plan: "paid" };
  if (!args.freeUsed) return { kind: "ready", plan: "free" };
  return { kind: "upgrade" };
}

export type Decision =
  | { allowed: true; plan: Plan }
  | { allowed: false; code: "upgrade" | "daily-cap"; message: string };

/** Whether a verified person may start one more simulation right now. */
export function decideAccess(args: { paid: boolean; freeUsed: boolean; simsLast24h: number }): Decision {
  if (args.paid) {
    if (args.simsLast24h >= PAID_SIMULATIONS_PER_DAY) {
      return {
        allowed: false,
        code: "daily-cap",
        message: `You have run ${PAID_SIMULATIONS_PER_DAY} simulations in the last 24 hours. Please come back tomorrow.`,
      };
    }
    return { allowed: true, plan: "paid" };
  }
  if (!args.freeUsed) return { allowed: true, plan: "free" };
  return {
    allowed: false,
    code: "upgrade",
    message: "You have used your free simulation. Choose a package to unlock the sandbox.",
  };
}

/** Escapes % and _ so an email can be matched exactly with a case-insensitive LIKE. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Comma-separated list of emails (for example the owner) that always get paid access. */
export function isAllowlisted(email: string, list: string | undefined): boolean {
  if (!list) return false;
  const target = email.trim().toLowerCase();
  return list
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(target);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);
