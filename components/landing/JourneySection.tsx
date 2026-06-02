"use client";

import { useEffect, useRef, useState } from "react";

// ─── Step data ────────────────────────────────────────────────────────────────
const STEPS = [
  {
    number: "01",
    label: "Assessment",
    title: "Know exactly where you stand",
    description:
      "20 questions across MCQ, short answer, and real code challenges. Claude AI grades every answer and measures your understanding — not just whether you clicked the right box.",
    tags: ["30 minutes", "AI graded", "Code + Theory"],
    color: "#0056CE",
    accentBg: "rgba(0,86,206,0.08)",
    preview: "assessment",
  },
  {
    number: "02",
    label: "Skill Report",
    title: "See the full picture. Topic by topic.",
    description:
      "Your results broken down by every topic. A radar chart showing strengths and gaps. AI-written recommendations specific to YOUR score — not a generic study guide.",
    tags: ["Topic mastery", "Strengths & gaps", "AI recommendations"],
    color: "#4F46E5",
    accentBg: "rgba(79,70,229,0.08)",
    preview: "report",
  },
  {
    number: "03",
    label: "Learning Plan",
    title: "A plan built around your life.",
    description:
      "Choose 3, 6, or 9 months. 45 minutes a day, 5 days a week. The curriculum adapts to your level — beginners and advanced students follow different paths through the same subject.",
    tags: ["3 / 6 / 9 months", "45 min/day", "Adapts to your level"],
    color: "#7C3AED",
    accentBg: "rgba(124,58,237,0.08)",
    preview: "plan",
  },
  {
    number: "04",
    label: "Build Projects",
    title: "10–12 real projects. All deployed.",
    description:
      "Not toy apps. Not to-do lists. Real-world projects your future employer can open, run, and actually be impressed by. Every project ships to GitHub with a live URL.",
    tags: ["10–12 projects", "All deployed", "GitHub portfolio"],
    color: "#9333EA",
    accentBg: "rgba(147,51,234,0.08)",
    preview: "projects",
  },
  {
    number: "05",
    label: "Get Hired",
    title: "Walk in with proof, not promises.",
    description:
      "12 live repos. An AI-graded portfolio score. Interview prep built into the final module. You don't need to say you can code — you can show it.",
    tags: ["Portfolio verified", "Interview ready", "Real credentials"],
    color: "#10B981",
    accentBg: "rgba(16,185,129,0.08)",
    preview: "hired",
  },
] as const;

// ─── Visual mockup components ─────────────────────────────────────────────────

function AssessmentPreview() {
  const options = [
    "To make models run faster",
    "To give models access to external knowledge",
    "To reduce API costs",
    "To improve model safety",
  ];
  return (
    <div
      className="rounded-2xl border border-white/10 p-6"
      style={{ background: "#0D1117" }}
    >
      <div className="text-xs text-slate-500 mb-4 flex items-center gap-2">
        <span className="px-2 py-0.5 rounded bg-[rgba(0,86,206,0.2)] text-[#0056CE] text-[10px] font-bold">
          Q 3 / 20
        </span>
        <span>Generative AI · RAG Systems</span>
      </div>
      <p className="text-white font-semibold mb-5 text-sm leading-relaxed">
        What is the primary purpose of Retrieval-Augmented Generation (RAG)?
      </p>
      {options.map((opt, i) => (
        <div
          key={i}
          className={`mb-2 px-4 py-3 rounded-xl text-xs border transition-all ${
            i === 1
              ? "border-[#0056CE] bg-[rgba(0,86,206,0.15)] text-white font-semibold"
              : "border-white/[0.08] text-slate-400"
          }`}
        >
          <span className="opacity-40 mr-2">{String.fromCharCode(65 + i)}.</span>
          {opt}
        </div>
      ))}
    </div>
  );
}

