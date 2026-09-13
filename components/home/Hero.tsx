import Image from "next/image";
import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-ink-line">
      <div className="container-arch grid gap-14 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:py-28">
        <div className="flex flex-col justify-center">
          <p className="eyebrow">Business Branding &amp; Strategy Consultancy</p>

          <h1 className="mt-5 max-w-xl font-display text-[2.6rem] leading-[1.08] text-paper-white sm:text-5xl lg:text-[3.4rem]">
            Build a brand that means business.
          </h1>

          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ash">
            Arch Consult helps founders and growing businesses turn an idea,
            or an underperforming brand, into a structured strategy, a
            credible identity, and a business built to scale — backed by
            both our consultants and an AI strategist available at any hour.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button href="/launch-wizard" size="lg">
              Start Your Business
            </Button>
            <Button href="/ai-consultant" variant="outline-dark" size="lg">
              Talk to AI Consultant
            </Button>
            <Button href="/book-consultation" variant="ghost" size="lg" showArrow>
              Book a Consultation
            </Button>
          </div>

          <div className="mt-14 flex items-center gap-3 border-t border-ink-line pt-8 text-xs text-ash">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Founder-led · Nigeria · Remote worldwide
          </div>
        </div>

        <div className="relative hidden items-center justify-center lg:flex">
          <ArchGrid />
          <Image
            src="/logo-icon-light.png"
            alt=""
            width={340}
            height={228}
            className="relative opacity-90"
            priority
          />
        </div>
      </div>
    </section>
  );
}

/** Quiet structural backdrop echoing the arch mark — the one deliberate hero graphic. */
function ArchGrid() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 440 440"
      className="absolute inset-0 h-full w-full"
    >
      <circle cx="220" cy="260" r="180" className="arch-mark" opacity="0.18" />
      <circle cx="220" cy="260" r="130" className="arch-mark" opacity="0.28" />
      <line x1="220" y1="20" x2="220" y2="440" className="arch-mark" opacity="0.12" />
      <line x1="20" y1="260" x2="440" y2="260" className="arch-mark" opacity="0.12" />
    </svg>
  );
}
