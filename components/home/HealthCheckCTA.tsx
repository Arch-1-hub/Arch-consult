import Button from "@/components/ui/Button";

const categories = [
  "Branding",
  "Marketing",
  "Positioning",
  "Customer Acquisition",
  "Digital Presence",
  "Operations",
  "Growth Readiness",
];

export default function HealthCheckCTA() {
  return (
    <section className="border-b border-ink-line py-20 lg:py-28">
      <div className="container-arch grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
        <div>
          <p className="eyebrow">Free Diagnostic</p>
          <h2 className="mt-4 font-display text-3xl text-paper-white sm:text-4xl">
            Find out what's actually holding your business back.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ash">
            Answer questions about your stage, market and operations. In
            minutes, get a scored breakdown across seven categories and
            AI-generated recommendations you can act on immediately.
          </p>
          <div className="mt-8">
            <Button href="/health-check" size="lg" showArrow>
              Start Your Business Health Check
            </Button>
          </div>
        </div>

        <div className="border border-ink-line bg-ink-soft p-8">
          <div className="flex items-baseline justify-between border-b border-ink-line pb-6">
            <span className="text-sm text-ash">Sample Health Score</span>
            <span className="font-display text-4xl text-gold">72</span>
          </div>
          <ul className="mt-6 flex flex-col gap-4">
            {categories.map((category) => (
              <li key={category} className="flex items-center gap-4">
                <span className="w-40 shrink-0 text-sm text-ash">
                  {category}
                </span>
                <ScoreBar value={scoreFor(category)} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function scoreFor(category: string) {
  const scores: Record<string, number> = {
    Branding: 64,
    Marketing: 58,
    Positioning: 80,
    "Customer Acquisition": 51,
    "Digital Presence": 70,
    Operations: 88,
    "Growth Readiness": 66,
  };
  return scores[category] ?? 60;
}

function ScoreBar({ value }: { value: number }) {
  return (
    <span className="h-1.5 flex-1 bg-ink-line" aria-hidden="true">
      <span
        className="block h-full bg-gold"
        style={{ width: `${value}%` }}
      />
    </span>
  );
}
