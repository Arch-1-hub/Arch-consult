import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import SandboxApp from "@/components/sandbox/SandboxApp";

export const metadata: Metadata = {
  title: "Business Sandbox",
  description:
    "Run your business plan forward month by month before you put capital behind it. See when you break even and how long your cash lasts.",
  // Hidden from search until access limits are added in a later stage.
  robots: { index: false, follow: false },
};

export default function SandboxPage() {
  return (
    <>
      <PageHero
        eyebrow="Business Sandbox"
        title="Stress-test your business before you put capital behind it."
        description="Enter your real numbers. The sandbox runs your plan forward month by month and shows when you break even, how long your cash lasts, and where it breaks. Built for Nigerian businesses."
      />
      <section className="py-16 lg:py-24">
        <div className="container-arch">
          <SandboxApp />
        </div>
      </section>
    </>
  );
}
