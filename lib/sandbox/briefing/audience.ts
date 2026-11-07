import { isAllowlisted } from "../entitlement";

export interface Recipient {
  userId: string;
  email: string;
  niche: string;
  state: string;
}

export interface SimRow {
  user_id: string;
  business_type: string | null;
  state_name: string | null;
  created_at: string;
}

/**
 * Who should get briefings: verified, paying people who have run a simulation with a known
 * business type, using their most recent simulation. Unsubscribed addresses are left out.
 */
export function decideRecipients(a: {
  sims: SimRow[];
  users: Record<string, { email?: string | null; confirmed: boolean } | undefined>;
  paidUserIds: Set<string>;
  paidEmails: Set<string>;
  allowlist?: string;
  optouts: Set<string>;
  validNiches: Set<string>;
}): Recipient[] {
  const latest = new Map<string, SimRow>();
  for (const s of a.sims) {
    if (!s.business_type || !a.validNiches.has(s.business_type)) continue;
    const have = latest.get(s.user_id);
    if (!have || s.created_at > have.created_at) latest.set(s.user_id, s);
  }

  const seen = new Set<string>();
  const out: Recipient[] = [];
  for (const [userId, sim] of Array.from(latest.entries())) {
    const u = a.users[userId];
    const email = u?.email?.trim().toLowerCase();
    if (!u || !email || !u.confirmed) continue;
    if (a.optouts.has(email) || seen.has(email)) continue;
    const paid = a.paidUserIds.has(userId) || a.paidEmails.has(email) || isAllowlisted(email, a.allowlist);
    if (!paid) continue;
    seen.add(email);
    out.push({ userId, email, niche: sim.business_type as string, state: (sim.state_name ?? "").trim() });
  }
  return out;
}
