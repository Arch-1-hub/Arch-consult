import { createAdminClient } from "@/lib/supabase/admin";
import { ENTITLING_ITEM_TYPES } from "../entitlement";
import { decideRecipients, Recipient, SimRow } from "./audience";
import { DeliveryStore } from "./deliver";
import { NICHES } from "./generate";

type Db = ReturnType<typeof createAdminClient>;

/** Everyone who should currently receive briefings. Throws if the database is not ready. */
export async function loadRecipients(db: Db): Promise<Recipient[]> {
  const since = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
  const sims = await db
    .from("sandbox_simulations")
    .select("user_id, business_type, state_name, created_at")
    .not("business_type", "is", null)
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

  const opt = await db.from("sandbox_email_optouts").select("email").limit(100000);
  if (opt.error) throw opt.error;
  const optouts = new Set((opt.data ?? []).map((o) => String(o.email).toLowerCase()));

  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  const users: Record<string, { email?: string | null; confirmed: boolean }> = {};
  for (let i = 0; i < ids.length; i += 10) {
    await Promise.all(
      ids.slice(i, i + 10).map(async (id) => {
        const { data } = await db.auth.admin.getUserById(id);
        if (data?.user) users[id] = { email: data.user.email, confirmed: Boolean(data.user.email_confirmed_at) };
      })
    );
  }

  return decideRecipients({
    sims: rows,
    users,
    paidUserIds,
    paidEmails,
    allowlist: process.env.SANDBOX_FREE_ACCESS_EMAILS,
    optouts,
    validNiches: new Set(NICHES.map((n) => n.id)),
  });
}

export function supabaseStore(db: Db): DeliveryStore {
  return {
    async delivered(briefingId) {
      const { data, error } = await db.from("sandbox_briefing_deliveries").select("email").eq("briefing_id", briefingId).limit(100000);
      if (error) throw error;
      return new Set((data ?? []).map((d) => String(d.email)));
    },
    async claim(briefingId, emails) {
      const { data, error } = await db
        .from("sandbox_briefing_deliveries")
        .upsert(emails.map((email) => ({ briefing_id: briefingId, email })), { onConflict: "briefing_id,email", ignoreDuplicates: true })
        .select("email");
      if (error) throw error;
      return (data ?? []).map((d) => String(d.email));
    },
    async release(briefingId, emails) {
      await db.from("sandbox_briefing_deliveries").delete().eq("briefing_id", briefingId).in("email", emails);
    },
  };
}
