"use client";

import { useEffect, useRef, useState } from "react";
import { X, Check, FileX2, FolderGit2, BadgeCheck, Sparkles } from "lucide-react";
import { PrimaryCta } from "@/components/ui/primary-cta";

// ═══════════════════════════════════════════════════════════════════════════════
// The 2026 Reality — the stakes. The market divergence drawn as a "scissor"
// chart (postings collapsing, grads climbing), then a side-by-side candidate
// comparison. The winning card carries PRODUCT FACTS only.
//
// Chart honesty: the ENDPOINTS are the verified cited figures (−65% postings /
// +40% grads, Jan 2022 → Jan 2025, indexed Jan 2022 = 100); intermediate points
// are smooth interpolation for shape — which is why there are deliberately NO
// per-point hover tooltips (hover values would imply monthly data we don't
// have). Palette #DC2626/#0056CE validated: CVD ΔE 26.3, normal 38.1, contrast
// ≥3:1 — all checks pass.
//
// Stat sources (verified 2026-07): Indeed Hiring Lab (hiringlab.org) — software
// dev postings −68.8% vs Feb 2022 peak, entry-level −65% Jan 2022–Jan 2025;
// NY Fed college labour market data — 6.1% recent-CS-grad unemployment.
// ═══════════════════════════════════════════════════════════════════════════════

const BLUE_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";
const RED = "#DC2626";
const BLUE = "#0056CE";

const POSTINGS = [[2022, 100], [2022.5, 88], [2023, 72], [2023.5, 58], [2024, 47], [2024.5, 40], [2025, 35]] as const;
const GRADS    = [[2022, 100], [2022.75, 109], [2023.5, 120], [2024.25, 130], [2025, 140]] as const;

// Two geometries: desktop carries in-chart endpoint labels; the compact mobile
// variant drops them (SVG text would scale below legibility at ~330px wide)
// and shows the two values as chips under the plot instead.
type ChartCfg = { w: number; h: number; l: number; r: number; t: number; b: number; yMin: number; yMax: number; labels: boolean };
const DESKTOP_CFG: ChartCfg = { w: 680, h: 320, l: 40, r: 170, t: 16, b: 34, yMin: 20, yMax: 152, labels: true };
const COMPACT_CFG: ChartCfg = { w: 400, h: 300, l: 34, r: 24, t: 14, b: 30, yMin: 20, yMax: 152, labels: false };

const px = (c: ChartCfg, year: number) => c.l + ((year - 2022) / 3) * (c.w - c.l - c.r);
const py = (c: ChartCfg, v: number) => c.t + ((c.yMax - v) / (c.yMax - c.yMin)) * (c.h - c.t - c.b);

