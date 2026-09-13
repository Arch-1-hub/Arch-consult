"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import WizardShell from "@/components/shared/WizardShell";
import { TextField, TextAreaField, SelectField, RadioCardGroup } from "@/components/shared/WizardFields";
import { businessStages, scoredQuestions, computeScores } from "@/lib/health-check-data";
import HealthCheckReport from "./HealthCheckReport";

type Answers = {
  businessStage: string;
  industry: string;
  targetCustomer: string;
  revenueModel: string;
  challenges: string;
  growthGoals: string;
  [key: string]: string;
};

const TOTAL_STEPS = 10;

export default function HealthCheckWizard() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({
    businessStage: "",
    industry: "",
    targetCustomer: "",
    revenueModel: "",
    challenges: "",
    growthGoals: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    categoryScores: Record<string, number>;
    overall: number;
    recommendations: any;
    setupRequired?: boolean;
  } | null>(null);

  function set(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function isStepValid() {
    if (step === 1) return answers.businessStage && answers.industry;
    if (step === 2) return answers.targetCustomer && answers.revenueModel;
    if (step >= 3 && step <= 9) {
      const q = scoredQuestions[step - 3];
      return !!answers[q.key];
    }
    if (step === 10) return answers.challenges && answers.growthGoals;
    return true;
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    const { categoryScores, overall } = computeScores(answers);

    try {
      const res = await fetch("/api/health-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, categoryScores, overall }),
      });
      const json = await res.json();

      if (!res.ok) {
        // Scores are still real and computed client-side even if AI text fails.
        setResult({ categoryScores, overall, recommendations: null, setupRequired: json.setupRequired });
        setError(json.error);
        setLoading(false);
        return;
      }

      setResult({ categoryScores, overall, recommendations: json.recommendations });
    } catch {
      setResult({ categoryScores, overall, recommendations: null });
      setError("Network error — your scores are shown below, but recommendations couldn't be generated.");
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  }

  if (result) {
    return (
      <HealthCheckReport
        categoryScores={result.categoryScores}
        overall={result.overall}
        recommendations={result.recommendations}
        error={error}
        onReset={() => {
          setResult(null);
          setStep(1);
        }}
      />
    );
  }

  return (
    <WizardShell
      step={step}
      totalSteps={TOTAL_STEPS}
      onBack={() => setStep((s) => Math.max(1, s - 1))}
      onNext={handleNext}
      nextLabel={step === TOTAL_STEPS ? "Get My Health Check" : "Next"}
      nextDisabled={!isStepValid()}
      loading={loading}
    >
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <SelectField
            label="What stage is your business at?"
            value={answers.businessStage}
            onChange={(v) => set("businessStage", v)}
            options={businessStages}
          />
          <TextField
            label="Industry"
            value={answers.industry}
            onChange={(v) => set("industry", v)}
            placeholder="e.g. skincare retail, B2B SaaS, logistics"
          />
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-6">
          <TextAreaField
            label="Who is your target customer?"
            value={answers.targetCustomer}
            onChange={(v) => set("targetCustomer", v)}
            placeholder="Describe who you're trying to reach"
          />
          <TextAreaField
            label="What's your revenue model?"
            value={answers.revenueModel}
            onChange={(v) => set("revenueModel", v)}
            placeholder="How does the business make money?"
          />
        </div>
      )}

      {step >= 3 && step <= 9 && (
        <RadioCardGroup
          label={scoredQuestions[step - 3].label}
          value={answers[scoredQuestions[step - 3].key] || ""}
          onChange={(v) => set(scoredQuestions[step - 3].key, v)}
          options={scoredQuestions[step - 3].options}
        />
      )}

      {step === 10 && (
        <div className="flex flex-col gap-6">
          <TextAreaField
            label="What are your main challenges right now?"
            value={answers.challenges}
            onChange={(v) => set("challenges", v)}
            placeholder="What's holding the business back?"
          />
          <TextAreaField
            label="What are your growth goals?"
            value={answers.growthGoals}
            onChange={(v) => set("growthGoals", v)}
            placeholder="Where do you want the business to be?"
          />
        </div>
      )}

      {step === TOTAL_STEPS && error && (
        <div className="mt-4 flex items-start gap-2 border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
    </WizardShell>
  );
}
