import { createHmac, timingSafeEqual } from "node:crypto";

export const DEFAULT_SITE_URL = "https://archbrandingconsult.online";

/** A signature that proves an unsubscribe link was made by us for exactly this address. */
export function signEmail(email: string, secret: string): string {
  return createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("hex").slice(0, 40);
}

export function verifyEmailToken(email: string, token: string, secret: string): boolean {
  if (!secret || typeof token !== "string" || token.length !== 40) return false;
  const expected = Buffer.from(signEmail(email, secret));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function unsubscribeUrl(siteUrl: string, email: string, secret: string): string {
  const e = encodeURIComponent(email.trim().toLowerCase());
  return `${siteUrl.replace(/\/+$/, "")}/sandbox/unsubscribe?e=${e}&t=${signEmail(email, secret)}`;
}

/** The one-click endpoint mail apps call directly. */
export function oneClickUrl(siteUrl: string, email: string, secret: string): string {
  const e = encodeURIComponent(email.trim().toLowerCase());
  return `${siteUrl.replace(/\/+$/, "")}/api/sandbox/unsubscribe?e=${e}&t=${signEmail(email, secret)}`;
}

/** Secret used to sign links. Set BRIEFING_SECRET in Vercel to use your own; otherwise a server-only key is reused. */
export function emailSecret(env: Record<string, string | undefined>): string {
  return env.BRIEFING_SECRET || env.SUPABASE_SERVICE_ROLE_KEY || "";
}
