"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { PrimaryCta } from "@/components/ui/primary-cta";

// Goal-typer roles — picking one personalises the CTA + shows the salary
const GOAL_ROLES = [
  { label: "AI Engineer", slug: "generative-ai", salary: "$130–200k" },
  { label: "ML Engineer", slug: "machine-learning", salary: "$140–220k" },
  { label: "Full Stack Engineer", slug: "fullstack-development", salary: "$100–160k" },
  { label: "Security Engineer", slug: "cybersecurity", salary: "$110–180k" },
  { label: "Data Scientist", slug: "data-science", salary: "$115–185k" },
  { label: "DevOps Engineer", slug: "devops-engineering", salary: "$120–190k" },
];

// ─── Hero product TOUR: an auto-playing 3-scene showcase (Assess → Review → Ship)
function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(m.matches);
    const fn = () => setReduce(m.matches);
    m.addEventListener?.("change", fn);
    return () => m.removeEventListener?.("change", fn);
  }, []);
  return reduce;
}

function useCountUp(target: number, run: boolean, reduce: boolean, duration = 1000) {
  const [v, setV] = useState(reduce ? target : 0);
  useEffect(() => {
    if (!run) return;
    if (reduce) { setV(target); return; }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setV(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, reduce, duration]);
  return v;
}

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
      <circle cx="42" cy="42" r={r} fill="none" stroke="url(#hero-score)" strokeWidth="8"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        transform="rotate(-90 42 42)" style={{ transition: "stroke-dashoffset 1s ease-out" }} />
      <text x="42" y="40" textAnchor="middle" fill="#0F172A" fontSize="22" fontWeight="800">{value}</text>
      <text x="42" y="55" textAnchor="middle" fill="#94A3B8" fontSize="9" fontWeight="600">/ 100</text>
    </svg>
  );
}

