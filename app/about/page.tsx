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

// Square 1 Blue accent gradient for headline words (matches the landing).
const ACCENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";
const accentText = {
  background: ACCENT,
  WebkitBackgroundClip: "text" as const,
  WebkitTextFillColor: "transparent" as const,
  backgroundClip: "text" as const,
};

// ─── The ecosystem pillars (blue family + honest status) ──────────────────────
const ECOSYSTEM = [
  { n: "01", title: "AI assessment & skill mapping", desc: "A 30-minute test across MCQ, short answer, and real code. AI grades everything and maps your skills topic by topic — strengths, gaps, and a personalised plan.", accent: "#3388FF", status: "live" },
  { n: "02", title: "On-demand courses", desc: "Self-paced, AI-enhanced courses across 12 subjects. Theory, coding challenges, and real projects — 45 minutes a day. AI grades every line of code you write.", accent: "#0EA5E9", status: "building" },
  { n: "03", title: "Live courses & workshops", desc: "Instructor-led cohort sessions with real-time AI assistance. Weekly live workshops, Q&A, and pair programming — the energy of a classroom, the intelligence of AI.", accent: "#0056CE", status: "coming" },
  { n: "04", title: "Community", desc: "A global network of learners, builders, and mentors. Peer code reviews, study groups, accountability partners, and a space where you're never learning alone.", accent: "#3388FF", status: "coming" },
  { n: "05", title: "Competitions & hackathons", desc: "Monthly AI-judged coding competitions and team hackathons. Build under pressure, win recognition, and add real results to your portfolio.", accent: "#0EA5E9", status: "coming" },
  { n: "06", title: "Research lab", desc: "Collaborative research on cutting-edge AI, security, and emerging tech. Publish, contribute to open source, and build credibility beyond coursework.", accent: "#0056CE", status: "coming" },
  { n: "07", title: "Career enablement", desc: "AI-powered interview prep, portfolio scoring, resume generation, and pathways to employers who trust our graduates. Mock interviews graded by AI.", accent: "#3388FF", status: "coming" },
  { n: "08", title: "Startup incubation", desc: "For builders who want to launch, not just land a job. Founder mentorship, investor access, pitch coaching, and a community turning projects into products.", accent: "#0EA5E9", status: "coming" },
];

const STATUS: Record<string, { label: string; bg: string; border: string; color: string }> = {
  live:     { label: "● Live",     bg: "rgba(25,166,95,0.10)",  border: "rgba(25,166,95,0.30)",  color: "#19A65F" },
  building: { label: "◐ Building", bg: "rgba(217,119,6,0.10)",  border: "rgba(217,119,6,0.30)",  color: "#D97706" },
  coming:   { label: "○ Coming",   bg: "rgba(15,23,42,0.05)",   border: "rgba(15,23,42,0.12)",   color: "#64748B" },
};

// ─── Why it matters — AI features (blue + verified-emerald) ───────────────────
const AI_FEATURES = [
  { title: "AI that grades your code", desc: "Not multiple choice. Claude reads every line of your code and tells you exactly what's wrong and how to fix it.", accent: "#0056CE", tag: "Code" },
  { title: "AI that knows your level", desc: "The 30-minute assessment maps your skills topic by topic. Your plan starts where YOU are — not where a curriculum assumes.", accent: "#0EA5E9", tag: "Skill map" },
  { title: "AI that adapts in real time", desc: "Struggling with RAG systems? Nova adjusts. Breezing through APIs? It accelerates. Every session is personalised.", accent: "#3388FF", tag: "Adaptive" },
  { title: "AI that proves you're ready", desc: "Your portfolio score, skill report, and 12 deployed projects tell employers everything — without a single interview question.", accent: "#19A65F", tag: "Portfolio" },
];

