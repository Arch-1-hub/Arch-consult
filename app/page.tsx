import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import ServicesOverview from "@/components/home/ServicesOverview";
import HowItWorks from "@/components/home/HowItWorks";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import HealthCheckCTA from "@/components/home/HealthCheckCTA";
import AIConsultantCTA from "@/components/home/AIConsultantCTA";
import Testimonials from "@/components/home/Testimonials";
import FounderSection from "@/components/home/FounderSection";
import InsightsPreview from "@/components/home/InsightsPreview";
import FinalCTA from "@/components/home/FinalCTA";

export const metadata: Metadata = {
  title: "Arch Consult — Build a Brand That Means Business.",
  description:
    "AI business consulting, brand strategy and digital transformation for businesses ready to scale. Talk to an AI consultant, run a Business Health Check, or book time with Arch Consult.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesOverview />
      <HowItWorks />
      <WhyChooseUs />
      <HealthCheckCTA />
      <AIConsultantCTA />
      <Testimonials />
      <FounderSection />
      <InsightsPreview />
      <FinalCTA />
    </>
  );
}
