"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X, Check, Rocket, Briefcase } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const BLUE_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

// ─── The fork: two equal doors into the product ───────────────────────────────
// Both doors stay in the Square 1 blue family — differentiated by TREATMENT, not
// hue: the career door is a filled brand-blue card (the bold "gets you hired"
// statement); the work door is a light card with blue accents (open, low-friction).
// LEFT  = career-changers & builders   → existing courses/diagnostic flow
// RIGHT = "use AI at my job, no code"  → diagnostic tagged with goal=work
const DOORS = [
  {
    key: "career",
    icon: Rocket,
    eyebrow: "Career path",
    badge: "Engineering · Data · AI",
    title: "Build a career in AI",
    subtitle:
      "The AI tutor that gets you hired. Job-ready engineering & data tracks — get assessed, follow a personalised plan, and ship deployed projects employers can run.",
    bullets: [
      "Job-ready engineering & data tracks",
      "Every project code-reviewed & graded",
      "Certificates backed by a real skill report",
    ],
    cta: "Explore career tracks",
    href: "/diagnostic",
  },
  {
    key: "work",
    icon: Briefcase,
    eyebrow: "Work smarter",
    badge: "Marketing · Finance · +6",
    // NBSPs keep "— no code" wrapping as one unit (no orphaned "code" on line 2)
    title: "Use AI better at work — no code",
    subtitle:
      "Your company already pays for Copilot. Get your money's worth. Practical AI skills for your actual job — no programming required.",
    bullets: [
      "Role tracks for marketers, finance, teachers, founders & more",
      "Practise on real work scenarios, graded by Nova",
      "No code, no setup — start in minutes",
    ],
    cta: "Start free — no code",
    href: "/diagnostic?goal=work",
  },
] as const;

function DoorCard({ door }: { door: (typeof DOORS)[number] }) {
  const Icon = door.icon;
  const filled = door.key === "career";

  // ── Career: filled brand-blue card ──────────────────────────────────────────
  if (filled) {
    return (
      <div className="group relative h-full">
        <div
          className="relative flex h-full flex-col overflow-hidden rounded-2xl p-7 sm:p-8 text-left transition-all duration-200 motion-safe:group-hover:-translate-y-1"
          style={{
            background: "linear-gradient(155deg, #2E7BF0 0%, #0056CE 52%, #01224F 100%)",
            boxShadow: "0 1px 2px rgba(15,28,49,0.06), 0 22px 46px -20px rgba(0,86,206,0.55)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-20 w-64 h-64 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%)" }}
          />

          <div className="relative flex items-center gap-3 mb-5">
            <span
              className="w-[50px] h-[50px] rounded-[14px] flex items-center justify-center text-white shrink-0"
              style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.28)" }}
            >
              <Icon size={22} strokeWidth={2.1} aria-hidden />
            </span>
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "#BFD9FF" }}>
              {door.eyebrow}
            </p>
            <span
              className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full text-white whitespace-nowrap"
              style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.24)" }}
            >
              {door.badge}
            </span>
          </div>

          <h2 className="relative text-2xl sm:text-[27px] font-black tracking-tight text-white leading-tight text-balance">
            {door.title}
          </h2>
          <p className="relative mt-3 text-sm leading-relaxed" style={{ color: "#CBDDF7" }}>
            {door.subtitle}
          </p>

          <ul className="relative flex-1 flex flex-col justify-center gap-3 my-6">
            {door.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[13px] font-medium leading-snug" style={{ color: "#E4EEFB" }}>
                <span className="mt-px w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 bg-white">
                  <Check size={12} strokeWidth={3.5} aria-hidden style={{ color: "#0056CE" }} />
                </span>
                <span className="pt-0.5">{b}</span>
              </li>
            ))}
          </ul>

          <Link
            href={door.href}
            className="relative flex items-center justify-center gap-2 h-14 rounded-[15px] bg-white text-[15px] font-bold transition-transform duration-150 motion-safe:hover:-translate-y-0.5"
            style={{ color: "#0056CE", boxShadow: "0 12px 26px -12px rgba(0,0,0,0.35)" }}
          >
            {door.cta}
            <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    );
  }

  // ── Work: light card with blue accents ──────────────────────────────────────
  return (
    <div className="group relative h-full">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-3 rounded-[26px] opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(ellipse at 50% 10%, rgba(51,136,255,0.16) 0%, transparent 65%)" }}
      />
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border p-7 sm:p-8 text-left transition-all duration-200 motion-safe:group-hover:-translate-y-1"
        style={{
          background: "linear-gradient(180deg, #EFF5FF 0%, #FFFFFF 44%)",
          borderColor: "#D8E7FC",
          boxShadow: "0 1px 2px rgba(15,28,49,0.05), 0 18px 40px -24px rgba(15,28,49,0.20)",
        }}
      >
        <div aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: "linear-gradient(90deg, #3388FF, #0056CE)" }} />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-20 w-56 h-56 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(51,136,255,0.14) 0%, transparent 70%)" }}
        />

        <div className="relative flex items-center gap-3 mb-5 mt-1">
          <span
            className="w-[50px] h-[50px] rounded-[14px] flex items-center justify-center text-white shrink-0"
            style={{ background: BLUE_GRADIENT, boxShadow: "0 8px 18px -8px rgba(0,86,206,0.6)" }}
          >
            <Icon size={22} strokeWidth={2.1} aria-hidden />
          </span>
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-brand">{door.eyebrow}</p>
          <span
            className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full text-brand bg-white whitespace-nowrap"
            style={{ border: "1px solid #D8E7FC" }}
          >
            {door.badge}
          </span>
        </div>

        <h2 className="relative text-2xl sm:text-[27px] font-black tracking-tight text-slate-900 leading-tight text-balance">
          {door.title}
        </h2>
        <p className="relative mt-3 text-sm text-slate-600 leading-relaxed">{door.subtitle}</p>

        <ul className="relative flex-1 flex flex-col justify-center gap-3 my-6">
          {door.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-[13px] text-slate-700 font-medium leading-snug">
              <span
                className="mt-px w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 text-white"
                style={{ background: BLUE_GRADIENT, boxShadow: "0 3px 7px -3px rgba(0,86,206,0.4)" }}
              >
                <Check size={12} strokeWidth={3.5} aria-hidden />
              </span>
              <span className="pt-0.5">{b}</span>
            </li>
          ))}
        </ul>

        <Link
          href={door.href}
          className="relative flex items-center justify-center gap-2 h-14 rounded-[15px] text-white text-[15px] font-bold transition-transform duration-150 motion-safe:hover:-translate-y-0.5"
          style={{ background: BLUE_GRADIENT, boxShadow: "0 12px 26px -10px rgba(0,86,206,0.55)" }}
        >
          {door.cta}
          <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-1">→</span>
        </Link>
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
