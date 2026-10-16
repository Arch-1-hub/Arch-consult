"use client";

import { ReactNode, useEffect, useState } from "react";

/* Same look as components/shared/WizardFields, plus number inputs and choice cards. */

const INPUT =
  "w-full border border-ink-line bg-ink py-3 text-sm text-paper-white outline-none placeholder:text-ash/60 focus-visible:border-gold";

function groupDigits(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatForInput(value: number, decimal: boolean): string {
  if (!Number.isFinite(value) || value === 0) return "";
  const [i, d] = String(value).split(".");
  return decimal && d !== undefined ? `${groupDigits(i)}.${d}` : groupDigits(i);
}

function parseText(text: string, decimal: boolean): number {
  const cleaned = text.replace(/,/g, "");
  const n = decimal ? parseFloat(cleaned) : parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : 0;
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
  decimal?: boolean;
  placeholder?: string;
}

/** Whole-number or decimal input that shows thousands separators and opens the number keypad on phones. */
export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
  decimal = false,
  placeholder = "0",
}: NumberFieldProps) {
  const [text, setText] = useState(() => formatForInput(value, decimal));

  // Keep the box in step when the value is changed from outside (for example by choosing a preset).
  useEffect(() => {
    if (parseText(text, decimal) !== value) setText(formatForInput(value, decimal));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimal]);

  function handle(raw: string) {
    let cleaned = raw.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, "");
    if (decimal) {
      const firstDot = cleaned.indexOf(".");
      if (firstDot !== -1) {
        cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
      }
    }
    const [i, d] = cleaned.split(".");
    const shown = d !== undefined ? `${groupDigits(i)}.${d}` : groupDigits(i);
    setText(shown);
    onChange(parseText(shown, decimal));
  }

  return (
    <label className="flex flex-col gap-2 text-sm text-paper-white">
      <span>{label}</span>
      <span className="relative block">
        {prefix ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ash">{prefix}</span>
        ) : null}
        <input
          type="text"
          inputMode={decimal ? "decimal" : "numeric"}
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          onChange={(e) => handle(e.target.value)}
          className={`${INPUT} ${prefix ? "pl-9" : "pl-4"} ${suffix ? "pr-10" : "pr-4"}`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ash">{suffix}</span>
        ) : null}
      </span>
      {hint ? <span className="text-xs text-ash">{hint}</span> : null}
    </label>
  );
}

interface PercentFieldProps {
  label: string;
  /** Stored as a fraction: 0.8 means 80%. */
  value: number;
  onChange: (fraction: number) => void;
  hint?: string;
}

export function PercentField({ label, value, onChange, hint }: PercentFieldProps) {
  const shown = Math.round(value * 10000) / 100;
  return (
    <NumberField
      label={label}
      value={shown}
      onChange={(n) => onChange(n / 100)}
      suffix="%"
      decimal
      hint={hint}
    />
  );
}

interface TextInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}

export function TextInput({ label, value, onChange, placeholder, hint }: TextInputProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-paper-white">
      <span>{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} px-4`}
      />
      {hint ? <span className="text-xs text-ash">{hint}</span> : null}
    </label>
  );
}

interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface ChoiceCardsProps<T extends string> {
  legend: string;
  value: T | null;
  onChange: (v: T) => void;
  options: ChoiceOption<T>[];
  columns?: 1 | 2 | 3;
}

/** Radio buttons styled as selectable cards. Fully keyboard and screen-reader friendly. */
export function ChoiceCards<T extends string>({ legend, value, onChange, options, columns = 1 }: ChoiceCardsProps<T>) {
  const grid = columns === 3 ? "sm:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : "";
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm text-paper-white">{legend}</legend>
      <div className={`grid grid-cols-1 gap-3 ${grid}`}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <label
              key={o.value}
              className={`flex cursor-pointer flex-col gap-1 border px-4 py-3 text-sm transition-colors focus-within:border-gold ${
                selected ? "border-gold text-paper-white" : "border-ink-line text-ash hover:border-ash"
              }`}
            >
              <input
                type="radio"
                name={legend}
                value={o.value}
                checked={selected}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <span className={selected ? "text-paper-white" : "text-paper-white/90"}>{o.label}</span>
              {o.description ? <span className="text-xs text-ash">{o.description}</span> : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function StepHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-display text-2xl text-paper-white">{title}</h2>
      {children ? <p className="text-sm leading-relaxed text-ash">{children}</p> : null}
    </div>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-paper-white">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-gold"
      />
      <span className="flex flex-col gap-1">
        <span>{label}</span>
        {hint ? <span className="text-xs text-ash">{hint}</span> : null}
      </span>
    </label>
  );
}
