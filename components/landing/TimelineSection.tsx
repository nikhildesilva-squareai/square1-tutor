"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── Rotating job titles (matches JourneyHook headline pattern) ──────────────
const JOB_TITLES: { label: string; gradient: string }[] = [
  { label: "AI Engineer",            gradient: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)" },
  { label: "Cybersecurity Engineer", gradient: "linear-gradient(135deg, #EF4444 0%, #F97316 50%, #FBBF24 100%)" },
  { label: "ML Engineer",            gradient: "linear-gradient(135deg, #06B6D4 0%, #3388FF 50%, #6366F1 100%)" },
  { label: "Cloud Architect",        gradient: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)" },
  { label: "Full Stack Engineer",    gradient: "linear-gradient(135deg, #10B981 0%, #06B6D4 50%, #3388FF 100%)" },
];

// ─── 6 months — each with its own brand accent color ──────────────────────────
type Month = {
  n:        string;        // "Month 1"
  title:    string;        // "Foundations"
  blurb:    string;        // 1-liner about what this month gets you
  projects: string[];      // project names (no emojis)
  weeks:    string[];      // schedule breakdown
  badge:    string;        // bottom badge text
  accent:   string;        // hex color
  isFinal:  boolean;       // styling for month 6
  milestone: string;       // career progress: "17% to AI Engineer"
};

const MONTHS: Month[] = [
  {
    n: "Month 1", title: "Foundations",
    blurb: "Master the building blocks of LLMs.",
    projects: ["AI Chatbot", "Document Q&A"],
    weeks: ["Week 1–2 · Theory", "Week 3–4 · Build"],
    badge: "2 projects shipped",
    accent: "#3388FF",
    isFinal: false,
    milestone: "17% to job-ready",
  },
  {
    n: "Month 2", title: "Prompting",
    blurb: "Engineer prompts that actually work.",
    projects: ["Prompt Lab", "Code Reviewer"],
    weeks: ["Week 1–2 · Theory", "Week 3–4 · Build"],
    badge: "2 projects shipped",
    accent: "#6366F1",
    isFinal: false,
    milestone: "33% to job-ready",
  },
  {
    n: "Month 3", title: "Building",
    blurb: "Real systems. Real users.",
    projects: ["Research Agent", "Knowledge Base"],
    weeks: ["Week 1–2 · Theory", "Week 3–4 · Build"],
    badge: "2 projects shipped",
    accent: "#A78BFA",
    isFinal: false,
    milestone: "50% to job-ready",
  },
  {
    n: "Month 4", title: "Production",
    blurb: "Deploy what you build. Scale what works.",
    projects: ["Voice AI", "Content Platform"],
    weeks: ["Week 1–2 · Theory", "Week 3–4 · Build"],
    badge: "2 projects shipped",
    accent: "#8B5CF6",
    isFinal: false,
    milestone: "67% to job-ready",
  },
  {
    n: "Month 5", title: "Advanced",
    blurb: "Architecture-level engineering.",
    projects: ["Production SaaS", "Multi-Agent System"],
    weeks: ["Week 1–2 · Theory", "Week 3–4 · Build"],
    badge: "2 projects shipped",
    accent: "#06B6D4",
    isFinal: false,
    milestone: "83% to job-ready",
  },
  {
    n: "Month 6", title: "Interview Ready",
    blurb: "Portfolio complete. Proof in hand.",
    projects: ["Portfolio Polish", "Mock Interviews"],
    weeks: ["Week 1–2 · Polish", "Week 3–4 · Interview"],
    badge: "Portfolio verified",
    accent: "#10B981",
    isFinal: true,
    milestone: "Hired",
  },
];