// Scene 1 — Assess: skill report with count-up score + filling topic bars
function SceneAssess({ reduce }: { reduce: boolean }) {
  const score = useCountUp(74, true, reduce);
  const [fill, setFill] = useState(reduce);
  useEffect(() => { const t = setTimeout(() => setFill(true), 60); return () => clearTimeout(t); }, []);
  const bars = [
    { l: "LLMs & RAG", v: 90, c: "#19A65F" },
    { l: "Prompt design", v: 75, c: "#19A65F" },
    { l: "Agents", v: 45, c: "#E5B217" },
    { l: "Eval & testing", v: 30, c: "#D93636" },
  ];
  return (
    <div>
      <div className="flex items-center gap-5 mb-5">
        <ScoreRing value={score} />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">You&apos;re {score}% of the way to AI Engineer.</p>
          <p className="text-xs text-slate-500 mt-1">Two focused gaps between you and interview-ready.</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {bars.map((b, i) => (
          <div key={b.l} className="flex items-center gap-3">
            <span className="text-xs text-slate-600 w-24 shrink-0">{b.l}</span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: fill ? `${b.v}%` : "0%", background: b.c, transitionDelay: `${i * 90}ms` }} />
            </div>
            <span className="text-[11px] font-semibold tabular-nums w-8 text-right" style={{ color: b.c }}>{b.v}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Scene 2 — Review: Nova reads your code, scores it, suggests fixes
function SceneReview({ reduce }: { reduce: boolean }) {
  const score = useCountUp(94, true, reduce);
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-black shrink-0"
          style={{ background: "linear-gradient(135deg,#0056CE,#3388FF)" }}>N</div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">Nova reviewed <span className="font-mono">rag-agent.py</span></p>
          <p className="text-xs text-slate-500 mt-0.5">Read line-by-line · scored against the brief</p>
        </div>
        <span className="text-2xl font-black tabular-nums" style={{ color: "#0056CE" }}>{score}<span className="text-xs text-slate-500">/100</span></span>
      </div>
      <pre className="rounded-lg bg-[#0D1117] p-3 mb-3 text-[11px] leading-relaxed font-mono overflow-hidden whitespace-pre">
        <code className="text-slate-300">r = requests.get(url, <span style={{ color: "#34D399" }}>timeout=5</span>)
r.<span style={{ color: "#34D399" }}>raise_for_status()</span></code>
      </pre>
      <div className="space-y-2">
        {[{ t: "Added request timeout", done: true }, { t: "Wrap call in error handling", done: false }].map((f) => (
          <div key={f.t} className="flex items-center gap-2 text-xs">
            <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
              style={{ background: f.done ? "#D0FBED" : "#E5F0FF" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={f.done ? "#19A65F" : "#0056CE"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {f.done ? <polyline points="20 6 9 17 4 12" /> : <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>}
              </svg>
            </span>
            <span className={f.done ? "text-slate-500 line-through" : "text-slate-700 font-medium"}>{f.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Scene 3 — Ship: deployed, verifiable portfolio
function SceneShip({ reduce }: { reduce: boolean }) {
  const count = useCountUp(12, true, reduce);
  const projects = [
    { n: "rag-support-agent", s: 94 },
    { n: "vision-defect-detector", s: 91 },
    { n: "trading-dashboard-api", s: 88 },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-3xl font-black tabular-nums text-slate-900 leading-none">{count}<span className="text-base text-slate-500"> / 12</span></p>
          <p className="text-xs text-slate-500 mt-1">projects live on GitHub</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full text-emerald-700 bg-emerald-50 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> all deployed
        </span>
      </div>
      <div className="space-y-2">
        {projects.map((p) => (
          <div key={p.n} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs font-mono text-slate-700">{p.n}</span>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="inline-flex items-center gap-1 text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> live</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 tabular-nums">{p.s}/100</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TOUR_SCENES = [
  { key: "assess", step: "Step 1 · Assess", title: "Skill Report", badge: "Intermediate", badgeCls: "bg-amber-50 text-amber-700 border-amber-200", render: (reduce: boolean) => <SceneAssess reduce={reduce} /> },
  { key: "review", step: "Step 2 · Review", title: "Nova code review", badge: "94 / 100", badgeCls: "bg-blue-50 text-brand border-blue-200", render: (reduce: boolean) => <SceneReview reduce={reduce} /> },
  { key: "ship", step: "Step 3 · Ship", title: "Your portfolio", badge: "12 live", badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200", render: (reduce: boolean) => <SceneShip reduce={reduce} /> },
];

function HeroProductCard() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-advance the tour; pause on hover/focus; honour reduced-motion.
  useEffect(() => {
    if (reduce || paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % TOUR_SCENES.length), 4000);
    return () => clearInterval(t);
  }, [reduce, paused]);

  const scene = TOUR_SCENES[active];

  return (
    <div
      className="relative w-full max-w-[420px] mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Soft blue glow behind the card */}
      <div className="pointer-events-none absolute -inset-10 rounded-[40px]"
        style={{ background: "radial-gradient(circle at 60% 40%, rgba(0,86,206,0.14), transparent 70%)", filter: "blur(40px)" }} />

      {/* Main tour card */}
      <div className="relative rounded-3xl bg-white border border-slate-200 p-6 sm:p-7"
        style={{ boxShadow: "0 24px 64px rgba(15,28,49,0.12), 0 0 0 1px rgba(15,28,49,0.02)" }}>
        {/* Header — changes per scene */}
        <div className="flex items-center justify-between mb-5">
          <div key={`h-${active}`} className="animate-fade-in-up">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand">{scene.step}</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{scene.title}</p>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${scene.badgeCls}`}>
            {scene.badge}
          </span>
        </div>

        {/* Scene body — remounts per scene to replay its entrance animation */}
        <div key={scene.key} className="animate-fade-in-up min-h-[208px]">
          {scene.render(reduce)}
        </div>

        {/* Progress dots — clickable */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {TOUR_SCENES.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setActive(i)}
                aria-label={`Go to ${s.title}`}
                aria-current={i === active ? "true" : undefined}
                className="h-1.5 rounded-full cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                style={{ width: i === active ? 22 : 7, background: i === active ? "#0056CE" : "#CBD5E1" }}
              />
            ))}
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live demo
          </span>
        </div>
      </div>

      {/* Floating reassurance chips */}
      <div className="hidden sm:flex absolute -top-5 -right-4 items-center gap-2 rounded-2xl bg-white border border-slate-200 px-3.5 py-2.5"
        style={{ boxShadow: "0 12px 32px rgba(15,28,49,0.12)" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
        <p className="text-[11px] font-bold text-slate-900">3-min skill check</p>
      </div>
      <div className="hidden sm:flex absolute -bottom-5 -left-5 items-center gap-2 rounded-2xl bg-white border border-slate-200 px-3.5 py-2.5"
        style={{ boxShadow: "0 12px 32px rgba(15,28,49,0.12)" }}>
        <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#19A65F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </span>
        <p className="text-[11px] font-bold text-slate-900">Free · no credit card</p>
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
  const [goal, setGoal] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const role = GOAL_ROLES[goal];
  const BLUE_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

  // Magnetic primary CTA — leans toward the cursor (consistent with the closing CTA)
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const onCtaMove = (e: React.MouseEvent) => {
    const el = ctaRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * 0.2}px, ${(e.clientY - (r.top + r.height / 2)) * 0.3}px)`;
  };
  const onCtaLeave = () => { if (ctaRef.current) ctaRef.current.style.transform = ""; };

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
            projects will. Get assessed, get a personalised plan, and build 10+ real
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

          {/* CTA row — single brand primary, outline secondary */}
          <div className="flex flex-col sm:flex-row gap-3">
            <PrimaryCta
              ref={ctaRef}
              onMouseMove={onCtaMove}
              onMouseLeave={onCtaLeave}
              href={`/diagnostic?subject=${role.slug}`}
            >
              Show me my {role.label} path
            </PrimaryCta>
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

          {/* Mini trust bar */}
          <div className="mt-8 flex items-center gap-4 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            <span>{courseCount} Subjects</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>10+ Projects</span>
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
