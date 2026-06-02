"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── Example reports for 3 subjects — rotates every 6s ────────────────────────
type Skill = { label: string; value: number };
type Report = {
  subject:    string;
  accent:     string;
  skills:     Skill[];
  weakest:    string;
  strongest:  string;
  recommendation: string;
};

const REPORTS: Report[] = [
  {
    subject: "Generative AI",
    accent:  "#3388FF",
    skills: [
      { label: "LLM Fundamentals",  value: 85 },
      { label: "Prompt Engineering", value: 70 },
      { label: "RAG Systems",        value: 45 },
      { label: "AI Agents",          value: 30 },
      { label: "API Integration",    value: 90 },
      { label: "Fine-tuning",        value: 20 },
      { label: "AI Safety",          value: 60 },
      { label: "Production AI",      value: 40 },
    ],
    weakest:    "Fine-tuning",
    strongest:  "API Integration",
    recommendation: "Start with Module 7 — Fine-tuning & Embeddings to close your biggest gap before moving on.",
  },
  {
    subject: "Cybersecurity",
    accent:  "#EF4444",
    skills: [
      { label: "Network Security",   value: 78 },
      { label: "Cryptography",       value: 55 },
      { label: "OWASP Top 10",       value: 42 },
      { label: "Pen Testing",        value: 25 },
      { label: "Auth & Identity",    value: 88 },
      { label: "Cloud Security",     value: 35 },
      { label: "Incident Response",  value: 50 },
      { label: "Forensics",          value: 30 },
    ],
    weakest:    "Pen Testing",
    strongest:  "Auth & Identity",
    recommendation: "Begin with Module 5 — Penetration Testing to bridge theory to attack.",
  },
  {
    subject: "Machine Learning",
    accent:  "#A78BFA",
    skills: [
      { label: "Linear Models",      value: 92 },
      { label: "Tree Methods",       value: 68 },
      { label: "Deep Learning",      value: 35 },
      { label: "Feature Engineering",value: 75 },
      { label: "Model Eval",         value: 60 },
      { label: "MLOps",              value: 22 },
      { label: "NLP Basics",         value: 48 },
      { label: "Computer Vision",    value: 40 },
    ],
    weakest:    "MLOps",
    strongest:  "Linear Models",
    recommendation: "Jump to Module 7 — MLOps. You have the modelling fundamentals; deployment is the gap.",
  },
];

const ROTATION_MS = 6000;

const N   = 8;
const CX  = 200;
const CY  = 200;
const R   = 130;

