import { createAdminClient } from "@/lib/supabase/admin";
import { ENTITLING_ITEM_TYPES } from "../entitlement";
import { RuleContext } from "../nigeria-rules";
import { BusinessProfile, emptyProfile, sanitizeProfile } from "../profile";
import { getPreset } from "../presets";
import { SimulationInputs } from "../types";
import { decideRecipients, Recipient, SimRow } from "./audience";

type Db = ReturnType<typeof createAdminClient>;

/** Everyone who should currently receive a briefing. Throws if the database is not ready. */
export async function loadRecipients(db: Db): Promise<Recipient[]> {
  const since = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
  const sims = await db
    .from("sandbox_simulations")
    .select("id, user_id, state_name, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(10000);
  if (sims.error) throw sims.error;
  const rows = (sims.data ?? []) as SimRow[];

  const pay = await db
    .from("payments")
    .select("user_id, customer_email")
    .eq("status", "successful")
    .in("item_type", [...ENTITLING_ITEM_TYPES])
    .limit(10000);
  if (pay.error) throw pay.error;
  const paidUserIds = new Set<string>();
  const paidEmails = new Set<string>();
  for (const p of pay.data ?? []) {
    if (p.user_id) paidUserIds.add(p.user_id);
    if (p.customer_email) paidEmails.add(String(p.customer_email).trim().toLowerCase());
  }

  const optouts = await loadOptouts(db);

  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  const users: Record<string, { email?: string | null; confirmed: boolean }> = {};
  for (let i = 0; i < ids.length; i += 10) {
    await Promise.all(
      ids.slice(i, i + 10).map(async (id) => {
        const { data } = await db.auth.admin.getUserById(id);
        if (data?.user) users[id] = { email: data.user.email, confirmed: Boolean(data.user.email_confirmed_at) };
      }),
    );
  }

  return decideRecipients({ sims: rows, users, paidUserIds, paidEmails, allowlist: process.env.SANDBOX_FREE_ACCESS_EMAILS, optouts });
}

export async function loadOptouts(db: Db): Promise<Set<string>> {
  const opt = await db.from("sandbox_email_optouts").select("email").limit(100000);
  if (opt.error) throw opt.error;
  return new Set((opt.data ?? []).map((o) => String(o.email).toLowerCase()));
}

export interface SimDetails {
  inputs: SimulationInputs;
  ctx: RuleContext;
  state: string;
  profile: BusinessProfile;
}

/** One saved simulation, with a usable profile even for older simulations made before the profile form existed. */
export async function loadSim(db: Db, simId: string, userId?: string): Promise<SimDetails | null> {
  let q = db.from("sandbox_simulations").select("inputs, ctx, state_name, profile, business_type, user_id").eq("id", simId);
  if (userId) q = q.eq("user_id", userId);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  if (!data) return null;
  let profile = sanitizeProfile(data.profile);
  if (!profile) {
    const preset = data.business_type ? getPreset(String(data.business_type)) : undefined;
    const inputs = data.inputs as SimulationInputs;
    const names = (inputs.products ?? []).map((p) => p.name).filter(Boolean).join(", ");
    profile = {
      ...emptyProfile(),
      description: preset ? `${preset.label}. ${preset.description}. ${names}`.trim() : names || "A small business",
      customers: "Customers in my area",
      area: "",
    };
  }
  return { inputs: data.inputs as SimulationInputs, ctx: data.ctx as RuleContext, state: String(data.state_name ?? ""), profile };
}
