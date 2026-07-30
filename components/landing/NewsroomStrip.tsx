import Link from "next/link";
import { NEWS_TOPICS, NEWS_REGIONS, publishedArticles, newsReadingMinutes } from "@/lib/newsroom";

// ═══════════════════════════════════════════════════════════════════════════════
// "Today in technology" — landing-page strip, styled with the same card system
// as the rest of the landing page. Server component; renders NOTHING until at
// least one article is published, so the page never shows an empty section.
// ═══════════════════════════════════════════════════════════════════════════════

export async function NewsroomStrip() {
  const articles = await publishedArticles({ limit: 3 });
  if (articles.length === 0) return null;

  return (
    <section className="relative bg-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-14 sm:py-18">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              Newsroom
            </span>
            <h2 className="mt-2 font-black tracking-tight text-slate-900 leading-tight"
              style={{ fontSize: "clamp(22px, 2.8vw, 34px)", letterSpacing: "-0.02em" }}>
              Today in technology
            </h2>
          </div>
          <Link href="/newsroom" className="shrink-0 text-xs sm:text-sm font-bold text-brand hover:underline">
            All stories →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {articles.map((a) => (
            <article key={a.id}>
              <Link href={`/newsroom/${a.slug}`}
                className="group h-full flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_12px_30px_rgba(0,86,206,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold tracking-wider uppercase mb-2.5">
                  <span className="text-brand">{NEWS_TOPICS[a.topic].label}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden />
                  <span className="text-slate-400">{NEWS_REGIONS[a.region].short}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-brand transition-colors"
                  style={{ textWrap: "balance" }}>
                  {a.headline}
                </h3>
                {a.dek && <p className="mt-2 text-[13px] text-slate-500 leading-relaxed line-clamp-2">{a.dek}</p>}
                <p className="mt-auto pt-3 text-[11px] font-semibold text-slate-400">
                  {newsReadingMinutes(a.body_md)} min read
                </p>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
