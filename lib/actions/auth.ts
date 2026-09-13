"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; success?: string };

function notConfigured(): AuthState {
  return {
    error:
      "Accounts aren't fully configured in this environment yet — Supabase credentials need to be added. See the README for setup steps.",
  };
}

function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isConfigured()) return notConfigured();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("fullName") || "").trim();
  const businessName = String(formData.get("businessName") || "").trim();

  if (!email || !password || !fullName) {
    return { error: "Please fill in your name, email and password." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, business_name: businessName || null },
      emailRedirectTo: `${siteUrl}/login`,
    },
  });

  if (error) return { error: error.message };

  return {
    success:
      "Account created. Check your email for a confirmation link, then log in.",
  };
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isConfigured()) return notConfigured();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const redirectTo = String(formData.get("redirectTo") || "/account");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "Incorrect email or password." };

  redirect(redirectTo || "/account");
  return {};
}

export async function signOutAction() {
  if (!isConfigured()) redirect("/");
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isConfigured()) return notConfigured();

  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Please enter your email." };

  const supabase = createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/update-password`,
  });

  // Always return the same message whether or not the email exists, so we
  // don't leak which emails have accounts.
  return {
    success: "If an account exists for that email, a reset link has been sent.",
  };
}

export async function updateProfile(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isConfigured()) return notConfigured();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You need to be logged in to update your profile." };

  const fullName = String(formData.get("fullName") || "").trim();
  const businessName = String(formData.get("businessName") || "").trim();

  if (!fullName) return { error: "Name can't be empty." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, business_name: businessName || null })
    .eq("id", user.id);

  if (error) return { error: error.message };

  return { success: "Profile updated." };
}
