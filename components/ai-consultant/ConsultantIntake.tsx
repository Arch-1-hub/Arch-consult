"use client";

import { useState, FormEvent } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import ConsultantReport, { type Report } from "./ConsultantReport";

type Status = "idle" | "loading" | "success" | "error";

const businessStages = [
  "Just an idea, not yet trading",
  "Early stage — first customers",
  "Established — steady revenue",
  "Scaling — growing fast",
];

const budgetStages = [
  "Bootstrapped / minimal budget",
  "Small budget available",
  "Moderate budget for strategy & branding",
  "Well-funded / enterprise budget",
];

export default function ConsultantIntake() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const res = await fetch("/api/ai-consultant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(json.error || "Something went wrong. Please try again.");
        return;
      }

      setReport(json.report);
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Network error — please check your connection and try again.");
    }
  }

  if (status === "success" && report) {
    return <ConsultantReport report={report} onReset={() => setStatus("idle")} />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Field label="Business name (optional)" name="businessName" />

      <Field label="Industry" name="industry" required placeholder="e.g. skincare retail, B2B SaaS, logistics" />

      <SelectField label="Business stage" name="businessStage" options={businessStages} required />

      <TextArea
        label="Who are your target customers?"
        name="targetCustomers"
        required
        placeholder="Describe who you're trying to reach"
      />

      <TextArea
        label="What are your current challenges?"
        name="challenges"
        required
        placeholder="What's not working, or what's holding growth back?"
      />

      <TextArea
        label="What are your goals?"
        name="goals"
        required
        placeholder="Where do you want the business to be?"
      />

      <TextArea
        label="Current brand / marketing situation"
        name="brandMarketingSituation"
        required
        placeholder="What do you currently have — a logo, a website, social pages, none of the above?"
      />

      <SelectField label="Budget / stage" name="budgetStage" options={budgetStages} required />

      {status === "error" && error && (
        <div className="flex items-start gap-2 border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-2 inline-flex items-center justify-center gap-2 bg-gold px-6 py-3.5 text-sm font-medium text-ink transition-colors duration-200 ease-arch hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" && <Loader2 size={16} className="animate-spin" />}
        {status === "loading" ? "Analyzing your business..." : "Get My Assessment"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-paper-white">
      {label}
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none placeholder:text-ash/60 focus-visible:border-gold"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-paper-white">
      {label}
      <textarea
        name={name}
        required={required}
        placeholder={placeholder}
        rows={3}
        maxLength={2000}
        className="resize-none border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none placeholder:text-ash/60 focus-visible:border-gold"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  required = false,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-paper-white">
      {label}
      <select
        name={name}
        required={required}
        defaultValue=""
        className="border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none focus-visible:border-gold"
      >
        <option value="" disabled>
          Select an option
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
