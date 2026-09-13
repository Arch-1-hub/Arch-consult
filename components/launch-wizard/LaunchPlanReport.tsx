"use client";

import Link from "next/link";
import { RefreshCw, Printer } from "lucide-react";
import Button from "@/components/ui/Button";
import { services } from "@/lib/constants";

export default function LaunchPlanReport({ plan, onReset }: { plan: any; onReset: () => void }) {
  const matchedServices = services.filter((s) =>
    plan.suggestedServices?.some((name: string) => name.toLowerCase() === s.name.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between border-b border-ink-line pb-4 print:hidden">
        <p className="eyebrow">Your Business Launch Plan</p>
        <div className="flex items-center gap-5">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs text-ash hover:text-gold">
            <Printer size={13} /> Save as PDF
          </button>
          <button onClick={onReset} className="flex items-center gap-1.5 text-xs text-ash hover:text-gold">
            <RefreshCw size={13} /> Start over
          </button>
        </div>
      </div>

      <Section title="Business Concept Summary" text={plan.businessConceptSummary} />
      <Section title="Target Audience" text={plan.targetAudience} />
      <Section title="Value Proposition" text={plan.valueProposition} />
      <Section title="Positioning" text={plan.positioning} />
      <Section title="Brand Personality" text={plan.brandPersonality} />

      {plan.brandNamingSuggestions?.length > 0 && (
        <div>
          <p className="eyebrow">Brand Naming Suggestions</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {plan.brandNamingSuggestions.map((name: string) => (
              <span key={name} className="border border-ink-line px-4 py-2 font-display text-lg text-paper-white">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      <Section title="Revenue Model" text={plan.revenueModel} />
      <Section title="Marketing Strategy" text={plan.marketingStrategy} />
      <Section title="Customer Acquisition Strategy" text={plan.customerAcquisitionStrategy} />
      <Section title="Launch Roadmap" text={plan.launchRoadmap} />

      {plan.swot && (
        <div>
          <p className="eyebrow">SWOT Analysis</p>
          <div className="mt-4 grid gap-px overflow-hidden bg-ink-line sm:grid-cols-2">
            <SwotBox label="Strengths" items={plan.swot.strengths} />
            <SwotBox label="Weaknesses" items={plan.swot.weaknesses} />
            <SwotBox label="Opportunities" items={plan.swot.opportunities} />
            <SwotBox label="Threats" items={plan.swot.threats} />
          </div>
        </div>
      )}

      {plan.actionPlan && (
        <div>
          <p className="eyebrow">30 / 60 / 90-Day Action Plan</p>
          <div className="mt-4 grid gap-x-10 gap-y-8 sm:grid-cols-3">
            <ActionBlock label="First 30 Days" items={plan.actionPlan.thirtyDays} />
            <ActionBlock label="Next 60 Days" items={plan.actionPlan.sixtyDays} />
            <ActionBlock label="Next 90 Days" items={plan.actionPlan.ninetyDays} />
          </div>
        </div>
      )}

      {matchedServices.length > 0 && (
        <div>
          <p className="eyebrow">Suggested Arch Consult Services</p>
          <div className="mt-4 grid gap-px overflow-hidden bg-ink-line sm:grid-cols-2">
            {matchedServices.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group bg-ink p-5 transition-colors hover:bg-ink-soft"
              >
                <h3 className="font-display text-lg text-paper-white group-hover:text-gold">{service.name}</h3>
                <p className="mt-1 text-xs text-ash">{service.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-ink-line pt-8 print:hidden">
        <p className="text-xs text-ash">
          This plan is AI-generated from what you shared and isn't a substitute for a full
          consultation. No outcome or result is guaranteed.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button href="/book-consultation" showArrow>
            Book a Human Consultation
          </Button>
          <Button href="/health-check" variant="outline-dark">
            Run the Business Health Check
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, text }: { title: string; text?: string }) {
  if (!text) return null;
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <p className="mt-3 text-[15px] leading-relaxed text-ash">{text}</p>
    </div>
  );
}

function SwotBox({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="bg-ink p-5">
      <h3 className="text-sm text-gold">{label}</h3>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-relaxed text-ash">
            · {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionBlock({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="text-sm text-paper-white">{label}</h3>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-relaxed text-ash">
            · {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
