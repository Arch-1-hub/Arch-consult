import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import LaunchWizard from "@/components/launch-wizard/LaunchWizard";

export const metadata: Metadata = {
  title: "Business Launch Wizard",
  description:
    "Turn a business idea into a structured concept, brand direction, revenue model, marketing strategy and 30/60/90-day launch plan.",
};

export default function LaunchWizardPage() {
  return (
    <>
      <PageHero
        eyebrow="Business Launch Wizard"
        title="Turn your idea into a structured plan to launch."
        description="Answer a few questions about your idea, audience and goals, and get a full concept summary, positioning, brand direction, revenue model, marketing strategy, SWOT analysis, and a 30/60/90-day action plan."
      />
      <section className="py-16 lg:py-24">
        <div className="container-arch max-w-2xl">
          <LaunchWizard />
        </div>
      </section>
    </>
  );
}
