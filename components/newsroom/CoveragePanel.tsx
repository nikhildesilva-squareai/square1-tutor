import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NEWS_TOPICS, type NewsTopic } from "@/lib/newsroom-meta";

// ═══════════════════════════════════════════════════════════════════════════════
// "What we've covered" — a chart built from the newsroom's OWN data.
//
// The articles themselves contain almost no chartable figures (only ~5% carry a
// statistic), so charting their contents would mean inventing numbers. This
// charts something we can state with certainty instead: how many published
// stories sit in each section, straight from the table.
//
// Form: single-series magnitude comparison across 8 named categories →
// horizontal bars (long category labels read straight; no rotated ticks).
// One series, so no legend — the heading names it — and every bar is directly
// labelled, so the value is never colour-dependent. Single brand hue, validated
// against the light surface (lightness band / chroma / contrast all pass).
// ═══════════════════════════════════════════════════════════════════════════════

export async function CoveragePanel() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_articles")
    .select("topic, published_at")
    .eq("status", "published");

  const rows = data ?? [];
  if (rows.length < 6) return null; // too little to be worth charting

  const counts = new Map<NewsTopic, number>();
  for (const r of rows) {
    const t = r.topic as NewsTopic;
    if (t in NEWS_TOPICS) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const series = (Object.keys(NEWS_TOPICS) as NewsTopic[])
    .map((t) => ({ topic: t, label: NEWS_TOPICS[t].label, value: counts.get(t) ?? 0 }))
    .sort((a, b) => b.value - a.value);

  const max = Math.max(...series.map((s) => s.value), 1);
  const total = rows.length;

  // Published in the last 7 days — a second, honest fact about cadence.
  const weekAgo = Date.now() - 7 * 86400_000;
  const thisWeek = rows.filter((r) => r.published_at && new Date(r.published_at).getTime() > weekAgo).length;

  return (
    <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7"
      aria-labelledby="coverage-heading">
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-1">
        <h2 id="coverage-heading" className="text-base font-black tracking-tight text-slate-900">
          What we&apos;ve covered
        </h2>
        <p className="text-[11px] font-semibold text-slate-400" style={{ fontVariantNumeric: "tabular-nums" }}>
          {total} stories{thisWeek > 0 ? ` · ${thisWeek} this week` : ""}
        </p>
      </div>
      <p className="text-xs text-slate-500 mb-5">
        Published stories by section.
      </p>

      <ul className="flex flex-col gap-2">
        {series.map((s) => {
          const pct = (s.value / max) * 100;
          return (
            <li key={s.topic}>
              <Link href={`/newsroom?topic=${s.topic}`}
                className="group grid grid-cols-[minmax(88px,132px)_1fr_auto] items-center gap-3 rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                <span className="text-[11.5px] font-bold text-slate-600 group-hover:text-brand transition-colors truncate">
                  {s.label}
                </span>
                {/* Track + bar. Bars are anchored to a common baseline with a
                    rounded data-end; the track is recessive, not a gridline. */}
                <span className="relative block h-5 rounded-[4px] bg-slate-100 overflow-hidden" aria-hidden>
                  <span className="absolute inset-y-0 left-0 rounded-[4px] transition-all"
                    style={{ width: `${Math.max(pct, s.value > 0 ? 2 : 0)}%`, background: "#0056CE" }} />
                </span>
                <span className="text-[11.5px] font-black text-slate-900 tabular-nums w-6 text-right">
                  {s.value}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
