"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";

// ═══════════════════════════════════════════════════════════════════════════════
// THE HOOK — Sits right after the hero. Answers "Why take this course?"
// Outcome first → 5-step journey to getting hired
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Career outcomes (the WHY) — USD salaries reflecting US tech market ─────
const ROLES = [
  { title: "AI Engineer",            track: "Generative AI",         salary: "$130–200k" },
  { title: "Cybersecurity Engineer", track: "Cybersecurity",         salary: "$110–180k" },
  { title: "ML Engineer",            track: "Machine Learning",      salary: "$140–220k" },
  { title: "Full Stack Engineer",    track: "Full Stack Development", salary: "$100–160k" },
  { title: "Data Engineer",          track: "Data Engineering",      salary: "$120–190k" },
  { title: "Cloud Architect",        track: "Cloud & DevOps",        salary: "$130–200k" },
];

// ─── Rotating headline roles (with gradient colors per role) ─────────────────
// All Square 1 Blue — subtle variation within the blue family for rotation interest
const HEADLINE_ROLES: { label: string; gradient: string }[] = [
  { label: "AI Engineer",            gradient: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)" },
  { label: "Cybersecurity Engineer", gradient: "linear-gradient(135deg, #0EA5E9 0%, #0056CE 55%, #01224F 100%)" },
  { label: "ML Engineer",            gradient: "linear-gradient(135deg, #3388FF 0%, #0EA5E9 50%, #0056CE 100%)" },
  { label: "Cloud Architect",        gradient: "linear-gradient(135deg, #0056CE 0%, #1E40AF 50%, #01224F 100%)" },
  { label: "Full Stack Engineer",    gradient: "linear-gradient(135deg, #3388FF 0%, #0056CE 100%)" },
];

// ─── Outcome cards — deliverables the platform actually ships, not claimed results
const OUTCOMES = [
  {
    target:    12,
    suffix:    "",
    label:     "real projects deployed",
    sub:       "Every project shipped to GitHub with a live URL. Public, verifiable, yours.",
    accent:    "#3388FF",
  },
  {
    target:    100,
    suffix:    "%",
    label:     "of your code reviewed",
    sub:       "Every submission read line-by-line by Claude — strengths, fixes, and a score.",
    accent:    "#0EA5E9",
  },
  {
    target:    24,
    suffix:    "/7",
    label:     "AI tutor at your side",
    sub:       "Nova knows your code, your weak topics, and your current lesson.",
    accent:    "#0056CE",
  },
];

