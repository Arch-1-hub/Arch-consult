"use client";

import { FormEvent, useState } from "react";
import Button from "@/components/ui/Button";
import { ADVISOR_QUESTION_LIMIT, MAX_QUESTION_CHARS } from "@/lib/sandbox/advisor";

interface Turn {
  q: string;
  a: string;
}

const SUGGESTIONS = [
  "What is the biggest risk in this plan?",
  "What should I change first to improve my cash?",
  "How much extra capital would make this safe?",
  "Which scenario should worry me most, and why?",
];

export default function Advisor({ simulationId }: { simulationId: string }) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [left, setLeft] = useState(ADVISOR_QUESTION_LIMIT);

  async function ask(q: string) {
    const text = q.trim();
    if (!text || loading || left <= 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sandbox/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulationId, question: text, history: turns.slice(-4) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.answer) {
        if (data.code === "limit") setLeft(0);
        setError(data.error || "The advisor couldn't answer right now. Please try again.");
      } else {
        setTurns((t) => [...t, { q: text, a: data.answer }]);
        setLeft(typeof data.questionsLeft === "number" ? data.questionsLeft : left - 1);
        setQuestion("");
      }
    } catch {
      setError("Couldn't reach the advisor. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(question);
  }

  return (
    <section aria-labelledby="advisor-heading" className="flex flex-col gap-5 print:hidden">
      <div className="flex flex-col gap-2">
        <h3 id="advisor-heading" className="font-display text-xl text-paper-white">
          Ask the advisor
        </h3>
        <p className="text-sm text-ash">
          Ask about your results and what to do next. Answers come from this simulation only, so they are not forecasts or
          guarantees. {left > 0 ? `${left} of ${ADVISOR_QUESTION_LIMIT} questions left.` : "You have used all your questions."}
        </p>
      </div>

      {turns.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {turns.map((t, i) => (
            <li key={i} className="flex flex-col gap-2">
              <p className="text-sm text-gold-light">{t.q}</p>
              <div className="border-l-2 border-gold bg-ink-soft px-4 py-3">
                <span className="mb-1 block text-xs uppercase tracking-wide2 text-ash">Advisor · simulation-based</span>
                <p className="whitespace-pre-line text-sm leading-relaxed text-paper-white">{t.a}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {left > 0 ? (
        <>
          {turns.length === 0 ? (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void ask(s)}
                  disabled={loading}
                  className="border border-ink-line px-3 py-2 text-left text-xs text-paper-white transition-colors hover:border-gold disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <label htmlFor="advisor-question" className="sr-only">
              Your question
            </label>
            <textarea
              id="advisor-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={MAX_QUESTION_CHARS}
              rows={3}
              placeholder="For example: what happens if my rent doubles?"
              className="w-full border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none placeholder:text-ash/60 focus-visible:border-gold"
            />
            <button
              type="submit"
              disabled={loading || question.trim().length < 3}
              className="inline-flex w-fit items-center justify-center bg-gold px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Thinking…" : "Ask"}
            </button>
          </form>
        </>
      ) : (
        <div className="flex flex-col gap-3 border border-ink-line p-4">
          <p className="text-sm text-paper-white">Want to go deeper on your numbers with a person?</p>
          <Button href="/book-consultation" variant="primary" showArrow>
            Book a consultation
          </Button>
        </div>
      )}

      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </section>
  );
}
