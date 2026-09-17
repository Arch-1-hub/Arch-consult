import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/shared/PageHero";
import { aiTools } from "@/lib/ai-tools-data";

export const metadata: Metadata = {
  title: "AI Tools",
  description: "Quick AI-powered tools for branding, marketing, and business strategy.",
};

export default function AIToolsPage() {
  return (
    <>
      <PageHero
        eyebrow="AI Tools"
        title="Quick, focused tools for specific tasks."
        description="For when you need one answer, not a full consultation — brand names, a SWOT analysis, a marketing plan, and more."
      />

      <section className="border-b border-ink-line py-16 lg:py-24">
        <div className="container-arch">
          <div className="grid divide-y divide-ink-line lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            {aiTools.map((tool, i) => (
              <Link
                key={tool.slug}
                href={`/ai-tools/${tool.slug}`}
                className="group flex items-start justify-between gap-6 py-8 pr-4 transition-colors duration-200 ease-arch hover:bg-ink-soft lg:px-8"
              >
                <div>
                  <span className="text-xs text-ash">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="mt-2 font-display text-xl text-paper-white group-hover:text-gold">
                    {tool.name}
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-ash">
                    {tool.description}
                  </p>
                </div>
                <ArrowUpRight
                  size={18}
                  strokeWidth={1.5}
                  className="mt-1 shrink-0 text-ash transition-colors group-hover:text-gold"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