// ─── The 5 steps (the HOW) ────────────────────────────────────────────────────
const STEPS = [
  {
    n:        "01",
    label:    "Assessment",
    title:    "Find out where you stand",
    desc:     "20 questions across MCQ, short answer, and real code. Claude AI grades everything in 30 minutes.",
    duration: "30 min",
    isFinal:  false,
  },
  {
    n:        "02",
    label:    "Skill Report",
    title:    "See the full picture",
    desc:     "Topic-by-topic breakdown of strengths and gaps. Know exactly what's between you and the role you want.",
    duration: "Instant",
    isFinal:  false,
  },
  {
    n:        "03",
    label:    "Plan",
    title:    "A path to your target role",
    desc:     "Choose 3, 6, or 9 months. 45 minutes a day. Curriculum adapts to your level — beginner to advanced.",
    duration: "Flexible",
    isFinal:  false,
  },
  {
    n:        "04",
    label:    "Build",
    title:    "10+ real, deployable projects",
    desc:     "Not toy apps. Real-world projects that prove you can do the job. Every one shipped to GitHub with a live URL.",
    duration: "3–9 months",
    isFinal:  false,
  },
  {
    n:        "05",
    label:    "Hired",
    title:    "Walk in with proof",
    desc:     "Verified portfolio. AI-graded score. Interview-ready. You don't need to say you can do the job — you can show it.",
    duration: "The goal",
    isFinal:  true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS + HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function useCountUp(target: number, isVisible: boolean, duration = 1600) {
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

// ─── Outcome card ─────────────────────────────────────────────────────────────
function OutcomeCard({
  outcome,
  isVisible,
  delay,
}: {
  outcome: typeof OUTCOMES[number];
  isVisible: boolean;
  delay: number;
}) {
  const value = useCountUp(outcome.target, isVisible);
  // Premium gradient — accent at corners, white in the middle for legibility
  const cardBg = `
    linear-gradient(135deg, ${outcome.accent}14 0%, #FFFFFF 45%, ${outcome.accent}08 100%),
    radial-gradient(circle at top right, ${outcome.accent}10, transparent 60%)
  `;
  return (
    <div
      className="relative group rounded-3xl p-6 lg:p-8 transition-all duration-700 will-change-transform border overflow-hidden"
      style={{
        background: cardBg,
        borderColor: `${outcome.accent}30`,
        boxShadow: `0 10px 32px ${outcome.accent}15, 0 0 0 1px ${outcome.accent}10 inset`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Decorative corner gradient blob */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-50"
        style={{ background: `radial-gradient(circle, ${outcome.accent}30 0%, transparent 70%)`, filter: "blur(16px)" }} />

      {/* Number */}
      <div className="relative z-10 mt-4 mb-4 flex items-baseline gap-0.5 leading-none">
        <span
          className="font-black tabular-nums tracking-tight"
          style={{
            fontSize: "clamp(56px, 7vw, 88px)",
            background: `linear-gradient(180deg, #0F172A 0%, ${outcome.accent} 120%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.04em",
          }}
        >
          {value}
        </span>
        {outcome.suffix && (
          <span className="text-2xl lg:text-3xl font-semibold text-slate-500 tabular-nums">
            {outcome.suffix}
          </span>
        )}
      </div>

      <p className="relative text-sm lg:text-base font-bold text-slate-900 mb-1.5">{outcome.label}</p>
      <p className="relative text-xs text-slate-600 leading-relaxed">{outcome.sub}</p>

      {/* Hover enhancement */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `0 16px 48px ${outcome.accent}35, 0 0 0 1px ${outcome.accent}40 inset` }}
      />

      {/* Animated Square 1 blue border beam — staggered per card so they don't sync */}
      <BorderBeam size={220} duration={8} delay={delay / 80} borderWidth={2} colorFrom="#3388FF" colorTo="#0056CE" />
    </div>
  );
}

// ─── "What an employer sees" — résumé→proof flip + hiring decision ────────────
function EmployerProof({ visible }: { visible: boolean }) {
  const [view, setView] = useState<"resume" | "proof">("proof");

  const pillars = [
    {
      k: "Value", v: "A live, deployed product",
      icon: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" /></>,
    },
    {
      k: "Experience", v: "12 real projects",
      icon: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    },
    {
      k: "Know-how", v: "Every line AI-graded",
      icon: <><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></>,
    },
  ];

  return (
    <div className="mt-14 lg:mt-20 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      {/* LEFT — student-first copy + pillars + de-risk row */}
      <div className="text-center lg:text-left">
        <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-brand font-bold">Your unfair advantage</span>
        <h3 className="mt-3 text-2xl sm:text-3xl lg:text-[2.5rem] font-bold text-slate-900 leading-[1.05] mb-3">
          Stop sending résumés.<br />Start sending proof.
        </h3>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto lg:mx-0 mb-6">
          When 400 applicants all say &ldquo;familiar with Python,&rdquo; you&apos;re the one whose work a hiring manager can open, run, and verify — before the first call.
        </p>

        <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto lg:mx-0 mb-5">
          {pillars.map((p) => (
            <div key={p.k} className="rounded-xl border border-slate-200 bg-white p-3 text-left">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1.5">{p.icon}</svg>
              <p className="text-xs font-bold text-slate-900">{p.k}</p>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{p.v}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center lg:justify-start">
          {["Live demo", "AI-graded code", "One-click verify", "No take-home"].map((t) => (
            <span key={t} className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#19A65F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* RIGHT — interactive résumé ↔ proof flip */}
      <div>
        <div className="flex justify-center lg:justify-end mb-3">
          <div className="inline-flex p-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold">
            {([["resume", "Typical résumé"], ["proof", "Square 1 proof"]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setView(key)}
                className={`px-3.5 py-1.5 rounded-full transition-all ${view === key ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div key={view} className="animate-fade-in-up">
          {view === "resume" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6" style={{ boxShadow: "0 14px 40px rgba(15,28,49,0.07)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-base font-bold text-slate-700">Alex Rivera</p>
                  <p className="text-xs text-slate-500">Aspiring Software Engineer · resume.pdf</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 border border-slate-200">PDF</span>
              </div>
              <div className="space-y-2.5">
                {["Familiar with Python (3 yrs)", "Strong team player, fast learner", "Built various personal projects", "Passionate about technology"].map((b) => (
                  <div key={b} className="flex items-start gap-2 text-sm text-slate-500">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />{b}
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 1 1 5 2.2c-.9.7-1.6 1.2-1.6 2.3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                References on request — nothing to click, nothing to verify.
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl border border-slate-200 overflow-hidden" style={{ background: "linear-gradient(180deg,#0B1626 0%,#070E1A 100%)", boxShadow: "0 24px 64px rgba(15,28,49,0.25)" }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.08]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                <span className="ml-2 text-[11px] text-slate-500 font-mono truncate">alex-rivera.dev · portfolio</span>
                <span className="ml-auto hidden sm:inline-flex items-center gap-1 text-[9px] font-semibold text-slate-500 whitespace-nowrap">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
                  reviewed in 4 min
                </span>
              </div>
              <div className="p-4 sm:p-5 space-y-3">
                <div className="rounded-xl border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-sm font-bold text-white font-mono">rag-support-agent</span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full text-emerald-300" style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> live
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] mb-1.5">
                    <span className="text-slate-500">Nova code review</span>
                    <span className="font-bold text-emerald-300 tabular-nums">94/100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                    <div className="h-full rounded-full transition-[width] duration-1000 ease-out" style={{ width: visible ? "94%" : "0%", background: "linear-gradient(90deg,#3388FF,#34D399)" }} />
                  </div>
                </div>
                {[{ n: "vision-defect-detector", s: "91" }, { n: "trading-dashboard-api", s: "88" }].map((p) => (
                  <div key={p.n} className="flex items-center justify-between rounded-lg border border-white/[0.08] px-3.5 py-2.5" style={{ background: "rgba(255,255,255,0.015)" }}>
                    <span className="text-xs font-mono text-slate-300">{p.n}</span>
                    <div className="flex items-center gap-2.5 text-[10px]">
                      <span className="inline-flex items-center gap-1 text-emerald-300/80"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> live</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-500 tabular-nums">{p.s}/100</span>
                    </div>
                  </div>
                ))}
                {/* Hiring decision — the manager's YES */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-300">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3388FF" strokeWidth="2.5"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
                    Verified <span className="hidden sm:inline text-slate-600 font-mono font-normal ml-1">SQ1-7F3A-9C21</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg,#19A65F,#34D399)" }}>
                    Invite to interview
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Closing CTA — scroll-reveal, animated headline sheen, magnetic glowing button
function ClosingCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const reduceRef = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.25 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const onMove = (e: React.MouseEvent) => {
    const b = btnRef.current;
    if (!b || reduceRef.current) return;
    const r = b.getBoundingClientRect();
    b.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * 0.1}px, ${(e.clientY - (r.top + r.height / 2)) * 0.16}px)`;
  };
  const onLeave = () => { if (btnRef.current) btnRef.current.style.transform = "translate(0,0)"; };

  const reveal = (i: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(24px)",
    transition: `opacity .6s ease ${i * 80}ms, transform .6s ease ${i * 80}ms`,
  });

  return (
    <section
      className="relative w-full overflow-hidden py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8"
      style={{
        background: `
          radial-gradient(ellipse 900px 450px at 20% 25%, rgba(0,86,206,0.08), transparent 60%),
          radial-gradient(ellipse 700px 500px at 80% 75%, rgba(14,165,233,0.07), transparent 60%),
          linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
        `,
      }}
    >
      <div className="pointer-events-none absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-25 animate-blob-1"
        style={{ background: "radial-gradient(circle, rgba(0,86,206,0.12) 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[500px] rounded-full opacity-25 animate-blob-2"
        style={{ background: "radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)", filter: "blur(90px)" }} />

      {/* Contained "start your assessment" card — measured, product-like */}
      <div ref={ref} className="relative max-w-2xl mx-auto rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-sm text-center px-6 sm:px-12 py-12 sm:py-14"
        style={{ boxShadow: "0 24px 64px rgba(15,28,49,0.10), 0 0 0 1px rgba(15,28,49,0.02)" }}>
        <span className="block text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-brand font-bold" style={reveal(0)}>
          Your turn
        </span>

        <h3 className="mt-3 mb-4 font-black text-slate-900 tracking-tight leading-[1.04]"
          style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.02em", ...reveal(1) }}>
          Start the assessment.{" "}
          <span style={{
            background: "linear-gradient(135deg, #0056CE 0%, #01224F 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Take step one.
          </span>
        </h3>

        <p className="text-sm sm:text-base text-slate-600 max-w-sm mx-auto mb-7" style={reveal(2)}>
          3 minutes to find out where you stand. Zero pressure. Free forever.
        </p>

        {/* Ticked meta */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-8" style={reveal(3)}>
          {["5 quick questions", "No sign-up", "Instant skill snapshot"].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              {t}
            </span>
          ))}
        </div>

        {/* Square 1 Blue magnetic CTA — right-sized, confident */}
        <div className="flex flex-col items-center" style={reveal(4)}>
          <div className="relative px-6 py-3" onMouseMove={onMove} onMouseLeave={onLeave}>
            <Link
              ref={btnRef}
              href="/diagnostic"
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-base sm:text-lg font-bold text-white tracking-tight transition-transform duration-200 ease-out hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                boxShadow: "0 12px 28px rgba(15,28,49,0.18), 0 0 0 1px rgba(255,255,255,0.12) inset",
              }}
            >
              Get your free skill report
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {/* Quiet credibility */}
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            Instant results · then a full 20-question assessment inside — free, no card
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Role marquee (scrolling target roles) ────────────────────────────────────
function RoleMarquee() {
  // Duplicate for seamless infinite scroll
  const items = [...ROLES, ...ROLES];
  return (
    <div className="relative w-full overflow-hidden py-2">
      {/* Edge fade masks — white for the light section */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 z-10"
        style={{ background: "linear-gradient(90deg, #FFFFFF 0%, transparent 100%)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 z-10"
        style={{ background: "linear-gradient(270deg, #FFFFFF 0%, transparent 100%)" }} />

      {/* Scrolling track */}
      <div className="flex gap-8 animate-marquee whitespace-nowrap">
        {items.map((role, i) => (
          <div key={`${role.title}-${i}`} className="flex items-center gap-3 shrink-0">
            <span className="w-2 h-2 rounded-full bg-brand" />
            <span className="text-sm sm:text-base font-bold text-slate-900">{role.title}</span>
            <span className="text-xs text-slate-500 hidden sm:inline">· {role.salary}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mini product mockups for each step ───────────────────────────────────────
function MockupAssessment() {
  return (
    <div className="rounded-lg p-3 border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[8px] px-1.5 py-0.5 rounded font-mono text-white" style={{ background: "#0056CE" }}>Q3</span>
        <span className="text-[8px] text-slate-500">RAG Systems</span>
      </div>
      <p className="text-[11px] text-slate-700 font-medium leading-snug mb-2">Which best describes RAG?</p>
      {["A", "B", "C", "D"].map((l, i) => (
        <div key={l} className={`text-[9px] mb-1 px-2 py-1 rounded ${i === 1 ? "bg-blue-50 text-blue-900 border border-blue-200 font-semibold" : "text-slate-500"}`}>
          {l}. {i === 1 ? "External knowledge retrieval" : "Option text..."}
        </div>
      ))}
    </div>
  );
}

function MockupReport() {
  const bars = [
    { l: "LLM",     v: 90, c: "#10B981" },
    { l: "Prompts", v: 75, c: "#10B981" },
    { l: "RAG",     v: 45, c: "#FBBF24" },
    { l: "Agents",  v: 30, c: "#EF4444" },
  ];
  return (
    <div className="rounded-lg p-3 border border-slate-200 bg-white shadow-sm">
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-[8px] text-slate-500">Score</p>
          <p className="text-2xl font-black text-slate-900 tabular-nums leading-none">74<span className="text-xs text-slate-500">/100</span></p>
        </div>
        <span className="text-[7px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">INT.</span>
      </div>
      {bars.map((b) => (
        <div key={b.l} className="flex items-center gap-2 mb-1.5">
          <span className="text-[8px] text-slate-500 w-14">{b.l}</span>
          <div className="flex-1 h-1 rounded bg-slate-100 overflow-hidden">
            <div className="h-full rounded transition-all" style={{ width: `${b.v}%`, background: b.c }} />
          </div>
          <span className="text-[8px] tabular-nums w-6 text-right" style={{ color: b.c }}>{b.v}%</span>
        </div>
      ))}
    </div>
  );
}

function MockupPlan() {
  return (
    <div className="rounded-lg p-3 border border-slate-200 bg-white shadow-sm space-y-1.5">
      {[
        { m: "3mo", h: "2hr/day", n: "8",  active: false },
        { m: "6mo", h: "1hr/day", n: "10", active: true  },
        { m: "9mo", h: "45m/day", n: "12", active: false },
      ].map((p) => (
        <div key={p.m} className={`flex items-center justify-between p-2 rounded border ${p.active ? "border-blue-300 bg-blue-50" : "border-slate-200"}`}>
          <div>
            <p className={`text-[10px] font-bold ${p.active ? "text-slate-900" : "text-slate-500"}`}>{p.m}</p>
            <p className="text-[8px] text-slate-500">{p.h}</p>
          </div>
          <span className={`text-[9px] tabular-nums font-bold ${p.active ? "text-blue-600" : "text-slate-500"}`}>{p.n} proj</span>
        </div>
      ))}
    </div>
  );
}

function MockupBuild() {
  return (
    <div className="rounded-lg p-3 border border-slate-200 bg-slate-50 font-mono space-y-1 shadow-sm">
      {["ai-chatbot", "rag-pipeline", "research-agent", "production-saas"].map((name, i) => (
        <div key={name} className="flex items-center justify-between text-[9px]">
          <span className="text-blue-600">{name}</span>
          <div className="flex items-center gap-1">
            <span className="text-amber-500">★</span>
            <span className="text-slate-500 tabular-nums">{[47, 31, 28, 62][i]}</span>
          </div>
        </div>
      ))}
      <div className="pt-1.5 mt-1.5 border-t border-slate-200 flex items-center justify-between text-[8px]">
        <span className="text-slate-500">12 / 12 deployed</span>
        <span className="text-emerald-500">●</span>
      </div>
    </div>
  );
}

function MockupHired() {
  return (
    <div className="rounded-lg p-3 border border-blue-200 space-y-2 shadow-sm"
      style={{ background: "linear-gradient(135deg, rgba(0,86,206,0.07), rgba(51,136,255,0.02))" }}>
      <div className="flex items-center justify-between">
        <p className="text-[8px] text-blue-700 font-bold tracking-widest">THE GOAL</p>
        <p className="text-[8px] text-slate-500">interview-ready</p>
      </div>
      <p className="text-base font-black text-slate-900 leading-none mt-1">AI Engineer</p>
      <p className="text-[10px] text-slate-500">$130–200k market range</p>
      <div className="space-y-1 pt-2 border-t border-blue-100">
        {[
          { l: "Projects live", v: "12" },
          { l: "Portfolio", v: "verified" },
        ].map((r) => (
          <div key={r.l} className="flex justify-between text-[8px]">
            <span className="text-slate-500">{r.l}</span>
            <span className="text-blue-700 font-bold">{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MOCKUPS = [MockupAssessment, MockupReport, MockupPlan, MockupBuild, MockupHired];

// ═══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE JOURNEY FLOW — click the connected nodes (or let it auto-play) to
// walk through the 5 steps. The rail shows the flow; the panel shows the detail.
// ═══════════════════════════════════════════════════════════════════════════════
const FLOW_ACCENTS = ["#3388FF", "#0EA5E9", "#0056CE", "#1E40AF", "#0056CE"];

function JourneyFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);

  const last = STEPS.length - 1;
  const accent = FLOW_ACCENTS[active] ?? "#0056CE";
  const step = STEPS[active];
  const Mockup = MOCKUPS[active];

  // Only start auto-playing once the flow scrolls into view.
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold: 0.35 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  // Auto-advance through the flow; pauses while the user is interacting.
  useEffect(() => {
    if (!visible || paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 3600);
    return () => clearInterval(t);
  }, [visible, paused]);

  const go = (i: number) => setActive(((i % STEPS.length) + STEPS.length) % STEPS.length);

  return (
    <div ref={ref} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* ── Flow rail ─────────────────────────────────────────── */}
      <div className="relative">
        {/* connecting track */}
        <div className="absolute top-7 left-[10%] right-[10%] h-[3px] -translate-y-1/2 rounded-full bg-slate-200" />
        {/* filled portion up to the active node */}
        <div
          className="absolute top-7 left-[10%] h-[3px] -translate-y-1/2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(active / last) * 80}%`, background: "linear-gradient(90deg,#3388FF,#0056CE)" }}
        />
        {/* nodes */}
        <div className="relative z-10 flex justify-between">
          {STEPS.map((s, i) => {
            const isActive = i === active;
            const isDone = i < active;
            const a = FLOW_ACCENTS[i] ?? "#0056CE";
            return (
              <button
                key={s.n}
                onClick={() => go(i)}
                className="flex-1 flex flex-col items-center gap-2.5 focus:outline-none"
                aria-label={`${s.label} — step ${i + 1} of ${STEPS.length}`}
                aria-current={isActive ? "step" : undefined}
              >
                <span
                  className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black text-xs sm:text-sm transition-all duration-300"
                  style={
                    isActive
                      ? { background: a, color: "#fff", boxShadow: `0 0 0 6px ${a}1f, 0 8px 24px ${a}55`, transform: "scale(1.08)" }
                      : isDone
                        ? { background: a, color: "#fff" }
                        : { background: "#fff", color: "#94A3B8", border: "2px solid #E2E8F0" }
                  }
                >
                  {isDone ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    s.n
                  )}
                </span>
                <span
                  className="text-[9px] sm:text-[11px] font-bold tracking-wide text-center transition-colors duration-300"
                  style={{ color: isActive ? a : isDone ? "#475569" : "#94A3B8" }}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active step detail ────────────────────────────────── */}
      <div className="mt-12 lg:mt-16 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center lg:min-h-[280px]">
        {/* Text */}
        <div key={`t-${active}`} className="animate-fade-in-up">
          <div className="flex items-baseline gap-4 mb-4">
            <span
              className="font-black tabular-nums leading-none"
              style={{
                fontSize: "clamp(64px, 9vw, 112px)",
                letterSpacing: "-0.05em",
                background: `linear-gradient(180deg, ${accent} 0%, ${accent}99 110%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {step.n}
            </span>
            <div>
              <span className="block text-[11px] font-black tracking-[0.3em] uppercase" style={{ color: accent }}>{step.label}</span>
              <span className="block text-xs text-slate-500 mt-1">{step.duration}</span>
            </div>
          </div>
          <h4 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight mb-3">{step.title}</h4>
          <p className="text-sm lg:text-base text-slate-600 leading-relaxed mb-8 max-w-md">{step.desc}</p>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => go(active - 1)}
              className="w-11 h-11 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-brand hover:text-brand transition-colors"
              aria-label="Previous step"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button
              onClick={() => go(active + 1)}
              className="w-11 h-11 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105"
              style={{ background: accent }}
              aria-label="Next step"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <span className="ml-1 text-sm tabular-nums text-slate-500">
              <span className="font-bold text-slate-900">{active + 1}</span> / {STEPS.length}
            </span>
          </div>
        </div>

        {/* Mockup */}
        <div key={`m-${active}`} className="animate-fade-in-up">
          <div
            className="w-full max-w-[300px] mx-auto rounded-2xl"
            style={{ boxShadow: `0 16px 48px ${accent}22, 0 0 0 1px ${accent}18` }}
          >
            <Mockup />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function JourneyHook() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [roleIdx, setRoleIdx]         = useState(0);

  // Rotate the role in the headline
  useEffect(() => {
    const t = setInterval(() => {
      setRoleIdx((i) => (i + 1) % HEADLINE_ROLES.length);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setHeroVisible(true),
      { threshold: 0.2 }
    );
    if (heroRef.current) obs.observe(heroRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ZONE 1 — THE HOOK (Why take this?)  · LIGHT THEME */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative w-full overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 80%, #F0F4FB 100%)" }}
      >
        {/* Background accent glows — subtle on white */}
        <div className="pointer-events-none absolute top-1/4 left-0 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,86,206,0.07) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="pointer-events-none absolute bottom-0 right-0 translate-x-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)", filter: "blur(90px)" }} />

        <div className="relative max-w-6xl mx-auto">

          {/* Label */}
          <div className="text-center mb-6">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              Why Square 1 · The Outcome
            </span>
          </div>

          {/* Headline — rotating role */}
          <h2 className="text-center font-black tracking-tight text-slate-900 leading-[0.95] mb-4"
            style={{ fontSize: "clamp(40px, 7vw, 96px)" }}>
            Get hired as
            <span className="hidden sm:inline">{" "}</span>
            <span className="sm:hidden"><br /></span>
            an
            <br />
            <span
              key={roleIdx}
              className="animate-role-rotate inline-block"
              style={{
                background: HEADLINE_ROLES[roleIdx].gradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {HEADLINE_ROLES[roleIdx].label}.
            </span>
          </h2>

          <p className="text-center text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10">
            Whatever role you&apos;re targeting — Square 1 takes you from where you are now, to landing the offer.
          </p>

          {/* Role marquee */}
          <div className="mb-12 lg:mb-14">
            <RoleMarquee />
          </div>

          {/* "What you walk away with" sub-headline */}
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
              What you walk away with.
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Deliverables, not promises. All public and verifiable.
            </p>
          </div>

          {/* 3 outcome cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            {OUTCOMES.map((o, i) => (
              <OutcomeCard key={o.label} outcome={o} isVisible={heroVisible} delay={i * 150} />
            ))}
          </div>

          {/* What an employer sees — interactive résumé→proof flip + hiring decision */}
          <EmployerProof visible={heroVisible} />
        </div>
      </section>

      {/* Zone 1 → Zone 2: both light now, seamless */}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ZONE 2 — THE 5 STEPS (How you get there) */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative w-full overflow-hidden py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 45%, #F4F8FF 100%)" }}
      >
        {/* Background accent — Square 1 blue */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(0,86,206,0.07) 0%, transparent 70%)", filter: "blur(80px)" }} />

        <div className="relative max-w-5xl mx-auto">
          {/* Section intro */}
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-brand font-bold">
              The 5-Step Journey
            </span>
            <h3 className="mt-3 font-black text-slate-900 tracking-tight leading-[0.95]"
              style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
              From doubt to offer letter.
            </h3>
            <p className="mt-3 text-slate-600 text-sm sm:text-base max-w-lg mx-auto">
              Click through the flow — or watch it play. Five steps from where you are to hired.
            </p>
          </div>

          {/* Interactive flow — click the nodes or let it auto-play */}
          <JourneyFlow />
        </div>
      </section>

      {/* Zone 2 → Zone 3: both light, seamless */}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ZONE 3 — CLOSING CTA · vibrant: reveal + headline sheen + magnetic button */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <ClosingCTA />
    </>
  );
}
