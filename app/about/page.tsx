import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import AboutStory from "@/components/about/AboutStory";
import AboutPillars from "@/components/about/AboutPillars";
import AboutFounder from "@/components/about/AboutFounder";
import FinalCTA from "@/components/home/FinalCTA";

export const metadata: Metadata = {
  title: "About",
  description:
    "Arch Consult is a founder-led consultancy combining branding, business strategy, digital strategy and AI to help businesses build clear direction and stronger brands.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Arch Consult"
        title="A founder-led consultancy, built for how businesses actually grow."
        description="Arch Consult combines branding, business strategy, digital strategy and applied AI into one coherent practice — currently in its early-stage growth phase."
      />
      <AboutStory />
      <AboutPillars />
      <AboutFounder />
      <FinalCTA />
    </>
  );
}
