"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type ResearchCard = {
  slug: string;
  title: string;
  description: string;
  topic: string;
  published: string; // YYYY-MM-DD
  minutes: number | null;
};

const BRAND_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-AU", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

export function ResearchIndex({ articles }: { articles: ResearchCard[] }) {
  const [topic, setTopic] = useState<string | null>(null);

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of articles) counts.set(a.topic, (counts.get(a.topic) ?? 0) + 1);
    return [...counts.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]));
  }, [articles]);

  // Featured = newest overall; hidden while a topic filter is active
  const [featured, ...rest] = articles;
  const filtered = topic ? articles.filter((a) => a.topic === topic) : rest;

  return (
    <div>
      {/* Featured — the newest paper gets the editorial treatment */}
      {!topic && featured && (
        <Link
          href={`/research/${featured.slug}`}
          className="group relative block rounded-3xl overflow-hidden mb-10 p-8 sm:p-12"
          style={{ background: "linear-gradient(135deg, #00183A 0%, #01224F 60%, #0B3B7E 130%)" }}
        >
          {/* Brand-mark watermark — the open square, oversized */}
          <svg viewBox="0 0 75 75" aria-hidden
            className="absolute -right-10 -bottom-14 w-64 h-64 opacity-[0.07] transition-transform duration-500 group-hover:scale-105 group-hover:opacity-10">
            <g fill="#FFFFFF">
              <rect x="0" y="0" width="75" height="8" />
              <rect x="0" y="0" width="8" height="75" />
              <rect x="67" y="0" width="8" height="24" />
              <rect x="0" y="67" width="45" height="8" />
            </g>
          </svg>
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[9px] tracking-[0.2em] uppercase font-bold px-2.5 py-1 rounded-full text-white"
                style={{ background: "rgba(51,136,255,0.25)", border: "1px solid rgba(51,136,255,0.4)" }}>
                Latest research
              </span>
              <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-sky-300/80">
                {featured.topic}
              </span>
            </div>
            <h2 className="font-black tracking-tight text-white leading-[1.05] mb-4"
              style={{ fontSize: "clamp(24px, 3.4vw, 40px)" }}>
              {featured.title}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6 line-clamp-3">
              {featured.description}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-white">
                Read the article
                <span className="transition-transform group-hover:translate-x-1.5" aria-hidden>→</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {fmtDate(featured.published)}{featured.minutes ? ` · ${featured.minutes} min read` : ""}
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* Topic filter */}
      <div className="flex flex-wrap items-center gap-2 mb-8" role="group" aria-label="Filter by topic">
        <button
          onClick={() => setTopic(null)}
          aria-pressed={topic === null}
          className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
          style={topic === null
            ? { background: BRAND_GRADIENT, color: "#FFF", boxShadow: "0 4px 14px rgba(0,86,206,0.25)" }
            : { background: "#FFF", color: "#475569", border: "1px solid #E2E8F0" }}
        >
          All papers <span className={topic === null ? "opacity-70" : "text-slate-400"}>{articles.length}</span>
        </button>
        {topics.map(([t, n]) => (
          <button
            key={t}
            onClick={() => setTopic(topic === t ? null : t)}
            aria-pressed={topic === t}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
            style={topic === t
              ? { background: BRAND_GRADIENT, color: "#FFF", boxShadow: "0 4px 14px rgba(0,86,206,0.25)" }
              : { background: "#FFF", color: "#475569", border: "1px solid #E2E8F0" }}
          >
            {t} <span className={topic === t ? "opacity-70" : "text-slate-400"}>{n}</span>
          </button>
        ))}
      </div>

      {/* Article grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((a) => (
          <Link
            key={a.slug}
            href={`/research/${a.slug}`}
            className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-brand/40 overflow-hidden"
            style={{ boxShadow: "0 4px 20px rgba(15,28,49,0.05)" }}
          >
            {/* Gradient hairline that slides in on hover */}
            <span aria-hidden
              className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
              style={{ background: BRAND_GRADIENT }} />
            <span className="flex items-center justify-between mb-4">
              <span className="text-[9px] tracking-[0.2em] uppercase font-bold px-2 py-1 rounded-full"
                style={{ background: "rgba(0,86,206,0.07)", color: "#0056CE" }}>
                {a.topic}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">{fmtDate(a.published)}</span>
            </span>
            <h2 className="text-lg font-black text-slate-900 leading-snug mb-2 group-hover:text-brand transition-colors">
              {a.title}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed flex-1 line-clamp-4">{a.description}</p>
            <span className="mt-5 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: "#0056CE" }}>
                Read the article
                <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
              </span>
              {a.minutes && <span className="text-slate-400 font-medium">{a.minutes} min read</span>}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
