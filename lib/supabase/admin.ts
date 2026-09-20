import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses Row Level Security entirely.
 *
 * ONLY import this from server-only code (API routes, Server Components
 * that never render client-supplied data unchecked). NEVER import this
 * from a "use client" file, and never send its results directly back to
 * the browser without deciding what's safe to expose.
 *
 * Used specifically for the payments flow, where the server itself is
 * the only thing allowed to mark a payment successful — that decision
 * must never depend on (or be bypassable via) a client's RLS-scoped
 * session.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service role is not configured.");
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
