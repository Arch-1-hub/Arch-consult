import Link from "next/link";
import { insightsPreview } from "@/lib/constants";
import Button from "@/components/ui/Button";

export default function InsightsPreview() {
  return (
    <section className="border-b border-ink-line py-20 lg:py-28">
      <div className="container-arch">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">Insights</p>
            <h2 className="mt-4 max-w-lg font-display text-3xl text-paper-white sm:text-4xl">
              Strategy notes, not marketing filler.
            </h2>
          </div>
          <Button href="/blog" variant="outline-dark" showArrow>
            Read all insights
          </Button>
        </div>

        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {insightsPreview.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col"
            >
              <span className="text-xs text-gold">{post.category}</span>
              <h3 className="mt-3 font-display text-xl text-paper-white group-hover:text-gold">
                {post.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ash">
                {post.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
