import Button from "@/components/ui/Button";

const quickActions = [
  "Analyze my business",
  "Help me build my brand",
  "Create a marketing strategy",
  "Create a SWOT analysis",
];

export default function AIConsultantCTA() {
  return (
    <section className="border-b border-ink-line bg-ink-soft py-20 lg:py-28">
      <div className="container-arch grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
        <div className="order-2 border border-ink-line bg-ink p-6 lg:order-1">
          <div className="flex items-center gap-2.5 border-b border-ink-line pb-4">
            <span className="h-2 w-2 rounded-full bg-gold" />
            <span className="text-sm text-paper-white">
              Arch Consult AI Strategist
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ash">
            Welcome to Arch Consult. I&apos;m your AI business strategist.
            Tell me about your business, idea, or challenge, and I&apos;ll
            help you identify the next strategic move.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <span
                key={action}
                className="border border-ink-line px-3 py-1.5 text-xs text-ash"
              >
                {action}
              </span>
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="eyebrow">AI Business Consultant</p>
          <h2 className="mt-4 font-display text-3xl text-paper-white sm:text-4xl">
            A strategist that's available the moment an idea hits you.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ash">
            Get branding advice, positioning, competitive strategy and
            business-model input in a live conversation — then bring anything
            that needs deeper work to a human consultant.
          </p>
          <div className="mt-8">
            <Button href="/ai-consultant" size="lg" showArrow>
              Talk to the AI Consultant
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
