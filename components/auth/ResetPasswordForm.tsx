"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { requestPasswordReset, type AuthState } from "@/lib/actions/auth";

const initialState: AuthState = {};

export default function ResetPasswordForm() {
  const [state, formAction] = useFormState(requestPasswordReset, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-start gap-3 border border-ink-line bg-ink-soft p-8">
        <CheckCircle2 className="text-gold" size={28} strokeWidth={1.5} />
        <p className="text-sm leading-relaxed text-ash">{state.success}</p>
        <Link href="/login" className="mt-2 text-sm text-gold hover:text-gold-light">
          Back to login →
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-sm text-paper-white">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none focus-visible:border-gold"
        />
      </label>

      {state.error && (
        <div className="flex items-start gap-2 border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex items-center justify-center gap-2 bg-gold px-6 py-3.5 text-sm font-medium text-ink transition-colors duration-200 ease-arch hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      {pending ? "Sending..." : "Send Reset Link"}
    </button>
  );
}
