import Link from "next/link";
import { blogPosts } from "@/lib/constants";

export default function BlogGrid() {
  return (
    <section className="border-b border-ink-line py-16 lg:py-24">
      <div className="container-arch">
        <div className="grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col">
              <span className="text-xs text-gold">{post.category}</span>
              <h2 className="mt-3 font-display text-xl text-paper-white group-hover:text-gold">
                {post.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ash">
                {post.excerpt}
              </p>
              <span className="mt-4 text-xs text-ash">{post.readTime}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
