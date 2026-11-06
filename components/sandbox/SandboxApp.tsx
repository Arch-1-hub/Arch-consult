"use client";

import { useEffect, useRef, useState } from "react";
import WizardShell from "@/components/shared/WizardShell";
import { PageAccess, Plan } from "@/lib/sandbox/entitlement";
import { RuleNote, TaxStatus } from "@/lib/sandbox/nigeria-rules";
import { cloneInputs, getPreset, PRESETS } from "@/lib/sandbox/presets";
import { isStepValid, TOTAL_STEPS } from "@/lib/sandbox/step-rules";
import { SimulationInputs, SimulationResult } from "@/lib/sandbox/types";
import Button from "@/components/ui/Button";
import AccessGate from "./AccessGate";
import Dashboard from "./Dashboard";
import { Patch, StepBusiness, StepCosts, StepCustomers, StepMoney, StepOffer, StepReview } from "./steps";

const BLANK = (): SimulationInputs => cloneInputs((getPreset("custom") ?? PRESETS[PRESETS.length - 1]).inputs);

export default function SandboxApp({ access }: { access: PageAccess }) {
  const [step, setStep] = useState(1);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [stateName, setStateName] = useState("");
  const [inputs, setInputs] = useState<SimulationInputs>(BLANK);
  const [status, setStatus] = useState<TaxStatus>("company");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [notes, setNotes] = useState<RuleNote[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [gate, setGate] = useState<PageAccess | null>(null);
  const [simulationId, setSimulationId] = useState("");
  const [plan, setPlan] = useState<Plan>("paid");
  const topRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  // Bring the top of the card into view when the step or the results change.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ block: "start" });
  }, [step, result]);

  const update: Patch = (patch) => setInputs((prev) => ({ ...prev, ...patch }));

  function pickPreset(id: string) {
    const preset = getPreset(id);
    if (!preset) return;
    setPresetId(id);
    setInputs((prev) => ({ ...cloneInputs(preset.inputs), businessName: prev.businessName }));
  }

  const businessLabel = presetId ? getPreset(presetId)?.label ?? "Your business" : "Your business";
  const valid = isStepValid(step, { presetId, stateName, inputs });

  const ctx = { status, professionalServices: presetId === "professional-services" };

  async function next() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    setErrors([]);
    setRunning(true);
    try {
      const res = await fetch("/api/sandbox/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs, ctx, stateName, businessType: presetId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.result) {
        setNotes(data.notes ?? []);
        setSimulationId(data.simulationId);
        setPlan(data.plan === "free" ? "free" : "paid");
        setResult(data.result);
      } else if (data.code === "anon") {
        setGate({ kind: "anon" });
      } else if (data.code === "unverified") {
        setGate({ kind: "unverified" });
      } else if (data.code === "upgrade") {
        setGate({ kind: "upgrade" });
      } else {
        setErrors([data.error || "Something went wrong running the simulation."]);
      }
    } catch {
      setErrors(["Couldn't reach the server. Check your connection and try again."]);
    } finally {
      setRunning(false);
    }
  }

  function back() {
    if (step > 1) setStep(step - 1);
  }

  if (gate || access.kind !== "ready") {
    return <AccessGate access={gate ?? access} />;
  }

  if (result) {
    return (
      <div ref={topRef} className="mx-auto w-full max-w-5xl">
        <Dashboard
          result={result}
          businessLabel={businessLabel}
          stateName={stateName}
          notes={notes}
          ctx={ctx}
          onEdit={() => {
            setResult(null);
            setStep(TOTAL_STEPS);
          }}
          simulationId={simulationId}
        />
        {plan === "free" ? (
          <div className="mt-10 flex flex-col gap-3 border border-gold p-5 print:hidden">
            <p className="text-sm text-paper-white">
              That was your free simulation. Starter and every higher package include unlimited simulations, the Scenario Lab and the AI advisor.
            </p>
            <Button href="/pricing" variant="primary" showArrow>
              See packages
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={topRef} className="mx-auto w-full max-w-2xl">
      <p className="mb-8 text-xs text-ash">
        About five minutes. Your answers stay in this browser tab and are not saved anywhere.
      </p>
      <WizardShell
        step={step}
        totalSteps={TOTAL_STEPS}
        onBack={back}
        onNext={next}
        nextLabel={step === TOTAL_STEPS ? "Run the simulation" : "Next"}
        nextDisabled={!valid}
        loading={running}
      >
        {step === 1 && (
          <StepBusiness
            presetId={presetId}
            onPickPreset={pickPreset}
            stateName={stateName}
            onState={setStateName}
            name={inputs.businessName ?? ""}
            onName={(v) => update({ businessName: v })}
          />
        )}
        {step === 2 && <StepMoney inputs={inputs} update={update} />}
        {step === 3 && <StepOffer inputs={inputs} update={update} />}
        {step === 4 && <StepCustomers inputs={inputs} update={update} />}
        {step === 5 && <StepCosts inputs={inputs} update={update} />}
        {step === 6 && (
          <StepReview
            inputs={inputs}
            update={update}
            businessLabel={businessLabel}
            stateName={stateName}
            errors={errors}
            status={status}
            onStatus={setStatus}
          />
        )}
      </WizardShell>
    </div>
  );
}
