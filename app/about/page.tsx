"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

// ─── Reusable scroll-reveal hook ──────────────────────────────────────────────
function useReveal(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, isVisible: boolean, duration = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!isVisible) return;
    const start = performance.now();
    let raf = 0;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, isVisible, duration]);
  return v;
}

// ─── The ecosystem pillars ────────────────────────────────────────────────────
const ECOSYSTEM = [
  {
    n: "01", title: "AI Assessment & Skill Mapping",
    desc: "Take a 30-minute test across MCQ, short answer, and real code. AI grades everything and maps your skills topic by topic — strengths, gaps, and a personalised learning plan.",
    accent: "#3388FF",
    status: "live",
  },
  {
    n: "02", title: "On-Demand Courses",
    desc: "Self-paced, AI-enhanced courses across 12 subjects. Theory, coding challenges, and real projects — 45 minutes a day, at your own speed. AI grades every line of code you write.",
    accent: "#6366F1",
    status: "building",
  },
  {
    n: "03", title: "Live Courses & Workshops",
    desc: "Instructor-led cohort sessions with real-time AI assistance. Weekly live workshops, Q&A, and pair programming. The energy of a classroom, the intelligence of AI.",
    accent: "#A78BFA",
    status: "coming",
  },
  {
    n: "04", title: "Community",
    desc: "A global network of learners, builders, and mentors. Peer code reviews, study groups, accountability partners, and a Slack-like space where you're never learning alone.",
    accent: "#EC4899",
    status: "coming",
  },
  {
    n: "05", title: "Competitions & Hackathons",
    desc: "Monthly AI-judged coding competitions and team hackathons. Build under pressure, win recognition, and add real competition results to your portfolio.",
    accent: "#F59E0B",
    status: "coming",
  },
  {
    n: "06", title: "Research Lab",
    desc: "Collaborative research projects on cutting-edge AI, cybersecurity, and emerging tech. Publish papers, contribute to open source, and build credibility beyond coursework.",
    accent: "#06B6D4",
    status: "coming",
  },
  {
    n: "07", title: "Career Enablement",
    desc: "AI-powered interview prep, portfolio scoring, resume generation, and direct pathways to employers who trust our graduates. Mock interviews graded by AI.",
    accent: "#8B5CF6",
    status: "coming",
  },
  {
    n: "08", title: "Startup Incubation",
    desc: "For builders who want to launch, not just land a job. Mentorship from founders, investor access, pitch coaching, and a community of builders turning projects into products.",
    accent: "#10B981",
    status: "coming",
  },
];

// ─── Why it matters — AI features ─────────────────────────────────────────────
const AI_FEATURES = [
  {
    title: "AI that grades your code",
    desc: "Not multiple choice. Claude AI reads every line of your code and tells you exactly what's wrong and how to fix it.",
    accent: "#3388FF",
  },
  {
    title: "AI that knows your level",
    desc: "The 30-minute assessment maps your skills topic by topic. Your learning plan starts where YOU are — not where a curriculum assumes.",
    accent: "#A78BFA",
  },
  {
    title: "AI that adapts in real time",
    desc: "Struggling with RAG systems? Nova adjusts. Breezing through APIs? It accelerates. Every session is personalised.",
    accent: "#10B981",
  },
  {
    title: "AI that proves you're ready",
    desc: "Your portfolio score, skill report, and 12 deployed projects tell employers everything they need to know — without a single interview question.",
    accent: "#F59E0B",
  },
];

