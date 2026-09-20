import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type InitiatePayload = {
  itemType: "package" | "consultation" | "service";
  itemName: string;
  amount: number;
  currency?: string;
  customerEmail: string;
  customerName: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const requests = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 10;

function isRateLimited(ip: string) {
  const now = Date.now();
  const timestamps = (requests.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  requests.set(ip, timestamps);
  return timestamps.length > MAX_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!secretKey || !supabaseConfigured) {
    return NextResponse.json(
      {
        error:
          "Payments aren't fully configured in this environment yet — a PAYSTACK_SECRET_KEY and/or Supabase service role key needs to be added.",
        setupRequired: true,
      },
      { status: 503 }
    );
  }

  let body: Partial<InitiatePayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.itemType || !body.itemName || typeof body.amount !== "number" || body.amount <= 0) {
    return NextResponse.json({ error: "Missing or invalid item details." }, { status: 400 });
  }
  if (!body.customerEmail || !EMAIL_RE.test(body.customerEmail)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!body.customerName || body.customerName.trim().length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const currency = body.currency || "NGN";
  const txRef = `arch-${randomUUID()}`;

  // Attach the logged-in user's id if there is a session, without
  // requiring one — guest checkout is allowed.
  const sessionClient = createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  const admin = createAdminClient();
  const { error: insertError } = await admin.from("payments").insert({
    user_id: user?.id ?? null,
    tx_ref: txRef,
    item_type: body.itemType,
    item_name: body.itemName,
    amount: body.amount,
    currency,
    status: "pending",
    customer_email: body.customerEmail,
    customer_name: body.customerName,
  });

  if (insertError) {
    console.error("[payments] Failed to create pending payment:", insertError);
    return NextResponse.json({ error: "Couldn't start checkout. Please try again." }, { status: 500 });
  }

  try {
    // Paystack amounts are in the smallest currency unit (kobo for NGN),
    // hence * 100. Our own `amount` column stays in whole NGN throughout.
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: body.customerEmail,
        amount: Math.round(body.amount * 100),
        currency,
        reference: txRef,
        callback_url: `${siteUrl}/payment/callback`,
        metadata: {
          item_name: body.itemName,
          customer_name: body.customerName,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status || !paystackData.data?.authorization_url) {
      console.error("[payments] Paystack initiate error:", paystackData);
      await admin.from("payments").update({ status: "failed" }).eq("tx_ref", txRef);
      return NextResponse.json(
        { error: "Couldn't start checkout with our payment provider. Please try again shortly." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, link: paystackData.data.authorization_url });
  } catch (err) {
    console.error("[payments] Unexpected error initiating payment:", err);
    await admin.from("payments").update({ status: "failed" }).eq("tx_ref", txRef);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
