"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X, Check } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { PrimaryCta } from "@/components/ui/primary-cta";

const BLUE_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

// ─── The fork: two equal doors into the product ───────────────────────────────
// LEFT  = career-changers & builders  → existing courses/diagnostic flow
// RIGHT = "use AI at my job, no code" → diagnostic tagged with goal=work
const DOORS = [
  {
    key: "career",
    eyebrow: "Career path",
    title: "Build a career in AI",
    subtitle:
      "The AI tutor that gets you hired. Job-ready engineering & data tracks — get assessed, follow a personalised plan, and ship deployed projects employers can run.",
    bullets: [
      "Job-ready engineering & data tracks",
      "Every project code-reviewed & graded",
      "Certificates backed by a skill report",
    ],
    cta: "Explore career tracks",
    href: "/diagnostic",
  },
  {
    key: "work",
    eyebrow: "Work smarter",
    title: "Use AI better at work — no code",
    subtitle:
      "Your company already pays for Copilot. Get your money's worth. Practical AI skills for your actual job — no programming required.",
    bullets: [
      "Role tracks for marketers, finance, teachers, founders & more",
      "Practise on real work scenarios, graded by our AI tutor",
      "No code, no setup — start in minutes",
    ],
    cta: "Start free — no code",
    href: "/diagnostic?goal=work",
  },
] as const;

function DoorCard({ door }: { door: (typeof DOORS)[number] }) {
  return (
    <div className="group relative flex flex-col rounded-2xl bg-white border border-slate-200 p-7 sm:p-8 text-left transition-all duration-200 hover:border-brand/40 hover:-translate-y-1"
      style={{ boxShadow: "0 16px 48px rgba(15,28,49,0.08), 0 0 0 1px rgba(15,28,49,0.02)" }}>
      <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-brand mb-3">{door.eyebrow}</p>

      <h2 className="text-2xl sm:text-[28px] font-black tracking-tight text-slate-900 leading-tight mb-3">
        {door.title}
      </h2>

      <p className="text-sm text-slate-600 leading-relaxed mb-5">{door.subtitle}</p>

      <ul className="space-y-2.5 mb-7">
        {door.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-[13px] text-slate-700 font-medium">
            <span className="mt-0.5 w-[18px] h-[18px] rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <Check size={10} strokeWidth={3.5} className="text-brand" aria-hidden />
            </span>
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        <PrimaryCta href={door.href} className="w-full">
          {door.cta}
        </PrimaryCta>
      </div>
    </div>
  );
}

export function HeroSection({
  courseCount = 9,
  seats = null,
}: {
  courseCount?: number;
  seats?: { left: number; cap: number } | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="hero-section relative min-h-[92svh] flex flex-col overflow-hidden bg-white">
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
            <Link href="/#pricing" className="hidden sm:block text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-500 hover:text-slate-900 transition-colors" style={{ minHeight: "unset" }}>
              Pricing
            </Link>
            <Link href="/business" className="hidden sm:block text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-500 hover:text-slate-900 transition-colors" style={{ minHeight: "unset" }}>
              For Teams
            </Link>
            <Link href="/research" className="hidden sm:block text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-500 hover:text-slate-900 transition-colors" style={{ minHeight: "unset" }}>
              Research
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
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="sm:hidden w-11 h-11 -mr-2 flex items-center justify-center text-slate-700"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div className="sm:hidden absolute top-full inset-x-0 z-40 bg-white border-b border-slate-200 shadow-[0_16px_40px_rgba(15,28,49,0.10)]">
            <div className="px-6 py-2 flex flex-col">
              {[
                { href: "/#pricing", label: "Pricing" },
                { href: "/business", label: "For Teams" },
                { href: "/research", label: "Research" },
                { href: "/about",    label: "About" },
                { href: "/login",    label: "Sign in" },
              ].map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                  className="py-3.5 text-sm font-semibold text-slate-700 border-b border-slate-100 last:border-0">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO BODY — goal-neutral headline + the two-door fork ─────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto w-full px-6 sm:px-8 py-10 lg:py-14 text-center">

        <div className="mb-6 sm:mb-8">
          <span className="text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase text-brand border border-brand/20 bg-brand/5 px-3 py-1.5 rounded-full">
            Proof, not promises
          </span>
        </div>

        <h1 className="font-black leading-[0.98] tracking-tight text-slate-900 mb-5 sm:mb-6 max-w-4xl"
          style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.75rem)" }}>
          Learn AI the way that{" "}
          <span style={{ background: BLUE_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            fits your goal.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-10 sm:mb-12 max-w-xl mx-auto">
          Switching into an AI career, or just done wrestling with Copilot at work?
          Pick your door — both start free, both graded by Nova, our AI tutor.
        </p>

        {/* The fork — two equal doors, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 w-full max-w-4xl mx-auto">
          {DOORS.map((door) => (
            <DoorCard key={door.key} door={door} />
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Free · No credit card · No commitment — just signal.
        </p>

        {/* Live early-access seat counter — real count, hidden when closed */}
        {seats && (
          <p className="mt-2.5 inline-flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-500" />
            </span>
            {seats.left} of {seats.cap} free early-access seats left
          </p>
        )}

        {/* Mini trust bar — DB-driven course count */}
        <div className="mt-7 flex items-center justify-center gap-4 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
          <span>{courseCount} Subjects</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>10+ Projects</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>Public Proof</span>
        </div>
      </div>

      {/* ── BOTTOM BAR ────────────────────────────────────────────────────── */}
      <div className="relative z-20 w-full border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4 flex items-center gap-4">
          <span className="text-slate-300 text-xs font-light">+</span>
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-slate-500 font-medium whitespace-nowrap">
            Scroll to explore
          </span>
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-slate-300 text-xs font-light">+</span>
        </div>
      </div>
    </section>
  );
}
