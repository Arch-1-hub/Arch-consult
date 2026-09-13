const pillars = [
  {
    letter: "01",
    title: "Strategy",
    detail:
      "Every engagement starts with strategy — positioning, audience, business model — before any visual or marketing decision is made. It's slower up front and faster everywhere after.",
  },
  {
    letter: "02",
    title: "Creativity",
    detail:
      "Creative work that isn't tied to strategy is decoration. Ours is built to make the strategy visible, memorable and distinct — never generic, never templated.",
  },
  {
    letter: "03",
    title: "Technology",
    detail:
      "We use AI to move faster on analysis, drafts and iteration, and human consultants to verify anything that carries real business weight. Neither replaces the other.",
  },
  {
    letter: "04",
    title: "Growth",
    detail:
      "The work isn't done at delivery. We build for what the business needs to become next, not just what it needs today.",
  },
];

export default function AboutPillars() {
  return (
    <section className="border-b border-ink-line py-20 lg:py-28">
      <div className="container-arch">
        <p className="eyebrow">Our Approach</p>
        <h2 className="mt-4 max-w-lg font-display text-3xl text-paper-white sm:text-4xl">
          Four principles behind every engagement.
        </h2>

        <div className="mt-14 grid gap-x-10 gap-y-14 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <div key={pillar.title}>
              <span className="font-display text-sm text-gold">
                {pillar.letter}
              </span>
              <h3 className="mt-3 font-display text-2xl text-paper-white">
                {pillar.title}
              </h3>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ash">
                {pillar.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
