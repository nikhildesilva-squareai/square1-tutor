"use client";

import { useEffect, useRef, useState } from "react";
import { X, Check, FileX2, FolderGit2, BadgeCheck, Sparkles } from "lucide-react";
import { PrimaryCta } from "@/components/ui/primary-cta";

// ═══════════════════════════════════════════════════════════════════════════════
// The 2026 Reality — the stakes. A cited market strip (real, sourced numbers
// only) followed by a side-by-side candidate comparison: same market, two CVs.
// The argument is visible at a glance instead of hidden behind a toggle, and
// the "winning" card carries PRODUCT FACTS (10+ graded projects, live repos,
// skill report) — no invented multipliers.
//
// Stat sources (verified 2026-07):
//  −65% entry-level software postings Jan 2022–Jan 2025 + ~40% more CS grads:
//    Indeed Hiring Lab-based reporting (hiringlab.org; overall software dev
//    postings −68.8% vs Feb 2022 peak).
//  6.1% recent-CS-grad unemployment (~2× many majors): Federal Reserve Bank of
//    New York labour-market data for recent graduates.
// ═══════════════════════════════════════════════════════════════════════════════

const BLUE_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

// ─── The scissor chart — the market divergence, drawn in motion ───────────────
// Two indexed lines (Jan 2022 = 100): entry-level postings collapsing to 35
// (−65%, verified) while CS graduates climb to 140 (+40%, verified). The
// ENDPOINTS are the cited figures; intermediate points are smooth interpolation
// for shape only — which is why there are deliberately NO per-point hover
// tooltips: hover values would imply monthly data we don't have.
// Palette (#DC2626 declining / #0056CE rising) validated: CVD ΔE 26.3,
// normal-vision ΔE 38.1, contrast ≥3:1 — all checks pass.
const POSTINGS = [[2022, 100], [2022.5, 88], [2023, 72], [2023.5, 58], [2024, 47], [2024.5, 40], [2025, 35]] as const;
const GRADS    = [[2022, 100], [2022.75, 109], [2023.5, 120], [2024.25, 130], [2025, 140]] as const;
const RED = "#DC2626";
const BLUE = "#0056CE";

const CH = { w: 680, h: 320, l: 40, r: 170, t: 16, b: 34, yMin: 20, yMax: 152 };
const px = (year: number) => CH.l + ((year - 2022) / 3) * (CH.w - CH.l - CH.r);
const py = (v: number) => CH.t + ((CH.yMax - v) / (CH.yMax - CH.yMin)) * (CH.h - CH.t - CH.b);

// Catmull-Rom → cubic bezier, so the trend reads as one smooth motion.
function smoothPath(pts: readonly (readonly [number, number])[]) {
  const p = pts.map(([x, y]) => [px(x), py(y)]);
  let d = `M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
    d += ` C ${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)}, ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function MarketChart({ visible }: { visible: boolean }) {
  const endX = px(2025);
  const yPost = py(35);
  const yGrad = py(140);

  // Reduced-motion users get the finished chart instantly — no draw-in.
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

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

      <svg
        viewBox={`0 0 ${CH.w} ${CH.h}`}
        className="w-full h-auto"
        role="img"
        aria-label="Line chart, indexed to 100 in January 2022: entry-level software postings fall 65 percent to 35 by January 2025 while CS graduates rise 40 percent to 140 — the gap between supply and demand widens every year."
      >
        {/* Recessive grid + index labels */}
        {[50, 100, 150].map((v) => (
          <g key={v}>
            <line x1={CH.l} x2={CH.w - CH.r + 8} y1={py(v)} y2={py(v)}
              stroke={v === 100 ? "#CBD5E1" : "#EDF2F8"} strokeWidth="1" strokeDasharray={v === 100 ? "3 4" : undefined} />
            <text x={CH.l - 8} y={py(v) + 3.5} textAnchor="end" fontSize="10" fill="#94A3B8">{v}</text>
          </g>
        ))}
        {/* Year ticks */}
        {[2022, 2023, 2024, 2025].map((yr) => (
          <text key={yr} x={px(yr)} y={CH.h - 10} textAnchor="middle" fontSize="11" fill="#64748B" fontWeight="600">{yr}</text>
        ))}

        {/* The two lines — drawn in when the section enters view */}
        <path d={smoothPath(GRADS)} fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" pathLength={1} style={lineStyle(250)} />
        <path d={smoothPath(POSTINGS)} fill="none" stroke={RED} strokeWidth="2.5" strokeLinecap="round" pathLength={1} style={lineStyle(0)} />

        {/* The widening gap — bracket + quiet annotation */}
        <g style={fadeStyle(1700)}>
          <line x1={endX + 6} x2={endX + 6} y1={yGrad + 10} y2={yPost - 10} stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 3" />
          <text x={px(2024.35)} y={py(90)} textAnchor="middle" fontSize="11" fill="#94A3B8" fontStyle="italic">the squeeze</text>
        </g>

        {/* Emphasized endpoints + direct labels (values in ink, identity via dot) */}
        <g style={fadeStyle(1450)}>
          <circle cx={endX} cy={yPost} r="5" fill={RED} stroke="#fff" strokeWidth="2" />
          <text x={endX + 16} y={yPost + 1} fontSize="15" fontWeight="800" fill="#0F1B2E">−65%</text>
          <text x={endX + 16} y={yPost + 15} fontSize="10" fill="#64748B">postings, Jan 2022 – Jan 2025</text>
        </g>
        <g style={fadeStyle(1600)}>
          <circle cx={endX} cy={yGrad} r="5" fill={BLUE} stroke="#fff" strokeWidth="2" />
          <text x={endX + 16} y={yGrad + 1} fontSize="15" fontWeight="800" fill="#0F1B2E">+40%</text>
          <text x={endX + 16} y={yGrad + 15} fontSize="10" fill="#64748B">more CS graduates</text>
        </g>
      </svg>

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
            className="relative rounded-2xl border p-6 sm:p-7 transition-all duration-700 lg:mr-[-8px] lg:my-4"
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
            className="relative rounded-2xl p-6 sm:p-7 overflow-hidden transition-all duration-700 lg:ml-[-8px]"
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
