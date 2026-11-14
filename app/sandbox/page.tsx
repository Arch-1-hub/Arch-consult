import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import SandboxApp from "@/components/sandbox/SandboxApp";
import SandboxExplainer from "@/components/sandbox/SandboxExplainer";
import { getPageAccess } from "@/lib/sandbox/server-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Business Sandbox: test your business plan before you spend",
  description:
    "Describe your business or idea, enter your numbers, and see month by month when you break even and how long your cash lasts. Built for Nigerian businesses, with a monthly briefing on news in your area.",
  alternates: { canonical: "/sandbox" },
  openGraph: {
    title: "Business Sandbox | Arch Consult",
    description: "Stress-test your business plan month by month before you put capital behind it. Built for Nigerian businesses.",
    url: "/sandbox",
    type: "website",
  },
};

export default async function SandboxPage() {
  const access = await getPageAccess();
  return (
    <>
      <PageHero
        eyebrow="Business Sandbox"
        title="Stress-test your business before you put capital behind it."
        description="Enter your real numbers. The sandbox runs your plan forward month by month and shows when you break even, how long your cash lasts, and where it breaks. Built for Nigerian businesses."
      />
      <section className="py-16 lg:py-24">
        <div className="container-arch">
          <SandboxApp access={access} />
        </div>
      </section>
      <SandboxExplainer signedOut={access.kind === "anon"} />
    </>
  );
}
