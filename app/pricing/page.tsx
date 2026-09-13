import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import PricingCards from "@/components/pricing/PricingCards";
import FinalCTA from "@/components/home/FinalCTA";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Arch Consult consultancy packages — Starter, Growth, Strategic and Custom Enterprise.",
};

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Consultancy packages built around where your business is."
        description="Every engagement can also be scoped individually — packages are a starting point, not a limit."
      />
      <PricingCards />
      <FinalCTA />
    </>
  );
}
