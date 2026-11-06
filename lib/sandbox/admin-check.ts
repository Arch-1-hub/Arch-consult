import { createClient } from "@/lib/supabase/server";

/** For API routes: the signed-in admin, or null. (Pages use requireAdmin from lib/admin.ts.) */
export async function getAdminUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}
