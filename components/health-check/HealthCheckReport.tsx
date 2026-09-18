"use client";

import { RefreshCw, Printer, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import SaveReportButton from "@/components/dashboard/SaveReportButton";

type Recommendations = {
  summary: string;
  categoryInsights: Record<string, string>;
  topRecommendations: string[];
  nextSteps: string;
} | null;

export default function HealthCheckReport({
  categoryScores,
  overall,
  recommendations,
  error,
  onReset,
}: {
  categoryScores: Record<string, number>;
  overall: number;
  recommendations: Recommendations;
  error?: string | null;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between border-b border-ink-line pb-4 print:hidden">
        <p className="eyebrow">Your Business Health Check</p>
        <div className="flex items-center gap-5 print:hidden">
          <SaveReportButton
            type="health_check"
            title={`Business Health Check — Score ${overall}`}
            data={{ categoryScores, overall, recommendations }}
          />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs text-ash hover:text-gold"
          >
            <Printer size={13} /> Save as PDF
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-ash hover:text-gold"
          >
            <RefreshCw size={13} /> Start over
          </button>
        </div>
      </div>

      <div className="border border-ink-line bg-ink-soft p-8">
        <div className="flex items-baseline justify-between border-b border-ink-line pb-6">
          <span className="text-sm text-ash">Overall Health Score</span>
          <span className="font-display text-5xl text-gold">{overall}</span>
        </div>
        <ul className="mt-6 flex flex-col gap-4">
          {Object.entries(categoryScores).map(([category, score]) => (
            <li key={category} className="flex items-center gap-4">
              <span className="w-40 shrink-0 text-sm text-ash">{category}</span>
              <span className="h-1.5 flex-1 bg-ink-line">
                <span className="block h-full bg-gold" style={{ width: `${score}%` }} />
              </span>
              <span className="w-8 text-right text-sm text-paper-white">{score}</span>
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="flex items-start gap-2 border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300 print:hidden">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {recommendations && (
        <>
          <div>
            <p className="eyebrow">Summary</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ash">{recommendations.summary}</p>
          </div>

          <div>
            <p className="eyebrow">Category Insights</p>
            <div className="mt-4 flex flex-col gap-5">
              {Object.entries(recommendations.categoryInsights || {}).map(([category, insight]) => (
                <div key={category} className="border-l border-ink-line pl-4">
                  <h3 className="text-sm text-paper-white">{category}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ash">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="eyebrow">Top Recommendations</p>
            <ul className="mt-4 flex flex-col gap-3">
              {recommendations.topRecommendations?.map((rec, i) => (
                <li key={rec} className="flex gap-3 text-[15px] leading-relaxed text-paper-white">
                  <span className="font-display text-sm text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow">Next Steps</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ash">{recommendations.nextSteps}</p>
          </div>
        </>
      )}

      <div className="border-t border-ink-line pt-8 print:hidden">
        <p className="text-xs text-ash">
          This report is generated from your answers and, where AI is configured,
          AI-written insights. It isn't a substitute for a full consultation, and
          no outcome is guaranteed.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button href="/book-consultation" showArrow>
            Book a Human Consultation
          </Button>
          <Button href="/ai-consultant" variant="outline-dark">
            Talk to the AI Consultant
          </Button>
        </div>
      </div>
    </div>
  );
}