// ─── Stats strip ─────────────────────────────────────────────────────────────
function StatsStrip() {
  const { ref, visible } = useReveal(0.3);
  const s1 = useCountUp(12, visible);
  const s2 = useCountUp(120, visible);
  const s3 = useCountUp(100, visible);
  return (
    <section ref={ref} className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8" style={{ background: "#050B14" }}>
      <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
        {[
          { v: s1, suffix: "", label: "career paths" },
          { v: s2, suffix: "+", label: "lessons built" },
          { v: s3, suffix: "+", label: "projects designed" },
          { v: visible ? "$0" : "$0", suffix: "", label: "cost to start", isText: true },
        ].map((s) => (
          <div key={s.label}>
            <p className="font-black tabular-nums text-white leading-none"
              style={{ fontSize: "clamp(36px, 5vw, 56px)", letterSpacing: "-0.04em" }}>
              {s.isText ? s.v : `${s.v}${s.suffix}`}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-2 font-medium uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Animated ecosystem cards ────────────────────────────────────────────────
function EcosystemCards() {
  const { ref, visible } = useReveal(0.15);
  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
      {ECOSYSTEM.map((step, index) => (
        <div key={step.n}
          className="relative rounded-3xl p-6 lg:p-8 border overflow-hidden group transition-all hover:shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${step.accent}10 0%, #FFFFFF 50%, ${step.accent}06 100%)`,
            borderColor: `${step.accent}25`,
            boxShadow: `0 4px 24px ${step.accent}08`,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
            transitionDelay: `${index * 100}ms`,
          }}>
          {/* Decorative blob */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity"
            style={{ background: `radial-gradient(circle, ${step.accent}25 0%, transparent 70%)`, filter: "blur(16px)" }} />

          <div className="relative">
            {/* Header: number + status badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="font-black tabular-nums leading-none select-none"
                  style={{
                    fontSize: "clamp(32px, 4vw, 48px)",
                    letterSpacing: "-0.04em",
                    background: `linear-gradient(180deg, ${step.accent} 0%, ${step.accent}55 100%)`,
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    filter: `drop-shadow(0 0 12px ${step.accent}30)`,
                  }}>
                  {step.n}
                </span>
                <div className="h-px w-8" style={{ background: `${step.accent}30` }} />
              </div>
              <span
                className="text-[8px] sm:text-[9px] font-black tracking-widest uppercase px-2 py-1 rounded-full border"
                style={{
                  background: step.status === "live" ? "rgba(16,185,129,0.15)" : step.status === "building" ? "rgba(245,158,11,0.15)" : `${step.accent}10`,
                  borderColor: step.status === "live" ? "rgba(16,185,129,0.30)" : step.status === "building" ? "rgba(245,158,11,0.30)" : `${step.accent}25`,
                  color: step.status === "live" ? "#10B981" : step.status === "building" ? "#F59E0B" : step.accent,
                }}
              >
                {step.status === "live" ? "● Live" : step.status === "building" ? "◐ Building" : "○ Coming"}
              </span>
            </div>

            <h3 className="text-lg lg:text-xl font-black text-slate-900 leading-tight mb-3">
              {step.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {step.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Animated AI feature cards ───────────────────────────────────────────────
// ─── Mini visual per AI feature ───────────────────────────────────────────────
function AiMiniVisual({ type, accent }: { type: string; accent: string }) {
  if (type === "grades") {
    // Mini code review lines
    return (
      <div className="mt-5 space-y-1.5 font-mono text-[10px]">
        {[
          { ok: true,  line: "1", code: "def chat(msg):" },
          { ok: true,  line: "2", code: "  client = Anthropic()" },
          { ok: false, line: "3", code: "  response = client.send(msg)" },
        ].map((l) => (
          <div key={l.line} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
            style={{ background: l.ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${l.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}` }}>
            <span className={l.ok ? "text-emerald-400" : "text-red-400"}>{l.ok ? "✓" : "✗"}</span>
            <span className="text-slate-500 w-3">{l.line}</span>
            <span className="text-slate-300">{l.code}</span>
          </div>
        ))}
      </div>
    );
  }
  if (type === "level") {
    // Mini skill bars
    return (
      <div className="mt-5 space-y-2">
        {[
          { label: "LLM", pct: 85, color: "#10B981" },
          { label: "RAG", pct: 45, color: "#F59E0B" },
          { label: "Agents", pct: 25, color: "#EF4444" },
        ].map((b) => (
          <div key={b.label} className="flex items-center gap-2">
            <span className="text-[9px] text-slate-500 w-10">{b.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color }} />
            </div>
            <span className="text-[9px] tabular-nums font-bold" style={{ color: b.color }}>{b.pct}%</span>
          </div>
        ))}
      </div>
    );
  }
  if (type === "adapts") {
    // Mini adaptive progress
    return (
      <div className="mt-5 flex items-center gap-3">
        {["Beginner", "Intermediate", "Advanced"].map((l, i) => (
          <div key={l} className="flex-1 text-center">
            <div className="h-1.5 rounded-full mb-1.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{
                width: i === 0 ? "100%" : i === 1 ? "65%" : "20%",
                background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
              }} />
            </div>
            <span className="text-[8px] text-slate-500">{l}</span>
          </div>
        ))}
      </div>
    );
  }
  // "proves" — portfolio score
  return (
    <div className="mt-5 flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-white tabular-nums">94</span>
          <span className="text-xs text-slate-500">/100</span>
        </div>
        <p className="text-[9px] text-slate-500 mt-0.5">Portfolio score</p>
      </div>
      <div className="flex gap-0.5">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-sm"
            style={{ background: i < 9 ? `linear-gradient(135deg, ${accent}, ${accent}88)` : "rgba(255,255,255,0.06)" }} />
        ))}
      </div>
    </div>
  );
}

function AiFeatureCards() {
  const { ref, visible } = useReveal(0.15);
  const miniTypes = ["grades", "level", "adapts", "proves"];
  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
      {AI_FEATURES.map((f, index) => (
        <div key={f.title}
          className="group rounded-3xl p-6 lg:p-8 border overflow-hidden relative transition-all duration-500 hover:scale-[1.02] hover:shadow-xl"
          style={{
            background: `linear-gradient(135deg, ${f.accent}14 0%, rgba(13,17,23,0.95) 50%, ${f.accent}08 100%)`,
            borderColor: `${f.accent}30`,
            boxShadow: `0 8px 32px ${f.accent}12, 0 0 0 1px ${f.accent}10 inset`,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.7s ease-out, transform 0.7s ease-out, box-shadow 0.5s ease, scale 0.5s ease",
            transitionDelay: `${index * 120}ms`,
          }}>
          {/* Animated glow blob — intensifies on hover */}
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none opacity-30 group-hover:opacity-70 transition-opacity duration-700"
            style={{ background: `radial-gradient(circle, ${f.accent}40 0%, transparent 70%)`, filter: "blur(20px)" }} />

          <div className="relative">
            {/* Header row: badge + accent line */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
                style={{ background: `linear-gradient(135deg, ${f.accent}25, ${f.accent}10)`, borderColor: `${f.accent}40`, boxShadow: `0 4px 16px ${f.accent}20` }}>
                <span className="text-sm font-black" style={{ color: f.accent }}>AI</span>
              </div>
              <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${f.accent}30, transparent)` }} />
              <span className="text-[8px] tracking-widest uppercase font-bold px-2 py-0.5 rounded-full border"
                style={{ background: `${f.accent}15`, borderColor: `${f.accent}30`, color: f.accent }}>
                {index === 0 ? "Code" : index === 1 ? "Skill Map" : index === 2 ? "Adaptive" : "Portfolio"}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg lg:text-xl font-black text-white mb-2 leading-tight">{f.title}</h3>

            {/* Description */}
            <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>

            {/* Mini visual — different for each card */}
            <AiMiniVisual type={miniTypes[index]} accent={f.accent} />
          </div>

          {/* Bottom hover glow */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ boxShadow: `0 16px 48px ${f.accent}30, 0 0 0 1px ${f.accent}40 inset` }} />
        </div>
      ))}
    </div>
  );
}

// ─── Animated beyond-learning mini-cards ─────────────────────────────────────
function BeyondLearningCards() {
  const { ref, visible } = useReveal(0.15);
  const items = [
    { label: "On-Demand Courses", sub: "Self-paced, AI-graded" },
    { label: "Live Workshops", sub: "Instructor + AI combined" },
    { label: "Community", sub: "Global peer network" },
    { label: "Competitions", sub: "Monthly hackathons" },
    { label: "Research Lab", sub: "Open source + papers" },
    { label: "Career Tools", sub: "Interview prep + scoring" },
    { label: "Startup Club", sub: "Mentors + investors" },
    { label: "Nova 24/7", sub: "Knows your code" },
  ];
  return (
    <div ref={ref} className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
      {items.map((item, index) => (
        <div key={item.label} className="rounded-xl p-4 border bg-white/60"
          style={{
            borderColor: "rgba(15,23,42,0.06)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
            transitionDelay: `${index * 80}ms`,
          }}>
          <p className="text-xs sm:text-sm font-bold text-slate-900 mb-1">{item.label}</p>
          <p className="text-[10px] text-slate-500">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Animated "What We Are" checklist ────────────────────────────────────────
function WhatWeAreChecklist() {
  const { ref, visible } = useReveal(0.2);
  const items = [
    { label: "Personalised", desc: "Your path adapts to your level — beginner to advanced" },
    { label: "Project-based", desc: "12 deployed projects, not 12 certificates" },
    { label: "AI-graded", desc: "Every line of code reviewed by Claude AI" },
    { label: "Career-mapped", desc: "Every course leads to a real role with a real salary" },
  ];
  return (
    <div ref={ref} className="space-y-4">
      {items.map((item, index) => (
        <div key={item.label} className="flex items-start gap-3"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : "translateX(-30px)",
            transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
            transitionDelay: `${index * 100}ms`,
          }}>
          <span className="w-6 h-6 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center text-[10px] font-black text-brand shrink-0 mt-0.5">✓</span>
          <div>
            <p className="text-sm font-bold text-slate-900">{item.label}</p>
            <p className="text-xs text-slate-500">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Animated mission text ───────────────────────────────────────────────────
function MissionContent() {
  const { ref, visible } = useReveal(0.2);
  return (
    <div ref={ref} className="relative max-w-3xl mx-auto text-center">
      <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
        }}>
        Our Mission
      </span>
      <h2 className="mt-4 mb-8 font-black tracking-tight text-white leading-[1.05]"
        style={{
          fontSize: "clamp(28px, 4.5vw, 56px)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
          transitionDelay: "100ms",
        }}>
        Make world-class technical education{" "}
        <span style={{
          background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          accessible to everyone.
        </span>
      </h2>
      <div className="space-y-6 text-base sm:text-lg text-slate-400 leading-relaxed">
        <p style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
          transitionDelay: "200ms",
        }}>
          The best engineers in the world didn&apos;t get there by watching videos.
          They got there by building things, getting feedback, and iterating. But until
          now, that kind of mentorship cost $15,000+ or required knowing the right people.
        </p>
        <p className="text-white font-semibold" style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
          transitionDelay: "300ms",
        }}>
          We believe every person on earth should have access to a personal AI tutor like Nova that
          grades their code, a curriculum that adapts to their level, and a portfolio that
          proves they&apos;re ready — regardless of where they went to school or how much
          they can afford.
        </p>
      </div>
    </div>
  );
}

// ─── Animated promise section ────────────────────────────────────────────────
function PromiseContent() {
  const { ref, visible } = useReveal(0.2);
  return (
    <div ref={ref} className="relative max-w-3xl mx-auto text-center">
      <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
        }}>
        Our Promise
      </span>
      <h2 className="mt-4 mb-8 font-black tracking-tight text-slate-900 leading-[1.05]"
        style={{
          fontSize: "clamp(28px, 4.5vw, 56px)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
          transitionDelay: "100ms",
        }}>
        We don&apos;t stop until{" "}
        <span style={{
          background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          you&apos;re hired.
        </span>
      </h2>
      <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-12 max-w-2xl mx-auto"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
          transitionDelay: "200ms",
        }}>
        Every feature we build, every course we design, every AI model we tune —
        exists for one reason: to get you from where you are today to a real career
        in tech. Not someday. Not maybe.{" "}
        <span className="font-bold text-slate-900">In 3 to 9 months.</span>
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
          transitionDelay: "300ms",
        }}>
        <Link
          href="/diagnostic"
          className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-base lg:text-lg font-bold text-white overflow-hidden transition-all hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #DC2626 0%, #EF4444 50%, #F87171 100%)",
            boxShadow: "0 16px 48px rgba(220,38,38,0.35)",
          }}
        >
          <span className="relative z-10">Get your free skill report</span>
          <span className="relative z-10 text-xl transition-transform group-hover:translate-x-2">→</span>
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center px-8 py-5 rounded-2xl text-slate-700 text-base font-semibold transition-all hover:bg-slate-50"
          style={{ border: "1px solid rgba(15,23,42,0.10)" }}
        >
          Get in touch
        </Link>
      </div>
      <p className="text-xs text-slate-500"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.7s ease-out",
          transitionDelay: "400ms",
        }}>
        Or email us at{" "}
        <a href="mailto:tech@square1ai.com" className="text-brand hover:underline font-semibold">tech@square1ai.com</a>
      </p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HERO */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden pt-8 pb-24 sm:pb-32 lg:pb-40 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(180deg, #050B14 0%, #0B1626 100%)" }}
      >
        {/* Blobs */}
        <div className="pointer-events-none absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-[0.12]"
          style={{ background: "radial-gradient(circle, #0056CE 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.10]"
          style={{ background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)", filter: "blur(100px)" }} />

        {/* Nav */}
        <nav className="relative z-30 max-w-6xl mx-auto flex items-center justify-between mb-20 sm:mb-28">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors" style={{ minHeight: "unset" }}>
            <span>←</span> <Logo variant="light" size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/50 hover:text-white transition-colors" style={{ minHeight: "unset" }}>
              Sign In
            </Link>
            <Link href="/signup"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold tracking-wide uppercase hover:opacity-80 transition-all"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", minHeight: "unset" }}>
              Get Started <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <Logo variant="light" size="xl" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-8"
            style={{ background: "rgba(51,136,255,0.10)", borderColor: "rgba(51,136,255,0.30)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-brand">
              The World&apos;s First AI-Powered Learn-to-Launch Platform
            </span>
          </div>

          <h1 className="font-black tracking-tight text-white leading-[0.95] mb-8"
            style={{ fontSize: "clamp(36px, 7vw, 88px)", letterSpacing: "-0.03em" }}>
            Learn Your Way.
            <br />
            Build Real Skills.
            <br />
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              Launch Your Future.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Education is still one-size-fits-all. We&apos;re changing that. Square1 Ai
            combines AI-powered assessment, personalised learning, and real-world
            project building into one platform — designed to take you from where you
            are to where you want to be.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* WHAT WE ARE — the vision */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
        style={{
          background: `
            radial-gradient(ellipse 900px 500px at 20% 25%, rgba(0,86,206,0.08), transparent 60%),
            radial-gradient(ellipse 800px 500px at 80% 75%, rgba(167,139,250,0.07), transparent 60%),
            linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
          `,
        }}
      >
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              What We Are
            </span>
            <h2 className="mt-4 font-black tracking-tight text-slate-900 leading-[0.95]"
              style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
              Not a course.{" "}
              <span style={{
                background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                A career launch system.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-6">
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                Traditional education gives you theory and hopes you figure out the rest.
                Bootcamps rush you through and hand you a certificate. YouTube gives you
                content but zero feedback.
              </p>
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900">Square1 Ai is different.</span>{" "}
                We assess exactly where you are, build a plan around your life, grade every
                line of code you write with AI, and don&apos;t stop until you&apos;ve shipped
                12 real projects and landed the job — or launched the startup.
              </p>
            </div>
            <WhatWeAreChecklist />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* OUR MISSION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(180deg, #050B14 0%, #0B1626 50%, #050B14 100%)" }}
      >
        <div className="pointer-events-none absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(0,86,206,0.20) 0%, transparent 70%)", filter: "blur(90px)" }} />

        <MissionContent />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* STATS STRIP */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <StatsStrip />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS — The 5-step ecosystem */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
        style={{
          background: `
            radial-gradient(ellipse 900px 500px at 80% 20%, rgba(167,139,250,0.07), transparent 60%),
            radial-gradient(ellipse 800px 500px at 20% 80%, rgba(16,185,129,0.06), transparent 60%),
            linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
          `,
        }}
      >
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              The Ecosystem
            </span>
            <h2 className="mt-4 font-black tracking-tight text-slate-900 leading-[0.95]"
              style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
              Eight pillars.{" "}
              <span style={{
                background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                One platform.
              </span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              Square1 Ai isn&apos;t just courses. We&apos;re building an end-to-end education
              ecosystem powered by AI — from your first assessment to your first startup.
            </p>
          </div>

          {/* 8 pillars — premium gradient cards in a grid */}
          <EcosystemCards />

          {/* Ecosystem summary line */}
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              This is not a roadmap. This is what we&apos;re building{" "}
              <span className="font-bold text-slate-700">right now</span> —
              piece by piece, AI-first, student-first.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* WHY IT MATTERS — AI features */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(180deg, #050B14 0%, #0B1626 50%, #050B14 100%)" }}
      >
        <div className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", filter: "blur(90px)" }} />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              Why It Matters
            </span>
            <h2 className="mt-4 font-black tracking-tight text-white leading-[0.95]"
              style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
              AI isn&apos;t a feature.{" "}
              <span style={{
                background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                It&apos;s the foundation.
              </span>
            </h2>
          </div>

          <AiFeatureCards />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* BEYOND LEARNING — the full vision */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
        style={{
          background: `
            radial-gradient(ellipse 900px 500px at 30% 30%, rgba(0,86,206,0.08), transparent 60%),
            radial-gradient(ellipse 800px 500px at 70% 70%, rgba(16,185,129,0.07), transparent 60%),
            linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
          `,
        }}
      >
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              Beyond Learning
            </span>
            <h2 className="mt-4 font-black tracking-tight text-slate-900 leading-[0.95]"
              style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
              An end-to-end{" "}
              <span style={{
                background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                education ecosystem.
              </span>
            </h2>
          </div>

          <div className="space-y-8 text-center max-w-3xl mx-auto">
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
              Most platforms stop at courses. We&apos;re building something bigger — a
              complete ecosystem where you learn, build, compete, research, connect,
              and launch. All powered by AI. All under one roof.
            </p>

            <BeyondLearningCards />

            <p className="text-sm text-slate-500 pt-4">
              We&apos;re not building a better course platform.{" "}
              <span className="font-bold text-slate-800">
                We&apos;re building the operating system for technical careers.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* OUR PROMISE */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
        style={{
          background: `
            radial-gradient(ellipse 900px 500px at 50% 50%, rgba(0,86,206,0.08), transparent 60%),
            linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
          `,
        }}
      >
        <PromiseContent />
      </section>
    </main>
  );
}
