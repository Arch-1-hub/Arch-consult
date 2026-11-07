import { OutMessage } from "./deliver";

/** Sends up to 100 emails in one request through Resend's batch endpoint. */
export async function sendBatch(args: {
  apiKey: string;
  from: string;
  replyTo?: string;
  messages: OutMessage[];
  fetchImpl?: typeof fetch;
}): Promise<{ ok: boolean; error?: string }> {
  const f = args.fetchImpl ?? fetch;
  try {
    const res = await f("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${args.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(
        args.messages.map((m) => ({
          from: args.from,
          to: [m.to],
          subject: m.subject,
          html: m.html,
          text: m.text,
          headers: m.headers,
          ...(args.replyTo ? { reply_to: args.replyTo } : {}),
        }))
      ),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[briefing-email] Resend error:", res.status, body.slice(0, 300));
      return { ok: false, error: `Email service returned ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[briefing-email] Network error:", e);
    return { ok: false, error: "Could not reach the email service." };
  }
}
