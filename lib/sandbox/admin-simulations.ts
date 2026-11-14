import { createAdminClient } from "@/lib/supabase/admin";
import { growthFacts, GrowthFacts } from "./briefing/growth";
import { SimulationInputs } from "./types";
import { RuleContext } from "./nigeria-rules";
import { BusinessProfile, sanitizeProfile } from "./profile";

type Db = ReturnType<typeof createAdminClient>;

export interface SimRow {
  id: string;
  email: string;
  businessName: string;
  state: string;
  area: string;
  createdAt: string;
  wasFree: boolean;
  facts: GrowthFacts | null;
  booked: boolean;
}

export interface SimDetail extends SimRow {
  profile: BusinessProfile | null;
  inputs: SimulationInputs;
}

const EMAIL_KEYS = ["email", "client_email", "customer_email", "user_email"];

/** Emails (lower case) that have asked for a booking, plus any simulation ids quoted in booking notes. */
async function bookingIndex(db: Db): Promise<{ emails: Set<string>; text: string }> {
  const emails = new Set<string>();
  let text = "";
  try {
    const { data } = await db.from("bookings").select("*").limit(5000);
    for (const row of (data ?? []) as Record<string, unknown>[]) {
      for (const k of EMAIL_KEYS) {
        const v = row[k];
        if (typeof v === "string" && v.includes("@")) emails.add(v.trim().toLowerCase());
      }
      for (const v of Object.values(row)) if (typeof v === "string" && v.length > 20) text += `${v}\n`;
    }
  } catch {
    /* bookings table unreadable: show "not booked" rather than failing the page */
  }
  return { emails, text };
}

async function emailsFor(db: Db, ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (let i = 0; i < ids.length; i += 10) {
    await Promise.all(
      ids.slice(i, i + 10).map(async (id) => {
        try {
          const { data } = await db.auth.admin.getUserById(id);
          if (data?.user?.email) out[id] = data.user.email;
        } catch {
          /* leave blank */
        }
      }),
    );
  }
  return out;
}

interface Raw {
  id: string;
  user_id: string;
  inputs: SimulationInputs;
  ctx: RuleContext;
  state_name: string | null;
  profile: unknown;
  was_free: boolean | null;
  created_at: string;
}

function toRow(r: Raw, email: string, idx: { emails: Set<string>; text: string }): SimDetail {
  let facts: GrowthFacts | null = null;
  try {
    facts = growthFacts(r.inputs, r.ctx);
  } catch {
    facts = null;
  }
  const profile = sanitizeProfile(r.profile);
  return {
    id: r.id,
    email,
    businessName: r.inputs?.businessName?.trim() || profile?.description?.slice(0, 60) || "(no name)",
    state: r.state_name ?? "",
    area: profile?.area ?? "",
    createdAt: r.created_at,
    wasFree: Boolean(r.was_free),
    facts,
    booked: (email !== "" && idx.emails.has(email.toLowerCase())) || idx.text.includes(r.id),
    profile,
    inputs: r.inputs,
  };
}

const COLS = "id, user_id, inputs, ctx, state_name, profile, was_free, created_at";

export async function listSimulations(db: Db, limit = 200): Promise<SimRow[]> {
  const { data, error } = await db.from("sandbox_simulations").select(COLS).order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  const rows = (data ?? []) as unknown as Raw[];
  const [emails, idx] = await Promise.all([emailsFor(db, Array.from(new Set(rows.map((r) => r.user_id)))), bookingIndex(db)]);
  return rows.map((r) => toRow(r, emails[r.user_id] ?? "", idx));
}

export async function getSimulation(db: Db, id: string): Promise<SimDetail | null> {
  const { data, error } = await db.from("sandbox_simulations").select(COLS).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as unknown as Raw;
  const [emails, idx] = await Promise.all([emailsFor(db, [r.user_id]), bookingIndex(db)]);
  return toRow(r, emails[r.user_id] ?? "", idx);
}
