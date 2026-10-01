"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

export type ThreadMessage = {
  id: string;
  sender_id: string;
  sender_role: "client" | "consultant" | "admin";
  body: string;
  created_at: string;
};

const roleLabel: Record<ThreadMessage["sender_role"], string> = {
  client: "Client",
  consultant: "Consultant",
  admin: "Arch Consult",
};

export default function MessageThread({
  clientId,
  currentUserId,
  initial,
  emptyHint,
}: {
  clientId: string;
  currentUserId: string;
  initial: ThreadMessage[];
  emptyHint?: string;
}) {
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, body }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(result.error || "Could not send that message.");
      } else {
        setMessages((m) => [...m, result.message]);
        setText("");
      }
    } catch {
      setError("Could not send — check your connection.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-ink-line bg-ink-soft">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-ash">{emptyHint || "No messages yet. Say hello."}</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                    mine ? "bg-gold text-ink" : "border border-ink-line bg-ink text-paper-white"
                  }`}
                >
                  {!mine && (
                    <p className="mb-1 text-xs font-medium text-gold">{roleLabel[m.sender_role]}</p>
                  )}
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-ink/70" : "text-ash"}`}>
                    {new Date(m.created_at).toLocaleString("en-NG", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-ink-line p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(e);
            }
          }}
          maxLength={4000}
          rows={1}
          placeholder="Write a message…"
          className="flex-1 resize-none rounded-md border border-ink-line bg-ink p-3 text-sm text-paper-white focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          aria-label="Send message"
          className="rounded-md border border-gold px-4 text-gold transition-colors hover:bg-gold hover:text-ink disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
      {error && <p className="px-3 pb-3 text-xs text-red-400">{error}</p>}
    </div>
  );
}
