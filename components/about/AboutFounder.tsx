import Image from "next/image";
import Button from "@/components/ui/Button";
import { founder } from "@/lib/constants";

export default function AboutFounder() {
  return (
    <section className="border-b border-ink-line bg-ink-soft py-20 lg:py-28">
      <div className="container-arch grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:gap-16">
        <div className="flex justify-center lg:justify-start">
          <div className="flex h-44 w-44 items-center justify-center border border-ink-line bg-ink">
            <Image
              src="/logo-icon-light.png"
              alt=""
              width={80}
              height={54}
              className="opacity-90"
            />
          </div>
        </div>

        <div>
          <p className="eyebrow">Founder</p>
          <h2 className="mt-4 font-display text-3xl text-paper-white sm:text-4xl">
            {founder.name}
          </h2>
          <p className="mt-1 text-sm text-gold">{founder.role}</p>

          <div className="mt-6 flex max-w-xl flex-col gap-4">
            {founder.bio.map((paragraph) => (
              <p key={paragraph} className="text-[15px] leading-relaxed text-ash">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-8">
            <Button href="/book-consultation" showArrow>
              Book time with the founder
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
