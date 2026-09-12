import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { services } from "@/lib/constants";
import Button from "@/components/ui/Button";

export default function ServicesOverview() {
  const featured = services.slice(0, 6);

  return (
    <section id="services" className="border-b border-ink-line py-20 lg:py-28">
      <div className="container-arch">
        <div className="flex flex-col justify-between gap-6 border-b border-ink-line pb-10 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">What We Do</p>
            <h2 className="mt-4 max-w-lg font-display text-3xl text-paper-white sm:text-4xl">
              Consultancy built around how businesses actually grow.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ash">
            From first positioning to full digital transformation — pick a
            single engagement or work with us end to end.
          </p>
        </div>

        <div className="grid divide-y divide-ink-line lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {featured.map((service, i) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group flex items-start justify-between gap-6 py-7 pr-4 transition-colors duration-200 ease-arch hover:bg-ink-soft lg:px-8"
            >
              <div>
                <span className="text-xs text-ash">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-display text-xl text-paper-white group-hover:text-gold">
                  {service.name}
                </h3>
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

        <div className="mt-10 flex justify-center">
          <Button href="/services" variant="outline-dark" showArrow>
            View all services
          </Button>
        </div>
      </div>
    </section>
  );
}
