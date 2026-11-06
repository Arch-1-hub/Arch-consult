import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { ENTITLING_ITEM_TYPES, escapeLike, FREE_SIMULATIONS, isAllowlisted, PageAccess, pageAccess } from "./entitlement";

export type Admin = ReturnType<typeof createAdminClient>;

export interface SandboxUser {
  id: string;
  email: string;
  verified: boolean;
}

/** The signed-in user from the session cookie, or null. Read-only: the middleware refreshes sessions. */
export async function getSandboxUser(): Promise<SandboxUser | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const store = cookies();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll() {
        /* not needed for a read-only check */
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return null;
  return { id: user.id, email: user.email, verified: Boolean(user.email_confirmed_at) };
}

export interface AccessState {
  paid: boolean;
  freeUsed: boolean;
  simsLast24h: number;
}

/** Looks up payments and past simulations. Throws if the database is not ready. */
export async function loadAccessState(admin: Admin, user: SandboxUser): Promise<AccessState> {
  let paid = isAllowlisted(user.email, process.env.SANDBOX_FREE_ACCESS_EMAILS);

  if (!paid) {
    const byUser = await admin
      .from("payments")
      .select("id")
      .eq("status", "successful")
      .in("item_type", [...ENTITLING_ITEM_TYPES])
      .eq("user_id", user.id)
      .limit(1);
    if (byUser.error) throw byUser.error;
    paid = (byUser.data?.length ?? 0) > 0;
  }

  if (!paid) {
    // Someone who paid as a guest is matched by their verified email address.
    const byEmail = await admin
      .from("payments")
      .select("id")
      .eq("status", "successful")
      .in("item_type", [...ENTITLING_ITEM_TYPES])
      .ilike("customer_email", escapeLike(user.email))
      .limit(1);
    if (byEmail.error) throw byEmail.error;
    paid = (byEmail.data?.length ?? 0) > 0;
  }

  const free = await admin
    .from("sandbox_simulations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("was_free", true);
  if (free.error) throw free.error;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recent = await admin
    .from("sandbox_simulations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if (recent.error) throw recent.error;

  return { paid, freeUsed: (free.count ?? 0) >= FREE_SIMULATIONS, simsLast24h: recent.count ?? 0 };
}

/** What the sandbox page should show the current visitor. */
export async function getPageAccess(): Promise<PageAccess> {
  try {
    const user = await getSandboxUser();
    if (!user) return { kind: "anon" };
    if (!user.verified) return { kind: "unverified", email: user.email };
    const state = await loadAccessState(createAdminClient(), user);
    return pageAccess({ signedIn: true, verified: true, email: user.email, paid: state.paid, freeUsed: state.freeUsed });
  } catch (err) {
    console.error("[sandbox] access check failed:", err);
    return { kind: "setup" };
  }
}
