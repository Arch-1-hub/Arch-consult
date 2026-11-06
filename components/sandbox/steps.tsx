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

const STOCK_OPTIONS = [
  { value: "0", label: "I do not keep stock", description: "A service, or I make things only when someone orders" },
  { value: "7", label: "About 1 week" },
  { value: "14", label: "About 2 weeks" },
  { value: "30", label: "About 1 month" },
  { value: "60", label: "About 2 months" },
  { value: "90", label: "3 months or more" },
];

/** Picks the stock choice closest to a number of days (presets hold exact day counts). */
function nearestStock(days: number): string {
  let best = STOCK_OPTIONS[0];
  for (const o of STOCK_OPTIONS) {
    if (Math.abs(Number(o.value) - days) < Math.abs(Number(best.value) - days)) best = o;
  }
  return best.value;
}

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
        Pick the closest match. We fill in example numbers so you are not starting from nothing. Replace every
        number with your own in the next steps.
      </StepHeader>
      <ChoiceCards
        legend="Type of business"
        value={presetId}
        onChange={onPickPreset}
        options={PRESETS.map((p) => ({ value: p.id, label: p.label, description: p.description }))}
        columns={2}
      />
      <SelectField label="Which state is it in?" value={stateName} onChange={onState} options={NIGERIAN_STATES} />
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
        Only count money you really have. We start with this cash and spend it as your business runs.
      </StepHeader>
      <NumberField
        label="How much money are you starting with?"
        prefix="₦"
        value={inputs.startingCapital}
        onChange={(n) => update({ startingCapital: n })}
        hint="The cash you can actually put in on day one."
      />
      <NumberField
        label="How much will you spend before you open?"
        prefix="₦"
        value={inputs.setupCosts}
        onChange={(n) => update({ setupCosts: n })}
        hint="Equipment, shop fitting, registration, licences, deposits. This comes out of your starting money."
      />
      <ChoiceCards
        legend="How long should we test your business for?"
        value={String(inputs.months) as "12" | "24" | "36"}
        onChange={(v) => update({ months: Number(v) })}
        options={[
          { value: "12", label: "1 year" },
          { value: "24", label: "2 years", description: "Recommended" },
          { value: "36", label: "3 years" },
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
        Enter prices without VAT. "What one costs you" is what you pay to make or buy one item: ingredients, goods
        you buy to resell, packaging, or the cost of delivering a service.
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
                label="Price you charge"
                prefix="₦"
                value={p.unitPrice}
                onChange={(n) => setProduct(idx, { unitPrice: n })}
              />
              <NumberField
                label="What one costs you"
                prefix="₦"
                value={p.unitCost}
                onChange={(n) => setProduct(idx, { unitCost: n })}
              />
            </div>
            {inputs.products.length > 1 ? (
              <NumberField
                label="How much of your sales is this item?"
                value={p.mix}
                decimal
                onChange={(n) => setProduct(idx, { mix: n })}
                hint="Example: you sell 6 loaves for every 1 cake. Put 6 for the loaf and 1 for the cake."
              />
            ) : null}
            {p.unitPrice > 0 ? (
              <div className="flex flex-col gap-1 border-t border-ink-line pt-3">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-paper-white">Profit per sale</span>
                  <span className={`font-display text-xl ${margin <= 0 ? "text-red-400" : "text-gold-light"}`}>
                    {margin < 0 ? "−" : ""}
                    {naira(Math.abs(margin))}
                  </span>
                </div>
                <p className={`text-xs ${margin <= 0 ? "text-red-400" : "text-ash"}`}>
                  {margin <= 0
                    ? "You lose money on every sale at these numbers."
                    : `That is ${percent(marginPct)} of your selling price, before rent, staff and other running costs.`}
                </p>
              </div>
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
        This part matters most. Customers who stop buying must be replaced, and finding new ones costs money.
      </StepHeader>
      <NumberField
        label="How many customers will you already have on day one?"
        value={inputs.startingCustomers}
        onChange={(n) => update({ startingCustomers: n })}
        hint="People ready to buy from you when you open. Put 0 if you are starting from nothing."
      />
      <NumberField
        label="How many new customers find you each month without ads?"
        value={inputs.organicNewCustomersPerMonth}
        decimal
        onChange={(n) => update({ organicNewCustomersPerMonth: n })}
        hint="People who walk in, or come because a friend told them."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="How much do you spend on ads and promotion each month?"
          prefix="₦"
          value={inputs.marketingBudget}
          onChange={(n) => update({ marketingBudget: n })}
        />
        <NumberField
          label="How much does it cost you to get one new customer from ads?"
          prefix="₦"
          value={inputs.costPerNewCustomer}
          onChange={(n) => update({ costPerNewCustomer: n })}
          hint="Example: you spend ₦30,000 on ads and get 10 new customers. Put ₦3,000. Not sure? Keep the example figure."
        />
      </div>
      <NumberField
        label="Out of every 10 customers, how many buy from you again next month?"
        suffix="out of 10"
        decimal
        value={Math.round(inputs.monthlyRetention * 100) / 10}
        onChange={(n) => update({ monthlyRetention: Math.min(10, Math.max(0, n)) / 10 })}
        hint="Example: if 3 of every 10 stop coming, put 7."
      />
      <NumberField
        label="How many items does one customer buy from you in a month?"
        value={inputs.unitsPerCustomerPerMonth}
        decimal
        onChange={(n) => update({ unitsPerCustomerPerMonth: n })}
        hint="Example: someone who buys 2 loaves a week buys about 8 in a month."
      />
      <NumberField
        label="What is the most you can make or serve in one month? (optional)"
        value={inputs.maxUnitsPerMonth ?? 0}
        onChange={(n) => update({ maxUnitsPerMonth: n > 0 ? n : undefined })}
        hint="Leave empty if you can handle any number of orders. Example: an oven that makes 1,000 loaves a month."
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
        You pay these every month, even in a month when you sell nothing.
      </StepHeader>

      <div className="flex flex-col gap-4">
        <h3 className="text-sm text-paper-white">People you pay</h3>
        {inputs.staff.length === 0 ? <p className="text-xs text-ash">Nobody yet. It is just you.</p> : null}
        {inputs.staff.map((s, idx) => (
          <div key={idx} className="flex flex-col gap-4 border border-ink-line bg-ink-soft p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <TextInput label="Job" value={s.role} onChange={(v) => setStaff(idx, { role: v })} placeholder="For example: cashier" />
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
                label="Salary per person, per month"
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
            <Plus size={16} aria-hidden="true" /> Add a job
          </button>
        ) : null}
      </div>

      <NumberField
        label="Rent per month"
        prefix="₦"
        value={inputs.monthlyRent}
        onChange={(n) => update({ monthlyRent: n })}
        hint="If you pay once a year, divide by 12."
      />
      <CheckboxField
        label="I pay my rent once a year"
        checked={inputs.rentPaidYearlyUpfront}
        onChange={(v) => update({ rentPaidYearlyUpfront: v })}
        hint="Common in Nigeria. We will show the big payment at the start of each year."
      />
      <NumberField
        label="Light, diesel, internet and water per month"
        prefix="₦"
        value={inputs.monthlyUtilities}
        onChange={(n) => update({ monthlyUtilities: n })}
      />
      <NumberField
        label="Everything else per month"
        prefix="₦"
        value={inputs.monthlyOtherOpex}
        onChange={(n) => update({ monthlyOtherOpex: n })}
        hint="Transport, software, repairs, insurance, and packaging not already counted above."
      />
      <ChoiceCards
        legend="How long does the stock you buy usually last before you buy more?"
        value={nearestStock(inputs.inventoryDays)}
        onChange={(v) => update({ inventoryDays: Number(v) })}
        options={STOCK_OPTIONS}
        columns={2}
      />
      <p className="-mt-3 text-xs text-ash">
        Stock you have paid for but not yet sold is money sitting on a shelf, so this changes how much cash you have.
      </p>
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
    ["Starting money", naira(inputs.startingCapital)],
    ["Spent before opening", naira(inputs.setupCosts)],
    ["Costs you pay every month", naira(fixed)],
    ["Testing for", inputs.months === 12 ? "1 year" : `${inputs.months / 12} years`],
  ];

  return (
    <div className="flex flex-col gap-6">
      <StepHeader title="Check your plan, then run it.">
        We will run your plan month by month. You will see when you start making a profit, how long your money lasts,
        and where it could go wrong.
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
        <summary className="cursor-pointer px-4 py-3 text-sm text-paper-white">Price and cost changes over time (you can skip this)</summary>
        <div className="flex flex-col gap-5 border-t border-ink-line p-4">
          <PercentField
            label="How much more do things cost you each year?"
            value={inputs.costInflationAnnual}
            onChange={(f) => update({ costInflationAnnual: f })}
            hint="Ingredients, salaries, rent and diesel usually get more expensive."
          />
          <PercentField
            label="How much do you raise your prices each year?"
            value={inputs.priceIncreaseAnnual}
            onChange={(f) => update({ priceIncreaseAnnual: f })}
            hint="If your costs rise faster than your prices, you keep less on each sale."
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
