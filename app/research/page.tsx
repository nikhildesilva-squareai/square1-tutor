import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { RESEARCH_ARTICLES } from "@/lib/research";
import { getReadingMinutes } from "@/lib/research-content";
import { ResearchIndex, type ResearchCard } from "@/components/research/ResearchIndex";

const BASE = "https://square1-tutor.vercel.app";

export const metadata: Metadata = {
  title: "Research — Square 1 AI",
  description:
    "Research and analysis from the Square 1 AI team: AI safety, security, LLMs and agents, healthcare AI, and the future of technical education.",
  alternates: { canonical: `${BASE}/research` },
  openGraph: {
    title: "Research — Square 1 AI",
    description:
      "Research and analysis from the Square 1 AI team across AI safety, security, LLMs, agents, and applied machine learning.",
    url: `${BASE}/research`,
    type: "website",
  },
};

export default function ResearchIndexPage() {
  // Newest first, stable within a day by title
  const articles = [...RESEARCH_ARTICLES].sort(
    (a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title),
  );
  // Plain serialisable cards for the client (filtering + featured live there);
  // reading minutes come from fs so they must be resolved server-side.
  const cards: ResearchCard[] = articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    description: a.description,
    topic: a.topic,
    published: a.published,
    minutes: getReadingMinutes(a.slug),
  }));
  const totalMinutes = cards.reduce((s, c) => s + (c.minutes ?? 0), 0);
  const topicCount = new Set(cards.map((c) => c.topic)).size;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 40%,#F4F8FF 100%)" }}>
      {/* Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 sm:px-8 py-5">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <Link href="/diagnostic" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          Free skill check →
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 sm:px-8 pb-24">
        {/* Heading */}
        <div className="max-w-2xl pt-10 sm:pt-16 mb-12 sm:mb-16">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Research
          </span>
          <h1 className="mt-4 font-black tracking-tight text-slate-900 leading-[0.98]"
            style={{ fontSize: "clamp(32px, 5vw, 60px)" }}>
            Written by the team{" "}
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              building Square 1.
            </span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
            Papers and reports from the Square 1 AI team on the systems we build and teach —
            AI safety, security, LLMs and agents, and applied machine learning.
          </p>
          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold tracking-wide uppercase text-slate-400">
            <span className="text-slate-700">{cards.length} papers</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden />
            <span className="text-slate-700">{topicCount} topics</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden />
            <span className="text-slate-700">~{Math.round(totalMinutes / 60)} hours of reading</span>
          </p>
        </div>

        {/* Featured paper + topic filter + grid */}
        <ResearchIndex articles={cards} />
      </main>

      {/* CollectionPage structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Square 1 AI Research",
            url: `${BASE}/research`,
            hasPart: articles.map((a) => ({
              "@type": "Article",
              headline: a.title,
              url: `${BASE}/research/${a.slug}`,
            })),
          }),
        }}
      />
    </div>
  );
}
