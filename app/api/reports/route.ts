import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const VALID_TYPES = ["health_check", "launch_plan", "ai_consultation"];

export async function POST(req: NextRequest) {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  if (!supabaseConfigured) {
    return NextResponse.json(
      { error: "Accounts aren't configured in this environment yet, so reports can't be saved." },
      { status: 503 }
    );
  }

  let body: { type?: string; title?: string; data?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: "Invalid report type." }, { status: 400 });
  }
  if (!body.title || !body.data) {
    return NextResponse.json({ error: "Missing report title or data." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please log in to save this report to your account.", requiresLogin: true },
      { status: 401 }
    );
  }

  const { error } = await supabase.from("reports").insert({
    user_id: user.id,
    type: body.type,
    title: body.title,
    data: body.data,
  });

  if (error) {
    console.error("[reports] Supabase insert error:", error);
    return NextResponse.json(
      { error: "Couldn't save your report right now. Please try again shortly." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
