import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Call at the top of every admin-ONLY page/layout. */
export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");
  return { supabase, user, profile };
}

/** Call at the top of a page shared by admins AND consultants. */
export async function requireStaff() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "consultant") {
    redirect("/dashboard");
  }
  return { supabase, user, profile, isAdmin: profile.role === "admin" };
}

/** For API routes: null if not admin. */
export async function getAdminOrNull() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? { supabase, user } : null;
}

/** For API routes: null if not admin or consultant. */
export async function getStaffOrNull() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "consultant") return null;
  return { supabase, user, isAdmin: profile.role === "admin" };
}
