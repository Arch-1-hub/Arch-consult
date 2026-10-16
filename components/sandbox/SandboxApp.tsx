"use client";

import { useEffect, useRef, useState } from "react";
import WizardShell from "@/components/shared/WizardShell";
import { SimulationInputError, simulate } from "@/lib/sandbox/engine";
import { cloneInputs, getPreset, PRESETS } from "@/lib/sandbox/presets";
import { isStepValid, TOTAL_STEPS } from "@/lib/sandbox/step-rules";
import { SimulationInputs, SimulationResult } from "@/lib/sandbox/types";
import Dashboard from "./Dashboard";
import { Patch, StepBusiness, StepCosts, StepCustomers, StepMoney, StepOffer, StepReview } from "./steps";

const BLANK = (): SimulationInputs => cloneInputs((getPreset("custom") ?? PRESETS[PRESETS.length - 1]).inputs);

export default function SandboxApp() {
  const [step, setStep] = useState(1);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [stateName, setStateName] = useState("");
  const [inputs, setInputs] = useState<SimulationInputs>(BLANK);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
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

  function next() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    try {
      setErrors([]);
      setResult(simulate(inputs));
    } catch (e) {
      setErrors(e instanceof SimulationInputError ? e.errors : ["Something went wrong running the simulation."]);
    }
  }

  function back() {
    if (step > 1) setStep(step - 1);
  }

  function restart() {
    setResult(null);
    setErrors([]);
    setPresetId(null);
    setStateName("");
    setInputs(BLANK());
    setStep(1);
  }

  if (result) {
    return (
      <div ref={topRef} className="mx-auto w-full max-w-5xl">
        <Dashboard
          result={result}
          businessLabel={businessLabel}
          stateName={stateName}
          onEdit={() => {
            setResult(null);
            setStep(TOTAL_STEPS);
          }}
          onRestart={restart}
        />
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
          />
        )}
      </WizardShell>
    </div>
  );
}
