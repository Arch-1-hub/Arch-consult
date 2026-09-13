import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/shared/PageHero";
import FinalCTA from "@/components/home/FinalCTA";
import { services } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Brand strategy, brand identity, business consulting, growth strategy, digital strategy, AI automation, marketing strategy and entrepreneurial advisory from Arch Consult.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Consultancy built around how businesses actually grow."
        description="Work with Arch Consult on a single engagement, or end to end — from positioning through to digital execution."
      />

      <section className="border-b border-ink-line py-16 lg:py-24">
        <div className="container-arch">
          <div className="grid divide-y divide-ink-line lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            {services.map((service, i) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group flex items-start justify-between gap-6 py-8 pr-4 transition-colors duration-200 ease-arch hover:bg-ink-soft lg:px-8"
              >
                <div>
                  <span className="text-xs text-ash">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="mt-2 font-display text-xl text-paper-white group-hover:text-gold">
                    {service.name}
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-ash">
                    {service.summary}
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

      <FinalCTA />
    </>
  );
}