// ─── How it works — 3 steps ───────────────────────────────────────────────────
const STEPS = [
  { n: "1", title: "Assess", accent: "#3388FF",
    desc: "A 30-minute AI assessment maps every skill — strengths, gaps, and a plan that starts where you actually are.",
    icon: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></> },
  { n: "2", title: "Build & get graded", accent: "#0056CE",
    desc: "Self-paced projects across 12 subjects. Nova grades every line of code you write — and shows you the fix.",
    icon: <><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></> },
  { n: "3", title: "Ship & get hired", accent: "#01224F",
    desc: "Finish with 12 deployed projects and a verifiable skill report you put straight in front of employers.",
    icon: <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" /></> },
];

// ─── How-it-works cards ───────────────────────────────────────────────────────
function HowItWorks() {
  const { ref, visible } = useReveal(0.15);
  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {STEPS.map((s, i) => (
        <div key={s.n}
          className="relative rounded-3xl border border-slate-200 bg-white p-6 lg:p-7 transition-all hover:shadow-lg"
          style={{ boxShadow: "0 4px 20px rgba(15,28,49,0.05)", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity .6s ease-out, transform .6s ease-out", transitionDelay: `${i * 110}ms` }}>
          <div className="flex items-center justify-between mb-5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${s.accent}14`, border: `1px solid ${s.accent}30` }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
            </div>
            <span className="font-black tabular-nums leading-none" style={{ fontSize: "40px", ...accentText, opacity: 0.18 }}>{s.n}</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-2">{s.title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Ecosystem pillar cards ───────────────────────────────────────────────────
function EcosystemCards() {
  const { ref, visible } = useReveal(0.12);
  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
      {ECOSYSTEM.map((step, index) => {
        const st = STATUS[step.status];
        return (
          <div key={step.n}
            className="relative rounded-3xl p-6 lg:p-7 border bg-white overflow-hidden group transition-all hover:shadow-lg"
            style={{ borderColor: `${step.accent}22`, boxShadow: `0 4px 20px ${step.accent}08`, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity .6s ease-out, transform .6s ease-out", transitionDelay: `${index * 80}ms` }}>
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity"
              style={{ background: `radial-gradient(circle, ${step.accent}20 0%, transparent 70%)`, filter: "blur(16px)" }} />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-black tabular-nums leading-none select-none" style={{ fontSize: "clamp(30px, 4vw, 44px)", letterSpacing: "-0.04em", color: step.accent, opacity: 0.85 }}>{step.n}</span>
                  <div className="h-px w-8" style={{ background: `${step.accent}30` }} />
                </div>
                <span className="text-[8px] sm:text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border"
                  style={{ background: st.bg, borderColor: st.border, color: st.color }}>
                  {st.label}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 leading-tight mb-2.5">{step.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Mini visual per AI feature (light cards) ─────────────────────────────────
function AiMiniVisual({ type, accent }: { type: string; accent: string }) {
  if (type === "grades") {
    return (
      <div className="mt-5 space-y-1.5 font-mono text-[10px] rounded-xl p-3" style={{ background: "#0D1117" }}>
        {[
          { ok: true,  line: "1", code: "def chat(msg):" },
          { ok: true,  line: "2", code: "  client = Anthropic()" },
          { ok: false, line: "3", code: "  response = client.send(msg)" },
        ].map((l) => (
          <div key={l.line} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
            style={{ background: l.ok ? "rgba(25,166,95,0.10)" : "rgba(239,68,68,0.10)", border: `1px solid ${l.ok ? "rgba(25,166,95,0.20)" : "rgba(239,68,68,0.20)"}` }}>
            <span className={l.ok ? "text-emerald-400" : "text-red-400"}>{l.ok ? "✓" : "✗"}</span>
            <span className="text-slate-500 w-3">{l.line}</span>
            <span className="text-slate-300">{l.code}</span>
          </div>
        ))}
      </div>
    );
  }
  if (type === "level") {
    return (
      <div className="mt-5 space-y-2">
        {[
          { label: "LLM", pct: 85, color: "#19A65F" },
          { label: "RAG", pct: 45, color: "#D97706" },
          { label: "Agents", pct: 25, color: "#EF4444" },
        ].map((b) => (
          <div key={b.label} className="flex items-center gap-2">
            <span className="text-[9px] text-slate-500 w-10">{b.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color }} />
            </div>
            <span className="text-[9px] tabular-nums font-bold" style={{ color: b.color }}>{b.pct}%</span>
          </div>
        ))}
      </div>
    );
  }
  if (type === "adapts") {
    return (
      <div className="mt-5 flex items-center gap-3">
        {["Beginner", "Intermediate", "Advanced"].map((l, i) => (
          <div key={l} className="flex-1 text-center">
            <div className="h-1.5 rounded-full mb-1.5 overflow-hidden bg-slate-100">
              <div className="h-full rounded-full" style={{ width: i === 0 ? "100%" : i === 1 ? "65%" : "20%", background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
            </div>
            <span className="text-[8px] text-slate-500">{l}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="mt-5 flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900 tabular-nums">94</span>
          <span className="text-xs text-slate-500">/100</span>
        </div>
        <p className="text-[9px] text-slate-500 mt-0.5">Portfolio score</p>
      </div>
      <div className="flex gap-0.5">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: i < 9 ? accent : "rgba(15,23,42,0.08)" }} />
        ))}
      </div>
    </div>
  );
}

function AiFeatureCards() {
  const { ref, visible } = useReveal(0.15);
  const miniTypes = ["grades", "level", "adapts", "proves"];
  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {AI_FEATURES.map((f, index) => (
        <div key={f.title}
          className="group rounded-3xl p-6 lg:p-7 border border-slate-200 bg-white overflow-hidden relative transition-all duration-500 hover:shadow-xl"
          style={{ boxShadow: `0 6px 24px ${f.accent}0E`, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity .6s ease-out, transform .6s ease-out, box-shadow .4s ease", transitionDelay: `${index * 110}ms` }}>
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none opacity-30 group-hover:opacity-60 transition-opacity duration-700"
            style={{ background: `radial-gradient(circle, ${f.accent}25 0%, transparent 70%)`, filter: "blur(20px)" }} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover:scale-110"
                style={{ background: `${f.accent}14`, borderColor: `${f.accent}33` }}>
                <span className="text-sm font-black" style={{ color: f.accent }}>AI</span>
              </div>
              <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${f.accent}30, transparent)` }} />
              <span className="text-[8px] tracking-widest uppercase font-bold px-2 py-0.5 rounded-full border"
                style={{ background: `${f.accent}12`, borderColor: `${f.accent}30`, color: f.accent }}>
                {f.tag}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2 leading-tight">{f.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            <AiMiniVisual type={miniTypes[index]} accent={f.accent} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── "What we are" checklist ──────────────────────────────────────────────────
function WhatWeAreChecklist() {
  const { ref, visible } = useReveal(0.2);
  const items = [
    { label: "Personalised", desc: "Your path adapts to your level — beginner to advanced" },
    { label: "Project-based", desc: "12 deployed projects, not 12 certificates" },
    { label: "AI-graded", desc: "Every line of code reviewed by Claude" },
    { label: "Career-mapped", desc: "Every course leads to a real role with a real salary" },
  ];
  return (
    <div ref={ref} className="space-y-4">
      {items.map((item, index) => (
        <div key={item.label} className="flex items-start gap-3"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(-24px)", transition: "opacity .55s ease-out, transform .55s ease-out", transitionDelay: `${index * 90}ms` }}>
          <span className="w-6 h-6 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">{item.label}</p>
            <p className="text-xs text-slate-500">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section heading helper ───────────────────────────────────────────────────
function Heading({ eyebrow, plain, accent, sub }: { eyebrow: string; plain: string; accent: string; sub?: string }) {
  const { ref, visible } = useReveal(0.3);
  return (
    <div ref={ref} className="text-center mb-12 sm:mb-14"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity .6s ease-out, transform .6s ease-out" }}>
      <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-brand font-bold">{eyebrow}</span>
      <h2 className="mt-3 font-black tracking-tight text-slate-900 leading-[1.03]" style={{ fontSize: "clamp(30px, 5vw, 56px)", letterSpacing: "-0.02em" }}>
        {plain}{" "}<span style={accentText}>{accent}</span>
      </h2>
      {sub && <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">{sub}</p>}
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="overflow-x-hidden bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-6 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="pointer-events-none absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #0056CE 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #0EA5E9 0%, transparent 70%)", filter: "blur(100px)" }} />

        {/* Nav */}
        <nav className="relative z-30 max-w-6xl mx-auto flex items-center justify-between mb-16 sm:mb-24">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors" style={{ minHeight: "unset" }}>
            <span>←</span> <Logo variant="dark" size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-500 hover:text-slate-900 transition-colors" style={{ minHeight: "unset" }}>
              Sign in
            </Link>
            <Link href="/signup"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold tracking-wide uppercase transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#0056CE,#01224F)", minHeight: "unset", boxShadow: "0 8px 24px rgba(0,86,206,0.25)" }}>
              Get started <span className="w-2 h-2 rounded-full bg-white/80 shrink-0" />
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-8"
            style={{ background: "rgba(0,86,206,0.06)", borderColor: "rgba(0,86,206,0.20)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-brand">
              The AI-powered learn-to-launch platform
            </span>
          </div>

          <h1 className="font-black tracking-tight text-slate-900 leading-[0.98] mb-8"
            style={{ fontSize: "clamp(36px, 7vw, 84px)", letterSpacing: "-0.03em" }}>
            Learn your way.
            <br />Build real skills.
            <br /><span style={accentText}>Launch your future.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Education is still one-size-fits-all. We&apos;re changing that. Square 1 Ai combines
            AI-powered assessment, personalised learning, and real-world project building into
            one platform — designed to take you from where you are to where you want to be.
          </p>

          {/* Honest trust strip */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] sm:text-xs font-semibold text-slate-500">
            {["12 courses", "12 projects / course", "AI-graded", "$0 to start"].map((t, i) => (
              <span key={t} className="flex items-center gap-2">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-slate-300" />}
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM → OUR ANSWER ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 55%, #F4F8FF 100%)" }}>
        <div className="relative max-w-4xl mx-auto">
          <Heading eyebrow="What we are" plain="Not a course." accent="A career launch system." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="space-y-6">
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                Traditional education gives you theory and hopes you figure out the rest.
                Bootcamps rush you through and hand you a certificate. YouTube gives you
                content but zero feedback.
              </p>
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900">Square 1 Ai is different.</span>{" "}
                We assess exactly where you are, build a plan around your life, grade every
                line of code you write with AI, and don&apos;t stop until you&apos;ve shipped
                12 real projects and landed the job — or launched the startup.
              </p>
              <p className="text-sm text-slate-500 leading-relaxed border-l-2 border-brand/30 pl-4">
                Our mission: make world-class technical education accessible to everyone — a
                personal AI tutor, a curriculum that adapts to your level, and a portfolio that
                proves you&apos;re ready, regardless of where you went to school or what you can afford.
              </p>
            </div>
            <WhatWeAreChecklist />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="relative max-w-5xl mx-auto">
          <Heading eyebrow="How it works" plain="Three steps to" accent="job-ready." sub="One focused track — from your first assessment to a portfolio employers can verify." />
          <HowItWorks />
        </div>
      </section>

      {/* ── THE ECOSYSTEM (8 pillars) ────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(180deg, #F4F8FF 0%, #FFFFFF 55%, #F8FAFC 100%)" }}>
        <div className="pointer-events-none absolute top-1/4 right-1/5 w-[520px] h-[520px] rounded-full opacity-25 animate-blob-1"
          style={{ background: "radial-gradient(circle, rgba(0,86,206,0.08) 0%, transparent 70%)", filter: "blur(90px)" }} />
        <div className="relative max-w-5xl mx-auto">
          <Heading eyebrow="The ecosystem" plain="Eight pillars." accent="One platform."
            sub="Square 1 Ai isn't just courses — it's an end-to-end system, from your first assessment to your first startup. Here's what's live, what we're building, and what's next." />
          <EcosystemCards />
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              This isn&apos;t a wishlist. It&apos;s what we&apos;re building{" "}
              <span className="font-bold text-slate-700">right now</span> — piece by piece, AI-first, student-first.
            </p>
          </div>
        </div>
      </section>

      {/* ── WHY AI IS THE FOUNDATION ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="relative max-w-5xl mx-auto">
          <Heading eyebrow="Why it matters" plain="AI isn't a feature." accent="It's the foundation." />
          <AiFeatureCards />
        </div>
      </section>

      {/* ── OUR PROMISE + CTA ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)" }}>
        <div className="pointer-events-none absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(0,86,206,0.10) 0%, transparent 70%)", filter: "blur(90px)" }} />
        <PromiseContent />
      </section>
    </main>
  );
}

// ─── Promise + CTA ────────────────────────────────────────────────────────────
function PromiseContent() {
  const { ref, visible } = useReveal(0.2);
  const fade = (delay: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
    transition: "opacity .6s ease-out, transform .6s ease-out",
    transitionDelay: `${delay}ms`,
  });
  return (
    <div ref={ref} className="relative max-w-3xl mx-auto text-center">
      <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-brand font-bold" style={fade(0)}>
        Our promise
      </span>
      <h2 className="mt-4 mb-8 font-black tracking-tight text-slate-900 leading-[1.03]" style={{ fontSize: "clamp(30px, 5vw, 56px)", letterSpacing: "-0.02em", ...fade(80) }}>
        We don&apos;t stop until <span style={accentText}>you&apos;re hired.</span>
      </h2>
      <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-12 max-w-2xl mx-auto" style={fade(160)}>
        Every feature we build, every course we design, every AI model we tune — exists for one
        reason: to get you from where you are today to a real career in tech. Not someday.{" "}
        <span className="font-bold text-slate-900">In 3 to 9 months.</span>
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6" style={fade(240)}>
        <Link href="/diagnostic"
          className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-base lg:text-lg font-bold text-white overflow-hidden transition-all hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)", boxShadow: "0 16px 48px rgba(220,38,38,0.30)" }}>
          <span className="relative z-10">Get your free skill report</span>
          <span className="relative z-10 text-xl transition-transform group-hover:translate-x-2">→</span>
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
        </Link>
        <Link href="/contact"
          className="inline-flex items-center justify-center px-8 py-5 rounded-2xl text-slate-700 text-base font-semibold border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all">
          Get in touch
        </Link>
      </div>
      <p className="text-xs text-slate-500" style={fade(320)}>
        Or email us at{" "}
        <a href="mailto:tech@square1ai.com" className="text-brand hover:underline font-semibold">tech@square1ai.com</a>
      </p>
    </div>
  );
}
