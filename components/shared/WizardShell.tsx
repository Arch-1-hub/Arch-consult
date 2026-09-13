"use client";

import { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function WizardShell({
  step,
  totalSteps,
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  loading = false,
  children,
}: {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center justify-between text-xs text-ash">
          <span>
            Step {step} of {totalSteps}
          </span>
          <span>{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <div className="mt-2 h-1 w-full bg-ink-line">
          <div
            className="h-full bg-gold transition-all duration-300 ease-arch"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="min-h-[280px]">{children}</div>

      <div className="flex items-center justify-between border-t border-ink-line pt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={step === 1}
          className="flex items-center gap-1.5 text-sm text-ash transition-colors hover:text-paper-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled || loading}
          className="flex items-center gap-2 bg-gold px-6 py-3 text-sm font-medium text-ink transition-colors duration-200 ease-arch hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Generating..." : nextLabel}
          {!loading && step < totalSteps && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}
