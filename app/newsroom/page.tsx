import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import {
  NEWS_TOPICS, NEWS_REGIONS, isNewsTopic, isNewsRegion,
  publishedArticles, newsReadingMinutes,
} from "@/lib/newsroom";

const BASE = "https://square1-tutor.vercel.app";

export const metadata: Metadata = {
  title: "Newsroom — Square 1 AI",
  description:
    "Daily technology news from the Square 1 AI newsroom: AI, cybersecurity, cloud, quantum, machine learning and data — what happened and why it matters, with every source credited.",
  alternates: { canonical: `${BASE}/newsroom` },
  openGraph: {
    title: "Newsroom — Square 1 AI",
    description: "Daily technology news — what happened and why it matters, with every source credited.",
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

export default async function NewsroomPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const topic = isNewsTopic(params.topic) ? params.topic : undefined;
  const region = isNewsRegion(params.region) ? params.region : undefined;
  const articles = await publishedArticles({ topic, region });

  // Filter chips keep the OTHER dimension's selection so they compose.
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

  const [lead, ...rest] = articles;

  return (
    <div className="min-h-dvh" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 40%,#F4F8FF 100%)" }}>
      {/* Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 sm:px-8 py-5">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <Link href="/diagnostic" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          Free skill check →
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 sm:px-8 pb-24">
        {/* Heading */}
        <div className="max-w-2xl pt-6 sm:pt-8 mb-7 sm:mb-8">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Newsroom
          </span>
          <h1 className="mt-3 font-black tracking-tight text-slate-900 leading-[0.98]"
            style={{ fontSize: "clamp(28px, 3.6vw, 44px)" }}>
            Technology news,{" "}
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              explained for learners.
            </span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            What happened in AI, security, cloud and data — and why it matters to the skills
            you&apos;re building. Original summaries, every source credited.{" "}
            <Link href="/newsroom/standards" className="text-brand font-semibold hover:underline">
              How we report →
            </Link>
          </p>
        </div>

        {/* Topic chips */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          <Link href={topicHref()} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${!topic ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
            All topics
          </Link>
          {(Object.keys(NEWS_TOPICS) as (keyof typeof NEWS_TOPICS)[]).map((t) => (
            <Link key={t} href={topicHref(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${topic === t ? "bg-brand text-white border-brand" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
              {NEWS_TOPICS[t].label}
            </Link>
          ))}
        </div>

        {/* Region chips */}
        <div className="flex flex-wrap gap-1.5 mb-8">
          <Link href={regionHref()} className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${!region ? "bg-slate-100 text-slate-800 border-slate-300" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"}`}>
            All regions
          </Link>
          {(Object.keys(NEWS_REGIONS) as (keyof typeof NEWS_REGIONS)[]).map((r) => (
            <Link key={r} href={regionHref(r)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${region === r ? "bg-slate-100 text-brand border-brand/40" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"}`}>
              {NEWS_REGIONS[r].short}
            </Link>
          ))}
        </div>

        {articles.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center max-w-xl mx-auto">
            <p className="text-sm font-bold text-slate-900 mb-1">Nothing here yet</p>
            <p className="text-sm text-slate-500">
              {topic || region
                ? "No stories match this filter yet — try widening it."
                : "The newsroom publishes daily. The first stories are on their way."}
            </p>
          </div>
        ) : (
          <>
            {/* Lead story */}
            {lead && (
              <Link href={`/newsroom/${lead.slug}`}
                className="group block rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 mb-6 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_16px_40px_rgba(0,86,206,0.08)]">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold tracking-wider uppercase mb-3">
                  <span className="text-brand">{NEWS_TOPICS[lead.topic].label}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden />
                  <span className="text-slate-500">{NEWS_REGIONS[lead.region].label}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden />
                  <span className="text-slate-400">{fmtDate(lead.published_at)}</span>
                </div>
                <h2 className="font-black tracking-tight text-slate-900 leading-tight group-hover:text-brand transition-colors"
                  style={{ fontSize: "clamp(22px, 2.6vw, 32px)" }}>
                  {lead.headline}
                </h2>
                {lead.dek && <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">{lead.dek}</p>}
                <span className="mt-4 inline-block text-xs font-bold text-brand">
                  Read the story → <span className="text-slate-400 font-semibold">{newsReadingMinutes(lead.body_md)} min</span>
                </span>
              </Link>
            )}

            {/* The rest */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.map((a) => (
                <Link key={a.id} href={`/newsroom/${a.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 flex flex-col transition-all hover:-translate-y-0.5 hover:border-brand/30">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold tracking-wider uppercase mb-2.5">
                    <span className="text-brand">{NEWS_TOPICS[a.topic].label}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden />
                    <span className="text-slate-400">{NEWS_REGIONS[a.region].short}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-brand transition-colors">
                    {a.headline}
                  </h3>
                  {a.dek && <p className="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-2">{a.dek}</p>}
                  <span className="mt-auto pt-3 text-[11px] font-semibold text-slate-400">
                    {fmtDate(a.published_at)} · {newsReadingMinutes(a.body_md)} min
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
