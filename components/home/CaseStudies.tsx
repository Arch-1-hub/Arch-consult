import { caseStudies } from "@/lib/constants";

export default function CaseStudies() {
  return (
    <section className="border-b border-ink-line bg-ink-soft py-20 lg:py-28">
      <div className="container-arch">
        <p className="eyebrow">Case Studies</p>
        <h2 className="mt-4 max-w-lg font-display text-3xl text-paper-white sm:text-4xl">
          Selected engagements.
        </h2>

        <div className="mt-14 grid gap-px overflow-hidden bg-ink-line sm:grid-cols-3">
          {caseStudies.map((study) => (
            <div key={study.client} className="bg-ink-soft p-8">
              <span className="text-xs text-ash">{study.industry}</span>
              <h3 className="mt-3 font-display text-xl text-paper-white">
                {study.client}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ash">
                {study.result}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
