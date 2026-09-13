import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import HealthCheckWizard from "@/components/health-check/HealthCheckWizard";

export const metadata: Metadata = {
  title: "Business Health Check",
  description:
    "Answer questions about your business stage, brand, marketing and operations to get a scored health check across seven categories, with AI-generated recommendations.",
};

export default function HealthCheckPage() {
  return (
    <>
      <PageHero
        eyebrow="Business Health Check"
        title="Find out what's actually holding your business back."
        description="Answer questions about your stage, brand, marketing and operations. Get a scored breakdown across seven categories, plus specific recommendations."
      />
      <section className="py-16 lg:py-24">
        <div className="container-arch max-w-2xl">
          <HealthCheckWizard />
        </div>
      </section>
    </>
  );
}
