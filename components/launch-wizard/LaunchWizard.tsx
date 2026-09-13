"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import WizardShell from "@/components/shared/WizardShell";
import { TextField, TextAreaField } from "@/components/shared/WizardFields";
import LaunchPlanReport from "./LaunchPlanReport";

type Answers = {
  businessIdea: string;
  industry: string;
  location: string;
  targetCustomers: string;
  problem: string;
  productService: string;
  pricing: string;
  competitors: string;
  goals: string;
  resources: string;
};

const TOTAL_STEPS = 5;

export default function LaunchWizard() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({
    businessIdea: "",
    industry: "",
    location: "",
    targetCustomers: "",
    problem: "",
    productService: "",
    pricing: "",
    competitors: "",
    goals: "",
    resources: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<any | null>(null);

  function set(key: keyof Answers, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function isStepValid() {
    if (step === 1) return answers.businessIdea && answers.industry;
    if (step === 2) return answers.location && answers.targetCustomers;
    if (step === 3) return answers.problem && answers.productService;
    if (step === 4) return answers.pricing;
    if (step === 5) return answers.goals;
    return true;
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/launch-wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setPlan(json.plan);
    } catch {
      setError("Network error — please check your connection and try again.");
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

  if (plan) {
    return (
      <LaunchPlanReport
        plan={plan}
        onReset={() => {
          setPlan(null);
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
      nextLabel={step === TOTAL_STEPS ? "Generate My Launch Plan" : "Next"}
      nextDisabled={!isStepValid()}
      loading={loading}
    >
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <TextAreaField
            label="What's your business idea?"
            value={answers.businessIdea}
            onChange={(v) => set("businessIdea", v)}
            placeholder="Describe the idea in your own words"
          />
          <TextField
            label="Industry"
            value={answers.industry}
            onChange={(v) => set("industry", v)}
            placeholder="e.g. skincare, logistics, SaaS"
          />
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-6">
          <TextField
            label="Location"
            value={answers.location}
            onChange={(v) => set("location", v)}
            placeholder="Where will you operate?"
          />
          <TextAreaField
            label="Who are your target customers?"
            value={answers.targetCustomers}
            onChange={(v) => set("targetCustomers", v)}
            placeholder="Describe who you're building this for"
          />
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-6">
          <TextAreaField
            label="What problem are you solving?"
            value={answers.problem}
            onChange={(v) => set("problem", v)}
            placeholder="What frustration or gap does this address?"
          />
          <TextAreaField
            label="What's your product or service?"
            value={answers.productService}
            onChange={(v) => set("productService", v)}
            placeholder="What exactly will you sell?"
          />
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-6">
          <TextField
            label="Pricing"
            value={answers.pricing}
            onChange={(v) => set("pricing", v)}
            placeholder="What will you charge, or how are you thinking about it?"
          />
          <TextAreaField
            label="Who are your competitors? (optional)"
            value={answers.competitors}
            onChange={(v) => set("competitors", v)}
            placeholder="Direct or indirect alternatives customers might use instead"
          />
        </div>
      )}

      {step === 5 && (
        <div className="flex flex-col gap-6">
          <TextAreaField
            label="What are your goals?"
            value={answers.goals}
            onChange={(v) => set("goals", v)}
            placeholder="What does success look like in the first year?"
          />
          <TextAreaField
            label="What resources do you have available? (optional)"
            value={answers.resources}
            onChange={(v) => set("resources", v)}
            placeholder="Budget, team, time, existing assets"
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
