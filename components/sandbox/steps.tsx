"use client";

import { Plus, Trash2 } from "lucide-react";
import { SelectField } from "@/components/shared/WizardFields";
import { naira, percent } from "@/lib/sandbox/format";
import { NIGERIAN_STATES } from "@/lib/sandbox/nigeria";
import { PRESETS } from "@/lib/sandbox/presets";
import { monthlyFixedCosts } from "@/lib/sandbox/step-rules";
import { TaxStatus } from "@/lib/sandbox/nigeria-rules";
import { SimulationInputs } from "@/lib/sandbox/types";
import { ChoiceCards, CheckboxField, NumberField, PercentField, StepHeader, TextInput } from "./fields";

export type Patch = (patch: Partial<SimulationInputs>) => void;

const MAX_PRODUCTS = 6;
const MAX_STAFF_ROLES = 8;

/* ---------- Step 1: your business ---------- */

export function StepBusiness({
  presetId,
  onPickPreset,
  stateName,
  onState,
  name,
  onName,
}: {
  presetId: string | null;
  onPickPreset: (id: string) => void;
  stateName: string;
  onState: (s: string) => void;
  name: string;
  onName: (s: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader title="What are you testing?">
        Pick the closest match. We fill the plan with example figures so you are not starting blank. They are
        examples only, and you replace every number with your own in the next steps.
      </StepHeader>
      <ChoiceCards
        legend="Type of business"
        value={presetId}
        onChange={onPickPreset}
        options={PRESETS.map((p) => ({ value: p.id, label: p.label, description: p.description }))}
        columns={2}
      />
      <SelectField label="Where will it operate?" value={stateName} onChange={onState} options={NIGERIAN_STATES} />
      <TextInput
        label="Business name (optional)"
        value={name}
        onChange={onName}
        placeholder="For your report"
      />
    </div>
  );
}

/* ---------- Step 2: money ---------- */

export function StepMoney({ inputs, update }: { inputs: SimulationInputs; update: Patch }) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader title="How much money are you putting in?">
        Be exact about what you can actually commit. The simulation starts with this cash and spends it as the
        business runs.
      </StepHeader>
      <NumberField
        label="Starting capital"
        prefix="₦"
        value={inputs.startingCapital}
        onChange={(n) => update({ startingCapital: n })}
        hint="All the cash you have available on day one."
      />
      <NumberField
        label="Setup costs before you open"
        prefix="₦"
        value={inputs.setupCosts}
        onChange={(n) => update({ setupCosts: n })}
        hint="Equipment, fit-out, registration, licences, deposits. This comes out of your capital."
      />
      <ChoiceCards
        legend="How far ahead should we look?"
        value={String(inputs.months) as "12" | "24" | "36"}
        onChange={(v) => update({ months: Number(v) })}
        options={[
          { value: "12", label: "12 months" },
          { value: "24", label: "24 months", description: "Recommended" },
          { value: "36", label: "36 months" },
        ]}
        columns={3}
      />
    </div>
  );
}

/* ---------- Step 3: what you sell ---------- */

