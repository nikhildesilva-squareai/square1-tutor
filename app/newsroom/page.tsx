import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ArticleArt } from "@/components/newsroom/ArticleArt";
import { CoveragePanel } from "@/components/newsroom/CoveragePanel";
import {
  NEWS_TOPICS, NEWS_REGIONS, isNewsTopic, isNewsRegion,
  publishedArticles, publishedCounts, newsReadingMinutes,
} from "@/lib/newsroom";

const BASE = "https://www.square1ai.com";

// The one Square 1 headline gradient, same as the landing page and /research.
const BRAND_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

export const metadata: Metadata = {
  title: "Newsroom — Square 1 AI",
  description:
    "Daily technology news from the Square 1 AI newsroom: AI, cybersecurity, cloud, quantum, machine learning and data — what happened, why it matters, and what you can learn from it.",
  alternates: { canonical: `${BASE}/newsroom` },
  openGraph: {
    title: "Newsroom — Square 1 AI",
    description: "Daily technology news — what happened, why it matters, and what you can learn from it.",
    url: `${BASE}/newsroom`,
    type: "website",
  },
};

// News is fresh by definition — always render against the live table.
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ topic?: string; region?: string }>;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

/** The one filter control for this page — same pill as /research, so the two
 * public sections read as one product. A zero count stays visible but dimmed:
 * an empty section is information, not something to hide. */
function FilterChip({ href, active, label, count }: {
  href: string; active: boolean; label: string; count: number;
}) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined}
      className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
      style={active
        ? { background: BRAND_GRADIENT, color: "#FFF", boxShadow: "0 4px 14px rgba(0,86,206,0.25)" }
        : { background: "#FFF", color: count === 0 ? "#94A3B8" : "#475569", border: "1px solid #E2E8F0" }}>
      {label}{" "}
      <span className={active ? "opacity-70" : "text-slate-400"} style={{ fontVariantNumeric: "tabular-nums" }}>
        {count}
      </span>
    </Link>
  );
}

