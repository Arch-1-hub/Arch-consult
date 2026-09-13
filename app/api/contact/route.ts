import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  subject: string;
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Basic in-memory rate limiting per server instance. Not durable across
// deploys/instances — replace with a real store (Redis, DB) once the
// database stage is built. Good enough to stop trivial abuse for now.
const submissions = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_WINDOW = 5;

function isRateLimited(ip: string) {
  const now = Date.now();
  const timestamps = (submissions.get(ip) ?? []).filter(
    (t) => now - t < WINDOW_MS
  );
  timestamps.push(now);
  submissions.set(ip, timestamps);
  return timestamps.length > MAX_PER_WINDOW;
}

function validate(body: Partial<ContactPayload>): string | null {
  if (!body.name || body.name.trim().length < 2) return "Please enter your name.";
  if (!body.email || !EMAIL_RE.test(body.email)) return "Please enter a valid email address.";
  if (!body.subject || body.subject.trim().length < 2) return "Please enter a subject.";
  if (!body.message || body.message.trim().length < 10) return "Message must be at least 10 characters.";
  if (body.name.length > 200 || body.subject.length > 300 || body.message.length > 5000) {
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
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  let body: Partial<ContactPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const payload: ContactPayload = {
    name: sanitize(body.name!),
    email: sanitize(body.email!),
    phone: body.phone ? sanitize(body.phone) : undefined,
    company: body.company ? sanitize(body.company) : undefined,
    service: body.service ? sanitize(body.service) : undefined,
    subject: sanitize(body.subject!),
    message: sanitize(body.message!),
  };

  const resendKey = process.env.RESEND_API_KEY;
  const emailTo = process.env.EMAIL_FROM || "archbusinessline@gmail.com";

  if (!resendKey) {
    // No email provider configured yet. Log server-side so nothing is lost,
    // and tell the client honestly rather than pretending an email was sent.
    console.log("[contact] New submission (email delivery not configured):", payload);
    return NextResponse.json({
      ok: true,
      delivered: false,
      message:
        "Your message was received, but email delivery isn't configured yet in this environment. It has been logged server-side.",
    });
  }

  try {
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Arch Consult Website <${emailTo}>`,
        to: [emailTo],
        reply_to: payload.email,
        subject: `New contact form submission: ${payload.subject}`,
        text: [
          `Name: ${payload.name}`,
          `Email: ${payload.email}`,
          payload.phone ? `Phone: ${payload.phone}` : null,
          payload.company ? `Company: ${payload.company}` : null,
          payload.service ? `Service interested in: ${payload.service}` : null,
          "",
          payload.message,
        ]
          .filter(Boolean)
          .join("\n"),
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("[contact] Resend API error:", errText);
      return NextResponse.json(
        { error: "Message could not be delivered right now. Please try again shortly." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("[contact] Unexpected error sending email:", err);
    return NextResponse.json(
      { error: "Something went wrong sending your message. Please try again." },
      { status: 500 }
    );
  }
}
