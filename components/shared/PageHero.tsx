export default function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="border-b border-ink-line py-16 lg:py-24">
      <div className="container-arch">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-paper-white sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ash">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
