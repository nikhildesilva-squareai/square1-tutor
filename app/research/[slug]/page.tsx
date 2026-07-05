import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { PrimaryCta } from "@/components/ui/primary-cta";
import { RESEARCH_ARTICLES, getArticle } from "@/lib/research";
import { getArticleHtml } from "@/lib/research-content";

const BASE = "https://square1-tutor.vercel.app";

export function generateStaticParams() {
  return RESEARCH_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} — Square 1 AI Research`,
    description: article.description,
    alternates: { canonical: `${BASE}/research/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      url: `${BASE}/research/${article.slug}`,
      type: "article",
      publishedTime: article.published,
      authors: ["Square 1 AI Research Team"],
    },
  };
}

export default async function ResearchArticlePage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const body = getArticleHtml(article.slug);
  const related = RESEARCH_ARTICLES
    .filter((a) => a.topic === article.topic && a.slug !== article.slug)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="max-w-4xl mx-auto flex items-center justify-between px-6 sm:px-8 py-5">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <Link href="/research" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          ← All research
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 sm:px-8 pb-24">
        {/* Article header */}
        <div className="pt-8 sm:pt-12 mb-10">
          <span className="text-[9px] tracking-[0.2em] uppercase font-bold px-2 py-1 rounded-full"
            style={{ background: "rgba(0,86,206,0.07)", color: "#0056CE" }}>
            {article.topic}
          </span>
          <h1 className="mt-5 font-black tracking-tight text-slate-900 leading-[1.02]"
            style={{ fontSize: "clamp(28px, 4.5vw, 52px)" }}>
            {article.title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            {article.description}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pb-6 border-b border-slate-200">
            <span className="font-semibold text-slate-700">Square 1 AI Research Team</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <time dateTime={article.published}>
              {new Date(`${article.published}T00:00:00Z`).toLocaleDateString("en-AU", {
                year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
              })}
            </time>
            {body && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>{body.readingMinutes} min read</span>
              </>
            )}
          </div>
        </div>

        {/* Full article body — server-rendered from the markdown source */}
        {body ? (
          <article
            className="research-prose"
            dangerouslySetInnerHTML={{ __html: body.html }}
          />
        ) : (
          <p className="text-sm text-slate-600">
            The full text of this paper is being prepared — check back shortly.
          </p>
        )}

        {/* CTA — research readers are exactly the learners we want */}
        <div className="mt-14 rounded-3xl border border-slate-200 p-8 text-center"
          style={{ background: "linear-gradient(135deg, rgba(0,86,206,0.05) 0%, #FFFFFF 60%)" }}>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
            Want to build systems like this?
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            Square 1 teaches AI, security, and machine learning by building — every line of
            your code reviewed by AI. Find your starting point in 3 minutes.
          </p>
          <PrimaryCta href="/diagnostic">Get your free skill report</PrimaryCta>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-5">
              More in {article.topic}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.slug} href={`/research/${r.slug}`}
                  className="group rounded-2xl border border-slate-200 p-5 transition-all hover:-translate-y-0.5 hover:border-brand/30 bg-white">
                  <p className="text-sm font-bold text-slate-900 leading-snug group-hover:text-brand transition-colors">
                    {r.title}
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

      {/* Article structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.description,
            datePublished: article.published,
            url: `${BASE}/research/${article.slug}`,
            ...(body ? { wordCount: body.wordCount } : {}),
            author: { "@type": "Organization", name: "Square 1 AI Research Team", url: BASE },
            publisher: { "@type": "Organization", name: "Square 1 AI", url: BASE },
          }),
        }}
      />
    </div>
  );
}
