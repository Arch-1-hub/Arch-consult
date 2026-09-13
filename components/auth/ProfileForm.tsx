"use client";

import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { updateProfile, type AuthState } from "@/lib/actions/auth";

const initialState: AuthState = {};

export default function ProfileForm({
  email,
  fullName,
  businessName,
}: {
  email: string;
  fullName: string;
  businessName: string;
}) {
  const [state, formAction] = useFormState(updateProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-sm text-paper-white">
        Email
        <input
          value={email}
          disabled
          className="border border-ink-line bg-ink-soft px-4 py-3 text-sm text-ash outline-none"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-paper-white">
        Full name
        <input
          name="fullName"
          defaultValue={fullName}
          required
          className="border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none focus-visible:border-gold"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-paper-white">
        Business name
        <input
          name="businessName"
          defaultValue={businessName}
          className="border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none focus-visible:border-gold"
        />
      </label>

      {state.error && (
        <div className="flex items-start gap-2 border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="flex items-start gap-2 border border-gold/30 bg-ink-soft p-4 text-sm text-ash">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-gold" />
          {state.success}
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
      className="mt-2 w-fit inline-flex items-center justify-center gap-2 bg-gold px-6 py-3 text-sm font-medium text-ink transition-colors duration-200 ease-arch hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      {pending ? "Saving..." : "Save Changes"}
    </button>
  );
}
