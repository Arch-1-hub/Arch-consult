import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "@/components/shared/PageHero";
import AIToolForm from "@/components/ai-tools/AIToolForm";
import { aiTools, getToolBySlug } from "@/lib/ai-tools-data";

export function generateStaticParams() {
  return aiTools.map((tool) => ({ slug: tool.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const tool = getToolBySlug(params.slug);
  if (!tool) return {};
  return { title: tool.name, description: tool.description };
}

export default function AIToolPage({ params }: { params: { slug: string } }) {
  const tool = getToolBySlug(params.slug);
  if (!tool) notFound();

  return (
    <>
      <PageHero eyebrow="AI Tool" title={tool.name} description={tool.description} />
      <section className="py-16 lg:py-24">
        <div className="container-arch max-w-2xl">
          <AIToolForm tool={tool} />
        </div>
      </section>
    </>
  );
}