export function StepOffer({ inputs, update }: { inputs: SimulationInputs; update: Patch }) {
  const setProduct = (idx: number, patch: Partial<SimulationInputs["products"][number]>) =>
    update({ products: inputs.products.map((p, i) => (i === idx ? { ...p, ...patch } : p)) });

  return (
    <div className="flex flex-col gap-6">
      <StepHeader title="What do you sell, and for how much?">
        Prices exclude VAT. Unit cost is what each sale costs you directly: ingredients, goods you buy to resell,
        packaging, or the cost of delivering a service.
      </StepHeader>

      {inputs.products.map((p, idx) => {
        const margin = p.unitPrice - p.unitCost;
        const marginPct = p.unitPrice > 0 ? margin / p.unitPrice : 0;
        return (
          <div key={idx} className="flex flex-col gap-4 border border-ink-line bg-ink-soft p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <TextInput
                  label={`Product or service ${idx + 1}`}
                  value={p.name}
                  onChange={(v) => setProduct(idx, { name: v })}
                  placeholder="Name"
                />
              </div>
              {inputs.products.length > 1 ? (
                <button
                  type="button"
                  aria-label={`Remove ${p.name || `product ${idx + 1}`}`}
                  onClick={() => update({ products: inputs.products.filter((_, i) => i !== idx) })}
                  className="mb-1 p-2 text-ash transition-colors hover:text-paper-white"
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberField
                label="Selling price"
                prefix="₦"
                value={p.unitPrice}
                onChange={(n) => setProduct(idx, { unitPrice: n })}
              />
              <NumberField
                label="Cost to you"
                prefix="₦"
                value={p.unitCost}
                onChange={(n) => setProduct(idx, { unitCost: n })}
              />
            </div>
            <NumberField
              label="Share of your sales"
              value={p.mix}
              decimal
              onChange={(n) => setProduct(idx, { mix: n })}
              hint="Any numbers work. If you sell 6 loaves for every 1 cake, put 6 and 1."
            />
            {p.unitPrice > 0 ? (
              <p className={`text-xs ${margin <= 0 ? "text-red-400" : "text-ash"}`}>
                {margin <= 0
                  ? `You lose ${naira(Math.abs(margin))} on every sale at these numbers.`
                  : `You keep ${naira(margin)} on every sale (${percent(marginPct)} margin).`}
              </p>
            ) : null}
          </div>
        );
      })}

      {inputs.products.length < MAX_PRODUCTS ? (
        <button
          type="button"
          onClick={() =>
            update({ products: [...inputs.products, { name: "", unitPrice: 0, unitCost: 0, mix: 1 }] })
          }
          className="flex items-center gap-2 self-start text-sm text-gold transition-colors hover:text-gold-light"
        >
          <Plus size={16} aria-hidden="true" /> Add another product or service
        </button>
      ) : null}
    </div>
  );
}

/* ---------- Step 4: customers ---------- */

export function StepCustomers({ inputs, update }: { inputs: SimulationInputs; update: Patch }) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader title="Where do your customers come from, and do they stay?">
        This is where most plans fail. Customers who leave have to be replaced, and replacing them costs money.
      </StepHeader>
      <NumberField
        label="Customers on opening day"
        value={inputs.startingCustomers}
        onChange={(n) => update({ startingCustomers: n })}
        hint="People already waiting to buy. Use 0 if you are starting cold."
      />
      <NumberField
        label="New customers each month without paying for ads"
        value={inputs.organicNewCustomersPerMonth}
        decimal
        onChange={(n) => update({ organicNewCustomersPerMonth: n })}
        hint="Walk-ins, referrals, word of mouth."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Monthly marketing budget"
          prefix="₦"
          value={inputs.marketingBudget}
          onChange={(n) => update({ marketingBudget: n })}
        />
        <NumberField
          label="Cost to win one customer"
          prefix="₦"
          value={inputs.costPerNewCustomer}
          onChange={(n) => update({ costPerNewCustomer: n })}
          hint="Marketing spend divided by customers it brings."
        />
      </div>
      <PercentField
        label="Customers who stay from one month to the next"
        value={inputs.monthlyRetention}
        onChange={(f) => update({ monthlyRetention: f })}
        hint="80% means you lose 2 in every 10 customers each month."
      />
      <NumberField
        label="Items each customer buys per month"
        value={inputs.unitsPerCustomerPerMonth}
        decimal
        onChange={(n) => update({ unitsPerCustomerPerMonth: n })}
      />
      <NumberField
        label="Most you can produce or serve in a month (optional)"
        value={inputs.maxUnitsPerMonth ?? 0}
        onChange={(n) => update({ maxUnitsPerMonth: n > 0 ? n : undefined })}
        hint="Leave empty if you have no limit. Sales stop growing once you reach it."
      />
    </div>
  );
}

/* ---------- Step 5: running costs ---------- */