function ReportPreview() {
  const topics = [
    { topic: "LLM Fundamentals", pct: 90, color: "#10B981" },
    { topic: "Prompt Engineering", pct: 75, color: "#0056CE" },
    { topic: "RAG Systems", pct: 45, color: "#F59E0B" },
    { topic: "AI Agents", pct: 30, color: "#EF4444" },
    { topic: "Production AI", pct: 60, color: "#0056CE" },
  ];
  return (
    <div
      className="rounded-2xl border border-white/10 p-6"
      style={{ background: "#0D1117" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-slate-500 mb-1">Overall Score</p>
          <p className="text-4xl font-black text-white">
            74<span className="text-xl text-slate-500">/100</span>
          </p>
        </div>
        <div className="text-right">
          <span className="px-3 py-1.5 rounded-full bg-amber-400/15 text-amber-400 text-xs font-bold">
            Intermediate
          </span>
        </div>
      </div>
      {topics.map((item) => (
        <div key={item.topic} className="mb-3">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-400">{item.topic}</span>
            <span style={{ color: item.color }} className="font-bold">
              {item.pct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${item.pct}%`, background: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PlanPreview() {
  const plans = [
    { months: "3 Month", daily: "2 hrs/day", projects: "8 projects", tag: "Intensive", active: false },
    { months: "6 Month", daily: "1 hr/day", projects: "10 projects", tag: "Recommended", active: true },
    { months: "9 Month", daily: "45 min/day", projects: "12 projects", tag: "Relaxed", active: false },
  ];
  return (
    <div className="space-y-3">
      {plans.map((plan) => (
        <div
          key={plan.months}
          className={`rounded-xl p-4 border flex items-center justify-between transition-all ${
            plan.active
              ? "border-[#0056CE] bg-[rgba(0,86,206,0.10)]"
              : "border-white/[0.08] bg-white/[0.03]"
          }`}
        >
          <div>
            <p className={`font-bold text-sm ${plan.active ? "text-white" : "text-slate-400"}`}>
              {plan.months}
            </p>
            <p className="text-[10px] text-slate-500">
              {plan.daily} · {plan.projects}
            </p>
          </div>
          <span
            className={`text-[9px] font-bold px-2 py-1 rounded-full ${
              plan.active ? "bg-[#0056CE] text-white" : "bg-white/5 text-slate-500"
            }`}
          >
            {plan.tag}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProjectsPreview() {
  const repos = [
    { name: "ai-chatbot", lang: "Python", stars: 47, bars: 7 },
    { name: "rag-pipeline", lang: "Python", stars: 31, bars: 5 },
    { name: "research-agent", lang: "Python", stars: 28, bars: 6 },
    { name: "production-saas", lang: "TypeScript", stars: 62, bars: 8 },
  ];
  return (
    <div
      className="rounded-2xl border border-white/10 p-5"
      style={{ background: "#0D1117" }}
    >
      <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold">
          P
        </div>
        <span>priya-learns</span>
        <span className="ml-auto">12 repositories</span>
      </div>
      {repos.map((repo) => (
        <div
          key={repo.name}
          className="flex items-center justify-between py-2 border-t border-white/5"
        >
          <div>
            <p className="text-xs text-blue-400 font-medium">{repo.name}</p>
            <p className="text-[9px] text-slate-500">{repo.lang}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500">&#9733; {repo.stars}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: repo.bars }).map((_, i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-sm bg-emerald-400"
                  style={{ opacity: 0.3 + (i / repo.bars) * 0.7 }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HiredPreview() {
  const stats = [
    { label: "Projects deployed", value: "12 / 12", color: "text-emerald-400" },
    { label: "Portfolio score", value: "94 / 100", color: "text-emerald-400" },
    { label: "Interview calls", value: "3 received", color: "text-blue-400" },
  ];
  return (
    <div
      className="rounded-2xl border border-emerald-500/20 p-6 text-center"
      style={{ background: "rgba(16,185,129,0.05)" }}
    >
      <div className="text-5xl mb-4">🎯</div>
      <h3 className="text-xl font-black text-white mb-2">Interview Ready</h3>
      <div className="space-y-3 mt-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-white/5 border border-white/[0.08]"
          >
            <span className="text-xs text-slate-400">{stat.label}</span>
            <span className={`text-xs font-bold ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-5 leading-relaxed">
        &ldquo;I deployed my 10th project and got 3 interview calls in one week.&rdquo; — Priya, AI Engineer
      </p>
    </div>
  );
}

function StepMockup({ preview }: { preview: string }) {
  switch (preview) {
    case "assessment": return <AssessmentPreview />;
    case "report":     return <ReportPreview />;
    case "plan":       return <PlanPreview />;
    case "projects":   return <ProjectsPreview />;
    case "hired":      return <HiredPreview />;
    default:           return null;
  }
}

// ─── Station icons (one per step) ─────────────────────────────────────────────
const STATION_ICONS = ["📋", "📊", "🗓️", "🚀", "🎯"];

// ─── Journey Hero (the MONEY SHOT) ────────────────────────────────────────────
// A self-running "speed run" preview that auto-plays the moment the section
// enters view. A glowing orb travels left→right, lighting up each station,
// emitting sparks, with a celebration finale at HIRED. Replays every 9 seconds.

function JourneyHero({
  scrollActiveStep,
  scrollProgress,
}: {
  scrollActiveStep: number;
  scrollProgress: number;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted]   = useState(false);
  const [orbProgress, setOrbProgress] = useState(0);   // 0..1 across full journey
  const [poppedSteps, setPoppedSteps] = useState<Set<number>>(new Set());
  const [bursts, setBursts]           = useState<Set<number>>(new Set());
  const [celebrating, setCelebrating] = useState(false);
  const [showStamp, setShowStamp]     = useState(false);
  const [replayCounter, setReplayCounter] = useState(0);

  // Trigger speed-run when section enters view
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) setHasStarted(true);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasStarted]);

  // Speed-run animation — runs each time replayCounter changes
  useEffect(() => {
    if (!hasStarted) return;

    setPoppedSteps(new Set());
    setBursts(new Set());
    setCelebrating(false);
    setShowStamp(false);
    setOrbProgress(0);

    const DURATION = 3500;        // total run time
    const start    = performance.now();
    let raf = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / DURATION);
      // Ease-out cubic — feels like the orb is gaining momentum then settling
      const eased = 1 - Math.pow(1 - t, 2);
      setOrbProgress(eased);

      // Trigger station pops + bursts as orb passes
      STEPS.forEach((_, i) => {
        const stationT = i / (STEPS.length - 1);
        if (eased >= stationT) {
          setPoppedSteps(prev => prev.has(i) ? prev : new Set(prev).add(i));
          setBursts(prev => {
            if (prev.has(i)) return prev;
            const next = new Set(prev);
            next.add(i);
            return next;
          });
        }
      });

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // Reached the end → celebrate + show HIRED stamp
        setCelebrating(true);
        setTimeout(() => setShowStamp(true), 200);
        // Auto-replay after a pause
        setTimeout(() => setReplayCounter(c => c + 1), 5500);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hasStarted, replayCounter]);

  // Allow scroll-driven progress to ALSO drive the strip after speed-run completes
  const usingScroll = orbProgress >= 1 && !celebrating;
  const displayProgress = usingScroll
    ? (scrollActiveStep + scrollProgress) / STEPS.length
    : orbProgress;

  return (
    <div ref={heroRef} className="relative w-full px-4 sm:px-8 py-6 sm:py-8">
      {/* Section label */}
      <div className="text-center mb-4 sm:mb-6">
        <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
          The Journey
        </span>
      </div>

      {/* Journey strip */}
      <div className="relative max-w-5xl mx-auto">

        {/* Connecting line — background track */}
        <div className="absolute left-[10%] right-[10%] top-7 sm:top-9 h-0.5 bg-white/[0.08] rounded-full" />

        {/* Connecting line — animated fill */}
        <div
          className="absolute left-[10%] top-7 sm:top-9 h-0.5 rounded-full overflow-hidden"
          style={{
            width: `${displayProgress * 80}%`, // 80% = the visible track between first/last node centres
            background: "linear-gradient(90deg, #0056CE 0%, #4F46E5 25%, #7C3AED 50%, #9333EA 75%, #10B981 100%)",
            boxShadow: "0 0 12px rgba(99,102,241,0.5)",
            transition: usingScroll ? "width 0.3s ease" : "none",
          }}
        >
          {/* Inner shimmer */}
          <div className="absolute inset-0 animate-flow-shimmer"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
            }}
          />
        </div>

        {/* Traveling orb */}
        {!usingScroll && (
          <div
            className="absolute top-7 sm:top-9 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
            style={{
              left: `calc(10% + ${displayProgress * 80}%)`,
              willChange: "left",
            }}
          >
            {/* Outer glow */}
            <div
              className="absolute -inset-4 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(99,102,241,0.6) 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
            />
            {/* Inner orb */}
            <div
              className="relative w-4 h-4 rounded-full"
              style={{
                background: "radial-gradient(circle, #ffffff 0%, #0056CE 60%, #4F46E5 100%)",
                boxShadow: "0 0 24px rgba(99,102,241,0.9), 0 0 8px rgba(255,255,255,0.9)",
              }}
            />
          </div>
        )}

        {/* Stations */}
        <div className="relative flex items-start justify-between">
          {STEPS.map((step, i) => {
            const isLast = i === STEPS.length - 1;
            const popped = poppedSteps.has(i) || (usingScroll && i <= scrollActiveStep);
            const burst  = bursts.has(i);

            return (
              <div key={step.label} className="relative flex flex-col items-center gap-2 sm:gap-3" style={{ width: 80 }}>

                {/* Burst ring */}
                {burst && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-full pointer-events-none animate-station-burst"
                    style={{
                      border: `2px solid ${step.color}`,
                      boxShadow: `0 0 30px ${step.color}`,
                    }}
                  />
                )}

                {/* Sparks (for last station, lots of them) */}
                {burst && isLast && (
                  <div className="absolute top-7 left-1/2 -translate-x-1/2 pointer-events-none">
                    {Array.from({ length: 12 }).map((_, k) => {
                      const angle = (k / 12) * Math.PI * 2;
                      const dist  = 40 + Math.random() * 30;
                      return (
                        <div
                          key={k}
                          className="absolute w-1.5 h-1.5 rounded-full animate-spark"
                          style={{
                            background: k % 2 === 0 ? "#10B981" : "#FBBF24",
                            ["--spark-x" as string]: `${Math.cos(angle) * dist}px`,
                            ["--spark-y" as string]: `${Math.sin(angle) * dist}px`,
                            boxShadow: "0 0 6px currentColor",
                          }}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Station node */}
                <div
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl transition-all duration-500 will-change-transform ${popped ? "animate-station-pop" : ""} ${isLast && celebrating ? "animate-breathe-glow" : ""}`}
                  style={{
                    background: popped ? `linear-gradient(135deg, ${step.color}, ${step.color}cc)` : "rgba(255,255,255,0.04)",
                    border: `2px solid ${popped ? step.color : "rgba(255,255,255,0.10)"}`,
                    boxShadow: popped
                      ? `0 0 24px ${step.color}80, 0 0 8px ${step.color}, inset 0 0 12px ${step.color}30`
                      : "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  <span style={{ filter: popped ? "none" : "grayscale(1) opacity(0.4)" }}>
                    {STATION_ICONS[i]}
                  </span>

                  {/* Big celebration ring on last node */}
                  {isLast && celebrating && (
                    <div
                      className="absolute inset-0 rounded-2xl pointer-events-none animate-hired-celebrate"
                      style={{
                        background: "radial-gradient(circle, #10B981 0%, transparent 70%)",
                      }}
                    />
                  )}
                </div>

                {/* Label */}
                <div className="text-center">
                  <span
                    className={`block text-[10px] sm:text-[11px] font-bold tracking-wide whitespace-nowrap transition-all duration-500 ${isLast && celebrating ? "scale-110" : ""}`}
                    style={{
                      color: popped ? step.color : "rgba(255,255,255,0.25)",
                    }}
                  >
                    {step.label}
                  </span>
                  {/* Sub-label */}
                  <span
                    className={`hidden sm:block text-[8px] uppercase tracking-widest mt-0.5 transition-all duration-500 ${popped ? "opacity-60" : "opacity-0"}`}
                    style={{ color: step.color }}
                  >
                    {i === 0 && "Step 1"}
                    {i === 1 && "Step 2"}
                    {i === 2 && "Step 3"}
                    {i === 3 && "Step 4"}
                    {i === 4 && "Goal"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* HIRED stamp + confetti at the end */}
        {showStamp && (
          <>
            <div
              className="absolute right-[2%] sm:right-[4%] top-0 sm:-top-2 animate-hired-stamp pointer-events-none z-30"
            >
              <div
                className="px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-black tracking-widest"
                style={{
                  background: "rgba(16,185,129,0.95)",
                  color: "#FFFFFF",
                  border: "2px solid #10B981",
                  boxShadow: "0 8px 24px rgba(16,185,129,0.5), 0 0 0 1px rgba(255,255,255,0.2) inset",
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                ✓ HIRED
              </div>
            </div>

            {/* Confetti */}
            {Array.from({ length: 24 }).map((_, k) => {
              const colors = ["#10B981", "#3388FF", "#FBBF24", "#EC4899", "#8B5CF6", "#06B6D4"];
              const left   = 75 + Math.random() * 20; // confetti rains down on right side
              const delay  = Math.random() * 0.4;
              return (
                <div
                  key={`confetti-${replayCounter}-${k}`}
                  className="absolute top-4 pointer-events-none animate-confetti"
                  style={{
                    left: `${left}%`,
                    width: 5,
                    height: 9,
                    background: colors[k % colors.length],
                    transform: `rotate(${Math.random() * 360}deg)`,
                    animationDelay: `${delay}s`,
                    borderRadius: 1,
                  }}
                />
              );
            })}
          </>
        )}

        {/* Replay hint after first run */}
        {celebrating && (
          <div className="mt-4 sm:mt-6 text-center">
            <span className="text-[10px] tracking-widest uppercase text-slate-600 font-semibold">
              Scroll to explore the journey ↓
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mobile card (intersection-observer driven) ───────────────────────────────

function MobileStepCard({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-700 ${
        visible ? "animate-step-in opacity-100" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div
        className="rounded-2xl p-6 border border-white/10"
        style={{ background: step.accentBg, borderColor: `${step.color}20` }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-4xl font-black leading-none"
            style={{ color: step.color, opacity: 0.3 }}
          >
            {step.number}
          </span>
          <span
            className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
            style={{ background: `${step.color}20`, color: step.color }}
          >
            {step.label}
          </span>
        </div>
        <h3 className="text-xl font-bold text-white mb-3 leading-snug">{step.title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">{step.description}</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {step.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
              style={{
                background: `${step.color}12`,
                color: step.color,
                borderColor: `${step.color}30`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        {/* Mockup */}
        <div className="mt-2">
          <StepMockup preview={step.preview} />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function JourneySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const totalScrollable = sectionRef.current.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      const totalPct = Math.min(1, scrolled / totalScrollable);
      const raw = totalPct * STEPS.length;
      const step = Math.min(STEPS.length - 1, Math.floor(raw));
      const progress = raw - step;
      setActiveStep(step);
      setStepProgress(progress);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const currentStep = STEPS[activeStep];
  const overallProgress = (activeStep + stepProgress) / STEPS.length;

  return (
    <section style={{ background: "#050B14" }}>
      {/* ── MOBILE: stacked cards ──────────────────────────────────────────── */}
      <div className="lg:hidden px-4 py-12">
        {/* Mobile hero strip — runs the same speed-run animation */}
        <JourneyHero scrollActiveStep={0} scrollProgress={0} />
        <div className="text-center mt-8 mb-10">
          <h2 className="text-2xl font-bold text-white">Five steps. One outcome.</h2>
        </div>
        <div className="space-y-6">
          {STEPS.map((step, i) => (
            <MobileStepCard key={step.number} step={step} index={i} />
          ))}
        </div>
      </div>

      {/* ── DESKTOP: sticky scroll ─────────────────────────────────────────── */}
      <div
        ref={sectionRef}
        className="hidden lg:block"
        style={{ height: "500vh" }}
      >
        {/* Sticky panel */}
        <div
          className="sticky top-0 h-screen flex flex-col overflow-hidden"
          style={{ background: "#050B14" }}
        >
          {/* Top: Journey Hero (auto-play speed run + scroll-driven) */}
          <div className="flex-none pt-6">
            <JourneyHero scrollActiveStep={activeStep} scrollProgress={stepProgress} />
          </div>

          {/* Main content row */}
          <div className="flex-1 flex items-center px-10 xl:px-16 gap-8 min-h-0">

            {/* LEFT 45% — text */}
            <div className="w-[45%] flex-shrink-0 flex flex-col justify-center pr-4">
              <div
                key={activeStep}
                className="animate-step-in will-change-transform"
              >
                {/* Step number */}
                <span
                  className="block text-8xl font-black leading-none mb-3 select-none"
                  style={{ color: currentStep.color, opacity: 0.18 }}
                >
                  {currentStep.number}
                </span>

                {/* Label pill */}
                <span
                  className="inline-block text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full mb-4"
                  style={{
                    background: `${currentStep.color}20`,
                    color: currentStep.color,
                  }}
                >
                  {currentStep.label}
                </span>

                {/* Title */}
                <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-4">
                  {currentStep.title}
                </h2>

                {/* Description */}
                <p className="text-slate-400 leading-relaxed text-base mb-6 max-w-md">
                  {currentStep.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {currentStep.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-full border"
                      style={{
                        background: `${currentStep.color}12`,
                        color: currentStep.color,
                        borderColor: `${currentStep.color}30`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Next hint */}
                {activeStep < STEPS.length - 1 && (
                  <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
                    <span>Next:</span>
                    <span style={{ color: STEPS[activeStep + 1].color }} className="font-semibold">
                      {STEPS[activeStep + 1].label}
                    </span>
                    <span className="text-slate-700">→</span>
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT 55% — mockup */}
            <div className="flex-1 flex items-center justify-center min-h-0 py-4">
              <div
                key={`mockup-${activeStep}`}
                className="animate-mockup-in will-change-transform w-full max-w-md"
              >
                <StepMockup preview={currentStep.preview} />
              </div>
            </div>
          </div>

          {/* Bottom: scroll fill bar */}
          <div className="flex-none h-0.5 bg-white/[0.05] relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 transition-all duration-200"
              style={{
                width: `${overallProgress * 100}%`,
                background: currentStep.color,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
