import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type BookingPayload = {
  consultationType: string;
  preferredDate: string;
  preferredTime: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  goals?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Basic in-memory rate limiting per server instance — same caveat as the
// contact form: not durable across deploys/instances, good enough to stop
// trivial spam for now.
const submissions = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 5;

function isRateLimited(ip: string) {
  const now = Date.now();
  const timestamps = (submissions.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  submissions.set(ip, timestamps);
  return timestamps.length > MAX_PER_WINDOW;
}

function validate(body: Partial<BookingPayload>): string | null {
  if (!body.consultationType) return "Please select a consultation type.";
  if (!body.preferredDate) return "Please select a date.";
  if (!body.preferredTime) return "Please select a time.";
  if (!body.name || body.name.trim().length < 2) return "Please enter your name.";
  if (!body.email || !EMAIL_RE.test(body.email)) return "Please enter a valid email address.";

  const chosenDate = new Date(body.preferredDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(chosenDate.getTime()) || chosenDate < today) {
    return "Please choose a valid, upcoming date.";
  }
  if (body.name.length > 200 || (body.goals && body.goals.length > 2000)) {
    return "One of the fields is too long.";
  }
  return null;
}

function sanitize(value: string) {
  return value.replace(/[<>]/g, "").trim();
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many booking attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: Partial<BookingPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (!supabaseConfigured) {
    console.log("[bookings] New booking (database not configured):", body);
    return NextResponse.json({
      ok: true,
      saved: false,
      message:
        "Your booking request was received, but the database isn't configured yet in this environment, so it hasn't been saved. It has been logged server-side.",
    });
  }

  const payload = {
    consultation_type: sanitize(body.consultationType!),
    preferred_date: body.preferredDate!,
    preferred_time: sanitize(body.preferredTime!),
    name: sanitize(body.name!),
    email: sanitize(body.email!),
    phone: body.phone ? sanitize(body.phone) : null,
    business_name: body.businessName ? sanitize(body.businessName) : null,
    goals: body.goals ? sanitize(body.goals) : null,
  };

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("bookings").insert({
      ...payload,
      user_id: user?.id ?? null,
    });

    if (error) {
      console.error("[bookings] Supabase insert error:", error);
      return NextResponse.json(
        { error: "Couldn't save your booking right now. Please try again shortly." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, saved: true });
  } catch (err) {
    console.error("[bookings] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong saving your booking. Please try again." },
      { status: 500 }
    );
  }
}
