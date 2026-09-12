const steps = [
  {
    title: "Tell us where you are",
    detail:
      "Run the free Business Health Check or talk to the AI consultant to establish a clear starting point.",
  },
  {
    title: "Get a strategy, not a template",
    detail:
      "We turn your answers into a specific brand and business strategy — reviewed by a human consultant before you act on it.",
  },
  {
    title: "Build with us",
    detail:
      "Engage Arch Consult for the parts you need: identity, marketing, digital build, or ongoing advisory.",
  },
  {
    title: "Track it in one place",
    detail:
      "Your dashboard holds every report, proposal, invoice and file — nothing lives in scattered email threads.",
  },
];

export default function HowItWorks() {
  return (
    <section className="border-b border-ink-line bg-ink-soft py-20 lg:py-28">
      <div className="container-arch">
        <p className="eyebrow">How It Works</p>
        <h2 className="mt-4 max-w-lg font-display text-3xl text-paper-white sm:text-4xl">
          From first conversation to a business that runs on strategy.
        </h2>

        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="relative pl-6">
              <span
                aria-hidden="true"
                className="absolute left-0 top-1 h-full w-px bg-ink-line"
              />
              <span className="font-display text-lg text-gold">
                {i + 1}
              </span>
              <h3 className="mt-3 text-[15px] font-medium text-paper-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ash">
                {step.detail}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
