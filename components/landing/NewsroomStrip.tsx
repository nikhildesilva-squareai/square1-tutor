import Link from "next/link";
import { NEWS_TOPICS, publishedArticles, newsReadingMinutes } from "@/lib/newsroom";

// ═══════════════════════════════════════════════════════════════════════════════
// "Today in technology" — landing-page strip in the newsroom's editorial style
// (serif headlines, newspaper rules). Server component; renders NOTHING until
// at least one article is published, so the landing page never shows an empty
// news section.
// ═══════════════════════════════════════════════════════════════════════════════

const SERIF = 'Georgia, "Times New Roman", Times, serif';

export async function NewsroomStrip() {
  const articles = await publishedArticles({ limit: 3 });
  if (articles.length === 0) return null;

  return (
    <section className="relative bg-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-14 sm:py-18">
        <div className="flex items-end justify-between gap-4 pb-4 border-b-2 border-slate-900 mb-2">
          <div>
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-brand font-bold">
              Newsroom
            </span>
            <h2 className="mt-1.5 font-bold tracking-tight text-slate-900 leading-tight"
              style={{ fontFamily: SERIF, fontSize: "clamp(24px, 3vw, 36px)" }}>
              Today in technology
            </h2>
          </div>
          <Link href="/newsroom" className="shrink-0 text-xs sm:text-sm font-bold text-brand hover:underline pb-1">
            All stories →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8">
          {articles.map((a) => (
            <article key={a.id} className="border-b sm:border-b-0 border-slate-200 last:border-b-0">
              <Link href={`/newsroom/${a.slug}`}
                className="group block py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm">
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-brand mb-2">
                  {NEWS_TOPICS[a.topic].label}
                </p>
                <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-brand transition-colors"
                  style={{ fontFamily: SERIF, textWrap: "balance" }}>
                  {a.headline}
                </h3>
                {a.dek && <p className="mt-2 text-[13px] text-slate-600 leading-relaxed line-clamp-2">{a.dek}</p>}
                <p className="mt-2.5 text-[11px] font-semibold text-slate-400">
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
