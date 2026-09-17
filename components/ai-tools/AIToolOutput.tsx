import { RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

type ToolResult = {
  title: string;
  sections: { heading: string; content: string[] }[];
};

export default function AIToolOutput({
  result,
  onReset,
}: {
  result: ToolResult;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between border-b border-ink-line pb-4">
        <p className="eyebrow">Result</p>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-ash hover:text-gold"
        >
          <RefreshCw size={13} /> Start over
        </button>
      </div>

      <h2 className="font-display text-2xl text-paper-white">{result.title}</h2>

      {result.sections?.map((section) => (
        <div key={section.heading}>
          <p className="eyebrow">{section.heading}</p>
          {section.content?.length > 1 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {section.content.map((item, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-paper-white">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[15px] leading-relaxed text-ash">{section.content?.[0]}</p>
          )}
        </div>
      ))}

      <div className="border-t border-ink-line pt-8">
        <p className="text-xs text-ash">
          This result is AI-generated from what you shared and isn't a
          substitute for a full consultation. No outcome is guaranteed.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button href="/book-consultation" showArrow>
            Book a Human Consultation
          </Button>
          <Button href="/ai-tools" variant="outline-dark">
            Try Another Tool
          </Button>
        </div>
      </div>
    </div>
  );
}
