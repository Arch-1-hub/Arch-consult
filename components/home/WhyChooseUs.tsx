const reasons = [
  {
    title: "Strategy before aesthetics",
    detail:
      "We don't start with a moodboard. Positioning, audience and business model come first — the identity follows from that.",
  },
  {
    title: "AI-accelerated, human-verified",
    detail:
      "Our AI tools move fast on analysis and drafts. A consultant reviews anything that carries real business weight.",
  },
  {
    title: "One dashboard, not five vendors",
    detail:
      "Strategy, brand, marketing and digital execution run through a single account, so nothing falls between agencies.",
  },
  {
    title: "Built for founders who move",
    detail:
      "Clear timelines, direct communication, and deliverables that hold up outside a pitch deck.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="border-b border-ink-line py-20 lg:py-28">
      <div className="container-arch grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">Why Arch Consult</p>
          <h2 className="mt-4 font-display text-3xl text-paper-white sm:text-4xl">
            Built for businesses that intend to be taken seriously.
          </h2>
        </div>

        <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {reasons.map((reason) => (
            <div key={reason.title} className="border-l border-ink-line pl-6">
              <h3 className="text-[15px] font-medium text-paper-white">
                {reason.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ash">
                {reason.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