export default async function NewsroomPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const topic = isNewsTopic(params.topic) ? params.topic : undefined;
  const region = isNewsRegion(params.region) ? params.region : undefined;
  const [articles, counts] = await Promise.all([
    publishedArticles({ topic, region }),
    publishedCounts(),
  ]);

  // Filter links keep the OTHER dimension's selection so they compose.
  const topicHref = (t?: string) => {
    const q = new URLSearchParams();
    if (t) q.set("topic", t);
    if (region) q.set("region", region);
    const s = q.toString();
    return `/newsroom${s ? `?${s}` : ""}`;
  };
  const regionHref = (r?: string) => {
    const q = new URLSearchParams();
    if (topic) q.set("topic", topic);
    if (r) q.set("region", r);
    const s = q.toString();
    return `/newsroom${s ? `?${s}` : ""}`;
  };

  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const [lead, ...rest] = articles;
  // Front-page split: a right-hand "Latest" rail when there's enough to fill it.
  const latest = rest.slice(0, 5);
  const remainder = rest.slice(5);

  return (
    // Same page wash as /research, so the newsroom reads as one of our sections.
    <div className="min-h-dvh" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 40%,#F4F8FF 100%)" }}>
      {/* ── Utility bar ─────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0"><Logo variant="dark" size="sm" /></Link>
          <p className="hidden md:block text-[11px] font-semibold text-slate-400">{today}</p>
          <Link href="/diagnostic"
            className="shrink-0 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors py-1.5">
            Free skill check →
          </Link>
        </div>
      </div>

      {/* ── Masthead ────────────────────────────────────────────────────── */}
      <header className="max-w-6xl mx-auto px-6 sm:px-8 pt-8 sm:pt-10 pb-6">
        <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
          Newsroom
        </span>
        <h1 className="mt-3 font-black tracking-tight text-slate-900 leading-[0.98] max-w-3xl"
          style={{ fontSize: "clamp(32px, 4.6vw, 56px)", letterSpacing: "-0.02em" }}>
          Technology news,{" "}
          <span style={{
            background: BRAND_GRADIENT,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            explained for learners.
          </span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
          What happened in AI, security, cloud and data — and what you can actually learn from it.{" "}
          <Link href="/newsroom/standards" className="text-brand font-semibold hover:underline">
            How we report →
          </Link>
        </p>
      </header>

      {/* ── Filters ──────────────────────────────────────────────────────
          Sections and Editions do the same job — narrow the list — so they use
          the SAME control: the site's filter pill (as on /research), active =
          brand gradient. Hierarchy comes from order and the row label, not from
          two different widgets. Counts are unfiltered, so a chip tells you how
          many stories it holds before you click it. */}
      <div className="sticky top-0 z-30 border-y border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-3 flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <span className="shrink-0 w-[58px] text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400">
              Sections
            </span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5"
              role="group" aria-label="Filter by section">
              <FilterChip href={topicHref()} active={!topic} label="Front Page" count={counts.total} />
              {(Object.keys(NEWS_TOPICS) as (keyof typeof NEWS_TOPICS)[]).map((t) => (
                <FilterChip key={t} href={topicHref(t)} active={topic === t}
                  label={NEWS_TOPICS[t].label} count={counts.byTopic[t] ?? 0} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="shrink-0 w-[58px] text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400">
              Editions
            </span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5"
              role="group" aria-label="Filter by edition">
              <FilterChip href={regionHref()} active={!region} label="All editions" count={counts.total} />
              {(Object.keys(NEWS_REGIONS) as (keyof typeof NEWS_REGIONS)[]).map((r) => (
                <FilterChip key={r} href={regionHref(r)} active={region === r}
                  label={NEWS_REGIONS[r].short} count={counts.byRegion[r] ?? 0} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 sm:px-8 pb-24">
        {articles.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-10 text-center max-w-xl mx-auto">
            <p className="text-sm font-bold text-slate-900 mb-1">Nothing here yet</p>
            <p className="text-sm text-slate-500">
              {topic || region
                ? "No stories in this section yet — try the front page."
                : "The newsroom publishes daily. The first stories are on their way."}
            </p>
          </div>
        ) : (
          <>
            {/* ── Above the fold: lead + latest rail ─────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pt-6">
              {/* Lead story */}
              {lead && (
                <article className={latest.length > 0 ? "lg:col-span-8" : "lg:col-span-12"}>
                  <Link href={`/newsroom/${lead.slug}`}
                    className="group block h-full rounded-3xl border border-slate-200 bg-white overflow-hidden transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_16px_40px_rgba(0,86,206,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                  <div className="aspect-[16/7] w-full overflow-hidden">
                    <ArticleArt slug={lead.slug} topic={lead.topic} label={lead.headline} />
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-bold tracking-wider uppercase mb-3">
                      <span className="px-2.5 py-1 rounded-full bg-brand/10 text-brand">
                        {NEWS_TOPICS[lead.topic].label}
                      </span>
                      <span className="text-slate-400">{NEWS_REGIONS[lead.region].label}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden />
                      <span className="text-slate-400 normal-case tracking-normal font-semibold"
                        style={{ fontVariantNumeric: "tabular-nums" }}>
                        {fmtDate(lead.published_at)}
                      </span>
                    </div>
                    <h2 className="font-black tracking-tight text-slate-900 leading-[1.08] group-hover:text-brand transition-colors"
                      style={{ fontSize: "clamp(28px, 3.9vw, 44px)", letterSpacing: "-0.025em", textWrap: "balance" }}>
                      {lead.headline}
                    </h2>
                    {lead.dek && (
                      <p className="mt-4 text-[17px] sm:text-[19px] font-light text-slate-500 leading-[1.5] max-w-2xl"
                        style={{ textWrap: "pretty" }}>
                        {lead.dek}
                      </p>
                    )}
                    <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-brand">
                      Read the story →
                      <span className="text-slate-400 font-semibold">{newsReadingMinutes(lead.body_md)} min</span>
                    </span>
                    </div>
                  </Link>
                </article>
              )}

              {/* The Latest rail */}
              {latest.length > 0 && (
                <aside className="lg:col-span-4" aria-label="The latest">
                  <div className="rounded-3xl border border-slate-200 bg-white px-5 sm:px-6 py-5 h-full">
                    <h3 className="text-[10px] font-bold tracking-[0.25em] uppercase text-slate-500 pb-3 border-b border-slate-200">
                      The Latest
                    </h3>
                    <ul>
                      {latest.map((a) => (
                        <li key={a.id} className="border-b border-slate-100 last:border-b-0">
                          <Link href={`/newsroom/${a.slug}`}
                            className="group flex gap-3 py-3.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                            <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden">
                              <ArticleArt slug={a.slug} topic={a.topic} label={a.headline} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-brand mb-1">
                                {NEWS_TOPICS[a.topic].label}
                              </p>
                              <h4 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-brand transition-colors">
                                {a.headline}
                              </h4>
                              <p className="mt-1 text-[11px] font-semibold text-slate-400"
                                style={{ fontVariantNumeric: "tabular-nums" }}>
                                {fmtDate(a.published_at)} · {newsReadingMinutes(a.body_md)} min
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>
              )}
            </div>

            {/* ── More stories ───────────────────────────────────────────── */}
            {remainder.length > 0 && (
              <section className="mt-10" aria-label="More stories">
                <h3 className="text-[10px] font-bold tracking-[0.25em] uppercase text-slate-500 mb-4">
                  More Stories
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {remainder.map((a) => (
                    <article key={a.id}>
                      <Link href={`/newsroom/${a.slug}`}
                        className="group h-full flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_12px_30px_rgba(0,86,206,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                        <div className="aspect-[16/9] w-full overflow-hidden">
                          <ArticleArt slug={a.slug} topic={a.topic} label={a.headline} />
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold tracking-wider uppercase mb-2.5">
                          <span className="text-brand">{NEWS_TOPICS[a.topic].label}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden />
                          <span className="text-slate-400">{NEWS_REGIONS[a.region].short}</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 leading-snug group-hover:text-brand transition-colors"
                          style={{ textWrap: "balance" }}>
                          {a.headline}
                        </h4>
                        {a.dek && (
                          <p className="mt-2 text-[13px] text-slate-500 leading-relaxed line-clamp-2">{a.dek}</p>
                        )}
                        <p className="mt-auto pt-3 text-[11px] font-semibold text-slate-400"
                          style={{ fontVariantNumeric: "tabular-nums" }}>
                          {fmtDate(a.published_at)} · {newsReadingMinutes(a.body_md)} min
                        </p>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Chart built from our own data — renders only once there's enough. */}
        <CoveragePanel />
      </main>
    </div>
  );
}