// Catmull-Rom → cubic bezier, so the trend reads as one smooth motion.
function smoothPath(c: ChartCfg, pts: readonly (readonly [number, number])[]) {
  const p = pts.map(([x, y]) => [px(c, x), py(c, y)]);
  let d = `M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
    d += ` C ${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)}, ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function ChartSvg({ c, visible, reduceMotion }: { c: ChartCfg; visible: boolean; reduceMotion: boolean }) {
  const endX = px(c, 2025);
  const yPost = py(c, 35);
  const yGrad = py(c, 140);
  const lineStyle = (delay: number) => ({
    strokeDasharray: 1,
    strokeDashoffset: visible ? 0 : 1,
    transition: reduceMotion ? "none" : `stroke-dashoffset 1500ms cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
  });
  const fadeStyle = (delay: number) => ({
    opacity: visible ? 1 : 0,
    transition: reduceMotion ? "none" : `opacity 500ms ease ${delay}ms`,
  });
  return (
    <svg
      viewBox={`0 0 ${c.w} ${c.h}`}
      className="w-full h-auto"
      role="img"
      aria-label="Line chart, indexed to 100 in January 2022: entry-level software postings fall 65 percent to 35 by January 2025 while CS graduates rise 40 percent to 140 — the gap between supply and demand widens every year."
    >
      {/* Recessive grid + index labels */}
      {[50, 100, 150].map((v) => (
        <g key={v}>
          <line x1={c.l} x2={c.w - c.r + 8} y1={py(c, v)} y2={py(c, v)}
            stroke={v === 100 ? "#CBD5E1" : "#EDF2F8"} strokeWidth="1" strokeDasharray={v === 100 ? "3 4" : undefined} />
          <text x={c.l - 8} y={py(c, v) + 3.5} textAnchor="end" fontSize="10" fill="#94A3B8">{v}</text>
        </g>
      ))}
      {/* Year ticks */}
      {[2022, 2023, 2024, 2025].map((yr) => (
        <text key={yr} x={px(c, yr)} y={c.h - 10} textAnchor="middle" fontSize="11" fill="#64748B" fontWeight="600">{yr}</text>
      ))}

      {/* The two lines — drawn in when the section enters view */}
      <path d={smoothPath(c, GRADS)} fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" pathLength={1} style={lineStyle(250)} />
      <path d={smoothPath(c, POSTINGS)} fill="none" stroke={RED} strokeWidth="2.5" strokeLinecap="round" pathLength={1} style={lineStyle(0)} />

      {/* Emphasized endpoints */}
      <g style={fadeStyle(1450)}>
        <circle cx={endX} cy={yPost} r="5" fill={RED} stroke="#fff" strokeWidth="2" />
      </g>
      <g style={fadeStyle(1600)}>
        <circle cx={endX} cy={yGrad} r="5" fill={BLUE} stroke="#fff" strokeWidth="2" />
      </g>

      {/* Desktop-only in-chart annotations */}
      {c.labels && (
        <>
          <g style={fadeStyle(1700)}>
            <line x1={endX + 6} x2={endX + 6} y1={yGrad + 10} y2={yPost - 10} stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 3" />
            <text x={px(c, 2024.35)} y={py(c, 90)} textAnchor="middle" fontSize="11" fill="#94A3B8" fontStyle="italic">the squeeze</text>
          </g>
          <g style={fadeStyle(1450)}>
            <text x={endX + 16} y={yPost + 1} fontSize="15" fontWeight="800" fill="#0F1B2E">−65%</text>
            <text x={endX + 16} y={yPost + 15} fontSize="10" fill="#64748B">postings, Jan 2022 – Jan 2025</text>
          </g>
          <g style={fadeStyle(1600)}>
            <text x={endX + 16} y={yGrad + 1} fontSize="15" fontWeight="800" fill="#0F1B2E">+40%</text>
            <text x={endX + 16} y={yGrad + 15} fontSize="10" fill="#64748B">more CS graduates</text>
          </g>
        </>
      )}
    </svg>
  );
}

function MarketChart({ visible }: { visible: boolean }) {
  // Reduced-motion users get the finished chart instantly — no draw-in.
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_-16px_rgba(15,28,49,0.15)] overflow-hidden">
      {/* Legend + scale note */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-slate-600">
            <span className="w-4 h-[3px] rounded-full" style={{ background: RED }} aria-hidden /> Entry-level software postings
          </span>
          <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-slate-600">
            <span className="w-4 h-[3px] rounded-full" style={{ background: BLUE }} aria-hidden /> CS graduates
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">Indexed · Jan 2022 = 100</span>
      </div>

      {/* Desktop chart (in-chart labels) / compact mobile chart (chips below) */}
      <div className="hidden sm:block">
        <ChartSvg c={DESKTOP_CFG} visible={visible} reduceMotion={reduceMotion} />
      </div>
      <div className="sm:hidden">
        <ChartSvg c={COMPACT_CFG} visible={visible} reduceMotion={reduceMotion} />
        <div className="flex items-center justify-center gap-6 px-4 pb-2 -mt-1">
          <span className="inline-flex items-baseline gap-1.5">
            <span className="w-2 h-2 rounded-full self-center" style={{ background: RED }} aria-hidden />
            <span className="text-sm font-black tabular-nums text-slate-900">−65%</span>
            <span className="text-[11px] text-slate-500">postings</span>
          </span>
          <span className="inline-flex items-baseline gap-1.5">
            <span className="w-2 h-2 rounded-full self-center" style={{ background: BLUE }} aria-hidden />
            <span className="text-sm font-black tabular-nums text-slate-900">+40%</span>
            <span className="text-[11px] text-slate-500">CS grads</span>
          </span>
        </div>
      </div>

      {/* Companion fact + sources */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 px-5 py-3 border-t border-slate-100">
        <p className="text-[11px] sm:text-xs text-slate-500">
          <span className="font-black text-slate-900 tabular-nums">6.1%</span> unemployment among recent CS grads — nearly 2× many other majors
        </p>
        <p className="text-[10px] text-slate-400">
          Sources:{" "}
          <a href="https://www.hiringlab.org" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-slate-600">Indeed Hiring Lab</a>
          {" · "}
          <a href="https://www.newyorkfed.org/research/college-labor-market" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-slate-600">Federal Reserve Bank of New York</a>
        </p>
      </div>
    </div>
  );
}

// ─── The two candidates ────────────────────────────────────────────────────────
const CANDIDATE_A = [
  { icon: FileX2, text: "A certificate PDF employers can't verify" },
  { icon: X,      text: "No public code for anyone to review" },
  { icon: X,      text: "The same CV as thousands of other grads" },
  { icon: X,      text: "Waits in the pile, hopes for a callback" },
];

const CANDIDATE_B = [
  { icon: FolderGit2, text: "10+ deployed, code-reviewed projects" },
  { icon: Check,      text: "Live GitHub repos employers can actually run" },
  { icon: BadgeCheck, text: "A skill report that shows your real level" },
  { icon: Sparkles,   text: "Every rep graded by Nova before it ships" },
];

export function RealityBand() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F6F9FE 100%)" }}>
      {/* Accent glows — Square 1 blue */}
      <div className="pointer-events-none absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(circle, #0EA5E9 0%, transparent 70%)", filter: "blur(110px)" }} />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(circle, #0056CE 0%, transparent 70%)", filter: "blur(110px)" }} />

      <div className="relative max-w-5xl mx-auto">
        {/* Eyebrow + headline */}
        <div className="text-center">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">The 2026 reality</span>
        </div>
        <h2 className="mt-4 text-center font-black tracking-tight text-slate-900 leading-[1.0] max-w-3xl mx-auto"
          style={{ fontSize: "clamp(26px, 4vw, 46px)", letterSpacing: "-0.03em" }}>
          A degree used to be enough.{" "}
          <span style={{ background: BLUE_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Not anymore.
          </span>
        </h2>
        <p className="mt-5 text-center text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Hundreds of applications, no callbacks — it&apos;s not a you problem, it&apos;s a{" "}
          <span className="text-slate-900 font-semibold">proof problem</span>. Your degree gets you
          shortlisted — <span className="text-slate-900 font-semibold">deployed proof gets you picked</span>.
        </p>

        {/* ── The market, in motion — the scissor chart ────────────────────── */}
        <div className="mt-9">
          <MarketChart visible={visible} />
        </div>

        {/* ── Same market, two CVs — the visible argument ──────────────────── */}
        <div className="mt-12 sm:mt-14 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-stretch gap-5 lg:gap-0">

          {/* CANDIDATE A — degree only (deliberately flat + muted: the "before") */}
          <div
            className="relative rounded-2xl border p-6 sm:p-7 transition-all duration-700 motion-reduce:transition-none lg:mr-[-8px] lg:my-4"
            style={{
              background: "#F8FAFC",
              borderColor: "#E2E8F0",
              opacity: visible ? 0.92 : 0,
              transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.98)",
            }}
          >
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-slate-400">Candidate A</p>
            <h3 className="mt-1.5 text-xl sm:text-2xl font-black tracking-tight text-slate-500">Degree only</h3>
            <ul className="mt-5 space-y-3.5">
              {CANDIDATE_A.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-[13px] sm:text-sm text-slate-500 leading-snug">
                  <span className="mt-px w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 border border-slate-300 text-slate-400 bg-white">
                    <Icon size={12} strokeWidth={2.5} aria-hidden />
                  </span>
                  <span className="pt-0.5">{text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 pt-4 border-t border-slate-200 text-[11px] text-slate-400 font-medium">
              Shortlisted, maybe. Picked on faith.
            </p>
          </div>

          {/* VS medallion */}
          <div className="relative z-10 flex lg:flex-col items-center justify-center">
            <span
              className="w-12 h-12 rounded-full flex items-center justify-center text-[13px] font-black text-white shadow-lg"
              style={{ background: BLUE_GRADIENT, boxShadow: "0 10px 24px -8px rgba(0,86,206,0.6), 0 0 0 6px #FFFFFF" }}
              aria-hidden
            >
              VS
            </span>
          </div>

          {/* CANDIDATE B — degree + deployed proof (elevated: the "after") */}
          <div
            className="relative rounded-2xl p-6 sm:p-7 overflow-hidden transition-all duration-700 motion-reduce:transition-none lg:ml-[-8px]"
            style={{
              background: "linear-gradient(155deg, #2E7BF0 0%, #0056CE 52%, #01224F 100%)",
              boxShadow: "0 1px 2px rgba(15,28,49,0.06), 0 28px 60px -24px rgba(0,86,206,0.6)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.98)",
              transitionDelay: "140ms",
            }}
          >
            <div aria-hidden className="pointer-events-none absolute -top-20 -right-16 w-56 h-56 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%)" }} />
            <div className="relative flex items-center justify-between">
              <p className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "#BFD9FF" }}>Candidate B</p>
              <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full text-white"
                style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.24)" }}>
                Proof attached
              </span>
            </div>
            <h3 className="relative mt-1.5 text-xl sm:text-2xl font-black tracking-tight text-white">
              Degree + deployed proof
            </h3>
            <ul className="relative mt-5 space-y-3.5">
              {CANDIDATE_B.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-[13px] sm:text-sm leading-snug" style={{ color: "#E4EEFB" }}>
                  <span className="mt-px w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 bg-white">
                    <Icon size={12} strokeWidth={2.5} aria-hidden style={{ color: "#0056CE" }} />
                  </span>
                  <span className="pt-0.5 font-medium">{text}</span>
                </li>
              ))}
            </ul>
            <p className="relative mt-6 pt-4 text-[11px] font-medium" style={{ borderTop: "1px solid rgba(255,255,255,0.18)", color: "#BFD9FF" }}>
              Same market. A CV employers can click, run and verify.
            </p>
          </div>
        </div>

        {/* Resolution + CTA — hand the tension to the funnel */}
        <div className="mt-11 flex flex-col items-center gap-4">
          <p className="text-center text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
            Square 1 turns you into Candidate B —{" "}
            <span className="font-bold text-slate-900">project by graded project.</span>
          </p>
          <PrimaryCta href="/diagnostic">Start building proof — free 3-min skill check</PrimaryCta>
        </div>
      </div>
    </section>
  );
}
