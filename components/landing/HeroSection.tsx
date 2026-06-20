"use client";
import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

// Goal-typer roles — picking one personalises the CTA + shows the salary
const GOAL_ROLES = [
  { label: "AI Engineer", slug: "generative-ai", salary: "$130–200k" },
  { label: "ML Engineer", slug: "machine-learning", salary: "$140–220k" },
  { label: "Full Stack Engineer", slug: "fullstack-development", salary: "$100–160k" },
  { label: "Security Engineer", slug: "cybersecurity", salary: "$110–180k" },
  { label: "Data Scientist", slug: "data-science", salary: "$115–185k" },
  { label: "DevOps Engineer", slug: "devops-engineering", salary: "$120–190k" },
];

// ─── Hero product preview: a Skill Report card with a circular score ───────────
function ScoreRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0">
      <defs>
        <linearGradient id="hero-score" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3388FF" />
          <stop offset="100%" stopColor="#0056CE" />
        </linearGradient>
      </defs>
      <circle cx="42" cy="42" r={r} fill="none" stroke="#E8EEF5" strokeWidth="8" />
      <circle
        cx="42" cy="42" r={r} fill="none" stroke="url(#hero-score)" strokeWidth="8"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        transform="rotate(-90 42 42)"
      />
      <text x="42" y="40" textAnchor="middle" fill="#0F172A" fontSize="22" fontWeight="800">{value}</text>
      <text x="42" y="55" textAnchor="middle" fill="#94A3B8" fontSize="9" fontWeight="600">/ 100</text>
    </svg>
  );
}

