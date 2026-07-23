"use client";

import { useEffect, useRef, useState } from "react";
import { Hammer, FolderGit2, ClipboardCheck } from "lucide-react";
import { PrimaryCta } from "@/components/ui/primary-cta";

// ═══════════════════════════════════════════════════════════════════════════════
// The premise — practice-first learning. Follows RealityBand's closing line
// ("project by graded project") and answers it: you don't watch tutorials here,
// you build 10 real projects per track, and each one is graded and deployed.
// Visual centrepiece: the project rail — 10 numbered stops that fill in as the
// section scrolls into view, with real project names from real courses as
// milestones. All facts on this section are product facts (10 projects/track,
// 152 starter repos live on GitHub, real datasets, Nova rubric-grading) — no
// invented pedagogy statistics.
// ═══════════════════════════════════════════════════════════════════════════════

const BLUE_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

// Real starter-kit projects from live courses — not decorative examples.
const MILESTONES = [
  { at: 1,  name: "House Price Predictor", note: "your first guided build" },
  { at: 4,  name: "Fraud Detector",        note: "real dataset, real signal" },
  { at: 7,  name: "RAG Pipeline",          note: "the stack employers ask about" },
  { at: 10, name: "Capstone",              note: "deployed, graded, on your CV" },
];

const BENEFITS = [
  {
    icon: Hammer,
    title: "Build to remember",
    desc: "Reading fades; building sticks. Every lesson ends in exercises, and every module feeds a project — you practise the skill, not the summary.",
  },
  {
    icon: FolderGit2,
    title: "Proof employers can run",
    desc: "Each project starts from a real starter repo with a real dataset and ships to your GitHub. Not screenshots of coursework — code anyone can clone and run.",
  },
  {
    icon: ClipboardCheck,
    title: "Graded, not guessed",
    desc: "Nova reviews every project against a rubric — what's solid, what's missing, what a senior would flag — so you know it's actually good before an employer sees it.",
  },
];

