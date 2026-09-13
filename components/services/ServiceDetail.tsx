import type { Service } from "@/lib/constants";
import Button from "@/components/ui/Button";

export default function ServiceDetail({ service }: { service: Service }) {
  return (
    <>
      <section className="border-b border-ink-line py-20 lg:py-28">
        <div className="container-arch grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow">What It Is</p>
            <p className="mt-4 text-[15px] leading-relaxed text-paper-white">
              {service.whatItIs}
            </p>

            <p className="eyebrow mt-10">Who It's For</p>
            <p className="mt-4 text-[15px] leading-relaxed text-ash">
              {service.whoItsFor}
            </p>
          </div>

          <div>
            <p className="eyebrow">Problems It Solves</p>
            <ul className="mt-4 flex flex-col gap-3">
              {service.problems.map((problem) => (
                <li
                  key={problem}
                  className="border-l border-ink-line pl-4 text-sm leading-relaxed text-ash"
                >
                  {problem}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-ink-line bg-ink-soft py-20 lg:py-28">
        <div className="container-arch">
          <p className="eyebrow">What You Receive</p>
          <h2 className="mt-4 max-w-lg font-display text-3xl text-paper-white sm:text-4xl">
            Deliverables from this engagement.
          </h2>

          <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {service.deliverables.map((item, i) => (
              <div key={item} className="flex gap-4">
                <span className="font-display text-sm text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[15px] leading-relaxed text-paper-white">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="container-arch flex flex-col items-start gap-6 lg:items-center lg:text-center">
          <h2 className="max-w-xl font-display text-3xl text-paper-white sm:text-4xl">
            Talk through {service.name.toLowerCase()} for your business.
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/book-consultation" size="lg">
              Book a Consultation
            </Button>
            <Button href="/ai-consultant" variant="outline-dark" size="lg">
              Ask the AI Consultant First
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
