import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { PrimaryCta } from "@/components/ui/primary-cta";
import { createClient } from "@/lib/supabase/server";
import {
  NEWS_TOPICS, NEWS_REGIONS,
  publishedArticleBySlug, publishedArticles, renderNewsBody, newsReadingMinutes,
} from "@/lib/newsroom";

const BASE = "https://square1-tutor.vercel.app";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await publishedArticleBySlug(slug);
  if (!article) return { title: "Story not found — Square 1 AI Newsroom" };
  return {
    title: `${article.headline} — Square 1 AI Newsroom`,
    description: article.dek ?? article.headline,
    alternates: { canonical: `${BASE}/newsroom/${article.slug}` },
    openGraph: {
      title: article.headline,
      description: article.dek ?? article.headline,
      url: `${BASE}/newsroom/${article.slug}`,
      type: "article",
      publishedTime: article.published_at ?? undefined,
    },
  };
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await publishedArticleBySlug(slug);
  if (!article) notFound();

  const html = renderNewsBody(article.body_md);
  const minutes = newsReadingMinutes(article.body_md);

  // "We teach this" — resolve the linked courses (visible ones only).
  let courses: { slug: string; title: string; color: string | null }[] = [];
  if (article.course_slugs.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("courses")
      .select("slug, title, color")
      .in("slug", article.course_slugs)
      .eq("status", "active");
    courses = data ?? [];
  }

  const related = (await publishedArticles({ topic: article.topic, limit: 4 }))
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  return (
    <div className="min-h-dvh bg-white">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 sm:px-8 py-5">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <Link href="/newsroom" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          ← Newsroom
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 sm:px-8 pb-24">
        {/* Kicker + headline */}
        <div className="pt-6 sm:pt-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold tracking-[0.25em] uppercase">
            <span className="text-brand">{NEWS_TOPICS[article.topic].label}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden />
            <span className="text-slate-500">{NEWS_REGIONS[article.region].label}</span>
          </div>
          <h1 className="mt-5 font-black tracking-tight text-slate-900 leading-[1.02]"
            style={{ fontSize: "clamp(26px, 4vw, 46px)" }}>
            {article.headline}
          </h1>
          {article.dek && (
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">{article.dek}</p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pb-6 border-b border-slate-200">
            <span className="font-semibold text-slate-700">Square 1 AI Newsroom</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden />
            {article.published_at && (
              <time dateTime={article.published_at}>
                {new Date(article.published_at).toLocaleDateString("en-AU", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </time>
            )}
            <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden />
            <span>{minutes} min read</span>
          </div>
        </div>

        {/* Body — our own editorial summary, reviewed before publish */}
        <article className="research-prose" dangerouslySetInnerHTML={{ __html: html }} />

        {/* We teach this */}
        {courses.length > 0 && (
          <div className="mt-10 rounded-2xl border border-brand/20 p-5"
            style={{ background: "linear-gradient(135deg, rgba(0,86,206,0.05) 0%, #FFFFFF 70%)" }}>
            <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-3">
              We teach this
            </p>
            <div className="flex flex-wrap gap-2">
              {courses.map((c) => (
                <Link key={c.slug} href={`/courses/${c.slug}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:border-brand/40 hover:text-brand transition-colors">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color ?? "#0056CE" }} aria-hidden />
                  {c.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sources — the outlets that reported this first, credited and linked */}
        {article.sources.length > 0 && (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-3">
              Sources
            </p>
            <ul className="space-y-2">
              {article.sources.map((s, i) => (
                <li key={i} className="text-sm leading-snug">
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                    className="font-semibold text-slate-800 hover:text-brand transition-colors">
                    {s.title}
                  </a>
                  <span className="text-slate-500"> — {s.outlet}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-slate-400">
              Our summary is original; full reporting is at the links above.
            </p>
          </div>
        )}

        {/* End divider — three brand squares, matching the research section */}
        <div className="mt-12 flex items-center justify-center gap-2.5" aria-hidden>
          <span className="w-1.5 h-1.5 rounded-[2px]" style={{ background: "#3388FF" }} />
          <span className="w-1.5 h-1.5 rounded-[2px]" style={{ background: "#0056CE" }} />
          <span className="w-1.5 h-1.5 rounded-[2px]" style={{ background: "#01224F" }} />
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-3xl border border-slate-200 p-8 text-center"
          style={{ background: "linear-gradient(135deg, rgba(0,86,206,0.05) 0%, #FFFFFF 60%)" }}>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
            Don&apos;t just read about it — build it.
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            Square 1 teaches the skills behind the headlines, with every line of your work
            graded by AI. Find your starting point in 3 minutes.
          </p>
          <PrimaryCta href="/diagnostic">Get your free skill report</PrimaryCta>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-5">
              More in {NEWS_TOPICS[article.topic].label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.slug} href={`/newsroom/${r.slug}`}
                  className="group rounded-2xl border border-slate-200 p-5 transition-all hover:-translate-y-0.5 hover:border-brand/30 bg-white">
                  <p className="text-sm font-bold text-slate-900 leading-snug group-hover:text-brand transition-colors">
                    {r.headline}
                  </p>
                  <span className="mt-3 inline-block text-xs font-bold" style={{ color: "#0056CE" }}>
                    Read →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* NewsArticle structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: article.headline,
            description: article.dek ?? article.headline,
            datePublished: article.published_at,
            url: `${BASE}/newsroom/${article.slug}`,
            author: { "@type": "Organization", name: "Square 1 AI Newsroom", url: BASE },
            publisher: { "@type": "Organization", name: "Square 1 AI", url: BASE },
            citation: article.sources.map((s) => s.url),
          }),
        }}
      />
    </div>
  );
}
