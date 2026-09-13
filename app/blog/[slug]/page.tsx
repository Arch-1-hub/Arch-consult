import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { blogPosts } from "@/lib/constants";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) notFound();

  return (
    <article className="py-16 lg:py-24">
      <div className="container-arch max-w-2xl">
        <Link href="/blog" className="text-xs text-ash hover:text-gold">
          ← Back to Insights
        </Link>

        <p className="eyebrow mt-8">{post.category}</p>
        <h1 className="mt-4 font-display text-3xl leading-tight text-paper-white sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-xs text-ash">
          {formatDate(post.date)} · {post.readTime}
        </p>

        <div className="mt-10 flex flex-col gap-5 border-t border-ink-line pt-10">
          {post.content.map((paragraph, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-ash">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-14 border-t border-ink-line pt-10">
          <p className="text-sm text-paper-white">
            Want this applied to your business specifically?
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button href="/book-consultation" showArrow>
              Book a Consultation
            </Button>
            <Button href="/ai-consultant" variant="outline-dark">
              Ask the AI Consultant
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