export function BuildPremiseSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg, #F6F9FE 0%, #FFFFFF 55%, #F4F8FF 100%)" }}>
      <div className="pointer-events-none absolute top-1/4 -left-32 w-[560px] h-[560px] rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, #0056CE 0%, transparent 70%)", filter: "blur(100px)" }} />

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">The premise</span>
          <h2 className="mt-4 font-black tracking-tight text-slate-900 leading-[1.0] max-w-3xl mx-auto"
            style={{ fontSize: "clamp(26px, 4vw, 46px)", letterSpacing: "-0.03em" }}>
            You don&apos;t learn AI by watching.{" "}
            <span style={{ background: BLUE_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              You learn by building.
            </span>
          </h2>
          <p className="mt-5 text-center text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Every career track is built around <span className="text-slate-900 font-semibold">10 real projects</span> —
            each with a starter repo, a real dataset, and a rubric. You build, Nova grades, it ships to
            your GitHub. By the capstone, your portfolio <em>is</em> your CV.
          </p>
        </div>

        {/* ── The project rail — 10 stops, filling in as you arrive ─────────── */}
        {/* Desktop: horizontal rail with milestone cards above/below */}
        <div className="hidden md:block mt-14">
          <div className="relative px-2">
            {/* Track */}
            <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
              <div className="h-full rounded-full motion-reduce:transition-none"
                style={{
                  width: visible ? "100%" : "0%",
                  background: BLUE_GRADIENT,
                  transition: "width 1800ms cubic-bezier(0.4,0,0.2,1) 200ms",
                }} />
            </div>
            {/* Dots 01–10 */}
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between">
              {Array.from({ length: 10 }, (_, i) => {
                const n = i + 1;
                const isMilestone = MILESTONES.some((m) => m.at === n);
                return (
                  <span key={n}
                    className="rounded-full border-2 border-white motion-reduce:transition-none"
                    style={{
                      width: isMilestone ? 18 : 12,
                      height: isMilestone ? 18 : 12,
                      background: isMilestone ? "#0056CE" : "#3388FF",
                      boxShadow: "0 2px 8px rgba(0,86,206,0.35)",
                      opacity: visible ? 1 : 0,
                      transform: visible ? "scale(1)" : "scale(0)",
                      transition: `opacity 300ms ease ${300 + i * 140}ms, transform 300ms cubic-bezier(0.34,1.56,0.64,1) ${300 + i * 140}ms`,
                    }} />
                );
              })}
            </div>
          </div>
          {/* Milestone cards — aligned to their stop (10 equal columns) */}
          <div className="mt-6 grid grid-cols-10 gap-0">
            {Array.from({ length: 10 }, (_, i) => {
              const n = i + 1;
              const m = MILESTONES.find((x) => x.at === n);
              return (
                <div key={n} className="col-span-1 flex flex-col items-center text-center px-0.5">
                  <span className="text-[10px] font-mono font-bold tabular-nums text-slate-400">{String(n).padStart(2, "0")}</span>
                  {m && (
                    <div className="mt-2 rounded-xl border bg-white px-2 py-2 w-[130px] motion-reduce:transition-none"
                      style={{
                        borderColor: "#D8E7FC",
                        boxShadow: "0 6px 18px -10px rgba(0,86,206,0.3)",
                        opacity: visible ? 1 : 0,
                        transform: visible ? "translateY(0)" : "translateY(12px)",
                        transition: `opacity 400ms ease ${400 + i * 140}ms, transform 400ms ease ${400 + i * 140}ms`,
                      }}>
                      <p className="text-[11px] font-bold text-slate-900 leading-tight">{m.name}</p>
                      <p className="mt-0.5 text-[9.5px] text-slate-500 leading-snug">{m.note}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile: vertical rail */}
        <div className="md:hidden mt-10 relative pl-7">
          <div className="absolute left-2 top-1 bottom-1 w-1 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
            <div className="w-full rounded-full motion-reduce:transition-none"
              style={{
                height: visible ? "100%" : "0%",
                background: BLUE_GRADIENT,
                transition: "height 1600ms cubic-bezier(0.4,0,0.2,1) 200ms",
              }} />
          </div>
          <div className="space-y-5">
            {MILESTONES.map((m, i) => (
              <div key={m.at} className="relative motion-reduce:transition-none"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(10px)",
                  transition: `opacity 400ms ease ${300 + i * 200}ms, transform 400ms ease ${300 + i * 200}ms`,
                }}>
                <span className="absolute -left-[26px] top-1 w-4 h-4 rounded-full border-2 border-white"
                  style={{ background: "#0056CE", boxShadow: "0 2px 8px rgba(0,86,206,0.35)" }} />
                <p className="text-[10px] font-mono font-bold tabular-nums text-slate-400">Project {String(m.at).padStart(2, "0")}</p>
                <p className="text-sm font-bold text-slate-900">{m.name}</p>
                <p className="text-xs text-slate-500">{m.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Why building wins — three benefits ────────────────────────────── */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {BENEFITS.map(({ icon: Icon, title, desc }, i) => (
            <div key={title}
              className="rounded-2xl border bg-white p-6 motion-reduce:transition-none"
              style={{
                borderColor: "#E2E8F0",
                boxShadow: "0 4px 16px rgba(15,28,49,0.05)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 500ms ease ${600 + i * 120}ms, transform 500ms ease ${600 + i * 120}ms`,
              }}>
              <span className="w-11 h-11 rounded-[13px] flex items-center justify-center text-white"
                style={{ background: BLUE_GRADIENT, boxShadow: "0 8px 18px -8px rgba(0,86,206,0.6)" }}>
                <Icon size={20} strokeWidth={2.1} aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-black tracking-tight text-slate-900">{title}</h3>
              <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Product facts — real, checkable numbers only */}
        <p className="mt-8 text-center text-[11px] sm:text-xs text-slate-500 font-semibold tracking-wide">
          10 projects per career track · 152 starter repos live on GitHub · real datasets included · every project Nova-graded
        </p>

        {/* CTA — same single funnel */}
        <div className="mt-8 flex justify-center">
          <PrimaryCta href="/diagnostic">Start project 01 — free 3-min skill check</PrimaryCta>
        </div>
      </div>
    </section>
  );
}
