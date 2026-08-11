"use client";

import Link from "next/link";
import { fpTrack } from "@/lib/first-party";

// ═══════════════════════════════════════════════════════════════════════════════
// "Everyone was handed AI. Almost nobody was taught it."
//
// This is the honest version of a salary-uplift graphic. A "your pay could go
// from X to Y" widget was considered and rejected (2026-08-11): Square 1 has no
// graduates yet, so any figure would be modelled rather than measured; it would
// contradict the Straight-Talk section two screens below, which is the most
// persuasive thing on the page precisely because it refuses to invent proof;
// and earnings claims by an Australian education provider are exactly what the
// ACCC requires substantiation for. The first student who doesn't land the
// number would hold a screenshot of the promise.
//
// So this section sells the same urgency using facts that are already true and
// already checkable. Every number below is published research with the source
// named and linked, in the same pattern RealityBand uses — no projections, no
// self-reported outcomes, nothing about what a Square 1 student will earn.
//
// The argument it makes: the AI skills gap is not a knowledge problem, it's a
// TRAINING problem, and it is happening to everyone at once. That is a fact
// about the reader's own week, which lands harder than a promise about a future
// we cannot yet evidence.
// ═══════════════════════════════════════════════════════════════════════════════

type Stat = {
  value: number;
  decimals?: number;
  suffix: string;
  headline: string;
  detail: string;
  sourceLabel: string;
  sourceHref: string;
  accent: string;
};

const STATS: Stat[] = [
  {
    value: 71, suffix: "%",
    headline: "got no AI training at all",
    detail: "Told to use it. Shown nothing. That's most of the workforce, in the last twelve months.",
    sourceLabel: "Dayforce, Pulse of Talent 2026",
    sourceHref: "https://www.dayforce.com/",
    accent: "#D97706",
  },
  {
    value: 57, suffix: "%",
    headline: "hide their AI use at work",
    detail: "From managers and colleagues — across 48,000 people in 47 countries. Only 47% were ever trained.",
    sourceLabel: "KPMG & University of Melbourne",
    sourceHref: "https://kpmg.com/xx/en/media/press-releases/2025/04/trust-of-ai-remains-a-critical-challenge.html",
    accent: "#0EA5E9",
  },
  {
    value: 40, suffix: "%",
    headline: "were sent AI “workslop”",
    detail: "Output that looks finished and isn't — costing the person who receives it about two hours to clean up.",
    sourceLabel: "BetterUp & Stanford, in HBR",
    sourceHref: "https://hbr.org/2025/09/ai-generated-workslop-is-destroying-productivity",
    accent: "#DC2626",
  },
];

export function ProductivityGap() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24" aria-labelledby="gap-heading">
      <div className="mx-auto max-w-6xl">

        <header className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            The skills gap, measured
          </span>
          <h2 id="gap-heading"
              className="mt-4 text-3xl font-black leading-[1.08] tracking-tight text-slate-900 sm:text-[2.5rem]">
            Everyone was handed AI.
            <br className="hidden sm:block" />{" "}
            <span className="text-brand">Almost nobody was taught it.</span>
          </h2>
          <p className="mx-auto mt-4 text-base leading-relaxed text-slate-600">
            This is not a prediction about your career. It is what independent research
            already found about the people you work with — and it is why proof of skill
            has stopped being optional.
          </p>
        </header>

        {/* The three findings */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {STATS.map((s) => (
            <figure
              key={s.headline}
              className="m-0 flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(21,47,84,0.04)]"
            >
              <span className="block text-5xl font-black leading-none tracking-tight tabular-nums"
                    style={{ color: s.accent }}>
                {s.value.toFixed(s.decimals ?? 0)}{s.suffix}
              </span>
              <p className="mt-3 text-base font-bold leading-snug text-slate-900">{s.headline}</p>
              <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-slate-600">{s.detail}</p>
              <figcaption className="mt-4 border-t border-slate-100 pt-3 text-[10.5px] text-slate-400">
                <a href={s.sourceHref} target="_blank" rel="noopener noreferrer"
                   className="underline decoration-dotted underline-offset-2 hover:text-slate-600">
                  {s.sourceLabel}
                </a>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* The turn: demand is real, but it is not asking for enthusiasm. */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
          <div className="grid gap-5 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
            <div>
              <p className="text-[15px] font-bold leading-snug text-slate-900">
                Meanwhile AI Engineer is the fastest-growing role in the US —{" "}
                <span className="tabular-nums text-brand">+143%</span>{" "}
                year on year.
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-600">
                But only <strong className="font-bold text-slate-900">2.5%</strong> of advertised AI-engineer roles
                accept 0–2 years of experience. Demand is not the bottleneck. Proof is.
              </p>
            </div>
            <p className="text-[10.5px] leading-relaxed text-slate-400 sm:max-w-[9rem] sm:text-right">
              Sources:{" "}
              <a href="https://www.linkedin.com/pulse/linkedin-jobs-rise-2026-25-fastest-growing-roles-us-linkedin-news-dlb1c"
                 target="_blank" rel="noopener noreferrer"
                 className="underline decoration-dotted hover:text-slate-600">LinkedIn Jobs on the Rise 2026</a>
              {" · "}
              <a href="https://365datascience.com/career-advice/career-guides/ai-engineer-job-outlook-2025/"
                 target="_blank" rel="noopener noreferrer"
                 className="underline decoration-dotted hover:text-slate-600">Glassdoor postings analysis</a>
            </p>
          </div>
        </div>

        {/* What we do about it — claims limited to what the product actually does. */}
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="max-w-xl text-[15px] leading-relaxed text-slate-600">
            Square 1 is the training nobody gave them. Every rep you do is graded against a
            real rubric, and what you finish with is work an employer can open and run —
            which is the only thing that answers a 2.5% door.
          </p>
          <Link
            href="/skill-check"
            onClick={() => fpTrack("cta_click", "productivity-gap")}
            className="inline-flex h-12 items-center gap-2 rounded-xl px-7 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)",
              boxShadow: "0 14px 30px -12px rgba(0,86,206,0.55)",
            }}
          >
            See where you actually stand — free
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="text-xs text-slate-500">3 minutes · no account to start</p>
        </div>
      </div>
    </section>
  );
}
