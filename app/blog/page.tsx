import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import BlogGrid from "@/components/blog/BlogGrid";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Strategy notes on branding, business strategy, marketing, entrepreneurship and AI from Arch Consult.",
};

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Insights"
        title="Strategy notes, not marketing filler."
        description="Short, specific writing on branding, business strategy, marketing and applied AI."
      />
      <BlogGrid />
    </>
  );
}
