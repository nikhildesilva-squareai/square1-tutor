import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GraduationCap, Wrench } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ArticleArt } from "@/components/newsroom/ArticleArt";
import { ConceptDiagram } from "@/components/newsroom/ConceptDiagram";
import { PrimaryCta } from "@/components/ui/primary-cta";
import { createClient } from "@/lib/supabase/server";
import {
  NEWS_TOPICS, NEWS_REGIONS,
  publishedArticleBySlug, publishedArticles, renderNewsBody, newsReadingMinutes, parseDiagram,
} from "@/lib/newsroom";

const BASE = "https://www.square1ai.com";
const LEARNING_HEADING = "## What you can learn from this";
// The third act: the story, then the lesson, then what to actually do on
// Monday. Split out like the learning section so it renders as its own panel
// rather than disappearing into the prose.
const PRACTICE_HEADING = "## How to use this in practice";

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

  // The learning section is the article's purpose — split it out of the body
  // so it renders as a distinct branded panel instead of one more H2.
  const splitAt = article.body_md.indexOf(LEARNING_HEADING);
  const reportMd = splitAt === -1 ? article.body_md : article.body_md.slice(0, splitAt);
  const afterLearning = splitAt === -1 ? null : article.body_md.slice(splitAt + LEARNING_HEADING.length);

  // Practice section is optional — older articles predate it and render exactly
  // as they did before.
  const practiceAt = afterLearning?.indexOf(PRACTICE_HEADING) ?? -1;
  const learningMd = afterLearning === null
    ? null
    : (practiceAt === -1 ? afterLearning : afterLearning.slice(0, practiceAt)).trim();
  const practiceMd = afterLearning !== null && practiceAt !== -1
    ? afterLearning.slice(practiceAt + PRACTICE_HEADING.length).trim()
    : null;

  // Pull quote: the sharpest line of "Why it matters" — that section exists to
  // state the significance, so its opening sentence is the article's thesis.
  // Only used when it's a well-formed sentence of a readable length; otherwise
  // the article simply renders without one.
  const whyIdx = reportMd.indexOf("## Why it matters");
  const pullQuote = (() => {
    if (whyIdx === -1) return null;
    const section = reportMd.slice(whyIdx + "## Why it matters".length).trim();
    const first = section.split(/(?<=[.!?])\s+/)[0]?.trim() ?? "";
    return first.length >= 60 && first.length <= 190 ? first : null;
  })();

  // Re-validated on read, not trusted from the DB: the shape is jsonb, so a bad
  // row (hand-edited, or written before the validator) renders nothing.
  const diagram = parseDiagram(article.diagram);

  const reportHtml = renderNewsBody(reportMd);
  const learningHtml = learningMd ? renderNewsBody(learningMd) : null;
  const practiceHtml = practiceMd ? renderNewsBody(practiceMd) : null;
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

  const courseChips = (
    <div className="flex flex-wrap gap-2">
      {courses.map((c) => (
        <Link key={c.slug} href={`/courses/${c.slug}`}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:border-brand/40 hover:text-brand transition-colors">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color ?? "#0056CE" }} aria-hidden />
          {c.title}
        </Link>
      ))}
    </div>
  );

  return (
    <div className="min-h-dvh bg-white">
      {/* ── Utility bar ─────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0"><Logo variant="dark" size="sm" /></Link>
          <Link href="/newsroom"
            className="shrink-0 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors py-1.5">
            ← Newsroom
          </Link>
        </div>
      </div>

      <main className="px-6 sm:px-8 pb-24">
        {/* 660px ≈ 66 characters at the body size — the readable measure.
              720 was running ~78, past the comfortable band. */}
        <article className="max-w-[660px] mx-auto">
          {/* ── Headline block ──────────────────────────────────────────── */}
          <div className="pt-8 sm:pt-12">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-bold tracking-wider uppercase">
              <span className="px-2.5 py-1 rounded-full bg-brand/10 text-brand">
                {NEWS_TOPICS[article.topic].label}
              </span>
              <span className="text-slate-400">{NEWS_REGIONS[article.region].label}</span>
            </div>
            <h1 className="mt-4 font-black tracking-tight text-slate-900 leading-[1.05]"
              style={{ fontSize: "clamp(28px, 4.4vw, 46px)", letterSpacing: "-0.02em", textWrap: "balance" }}>
              {article.headline}
            </h1>
            {article.dek && (
              <p className="mt-5 text-[19px] sm:text-[22px] font-light text-slate-500 leading-[1.45]"
                style={{ textWrap: "pretty" }}>
                {article.dek}
              </p>
            )}
            <div className="mt-6 pb-6 border-b border-slate-200 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500"
              style={{ fontVariantNumeric: "tabular-nums" }}>
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

          {/* ── Cover art ───────────────────────────────────────────────── */}
          <div className="mt-7 aspect-[16/7] w-full overflow-hidden rounded-2xl">
            <ArticleArt slug={article.slug} topic={article.topic} label={article.headline} variant="hero" />
          </div>

          {/* ── The report — same prose system as /research ──────────────── */}
          <div className="research-prose newsroom-body" dangerouslySetInnerHTML={{ __html: reportHtml }} />

          {/* ── Pull quote — breaks the grey, restates the significance ──── */}
          {pullQuote && (
            <p className="newsroom-pullquote">{pullQuote}</p>
          )}

          {/* ── Teaching diagram — the mechanism, when the story has one ─── */}
          {diagram && <ConceptDiagram diagram={diagram} />}

          {/* ── The lesson — the article's purpose, visually first-class ── */}
          {learningHtml && (
            <section aria-labelledby="learning-heading"
              className="mt-10 rounded-3xl border border-brand/20 p-6 sm:p-7"
              style={{ background: "linear-gradient(135deg, rgba(0,86,206,0.05) 0%, #FFFFFF 70%)" }}>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-4 w-4 text-brand" aria-hidden />
                </span>
                <h2 id="learning-heading" className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                  What you can learn from this
                </h2>
              </div>
              <div className="research-prose newsroom-learning"
                dangerouslySetInnerHTML={{ __html: learningHtml }} />
              {courses.length > 0 && (
                <div className="mt-5 pt-5 border-t border-brand/15">
                  <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-slate-500 mb-3">
                    We teach this
                  </p>
                  {courseChips}
                </div>
              )}
            </section>
          )}

          {/* ── Practice — what to actually do with it ───────────────────── */}
          {practiceHtml && (
            <section aria-labelledby="practice-heading"
              className="mt-6 rounded-3xl border border-slate-200 bg-surface-soft p-6 sm:p-7">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-8 h-8 rounded-xl bg-slate-900/[0.06] flex items-center justify-center shrink-0">
                  <Wrench className="h-4 w-4 text-slate-700" aria-hidden />
                </span>
                <h2 id="practice-heading" className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                  How to use this in practice
                </h2>
              </div>
              <div className="research-prose newsroom-learning"
                dangerouslySetInnerHTML={{ __html: practiceHtml }} />
            </section>
          )}

          {/* Fallback placement when the article has no learning section */}
          {!learningHtml && courses.length > 0 && (
            <div className="mt-10 rounded-2xl border border-brand/20 p-5"
              style={{ background: "linear-gradient(135deg, rgba(0,86,206,0.05) 0%, #FFFFFF 70%)" }}>
              <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-slate-500 mb-3">We teach this</p>
              {courseChips}
            </div>
          )}

          {/* ── Sources ─────────────────────────────────────────────────── */}
          {article.sources.length > 0 && (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-surface-soft p-5" aria-label="Sources">
              <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-slate-500 mb-3">
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
                Our reporting is an original summary; full coverage is at the links above.
              </p>
            </section>
          )}

          {/* ── End rule — the three brand squares, as in /research ──────── */}
          <div className="mt-12 flex items-center justify-center gap-2.5" aria-hidden>
            <span className="w-1.5 h-1.5 rounded-[2px]" style={{ background: "#3388FF" }} />
            <span className="w-1.5 h-1.5 rounded-[2px]" style={{ background: "#0056CE" }} />
            <span className="w-1.5 h-1.5 rounded-[2px]" style={{ background: "#01224F" }} />
          </div>

          {/* ── CTA ─────────────────────────────────────────────────────── */}
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

          {/* ── Related ─────────────────────────────────────────────────── */}
          {related.length > 0 && (
            <section className="mt-14" aria-label={`More in ${NEWS_TOPICS[article.topic].label}`}>
              <h2 className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-5">
                More in {NEWS_TOPICS[article.topic].label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link key={r.slug} href={`/newsroom/${r.slug}`}
                    className="group rounded-2xl border border-slate-200 p-5 transition-all hover:-translate-y-0.5 hover:border-brand/30 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                    <p className="text-sm font-bold text-slate-900 leading-snug group-hover:text-brand transition-colors">
                      {r.headline}
                    </p>
                    <span className="mt-3 inline-block text-xs font-bold" style={{ color: "#0056CE" }}>
                      Read →
                    </span>
                  </Link>
                ))}
              </div>
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