export function StepCosts({ inputs, update }: { inputs: SimulationInputs; update: Patch }) {
  const setStaff = (idx: number, patch: Partial<SimulationInputs["staff"][number]>) =>
    update({ staff: inputs.staff.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });

  return (
    <div className="flex flex-col gap-6">
      <StepHeader title="What does it cost to keep the doors open?">
        These costs hit every month whether or not you sell anything.
      </StepHeader>

      <div className="flex flex-col gap-4">
        <h3 className="text-sm text-paper-white">Staff</h3>
        {inputs.staff.length === 0 ? <p className="text-xs text-ash">No staff. It is just you.</p> : null}
        {inputs.staff.map((s, idx) => (
          <div key={idx} className="flex flex-col gap-4 border border-ink-line bg-ink-soft p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <TextInput label="Role" value={s.role} onChange={(v) => setStaff(idx, { role: v })} placeholder="e.g. Cashier" />
              </div>
              <button
                type="button"
                aria-label={`Remove ${s.role || `role ${idx + 1}`}`}
                onClick={() => update({ staff: inputs.staff.filter((_, i) => i !== idx) })}
                className="mb-1 p-2 text-ash transition-colors hover:text-paper-white"
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberField label="How many people" value={s.count} onChange={(n) => setStaff(idx, { count: n })} />
              <NumberField
                label="Monthly salary each"
                prefix="₦"
                value={s.monthlySalary}
                onChange={(n) => setStaff(idx, { monthlySalary: n })}
              />
            </div>
          </div>
        ))}
        {inputs.staff.length < MAX_STAFF_ROLES ? (
          <button
            type="button"
            onClick={() => update({ staff: [...inputs.staff, { role: "", count: 1, monthlySalary: 0 }] })}
            className="flex items-center gap-2 self-start text-sm text-gold transition-colors hover:text-gold-light"
          >
            <Plus size={16} aria-hidden="true" /> Add a role
          </button>
        ) : null}
      </div>

      <NumberField
        label="Monthly rent"
        prefix="₦"
        value={inputs.monthlyRent}
        onChange={(n) => update({ monthlyRent: n })}
      />
      <CheckboxField
        label="My rent is paid a year ahead"
        checked={inputs.rentPaidYearlyUpfront}
        onChange={(v) => update({ rentPaidYearlyUpfront: v })}
        hint="Common in Nigeria. It shows up as a large cash drop at the start of each lease year."
      />
      <NumberField
        label="Power, diesel, internet and water per month"
        prefix="₦"
        value={inputs.monthlyUtilities}
        onChange={(n) => update({ monthlyUtilities: n })}
      />
      <NumberField
        label="Everything else per month"
        prefix="₦"
        value={inputs.monthlyOtherOpex}
        onChange={(n) => update({ monthlyOtherOpex: n })}
        hint="Transport, software, repairs, insurance, packaging not in your unit cost."
      />
      <NumberField
        label="Days of stock you keep on hand"
        value={inputs.inventoryDays}
        onChange={(n) => update({ inventoryDays: n })}
        hint="Stock is cash sitting on a shelf. Use 0 if you hold none."
      />
    </div>
  );
}

/* ---------- Step 6: review and assumptions ---------- */

export function StepReview({
  inputs,
  update,
  businessLabel,
  stateName,
  errors,
  status,
  onStatus,
}: {
  inputs: SimulationInputs;
  update: Patch;
  businessLabel: string;
  stateName: string;
  errors: string[];
  status: TaxStatus;
  onStatus: (s: TaxStatus) => void;
}) {
  const fixed = monthlyFixedCosts(inputs);
  const rows: [string, string][] = [
    ["Business", businessLabel],
    ["Location", stateName],
    ["Starting capital", naira(inputs.startingCapital)],
    ["Setup costs", naira(inputs.setupCosts)],
    ["Fixed costs per month", naira(fixed)],
    ["Looking ahead", `${inputs.months} months`],
  ];

  return (
    <div className="flex flex-col gap-6">
      <StepHeader title="Check your plan, then run it.">
        The simulation runs your plan month by month. It shows when you break even, how long your cash lasts, and
        where it breaks.
      </StepHeader>

      <dl className="flex flex-col border border-ink-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 border-b border-ink-line px-4 py-3 text-sm last:border-b-0">
            <dt className="text-ash">{k}</dt>
            <dd className="text-right text-paper-white">{v}</dd>
          </div>
        ))}
      </dl>

      <ChoiceCards<TaxStatus>
        legend="How is the business registered?"
        value={status}
        onChange={onStatus}
        options={[
          { value: "company", label: "Limited company (Ltd)", description: "Pays company tax, which is 0% for small companies." },
          { value: "sole", label: "Business name or sole proprietor", description: "You pay personal income tax on the profit." },
        ]}
        columns={2}
      />
      <p className="-mt-2 text-xs text-ash">
        Nigerian tax, pension and payroll rules are applied for you. You will see exactly which ones with your results.
      </p>

      <details className="border border-ink-line">
        <summary className="cursor-pointer px-4 py-3 text-sm text-paper-white">Economic assumptions (you can leave these)</summary>
        <div className="flex flex-col gap-5 border-t border-ink-line p-4">
          <PercentField
            label="Yearly rise in your costs"
            value={inputs.costInflationAnnual}
            onChange={(f) => update({ costInflationAnnual: f })}
            hint="Inputs, wages, rent and power get more expensive over time."
          />
          <PercentField
            label="Yearly rise in your prices"
            value={inputs.priceIncreaseAnnual}
            onChange={(f) => update({ priceIncreaseAnnual: f })}
            hint="If costs rise faster than prices, your margin shrinks."
          />
        </div>
      </details>

      {errors.length > 0 ? (
        <ul role="alert" className="flex list-disc flex-col gap-1 pl-5 text-sm text-red-400">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