// ─── Single month card — premium gradient style ───────────────────────────────
function MonthCard({
  month,
  isVisible,
  index,
}: {
  month: Month;
  isVisible: boolean;
  index: number;
}) {
  return (
    <div
      className="relative group rounded-3xl p-6 lg:p-7 transition-all duration-700 will-change-transform border overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, ${month.accent}14 0%, #FFFFFF 50%, ${month.accent}08 100%),
          radial-gradient(circle at top right, ${month.accent}10, transparent 60%)
        `,
        borderColor: `${month.accent}30`,
        boxShadow: `0 10px 32px ${month.accent}15, 0 0 0 1px ${month.accent}10 inset`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${index * 90}ms`,
      }}
    >
      {/* Decorative blob top-right */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-50"
        style={{ background: `radial-gradient(circle, ${month.accent}30 0%, transparent 70%)`, filter: "blur(16px)" }} />

      {/* Month badge — top-left */}
      <div className="relative flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="relative flex items-center justify-center">
            <span className="absolute w-2.5 h-2.5 rounded-full animate-ping opacity-50" style={{ background: month.accent }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: month.accent }} />
          </span>
          <span className="text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: month.accent }}>
            {month.n}
          </span>
        </div>
        {month.isFinal && (
          <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full"
            style={{ background: `${month.accent}20`, color: month.accent }}>
            ✓ Hired
          </span>
        )}
      </div>

      {/* Theme — big bold title */}
      <h3 className="relative text-2xl lg:text-3xl font-black text-slate-900 leading-tight mb-2"
        style={{ letterSpacing: "-0.02em" }}>
        {month.title}
      </h3>

      {/* Blurb */}
      <p className="relative text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
        {month.blurb}
      </p>

      {/* Projects */}
      <div className="relative space-y-1.5 mb-5">
        {month.projects.map((p, i) => (
          <div
            key={p}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-white/60"
            style={{ borderColor: `${month.accent}20` }}
          >
            <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color: month.accent }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-700">{p}</span>
          </div>
        ))}
      </div>

      {/* Schedule */}
      <div className="relative flex items-center gap-3 mb-4 text-[10px] text-slate-500">
        {month.weeks.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      {/* Bottom — milestone + progress bar */}
      <div className="relative pt-4 border-t" style={{ borderColor: `${month.accent}15` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] sm:text-[11px] font-bold" style={{ color: month.accent }}>
            {month.badge}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">
            {month.milestone}
          </span>
        </div>
        {/* Mini progress bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: `${month.accent}15` }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: isVisible ? `${((index + 1) / 6) * 100}%` : "0%",
              background: `linear-gradient(90deg, ${month.accent}, ${month.accent}cc)`,
              transitionDelay: `${index * 90 + 400}ms`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export function TimelineSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [roleIdx, setRoleIdx] = useState(0);

  // Rotating job title
  useEffect(() => {
    const t = setInterval(() => setRoleIdx((i) => (i + 1) % JOB_TITLES.length), 2800);
    return () => clearInterval(t);
  }, []);

  // Trigger reveal
  useEffect(() => {
    if (!sectionRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
      style={{
        background: `
          radial-gradient(ellipse 900px 500px at 20% 20%, rgba(0,86,206,0.08), transparent 60%),
          radial-gradient(ellipse 800px 500px at 80% 80%, rgba(167,139,250,0.07), transparent 60%),
          radial-gradient(ellipse 700px 500px at 50% 50%, rgba(16,185,129,0.05), transparent 60%),
          linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
        `,
      }}
    >
      {/* Drifting accent blobs for depth */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-30 animate-blob-1"
        style={{ background: "radial-gradient(circle, rgba(0,86,206,0.15) 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[500px] rounded-full opacity-25 animate-blob-2"
        style={{ background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)", filter: "blur(90px)" }} />

      <div className="relative max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            The 6-Month Path
          </span>
          <h2 className="mt-4 font-black tracking-tight text-slate-900 leading-[0.95]"
            style={{ fontSize: "clamp(36px, 6vw, 80px)" }}>
            From day zero to
            <br />
            <span
              key={roleIdx}
              className="animate-role-rotate inline-block"
              style={{
                background: JOB_TITLES[roleIdx].gradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {JOB_TITLES[roleIdx].label}.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Every week, a new lesson. Every month, a new project shipped. Every step closer to the offer letter.
          </p>
        </div>

        {/* 6 month grid — 2 rows of 3 on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {MONTHS.map((month, i) => (
            <MonthCard key={month.n} month={month} isVisible={visible} index={i} />
          ))}
        </div>

        {/* Bottom callout */}
        <div className="mt-14 sm:mt-20 flex flex-col items-center gap-4">
          <p className="text-sm text-slate-500 text-center max-w-md">
            6 months. 12 projects. 1 portfolio.{" "}
            <span className="font-semibold text-slate-700">One job offer.</span>
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            style={{
              background: "linear-gradient(135deg, #0056CE 0%, #4F46E5 100%)",
              boxShadow: "0 12px 32px rgba(0,86,206,0.30)",
            }}
          >
            Start month 1 →
          </Link>
        </div>
      </div>
    </section>
  );
}
