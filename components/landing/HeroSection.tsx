"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const BLUE_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

// ─── Hero interactive: "Spot the better prompt" ───────────────────────────────
// The foot-in-the-door — one universal, one-tap question that works for a future
// ML engineer AND a marketer, and demos the exact thing Nova grades. Deterministic
// reveal (no AI call, no cost). Tapping opens the curiosity gap → the real check,
// which is where the career-vs-work question is asked.
const DIMS = ["Context", "Role & goal", "Constraints", "Specificity", "Would it work?"] as const;

const PROMPTS = {
  a: {
    key: "a",
    label: "Prompt A",
    text: "write a launch email for our new product",
    scores: [2, 2, 1, 2, 1],
    better: false,
  },
  b: {
    key: "b",
    label: "Prompt B",
    text:
      "You're our copywriter. Write a 120-word launch email for the Terra serum ($54, ships Aug 1). Audience: existing customers, warm tone, no wellness clichés. One CTA: “Pre-order”. No discounts.",
    scores: [19, 20, 19, 20, 18],
    better: true,
  },
} as const;

type PromptKey = "a" | "b";
const total = (s: readonly number[]) => s.reduce((a, x) => a + x, 0);

// Count-up on reveal — the score "arriving" reads as Nova actively grading,
// which sells the product harder than a static number. Plain rAF (no motion
// lib): ease-out cubic, ~700ms, and reduced-motion users get the final value
// instantly.
function CountUp({ to, duration = 700 }: { to: number; duration?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{n}</>;
}

function PromptCheck() {
  const [picked, setPicked] = useState<PromptKey | null>(null);
  const answered = picked !== null;
  const gotItRight = picked === "b";

  // Prompt B types itself out on load: the visitor watches a good prompt
  // being WRITTEN, so the product demo happens by itself. Interruptible
  // (tapping completes it instantly); reduced-motion gets the full text.
  const fullB = PROMPTS.b.text;
  const [typedLen, setTypedLen] = useState(0);
  const typingDone = typedLen >= fullB.length;
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypedLen(fullB.length);
      return;
    }
    let i = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const startDelay = setTimeout(() => {
      interval = setInterval(() => {
        i += 3;
        setTypedLen(Math.min(i, fullB.length));
        if (i >= fullB.length && interval) clearInterval(interval);
      }, 30);
    }, 900);
    return () => { clearTimeout(startDelay); if (interval) clearInterval(interval); };
  }, [fullB.length]);

  return (
    <div
      className="relative w-full rounded-2xl border bg-white overflow-hidden"
      style={{ borderColor: "#D8E7FC", boxShadow: "0 1px 2px rgba(15,28,49,0.05), 0 26px 60px -28px rgba(0,86,206,0.42)" }}
    >
      {/* Card header — Nova / Prompt Lab */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b" style={{ borderColor: "#EEF3FB", background: "linear-gradient(180deg,#F5F9FF,#fff 80%)" }}>
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0" style={{ background: BLUE_GRADIENT }}>N</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">Prompt Lab</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" aria-hidden />
          Spot the better prompt
        </span>
      </div>

      <div className="p-5">
        <p className="text-[13px] sm:text-sm font-semibold text-slate-800 leading-snug mb-4">
          You need AI to draft a product launch email. <span className="text-slate-500 font-medium">Which prompt gets a usable result?</span>
        </p>

        {/* Two prompt options */}
        <div className="space-y-2.5">
          {(["a", "b"] as const).map((k) => {
            const p = PROMPTS[k];
            const isPick = picked === k;
            const revealWin = answered && p.better;
            const revealWeak = answered && !p.better;
            return (
              <button
                key={k}
                onClick={() => { if (!answered) { setPicked(k); setTypedLen(fullB.length); } }}
                disabled={answered}
                className="w-full text-left rounded-xl border-2 p-3.5 transition-all disabled:cursor-default motion-safe:hover:-translate-y-px"
                style={{
                  borderColor: revealWin ? "#10B981" : revealWeak ? "#E2E8F0" : isPick ? "#0056CE" : "#E2E8F0",
                  background: revealWin ? "rgba(16,185,129,0.05)" : revealWeak ? "#F8FAFC" : "#fff",
                  opacity: revealWeak ? 0.72 : 1,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: revealWin ? "#059669" : revealWeak ? "#94A3B8" : "#64748B" }}>
                    <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black"
                      style={{
                        borderColor: revealWin ? "#10B981" : revealWeak ? "#CBD5E1" : isPick ? "#0056CE" : "#CBD5E1",
                        color: revealWin ? "#10B981" : revealWeak ? "#94A3B8" : isPick ? "#0056CE" : "#94A3B8",
                      }}>
                      {revealWin ? "✓" : k.toUpperCase()}
                    </span>
                    {p.label}
                  </span>
                  {answered && (
                    <span className="text-[13px] font-black tabular-nums motion-safe:animate-fade-in-up" style={{ color: p.better ? "#0056CE" : "#94A3B8" }}>
                      {total(p.scores)}<span className="text-[10px] text-slate-400">/100</span>
                    </span>
                  )}
                </div>
                <p className="text-[12.5px] leading-relaxed" style={{ color: revealWeak ? "#94A3B8" : "#475569", display: "-webkit-box", WebkitLineClamp: answered && p.better ? 4 : 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: k === "b" && !answered ? "2.6em" : undefined }}>
                  {k === "b" && !answered && !typingDone
                    ? <>{fullB.slice(0, typedLen)}<span className="cursor-blink" aria-hidden /></>
                    : p.text}
                </p>
              </button>
            );
          })}
        </div>

        {!answered && (
          <p className="text-center text-[11px] text-slate-400 mt-3.5">Tap the one you'd trust — no signup.</p>
        )}

        {/* Reveal — Nova's breakdown of the strong prompt + curiosity gap */}
        {answered && (
          <div className="mt-4 motion-safe:animate-fade-in-up">
            <p className="text-[13px] font-bold text-slate-900 mb-3">
              {gotItRight
                ? "Nailed it — Nova scores that 96/100."
                : "Prompt B wins — Nova scores it 96 vs 8."}{" "}
              <span className="font-medium text-slate-500">The difference is context, constraints and a clear goal.</span>
            </p>

            {/* 5-bar breakdown of the winning prompt */}
            <div className="rounded-xl border p-3.5 mb-4" style={{ borderColor: "#EEF3FB", background: "#FBFDFF" }}>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Nova's score · Prompt B</span>
                <span className="text-sm font-black tabular-nums text-brand"><CountUp to={total(PROMPTS.b.scores)} /><span className="text-[10px] text-slate-400">/100</span></span>
              </div>
              <div className="space-y-2">
                {DIMS.map((d, i) => {
                  const s = PROMPTS.b.scores[i];
                  return (
                    <div key={d}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] font-semibold text-slate-600">{d}</span>
                        <span className="text-[10px] font-bold tabular-nums text-emerald-600">{s}/20</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                        <div className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-700"
                          style={{ width: `${(s / 20) * 100}%`, background: "linear-gradient(90deg,#3388FF,#0056CE)", transitionDelay: `${i * 70}ms` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Link
              href="/diagnostic"
              className="flex items-center justify-center gap-2 h-12 rounded-xl text-white text-[15px] font-bold transition-transform duration-150 motion-safe:hover:-translate-y-0.5"
              style={{ background: BLUE_GRADIENT, boxShadow: "0 14px 30px -12px rgba(0,86,206,0.55)" }}
            >
              See your full result — free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-center text-[11px] text-slate-400 mt-2.5">3-minute check · maps your real level · no signup to start</p>
          </div>
        )}
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
    <section className="hero-section relative flex flex-col overflow-hidden bg-white">
      {/* ── Soft Square 1 blue accents on white ───────────────────────────── */}
      {/* Brand-blue aurora wash — three drifting layers (21st.dev-style
          atmosphere, kept light-theme + restrained). Blob drift is already in
          the reduced-motion guard. */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full animate-blob-1"
        style={{ background: "radial-gradient(circle, rgba(0,86,206,0.12) 0%, transparent 70%)", filter: "blur(90px)" }} />
      <div className="pointer-events-none absolute top-1/4 -right-40 w-[680px] h-[680px] rounded-full animate-blob-2"
        style={{ background: "radial-gradient(circle, rgba(14,165,233,0.11) 0%, transparent 70%)", filter: "blur(90px)" }} />
      <div className="pointer-events-none absolute -bottom-56 left-1/3 w-[760px] h-[560px] rounded-full animate-blob-1"
        style={{ background: "radial-gradient(ellipse, rgba(51,136,255,0.09) 0%, transparent 70%)", filter: "blur(100px)", animationDelay: "3s" }} />
      {/* Fine dot grid, faded at the edges — gives the white hero texture */}
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(0,86,206,0.10) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse 75% 65% at 50% 32%, black 0%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 65% at 50% 32%, black 0%, transparent 78%)",
        }} />

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

      {/* ── HERO BODY — single-focus: one promise, one CTA, one live demo ──── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full px-6 sm:px-8 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center w-full">

          {/* LEFT — the promise */}
          <div className="text-center lg:text-left">
            <div className="mb-5 sm:mb-6 hero-enter">
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-[0.22em] uppercase text-brand border border-brand/20 bg-brand/5 px-3 py-1.5 rounded-full">
                <Sparkles className="h-3.5 w-3.5" /> Proof, not promises
              </span>
            </div>

            {/* H1 leads with the pain (passive tutorials) then the outcome (provable
                skill) — a contrast headline converts better than a capability claim
                because the visitor self-identifies with the first clause. */}
            <h1 className="font-black leading-[1.02] tracking-tight text-slate-900 mb-5 hero-enter"
              style={{ fontSize: "clamp(2.3rem, 4.8vw, 4.2rem)", animationDelay: "90ms" }}>
              Stop watching tutorials.{" "}
              <span className="animate-text-sheen" style={{ background: BLUE_GRADIENT, backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Build &amp; prove job-ready AI skills.
              </span>
            </h1>

            {/* Subhead names the differentiator (Nova grades code AND prompts) and
                the proof artifact (portfolio, not certificate) in one breath. */}
            <p className="text-sm sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0 hero-enter" style={{ animationDelay: "200ms" }}>
              Learn by doing — code or no-code. Nova, our AI tutor, grades every rep against
              real rubrics, and you graduate with a portfolio employers can run, not a certificate.
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3 sm:gap-4 justify-center lg:justify-start hero-enter" style={{ animationDelay: "320ms" }}>
              {/* "3-min" in the button label pre-answers the effort objection at the
                  exact moment of the click decision. */}
              <Link
                href="/diagnostic"
                className="inline-flex items-center justify-center gap-2 h-14 px-7 rounded-[15px] text-white text-[15px] font-bold transition-transform duration-150 motion-safe:hover:-translate-y-0.5 w-full sm:w-auto"
                style={{ background: BLUE_GRADIENT, boxShadow: "0 14px 30px -12px rgba(0,86,206,0.6)" }}
              >
                Take the free 3-min skill check
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="text-xs text-slate-500 sm:max-w-[9rem] text-center sm:text-left leading-snug">
                Free · no signup to start · no credit card
              </span>
            </div>

            {/* Seat counter deliberately NOT in the hero (user call): the first
                screen stays pure promise + action. Scarcity lives in the sticky
                bars + final CTA where it does the closing. */}

            {/* Mini trust bar — DB-driven course count */}
            <div className="mt-6 flex items-center justify-center lg:justify-start gap-4 text-[10px] text-slate-500 uppercase tracking-widest font-semibold hero-enter" style={{ animationDelay: "440ms" }}>
              <span>{courseCount} Subjects</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>Code + no-code</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>AI graded</span>
            </div>
          </div>

          {/* RIGHT — the live demo (foot-in-the-door) */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:justify-self-end hero-enter" style={{ animationDelay: "280ms" }}>
            <PromptCheck />
          </div>
        </div>
      </div>

      {/* ── Scroll cue — a real affordance instead of a dead divider band.
             Smaller footprint = the lane map's header peeks over the fold on
             most laptops, which is the actual scroll trigger. ─────────────── */}
      <div className="relative z-20 w-full pb-3 flex justify-center">
        <a href="#curriculum" aria-label="Scroll to the curriculum"
          className="inline-flex flex-col items-center gap-0.5 text-slate-400 hover:text-brand transition-colors">
          <span className="text-[9px] tracking-[0.3em] uppercase font-medium">Explore</span>
          <ChevronDown size={18} className="motion-safe:animate-bounce" aria-hidden />
        </a>
      </div>
    </section>
  );
}
