import Image from "next/image";
import { founder } from "@/lib/constants";

export default function FounderSection() {
  return (
    <section className="border-b border-ink-line bg-ink-soft py-20 lg:py-28">
      <div className="container-arch grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:gap-16">
        <div className="flex justify-center lg:justify-start">
          <div className="flex h-40 w-40 items-center justify-center border border-ink-line bg-ink">
            <Image
              src="/logo-icon-light.png"
              alt=""
              width={72}
              height={48}
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
          <div className="mt-5 flex max-w-xl flex-col gap-4">
            {founder.bio.map((paragraph) => (
              <p key={paragraph} className="text-[15px] leading-relaxed text-ash">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
