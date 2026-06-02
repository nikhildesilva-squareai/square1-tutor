"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── 12 real projects students build ──────────────────────────────────────────
const PROJECTS = [
  { name: "ai-chatbot",         lang: "Python",     stars: 47, status: "deployed" },
  { name: "rag-knowledge-base", lang: "Python",     stars: 31, status: "deployed" },
  { name: "prompt-playground",  lang: "TypeScript", stars: 22, status: "deployed" },
  { name: "code-reviewer",      lang: "Python",     stars: 38, status: "deployed" },
  { name: "research-agent",     lang: "Python",     stars: 28, status: "deployed" },
  { name: "ai-tutor-clone",     lang: "TypeScript", stars: 54, status: "deployed" },
  { name: "knowledge-search",   lang: "Python",     stars: 19, status: "deployed" },
  { name: "content-platform",   lang: "TypeScript", stars: 42, status: "deployed" },
  { name: "voice-assistant",    lang: "Python",     stars: 33, status: "deployed" },
  { name: "production-saas",    lang: "TypeScript", stars: 62, status: "deployed" },
  { name: "multi-agent-system", lang: "Python",     stars: 44, status: "deployed" },
  { name: "interview-prep-app", lang: "TypeScript", stars: 58, status: "deployed" },
];

const LANG_COLORS: Record<string, string> = {
  Python:     "#3776AB",
  TypeScript: "#3178C6",
};

// ─── Project card stacked in the tower ────────────────────────────────────────
function ProjectCard({
  project,
  index,
  isVisible,
  totalIndex,
}: {
  project: typeof PROJECTS[number];
  index: number;
  isVisible: boolean;
  totalIndex: number;
}) {
  // Slight rotation alternating for hand-stacked feel
  const rotate = index % 2 === 0 ? -1.5 : 1.2;
  // Each card slightly offset for depth
  const stackOffset = index * -4;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 w-[88%] max-w-md transition-all duration-700 will-change-transform"
      style={{
        bottom: 0,
        zIndex: index,
        transform: isVisible
          ? `translateY(${stackOffset}px) translateX(-50%) rotate(${rotate}deg)`
          : `translateY(${300 + index * 60}px) translateX(-50%) rotate(${rotate * 4}deg)`,
        opacity: isVisible ? 1 : 0,
        transitionDelay: `${index * 110}ms`,
      }}
    >
      <div
        className="rounded-2xl px-5 py-4 border flex items-center gap-3"
        style={{
          background: "linear-gradient(180deg, rgba(20,30,48,0.95) 0%, rgba(13,17,23,0.95) 100%)",
          borderColor: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset",
        }}
      >
        {/* Folder icon */}
        <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-mono text-slate-400 border border-white/8 bg-white/3">
          {String(totalIndex).padStart(2, "0")}
        </div>

        {/* Project name + lang */}
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm font-semibold text-white truncate">{project.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 rounded-full" style={{ background: LANG_COLORS[project.lang] }} />
            <span className="text-[10px] text-slate-500">{project.lang}</span>
          </div>
        </div>

        {/* Stars + status */}
        <div className="shrink-0 flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span className="text-amber-400">★</span>
            <span className="tabular-nums">{project.stars}</span>
          </div>
          <span className="text-[9px] font-bold tracking-widest uppercase text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Live
          </span>
        </div>
      </div>
    </div>
  );
}

export function VariantB() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleCount === 0) {
          // Start stacking one by one
          let i = 0;
          const tick = setInterval(() => {
            i++;
            setVisibleCount(i);
            if (i >= PROJECTS.length) clearInterval(tick);
          }, 180);
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
      style={{
        background: "linear-gradient(180deg, #050B14 0%, #081827 50%, #050B14 100%)",
      }}
    >
      {/* Background accents */}
      <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(79,70,229,0.10) 0%, transparent 70%)", filter: "blur(80px)" }} />

      <div className="relative max-w-6xl mx-auto">

        {/* Label */}
        <div className="text-center mb-6">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            The Journey · Living Stack
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-center font-black tracking-tight text-white leading-[0.95] mb-4"
          style={{ fontSize: "clamp(40px, 7vw, 92px)" }}>
          Watch your portfolio
          <br />
          <span style={{
            background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            stack up.
          </span>
        </h2>

        <p className="text-center text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-14">
          12 real, deployed projects. One stacked tower. Your GitHub, transformed.
        </p>

        {/* Two-column layout: stack visualization + counter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* LEFT — The growing stack */}
          <div className="relative h-[520px] w-full">
            {PROJECTS.map((p, i) => (
              <ProjectCard
                key={p.name}
                project={p}
                index={i}
                totalIndex={i + 1}
                isVisible={i < visibleCount}
              />
            ))}
          </div>

          {/* RIGHT — Live counter + breakdown */}
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-black tabular-nums text-white"
                style={{ fontSize: "clamp(72px, 10vw, 132px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
                {visibleCount}
              </span>
              <span className="text-2xl lg:text-4xl font-bold text-slate-500">/ 12</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-white mb-1">projects deployed</p>
            <p className="text-sm text-slate-500 mb-8">All on GitHub. All running live.</p>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden mb-8">
              <div className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(visibleCount / PROJECTS.length) * 100}%`,
                  background: "linear-gradient(90deg, #3388FF 0%, #A78BFA 60%, #10B981 100%)",
                }} />
            </div>

            {/* Breakdown stats */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="rounded-2xl p-4 border border-white/8" style={{ background: "rgba(8,18,32,0.5)" }}>
                <p className="text-xs text-slate-500 mb-1">Languages</p>
                <p className="text-lg font-bold text-white">Python · TypeScript</p>
              </div>
              <div className="rounded-2xl p-4 border border-white/8" style={{ background: "rgba(8,18,32,0.5)" }}>
                <p className="text-xs text-slate-500 mb-1">Total stars</p>
                <p className="text-lg font-bold text-white">{PROJECTS.reduce((acc, p) => acc + p.stars, 0)}</p>
              </div>
              <div className="rounded-2xl p-4 border border-white/8" style={{ background: "rgba(8,18,32,0.5)" }}>
                <p className="text-xs text-slate-500 mb-1">Time invested</p>
                <p className="text-lg font-bold text-white">~6 months</p>
              </div>
              <div className="rounded-2xl p-4 border border-emerald-500/20" style={{ background: "rgba(16,185,129,0.05)" }}>
                <p className="text-xs text-emerald-400 mb-1">Outcome</p>
                <p className="text-lg font-bold text-white">Job offer</p>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-white font-bold text-base transition-all"
              style={{
                background: "linear-gradient(135deg, #0056CE 0%, #4F46E5 100%)",
                boxShadow: "0 10px 32px rgba(0,86,206,0.4)",
              }}
            >
              Start building yours →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
