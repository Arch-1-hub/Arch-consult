export interface OutMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
}

export interface SendRow {
  id: string;
  email: string;
}

export interface DispatchStore {
  /** Atomically takes up to `limit` approved, unsent briefings and marks them sent. Returns what it took. */
  claim(limit: number): Promise<SendRow[]>;
  /** Puts them back as approved so a failed batch can be retried. */
  revert(ids: string[]): Promise<void>;
  /** Marks briefings as not to be sent (for example the person unsubscribed). */
  drop(ids: string[]): Promise<void>;
  /** How many approved briefings are still waiting. */
  waiting(): Promise<number>;
}

export type Mailer = (messages: OutMessage[]) => Promise<{ ok: boolean; error?: string }>;

export interface DispatchResult {
  sent: number;
  remaining: number;
  error?: string;
}

/** Sends one batch of approved briefings. Safe to call again and again: nobody is emailed twice. */
export async function dispatchApproved(a: {
  store: DispatchStore;
  mailer: Mailer;
  /** Builds the email for one briefing, or null to skip it (for example, the person unsubscribed). */
  build: (row: SendRow) => Promise<OutMessage | null>;
  limit: number;
}): Promise<DispatchResult> {
  const taken = await a.store.claim(a.limit);
  if (taken.length === 0) return { sent: 0, remaining: 0 };

  const messages: OutMessage[] = [];
  const skipped: string[] = [];
  const sending: SendRow[] = [];
  try {
    for (const row of taken) {
      const m = await a.build(row);
      if (m) {
        messages.push(m);
        sending.push(row);
      } else skipped.push(row.id);
    }
  } catch (e) {
    await a.store.revert(taken.map((r) => r.id));
    throw e;
  }
  if (skipped.length) await a.store.drop(skipped);

  if (messages.length > 0) {
    const res = await a.mailer(messages);
    if (!res.ok) {
      await a.store.revert(sending.map((r) => r.id));
      return { sent: 0, remaining: await a.store.waiting(), error: res.error ?? "The email service refused the batch." };
    }
  }
  return { sent: messages.length, remaining: await a.store.waiting() };
}