function HeroProductCard() {
  const bars = [
    { l: "LLMs & RAG",     v: 90, c: "#19A65F" },
    { l: "Prompt design",  v: 75, c: "#19A65F" },
    { l: "Agents",         v: 45, c: "#E5B217" },
    { l: "Eval & testing", v: 30, c: "#D93636" },
  ];
  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      {/* Soft blue glow behind the card */}
      <div className="pointer-events-none absolute -inset-10 rounded-[40px]"
        style={{ background: "radial-gradient(circle at 60% 40%, rgba(0,86,206,0.14), transparent 70%)", filter: "blur(40px)" }} />

      {/* Main Skill Report card */}
      <div className="relative rounded-3xl bg-white border border-slate-200 p-6 sm:p-7"
        style={{ boxShadow: "0 24px 64px rgba(15,28,49,0.12), 0 0 0 1px rgba(15,28,49,0.02)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand">Skill Report</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">Generative AI</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Intermediate
          </span>
        </div>

        <div className="flex items-center gap-5 mb-6">
          <ScoreRing value={74} />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">You&apos;re 74% of the way to AI Engineer.</p>
            <p className="text-xs text-slate-500 mt-1">Two focused gaps between you and interview-ready.</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {bars.map((b) => (
            <div key={b.l} className="flex items-center gap-3">
              <span className="text-xs text-slate-600 w-24 shrink-0">{b.l}</span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${b.v}%`, background: b.c }} />
              </div>
              <span className="text-[11px] font-semibold tabular-nums w-8 text-right" style={{ color: b.c }}>{b.v}%</span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2.5"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
          <span className="text-xs font-semibold text-slate-700">Personalised plan ready · target: AI Engineer</span>
        </div>
      </div>

      {/* Floating accent — Nova code review */}
      <div className="hidden sm:flex absolute -top-5 -right-4 items-center gap-2.5 rounded-2xl bg-white border border-slate-200 px-3.5 py-2.5"
        style={{ boxShadow: "0 12px 32px rgba(15,28,49,0.12)" }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
          style={{ background: "linear-gradient(135deg,#0056CE,#3388FF)" }}>N</div>
        <div className="leading-tight">
          <p className="text-[11px] font-bold text-slate-900">Nova reviewed your code</p>
          <p className="text-[10px] text-emerald-600 font-semibold">94 / 100 · 2 fixes suggested</p>
        </div>
      </div>

      {/* Floating accent — projects deployed */}
      <div className="hidden sm:flex absolute -bottom-5 -left-5 items-center gap-2.5 rounded-2xl bg-white border border-slate-200 px-3.5 py-2.5"
        style={{ boxShadow: "0 12px 32px rgba(15,28,49,0.12)" }}>
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        <div className="leading-tight">
          <p className="text-[11px] font-bold text-slate-900">12 projects deployed</p>
          <p className="text-[10px] text-slate-500">Live on GitHub · verifiable</p>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const [goal, setGoal] = useState(0);
  const role = GOAL_ROLES[goal];
  const BLUE_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

  return (
    <section className="hero-section relative min-h-screen flex flex-col overflow-hidden bg-white">
      {/* ── Soft Square 1 blue accents on white ───────────────────────────── */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(0,86,206,0.08) 0%, transparent 70%)", filter: "blur(90px)" }} />
      <div className="pointer-events-none absolute top-1/3 -right-40 w-[640px] h-[640px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)", filter: "blur(90px)" }} />

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <nav className="relative z-30 w-full">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between">
          <Logo variant="dark" size="md" />

          <div className="flex items-center gap-3 sm:gap-5">
            <Link href="/business" className="hidden sm:block text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-500 hover:text-slate-900 transition-colors" style={{ minHeight: "unset" }}>
              For Teams
            </Link>
            <Link href="/about" className="hidden sm:block text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-500 hover:text-slate-900 transition-colors" style={{ minHeight: "unset" }}>
              About
            </Link>
            <Link href="/login" className="hidden sm:block text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-500 hover:text-slate-900 transition-colors" style={{ minHeight: "unset" }}>
              Sign In
            </Link>
            {/* "GET STARTED" pill — solid Square 1 blue */}
            <Link href="/diagnostic"
              className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full bg-brand text-white text-xs font-bold tracking-wide uppercase hover:bg-brand/90 transition-all shadow-[0_6px_20px_rgba(0,86,206,0.25)]"
              style={{ minHeight: "unset" }}>
              Get Started
              <span className="w-2 h-2 rounded-full bg-white/70 shrink-0" />
            </Link>
            <Link href="/login" className="sm:hidden text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-500 hover:text-slate-900 transition-colors" style={{ minHeight: "unset" }}>
              In
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO BODY ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center gap-12 lg:gap-8 max-w-7xl mx-auto w-full px-6 sm:px-8 py-10 lg:py-0">

        {/* LEFT — Text */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center">

          <div className="mb-6 sm:mb-8">
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase text-brand border border-brand/20 bg-brand/5 px-3 py-1.5 rounded-full">
              Proof, not promises
            </span>
          </div>

          <h1 className="font-black leading-[0.95] tracking-tight text-slate-900 mb-6 sm:mb-7"
            style={{ fontSize: "clamp(2.75rem, 6.5vw, 5.5rem)" }}>
            The AI tutor that{" "}
            <span style={{ background: BLUE_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              gets you hired.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 max-w-md">
            A degree alone won&apos;t get you hired in 2026 — deployed, code-reviewed
            projects will. Get assessed, get a personalised plan, and build 10–12 real
            projects you can put in front of any employer.
          </p>

          {/* Goal-typer */}
          <div className="mb-7 max-w-md">
            <p className="text-xs text-slate-500 mb-2.5 font-medium">I want to become a…</p>
            <div className="flex flex-wrap gap-2">
              {GOAL_ROLES.map((r, i) => (
                <button
                  key={r.slug}
                  onClick={() => setGoal(i)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={
                    goal === i
                      ? { background: "linear-gradient(135deg,#3388FF,#0056CE)", color: "#fff", boxShadow: "0 4px 16px rgba(0,86,206,0.30)" }
                      : { background: "#fff", color: "#475569", border: "1px solid #E2E8F0" }
                  }
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              <span className="font-bold text-slate-900">{role.label}</span> roles pay{" "}
              <span className="font-bold text-emerald-600">{role.salary}</span>. See how far you are — free.
            </p>
          </div>

          {/* CTA row — red primary (kept), outline secondary */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/diagnostic?subject=${role.slug}`}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-white font-bold text-sm transition-all hover:-translate-y-px"
              style={{
                background: "linear-gradient(135deg, #B91C1C 0%, #DC2626 40%, #EF4444 100%)",
                boxShadow: "0 12px 32px rgba(220,38,38,0.35), 0 0 0 1px rgba(255,255,255,0.10) inset",
              }}
            >
              Show me my {role.label} path
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-full text-slate-700 text-sm font-semibold border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Free · No credit card · No commitment — just signal.
          </p>

          {/* Mini trust bar */}
          <div className="mt-8 flex items-center gap-4 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            <span>12 Subjects</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>10–12 Projects</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>Public Proof</span>
          </div>
        </div>

        {/* RIGHT — Product preview */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <HeroProductCard />
        </div>
      </div>

      {/* ── BOTTOM BAR ────────────────────────────────────────────────────── */}
      <div className="relative z-20 w-full border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4 flex items-center gap-4">
          <span className="text-slate-300 text-xs font-light">+</span>
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-slate-400 font-medium whitespace-nowrap">
            Scroll to explore
          </span>
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-slate-300 text-xs font-light">+</span>
        </div>
      </div>
    </section>
  );
}