function point(i: number, r: number): [number, number] {
  const angle = (2 * Math.PI * i) / N - Math.PI / 2;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

function toPoints(pairs: [number, number][]): string {
  return pairs.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

function levelColor(v: number) {
  if (v >= 70) return "#10B981"; // emerald
  if (v >= 40) return "#F59E0B"; // amber
  return "#EF4444";              // red
}

export function SkillRadarPreview() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive]       = useState(false);
  const [progress, setProgress]   = useState(0);
  const [reportIdx, setReportIdx] = useState(0);
  const [hoverIdx, setHoverIdx]   = useState<number | null>(null);
  const rafRef                    = useRef<number | null>(null);
  const startRef                  = useRef<number | null>(null);

  // Activate on enter view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setActive(true); obs.disconnect(); }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Animate the polygon outward
  useEffect(() => {
    if (!active) return;
    startRef.current = null;
    setProgress(0);
    const duration = 1500;
    function step(now: number) {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, reportIdx]);

  // Rotate through reports
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      setReportIdx((i) => (i + 1) % REPORTS.length);
    }, ROTATION_MS);
    return () => clearInterval(t);
  }, [active]);

  const report = REPORTS[reportIdx];
  const SKILLS = report.skills;

  // Build animated polygon points
  const dataPoints: [number, number][] = SKILLS.map((s, i) => {
    const r = (s.value / 100) * R * progress;
    return point(i, r);
  });

  const rings = [0.25, 0.5, 0.75, 1.0];
  const labelRadius = R + 30;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
      style={{
        background: `
          radial-gradient(ellipse 900px 500px at 20% 20%, ${report.accent}10, transparent 60%),
          radial-gradient(ellipse 800px 500px at 80% 80%, rgba(167,139,250,0.06), transparent 60%),
          radial-gradient(ellipse 700px 500px at 50% 50%, rgba(16,185,129,0.04), transparent 60%),
          linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
        `,
        transition: "background 1s ease",
      }}
    >
      {/* Drifting blobs — colour shifts with report */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-25 animate-blob-1 transition-colors duration-1000"
        style={{ background: `radial-gradient(circle, ${report.accent}25 0%, transparent 70%)`, filter: "blur(80px)" }} />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[500px] rounded-full opacity-20 animate-blob-2"
        style={{ background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)", filter: "blur(90px)" }} />

      <div className="relative max-w-6xl mx-auto">

        {/* Eyebrow + heading */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4"
            style={{
              background: `${report.accent}15`,
              borderColor: `${report.accent}40`,
            }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: report.accent }} />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: report.accent }}>
              The Skill Report
            </span>
          </div>
          <h2 className="font-black tracking-tight text-slate-900 leading-[0.95]"
            style={{ fontSize: "clamp(36px, 6vw, 80px)" }}>
            See exactly
            <br />
            <span
              key={reportIdx}
              className="animate-role-rotate inline-block"
              style={{
                background: `linear-gradient(135deg, ${report.accent} 0%, #A78BFA 50%, #10B981 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              where you stand.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            After the 30-minute assessment, you get a granular skill map — not just a number.
          </p>

          {/* Subject indicator */}
          <div className="mt-5 inline-flex items-center gap-2 text-xs text-slate-500">
            <span>Sample report:</span>
            <span className="font-bold" style={{ color: report.accent }}>{report.subject}</span>
            <span className="text-slate-400">·</span>
            <div className="flex gap-1">
              {REPORTS.map((r, i) => (
                <button
                  key={r.subject}
                  onClick={() => setReportIdx(i)}
                  className="rounded-full transition-all"
                  aria-label={`Show ${r.subject} example`}
                  style={{
                    width: i === reportIdx ? 24 : 6,
                    height: 6,
                    background: i === reportIdx ? r.accent : "rgba(148,168,200,0.3)",
                    minHeight: "unset",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Card container with radar + bars */}
        <div className="relative rounded-3xl border bg-white p-6 sm:p-8 lg:p-10"
          style={{
            borderColor: `${report.accent}25`,
            boxShadow: `0 16px 48px rgba(15,23,42,0.06), 0 0 0 1px ${report.accent}08 inset`,
          }}>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Radar SVG */}
            <div className="w-full flex justify-center">
              <svg
                viewBox="0 0 400 400"
                width="100%"
                height="auto"
                className="w-full max-w-sm"
              >
                {/* Grid rings */}
                {rings.map((ring) => {
                  const pts = SKILLS.map((_, i) => point(i, ring * R));
                  return (
                    <polygon
                      key={ring}
                      points={toPoints(pts)}
                      fill="none"
                      stroke="#CBD5E1"
                      strokeWidth="1"
                      strokeDasharray={ring < 1 ? "4 3" : "none"}
                    />
                  );
                })}

                {/* Axis lines */}
                {SKILLS.map((_, i) => {
                  const [x, y] = point(i, R);
                  return (
                    <line
                      key={i}
                      x1={CX} y1={CY}
                      x2={x}  y2={y}
                      stroke="#CBD5E1"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Filled data polygon — with gradient + drop-shadow */}
                <defs>
                  <radialGradient id={`radarFill-${reportIdx}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={report.accent} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={report.accent} stopOpacity="0.15" />
                  </radialGradient>
                </defs>
                <polygon
                  points={toPoints(dataPoints)}
                  fill={`url(#radarFill-${reportIdx})`}
                  stroke={report.accent}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  style={{
                    filter: `drop-shadow(0 0 12px ${report.accent}50)`,
                    transition: "stroke 0.5s ease",
                  }}
                />

                {/* Data points — pulse on hover */}
                {dataPoints.map(([x, y], i) => {
                  const isHover = hoverIdx === i;
                  return (
                    <circle
                      key={i}
                      cx={x} cy={y}
                      r={progress > 0.05 ? (isHover ? 7 : 4.5) : 0}
                      fill={isHover ? "white" : report.accent}
                      stroke={isHover ? report.accent : "white"}
                      strokeWidth={isHover ? 3 : 1.5}
                      style={{ transition: "r 0.2s ease, fill 0.2s ease" }}
                    />
                  );
                })}

                {/* Axis labels — give them PROPER room */}
                {SKILLS.map((s, i) => {
                  const [lx, ly] = point(i, labelRadius);
                  const anchor =
                    lx < CX - 5 ? "end" : lx > CX + 5 ? "start" : "middle";
                  const isHover = hoverIdx === i;
                  return (
                    <text
                      key={i}
                      x={lx} y={ly}
                      textAnchor={anchor}
                      dominantBaseline="middle"
                      fontSize="10"
                      fontFamily="system-ui, sans-serif"
                      fill={isHover ? report.accent : "#475569"}
                      fontWeight={isHover ? 700 : 500}
                      style={{ transition: "fill 0.2s, font-weight 0.2s" }}
                    >
                      {s.label}
                    </text>
                  );
                })}

                {/* Centre dot */}
                <circle cx={CX} cy={CY} r={3} fill={report.accent} />
              </svg>
            </div>

            {/* Skill bars */}
            <div className="w-full space-y-3">
              {SKILLS.map((s, i) => {
                const displayVal = Math.round(s.value * progress);
                const isHover = hoverIdx === i;
                const color = levelColor(s.value);
                return (
                  <div
                    key={s.label}
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(null)}
                    className="cursor-pointer p-2 -mx-2 rounded-lg transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-sm font-semibold transition-colors ${isHover ? "" : "text-slate-700"}`}
                        style={isHover ? { color: report.accent } : undefined}>
                        {s.label}
                      </span>
                      <span className="text-xs font-bold tabular-nums" style={{ color }}>
                        {displayVal}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{
                          width: `${displayVal}%`,
                          background: color,
                          boxShadow: isHover ? `0 0 12px ${color}80` : "none",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Insight card — what the report actually unlocks */}
          <div
            key={`insight-${reportIdx}`}
            className="mt-8 sm:mt-10 rounded-2xl p-5 sm:p-6 border animate-step-in"
            style={{
              background: `linear-gradient(135deg, ${report.accent}10, ${report.accent}03)`,
              borderColor: `${report.accent}30`,
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white"
                style={{ background: `linear-gradient(135deg, ${report.accent}, ${report.accent}cc)` }}
              >
                AI
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] tracking-[0.25em] uppercase font-bold mb-1.5" style={{ color: report.accent }}>
                  AI Recommendation
                </p>
                <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed mb-3">
                  {report.recommendation}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-slate-500">Weakest:</span>
                    <span className="font-bold text-red-500">{report.weakest}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-500">Strongest:</span>
                    <span className="font-bold text-emerald-600">{report.strongest}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 sm:mt-12 flex flex-col items-center gap-4">
          <p className="text-sm text-slate-500 text-center max-w-md">
            This is a sample.{" "}
            <span className="font-semibold text-slate-700">Your real report covers every topic in your chosen subject.</span>
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            style={{
              background: "linear-gradient(135deg, #0056CE 0%, #4F46E5 100%)",
              boxShadow: "0 12px 32px rgba(0,86,206,0.30)",
            }}
          >
            Unlock my real report →
          </Link>
        </div>
      </div>
    </section>
  );
}
