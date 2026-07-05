import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { RESEARCH_ARTICLES } from "@/lib/research";
import { getReadingMinutes } from "@/lib/research-content";

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
        </div>

        {/* Article grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={`/research/${a.slug}`}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-brand/30"
              style={{ boxShadow: "0 4px 20px rgba(15,28,49,0.05)" }}
            >
              <span className="text-[9px] tracking-[0.2em] uppercase font-bold self-start px-2 py-1 rounded-full mb-4"
                style={{ background: "rgba(0,86,206,0.07)", color: "#0056CE" }}>
                {a.topic}
              </span>
              <h2 className="text-lg font-black text-slate-900 leading-snug mb-2 group-hover:text-brand transition-colors">
                {a.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed flex-1">{a.description}</p>
              <span className="mt-5 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: "#0056CE" }}>
                  Read the article
                  <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
                </span>
                {getReadingMinutes(a.slug) && (
                  <span className="text-slate-400 font-medium">{getReadingMinutes(a.slug)} min read</span>
                )}
              </span>
            </Link>
          ))}
        </div>
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
