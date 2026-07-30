import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { PrimaryCta } from "@/components/ui/primary-cta";
import { createClient } from "@/lib/supabase/server";
import {
  NEWS_TOPICS, NEWS_REGIONS,
  publishedArticleBySlug, publishedArticles, renderNewsBody, newsReadingMinutes,
} from "@/lib/newsroom";

const BASE = "https://www.square1ai.com";

export const dynamic = "force-dynamic";

const SERIF = 'Georgia, "Times New Roman", Times, serif';
const LEARNING_HEADING = "## What you can learn from this";

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

  // The learning section is the article's purpose — split it out of the body
  // so it renders as a distinct branded panel instead of one more H2.
  const splitAt = article.body_md.indexOf(LEARNING_HEADING);
  const reportMd = splitAt === -1 ? article.body_md : article.body_md.slice(0, splitAt);
  const learningMd = splitAt === -1 ? null : article.body_md.slice(splitAt + LEARNING_HEADING.length).trim();

  const reportHtml = renderNewsBody(reportMd);
  const learningHtml = learningMd ? renderNewsBody(learningMd) : null;
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
      {/* ── Utility bar ─────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0"><Logo variant="dark" size="sm" /></Link>
          <Link href="/newsroom"
            className="shrink-0 text-[11px] font-bold tracking-[0.12em] uppercase text-slate-600 hover:text-slate-900 transition-colors py-2">
            ← Newsroom
          </Link>
        </div>
      </div>

      <main className="px-4 sm:px-6 pb-24">
        <article className="max-w-[720px] mx-auto">
          {/* ── Headline block ──────────────────────────────────────────── */}
          <div className="pt-8 sm:pt-12">
            <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-brand">
              {NEWS_TOPICS[article.topic].label}
              <span className="text-slate-400 font-semibold tracking-normal normal-case"> · {NEWS_REGIONS[article.region].label}</span>
            </p>
            <h1 className="mt-4 text-slate-900 font-bold leading-[1.06]"
              style={{ fontFamily: SERIF, fontSize: "clamp(30px, 5vw, 52px)", textWrap: "balance" }}>
              {article.headline}
            </h1>
            {article.dek && (
              <p className="mt-5 text-lg sm:text-xl text-slate-600 leading-relaxed" style={{ fontFamily: SERIF }}>
                {article.dek}
              </p>
            )}
            <div className="mt-6 py-3.5 border-y border-slate-200 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <span className="font-bold text-slate-800">By Square 1 Newsroom</span>
              <span className="text-slate-300" aria-hidden>|</span>
              {article.published_at && (
                <time dateTime={article.published_at}>
                  {new Date(article.published_at).toLocaleDateString("en-AU", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </time>
              )}
              <span className="text-slate-300" aria-hidden>|</span>
              <span>{minutes} min read</span>
            </div>
          </div>

          {/* ── The report ──────────────────────────────────────────────── */}
          <div className="research-prose newsroom-prose mt-2"
            dangerouslySetInnerHTML={{ __html: reportHtml }} />

          {/* ── The lesson — the article's purpose, visually first-class ── */}
          {learningHtml && (
            <section aria-labelledby="learning-heading"
              className="mt-10 rounded-none border-t-4 border-brand bg-slate-50 px-6 sm:px-8 py-7">
              <div className="flex items-center gap-2.5 mb-1">
                <GraduationCap className="h-5 w-5 text-brand shrink-0" aria-hidden />
                <h2 id="learning-heading"
                  className="text-xl sm:text-2xl font-bold text-slate-900"
                  style={{ fontFamily: SERIF }}>
                  What you can learn from this
                </h2>
              </div>
              <div className="research-prose newsroom-prose"
                dangerouslySetInnerHTML={{ __html: learningHtml }} />
              {courses.length > 0 && (
                <div className="mt-5 pt-5 border-t border-slate-200">
                  <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-slate-500 mb-3">
                    We teach this
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {courses.map((c) => (
                      <Link key={c.slug} href={`/courses/${c.slug}`}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:border-brand hover:text-brand transition-colors">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color ?? "#0056CE" }} aria-hidden />
                        {c.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Fallback placement when the article has no learning section */}
          {!learningHtml && courses.length > 0 && (
            <div className="mt-10 pt-5 border-t border-slate-200">
              <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-slate-500 mb-3">We teach this</p>
              <div className="flex flex-wrap gap-2">
                {courses.map((c) => (
                  <Link key={c.slug} href={`/courses/${c.slug}`}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:border-brand hover:text-brand transition-colors">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color ?? "#0056CE" }} aria-hidden />
                    {c.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Sources ─────────────────────────────────────────────────── */}
          {article.sources.length > 0 && (
            <section className="mt-10 pt-5 border-t border-slate-200" aria-label="Sources">
              <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-slate-500 mb-3">
                Sources
              </p>
              <ul className="space-y-2">
                {article.sources.map((s, i) => (
                  <li key={i} className="text-sm leading-snug">
                    <a href={s.url} target="_blank" rel="noopener noreferrer"
                      className="font-semibold text-slate-800 underline decoration-slate-300 underline-offset-2 hover:text-brand hover:decoration-brand transition-colors">
                      {s.title}
                    </a>
                    <span className="text-slate-500"> — {s.outlet}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-slate-400">
                Our reporting is an original summary; full coverage is at the links above.
              </p>
            </section>
          )}

          {/* ── End rule ────────────────────────────────────────────────── */}
          <div className="mt-12 flex items-center justify-center gap-2.5" aria-hidden>
            <span className="w-1.5 h-1.5 rounded-[2px]" style={{ background: "#3388FF" }} />
            <span className="w-1.5 h-1.5 rounded-[2px]" style={{ background: "#0056CE" }} />
            <span className="w-1.5 h-1.5 rounded-[2px]" style={{ background: "#01224F" }} />
          </div>

          {/* ── CTA ─────────────────────────────────────────────────────── */}
          <div className="mt-12 border-y-2 border-slate-900 py-9 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: SERIF }}>
              Don&apos;t just read about it — build it.
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
              Square 1 teaches the skills behind the headlines, with every line of your work
              graded by AI. Find your starting point in 3 minutes.
            </p>
            <PrimaryCta href="/diagnostic">Get your free skill report</PrimaryCta>
          </div>

          {/* ── Related ─────────────────────────────────────────────────── */}
          {related.length > 0 && (
            <section className="mt-12" aria-label={`More in ${NEWS_TOPICS[article.topic].label}`}>
              <h2 className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-900 pb-3 border-b-2 border-slate-900 mb-1">
                More in {NEWS_TOPICS[article.topic].label}
              </h2>
              <ul>
                {related.map((r) => (
                  <li key={r.slug} className="border-b border-slate-200 last:border-b-0">
                    <Link href={`/newsroom/${r.slug}`} className="group block py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm">
                      <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-brand transition-colors"
                        style={{ fontFamily: SERIF }}>
                        {r.headline}
                      </h3>
                      {r.dek && <p className="mt-1 text-[13px] text-slate-500 leading-relaxed line-clamp-1">{r.dek}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
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
