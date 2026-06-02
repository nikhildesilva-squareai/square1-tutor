"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════════
// Social Proof — rotating transformation stories + embedded stats
// Replaces both StatsSection + TransformationStories
// ═══════════════════════════════════════════════════════════════════════════════

const ROTATION_MS = 5000;

type Story = {
  name:      string;
  age:       number;
  initials:  string;
  avatarBg:  string;
  before:    string;
  after:     string;
  course:    string;
  plan:      string;
  quote:     string;
  stat:      { value: string; label: string };
  accent:    string;
};

const STORIES: Story[] = [
  {
    name: "Priya S.", age: 27, initials: "PS", avatarBg: "#7C3AED",
    before: "Accountant with zero coding experience",
    after:  "AI Engineer at a Series B startup",
    course: "Generative AI", plan: "6-month plan",
    quote: "6 months ago I couldn't write a Python function. I just deployed my 10th project and got 3 interview calls in one week. The AI grading was the difference — I knew exactly what to fix.",
    stat: { value: "3", label: "offers received" },
    accent: "#7C3AED",
  },
  {
    name: "James O.", age: 19, initials: "JO", avatarBg: "#0056CE",
    before: "CS student, lots of theory, zero shipped code",
    after:  "Launched his own AI startup in month 4",
    course: "Full Stack + Gen AI", plan: "9-month plan",
    quote: "University taught me theory. Square 1 taught me to build. By month 3 I had 6 real projects. By month 4 I had my first paying customer.",
    stat: { value: "12", label: "projects shipped" },
    accent: "#0056CE",
  },
  {
    name: "Marcus T.", age: 34, initials: "MT", avatarBg: "#10B981",
    before: "DevOps engineer wanting to move into AI",
    after:  "Senior AI Engineer, 40% salary increase",
    course: "Machine Learning", plan: "3-month plan",
    quote: "I'd tried Udemy, Coursera, YouTube. Nothing stuck because there was no feedback. Square 1 AI grades your actual code. That changes everything.",
    stat: { value: "40%", label: "salary increase" },
    accent: "#10B981",
  },
  {
    name: "Aisha K.", age: 23, initials: "AK", avatarBg: "#EC4899",
    before: "Marketing grad, self-taught Python basics",
    after:  "Data Scientist at a healthcare startup",
    course: "Data Science", plan: "6-month plan",
    quote: "I went from Pandas tutorials to building a real cohort analysis tool that my company actually uses. The AI tutor caught mistakes I didn't even know I was making.",
    stat: { value: "Week 22", label: "first offer" },
    accent: "#EC4899",
  },
  {
    name: "Chen W.", age: 28, initials: "CW", avatarBg: "#F59E0B",
    before: "Junior developer, 2 years experience",
    after:  "LLM Agent Architect at a top AI lab",
    course: "LLM Agent Architect", plan: "3-month plan",
    quote: "I needed to level up fast. The multi-agent project alone got me through 3 technical interviews. The interviewers were more impressed by my repo than my resume.",
    stat: { value: "$185k", label: "new salary" },
    accent: "#F59E0B",
  },
];

