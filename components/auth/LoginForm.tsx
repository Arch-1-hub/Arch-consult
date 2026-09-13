"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { signIn, type AuthState } from "@/lib/actions/auth";

const initialState: AuthState = {};

export default function LoginForm() {
  const [state, formAction] = useFormState(signIn, initialState);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/account";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />

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

      <label className="flex flex-col gap-2 text-sm text-paper-white">
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none focus-visible:border-gold"
        />
      </label>

      <div className="text-right">
        <Link href="/reset-password" className="text-xs text-ash hover:text-gold">
          Forgot password?
        </Link>
      </div>

      {state.error && (
        <div className="flex items-start gap-2 border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}

      <SubmitButton />

      <p className="text-center text-sm text-ash">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-gold hover:text-gold-light">
          Create one
        </Link>
      </p>
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
      {pending ? "Logging in..." : "Log In"}
    </button>
  );
}
