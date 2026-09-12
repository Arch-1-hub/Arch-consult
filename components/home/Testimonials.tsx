import { testimonials } from "@/lib/constants";

export default function Testimonials() {
  return (
    <section className="border-b border-ink-line py-20 lg:py-28">
      <div className="container-arch">
        <p className="eyebrow">Client Results</p>
        <h2 className="mt-4 max-w-lg font-display text-3xl text-paper-white sm:text-4xl">
          What working with Arch Consult actually changes.
        </h2>

        <div className="mt-14 grid gap-10 border-t border-ink-line pt-12 lg:grid-cols-3 lg:gap-8">
          {testimonials.map((t) => (
            <figure key={t.name} className="flex flex-col">
              <blockquote className="font-display text-lg leading-snug text-paper-white">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 text-sm text-ash">
                <span className="text-paper-white">{t.name}</span>
                <span className="block">{t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
