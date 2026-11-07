import { Recipient } from "./audience";
import { BriefingRef, pickBriefing } from "./email";

export interface OutMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
}

export interface DeliveryStore {
  /** Emails already delivered for this briefing. */
  delivered(briefingId: string): Promise<Set<string>>;
  /** Reserves these emails; returns only the ones that were not already reserved. */
  claim(briefingId: string, emails: string[]): Promise<string[]>;
  release(briefingId: string, emails: string[]): Promise<void>;
}

export type Mailer = (messages: OutMessage[]) => Promise<{ ok: boolean; error?: string }>;

/** The people who should get this particular briefing. */
export function recipientsFor<T extends BriefingRef>(briefingId: string, all: T[], recipients: Recipient[]): Recipient[] {
  return recipients.filter((r) => pickBriefing(all, r.niche, r.state)?.id === briefingId);
}

export interface ChunkResult {
  sent: number;
  remaining: number;
  total: number;
  error?: string;
}

/** Sends one batch. Safe to call again and again: nobody is emailed twice. */
export async function deliverChunk(a: {
  briefingId: string;
  audience: Recipient[];
  store: DeliveryStore;
  mailer: Mailer;
  build: (r: Recipient) => OutMessage;
  limit: number;
  /** Called with the people about to be emailed, so per-person content can be loaded first. */
  prepare?: (chunk: Recipient[]) => Promise<void>;
}): Promise<ChunkResult> {
  const done = await a.store.delivered(a.briefingId);
  const todo = a.audience.filter((r) => !done.has(r.email));
  const chunk = todo.slice(0, a.limit);
  if (chunk.length === 0) return { sent: 0, remaining: 0, total: a.audience.length };

  const claimed = new Set(await a.store.claim(a.briefingId, chunk.map((r) => r.email)));
  const mine = chunk.filter((r) => claimed.has(r.email));
  if (mine.length === 0) return { sent: 0, remaining: todo.length - chunk.length, total: a.audience.length };

  try {
    if (a.prepare) await a.prepare(mine);
  } catch (e) {
    await a.store.release(a.briefingId, mine.map((r) => r.email));
    throw e;
  }
  const res = await a.mailer(mine.map(a.build));
  if (!res.ok) {
    await a.store.release(a.briefingId, mine.map((r) => r.email));
    return { sent: 0, remaining: todo.length, total: a.audience.length, error: res.error ?? "The email service refused the batch." };
  }
  return { sent: mine.length, remaining: todo.length - chunk.length, total: a.audience.length };
}