export function SocialProofSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused]   = useState(false);
  const [progress, setProgress]   = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const startRef = useRef<number>(0);
  const rafRef   = useRef<number>(0);

  // Trigger on enter view
  useEffect(() => {
    if (!sectionRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (isPaused || !isVisible) return;
    startRef.current = performance.now();
    setProgress(0);
    function tick(now: number) {
      const elapsed = now - startRef.current;
      const pct = Math.min(1, elapsed / ROTATION_MS);
      setProgress(pct);
      if (pct < 1) rafRef.current = requestAnimationFrame(tick);
      else setActiveIdx((i) => (i + 1) % STORIES.length);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [activeIdx, isPaused, isVisible]);

  const story = STORIES[activeIdx];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
      style={{
        background: `
          radial-gradient(ellipse 900px 500px at 20% 30%, ${story.accent}10, transparent 60%),
          radial-gradient(ellipse 800px 500px at 80% 70%, rgba(167,139,250,0.06), transparent 60%),
          linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
        `,
        transition: "background 1s ease",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Drifting blob — colour matches active story */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-25 animate-blob-1 transition-all duration-1000"
        style={{ background: `radial-gradient(circle, ${story.accent}30 0%, transparent 70%)`, filter: "blur(90px)" }} />

      <div className="relative max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Real Results
          </span>
          <h2 className="mt-4 font-black tracking-tight text-slate-900 leading-[0.95]"
            style={{ fontSize: "clamp(36px, 6vw, 80px)" }}>
            Real learners.{" "}
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Real outcomes.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
            They didn&apos;t watch tutorials. They built things. Here&apos;s what happened.
          </p>
        </div>

        {/* Main story card — side-by-side on desktop */}
        <div
          className="relative rounded-3xl border overflow-hidden transition-all duration-500"
          style={{
            background: `
              linear-gradient(135deg, ${story.accent}08 0%, #FFFFFF 50%, ${story.accent}04 100%),
              radial-gradient(circle at top right, ${story.accent}08, transparent 60%)
            `,
            borderColor: `${story.accent}25`,
            boxShadow: `0 16px 48px ${story.accent}15, 0 0 0 1px ${story.accent}08 inset`,
          }}
        >
          {/* Decorative blob */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none opacity-40"
            style={{ background: `radial-gradient(circle, ${story.accent}25 0%, transparent 70%)`, filter: "blur(24px)" }} />

          <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-0">

            {/* LEFT — story content */}
            <div key={`story-${activeIdx}`} className="p-8 sm:p-10 lg:p-12 animate-step-in">
              {/* Avatar + name */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black text-white shrink-0"
                  style={{ background: `linear-gradient(135deg, ${story.avatarBg}, ${story.avatarBg}cc)` }}>
                  {story.initials}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{story.name} <span className="text-slate-400 font-medium">{story.age}</span></h3>
                  <div className="flex gap-0.5 mt-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-amber-400 text-xs">★</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Before → After */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl p-4 bg-slate-50 border border-slate-100">
                  <p className="text-[10px] tracking-widest uppercase font-bold text-slate-400 mb-1">Before</p>
                  <p className="text-sm font-semibold text-slate-700">{story.before}</p>
                </div>
                <div className="rounded-xl p-4 border"
                  style={{ background: `${story.accent}08`, borderColor: `${story.accent}20` }}>
                  <p className="text-[10px] tracking-widest uppercase font-bold mb-1" style={{ color: story.accent }}>After</p>
                  <p className="text-sm font-bold text-slate-900">{story.after}</p>
                </div>
              </div>

              {/* Quote */}
              <blockquote className="text-base sm:text-lg text-slate-700 leading-relaxed italic mb-6 border-l-4 pl-5"
                style={{ borderColor: `${story.accent}40` }}>
                &ldquo;{story.quote}&rdquo;
              </blockquote>

              {/* Course + plan pill */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border"
                  style={{ background: `${story.accent}10`, borderColor: `${story.accent}30`, color: story.accent }}>
                  {story.plan} · {story.course}
                </span>
              </div>
            </div>

            {/* RIGHT — big stat + navigation */}
            <div
              className="relative flex flex-col items-center justify-center p-8 sm:p-10 lg:border-l"
              style={{
                borderColor: `${story.accent}15`,
                background: `linear-gradient(180deg, ${story.accent}06, ${story.accent}02)`,
              }}
            >
              <div key={`stat-${activeIdx}`} className="text-center animate-mockup-in">
                {/* Big number */}
                <div
                  className="font-black tabular-nums leading-none select-none mb-2"
                  style={{
                    fontSize: "clamp(64px, 10vw, 96px)",
                    letterSpacing: "-0.04em",
                    background: `linear-gradient(180deg, ${story.accent} 0%, ${story.accent}88 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: `drop-shadow(0 0 24px ${story.accent}40)`,
                  }}
                >
                  {story.stat.value}
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1">{story.stat.label}</p>
                <p className="text-xs text-slate-500">{story.name.split(".")[0]}&apos;s result</p>
              </div>

              {/* Navigation dots */}
              <div className="mt-8 flex items-center gap-2">
                {STORIES.map((s, i) => {
                  const active = i === activeIdx;
                  return (
                    <button
                      key={i}
                      onClick={() => { setActiveIdx(i); setProgress(0); }}
                      className="transition-all rounded-full"
                      aria-label={`Show ${s.name}'s story`}
                      style={{
                        width:  active ? 28 : 8,
                        height: 8,
                        background: active ? s.accent : "rgba(148,168,200,0.25)",
                        boxShadow: active ? `0 0 12px ${s.accent}` : "none",
                        minHeight: "unset",
                      }}
                    />
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="mt-3 w-24 h-0.5 rounded-full overflow-hidden bg-slate-200">
                <div className="h-full rounded-full"
                  style={{
                    width: `${progress * 100}%`,
                    background: story.accent,
                    transition: progress === 0 ? "none" : "width 0.05s linear",
                  }} />
              </div>

              {/* Status */}
              <p className="mt-2 text-[9px] tracking-widest uppercase text-slate-400 tabular-nums">
                {String(activeIdx + 1).padStart(2, "0")} / {String(STORIES.length).padStart(2, "0")}
                {isPaused && <span className="ml-2 text-amber-500 font-bold">Paused</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom — embedded stats row (replaces StatsSection) */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto text-center">
          {[
            { value: "12",   label: "projects per student" },
            { value: "12",   label: "career paths" },
            { value: "45",   label: "minutes per day" },
            { value: "100%", label: "code, zero videos" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-black tabular-nums text-slate-900 leading-none"
                style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.04em" }}>
                {s.value}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 sm:mt-14 flex flex-col items-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            style={{
              background: "linear-gradient(135deg, #0056CE 0%, #4F46E5 100%)",
              boxShadow: "0 12px 32px rgba(0,86,206,0.30)",
            }}
          >
            Join them — take the assessment →
          </Link>
          <p className="text-xs text-slate-500">Free · 30 minutes · No credit card</p>
        </div>
      </div>
    </section>
  );
}
