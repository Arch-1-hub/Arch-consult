import Button from "@/components/ui/Button";

const WHAT_YOU_GET = [
  { title: "When you break even", body: "See the month your business starts to cover its costs, so you know how long you must hold out." },
  { title: "How long your cash lasts", body: "Find out whether your money runs out, when, and by how much, before it happens for real." },
  { title: "Nigerian costs built in", body: "Company or sole-proprietor tax, pension and NSITF on staff, and your own rent, stock and wages are all counted." },
  { title: "What-if Scenario Lab", body: "Test a price rise, a supplier hike, a weak season or a new competitor, side by side with your base plan." },
  { title: "An advisor that knows your numbers", body: "Ask questions about your own plan and get plain answers based on the figures you entered." },
  { title: "A monthly briefing for your business", body: "Each month: news in your area that affects your kind of business, and what to do about it." },
];

const STEPS = [
  { title: "Describe your business or idea", body: "Tell us in your own words what you do or plan to do, who buys, and the town and state you operate in." },
  { title: "Answer plain questions", body: "Prices, costs, staff, rent, money in hand. No accounting words, and you can use your best estimate." },
  { title: "Read the verdict and test it", body: "See your month-by-month picture, then change one thing at a time to see what it does." },
];

const FAQ = [
  { q: "Is it really free?", a: "Your first simulation is free. Any consultation package unlocks unlimited simulations, the Scenario Lab, the AI advisor and the monthly briefing." },
  { q: "Is this a prediction?", a: "No. It is a simulation built from the numbers you enter. It shows what your plan does under your assumptions. It is not a forecast or a guarantee, and it does not replace professional advice." },
  { q: "Does it work for an idea I have not started?", a: "Yes. That is the point. Test the idea on paper first, then put capital behind it only if the numbers hold." },
  { q: "Who is it for?", a: "Business owners and founders in Nigeria, from a shop or a restaurant to a service business or an online store." },
];

/** Public, crawlable explanation shown to everyone below the tool. */
export default function SandboxExplainer({ signedOut }: { signedOut: boolean }) {
  return (
    <>
      <section className="border-t border-ink-line py-16 lg:py-24" aria-labelledby="sandbox-what">
        <div className="container-arch flex flex-col gap-10">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="eyebrow">What you get</p>
            <h2 id="sandbox-what" className="font-display text-3xl text-paper-white lg:text-4xl">
              Know where your business is heading, before the money is spent.
            </h2>
          </div>
          <ul className="grid gap-px border border-ink-line bg-ink-line sm:grid-cols-2 lg:grid-cols-3">
            {WHAT_YOU_GET.map((item) => (
              <li key={item.title} className="flex flex-col gap-2 bg-ink p-6">
                <h3 className="font-display text-lg text-paper-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-ash">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-ink-line py-16 lg:py-24" aria-labelledby="sandbox-how">
        <div className="container-arch flex flex-col gap-10">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="eyebrow">How it works</p>
            <h2 id="sandbox-how" className="font-display text-3xl text-paper-white lg:text-4xl">Three steps, about ten minutes.</h2>
          </div>
          <ol className="grid gap-6 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-3 border border-ink-line p-6">
                <span className="font-display text-2xl text-gold">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-display text-lg text-paper-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-ash">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-ink-line py-16 lg:py-24" aria-labelledby="sandbox-faq">
        <div className="container-arch flex max-w-3xl flex-col gap-8">
          <h2 id="sandbox-faq" className="font-display text-3xl text-paper-white lg:text-4xl">Questions owners ask</h2>
          <dl className="flex flex-col gap-6">
            {FAQ.map((f) => (
              <div key={f.q} className="flex flex-col gap-2 border-b border-ink-line pb-6">
                <dt className="font-display text-lg text-paper-white">{f.q}</dt>
                <dd className="text-sm leading-relaxed text-ash">{f.a}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-3 sm:flex-row">
            {signedOut ? (
              <Button href="/register" variant="primary" showArrow>
                Create a free account
              </Button>
            ) : null}
            <Button href="/pricing" variant="outline-dark">
              See packages
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
