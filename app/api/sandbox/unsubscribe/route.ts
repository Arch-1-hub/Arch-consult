import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailSecret, verifyEmailToken } from "@/lib/sandbox/briefing/unsubscribe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function read(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("e") ?? "").trim().toLowerCase();
  const token = req.nextUrl.searchParams.get("t") ?? "";
  return { email, token, ok: email.length > 3 && email.length < 255 && verifyEmailToken(email, token, emailSecret(process.env)) };
}

/** Mail apps call this (POST) when someone taps the built-in "Unsubscribe" button. It also serves the confirm button on our page. */
export async function POST(req: NextRequest) {
  const { email, ok } = read(req);
  if (!ok) return NextResponse.json({ ok: false, error: "This unsubscribe link is not valid." }, { status: 400 });
  try {
    const { error } = await createAdminClient().from("sandbox_email_optouts").upsert({ email }, { onConflict: "email", ignoreDuplicates: true });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[sandbox-unsubscribe] failed:", e);
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

/** Opening the link only shows the confirmation page, so mail scanners that pre-open links cannot unsubscribe anyone. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/sandbox/unsubscribe";
  return NextResponse.redirect(url);
}
