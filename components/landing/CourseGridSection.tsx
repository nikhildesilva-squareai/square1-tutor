"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode, KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { PrimaryCta } from "@/components/ui/primary-cta";
import { CourseIcon } from "@/components/ui/course-icon";
import { WORK_LANE_SLUGS } from "@/lib/work-lanes";

export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  total_lessons: number;
  total_projects: number;
  status: string;
};

// Real syllabus data for the explorer, fetched server-side in app/page.tsx:
// the course's core module spine (in order) and its authored project briefs.
// Optional everywhere — when absent the explorer falls back to the static
// sample lists below, so the modal never renders empty.
export type CourseDepth = {
  modules: { title: string }[];
  projects: { title: string; difficulty: string | null; hours: number | null }[];
};

// ─── Career outcome + sample projects per course (by slug) ────────────────────
type CourseMeta = {
  role:     string;
  salary:   string;
  projects: string[];
};

const META: Record<string, CourseMeta> = {
  "agentic-ai":              { role: "AI Engineer",            salary: "$130–200k", projects: ["Customer Service Agent", "Code Generation Assistant", "Multi-Agent Orchestrator"] },
  "generative-ai":           { role: "AI Engineer",            salary: "$130–200k", projects: ["AI Chatbot", "RAG Pipeline", "Research Agent"] },
  "machine-learning":        { role: "ML Engineer",            salary: "$140–220k", projects: ["House Price Predictor", "Image Classifier", "Fraud Detector"] },
  "artificial-intelligence": { role: "AI Engineer",            salary: "$130–200k", projects: ["Pathfinding Visualiser", "Game AI", "Decision Engine"] },
  "cybersecurity":           { role: "Cybersecurity Engineer",  salary: "$110–180k", projects: ["Vulnerability Scanner", "Password Auditor", "Secure Auth"] },
  "computer-vision":         { role: "CV Engineer",            salary: "$120–180k", projects: ["Face Detection", "OCR App", "Object Tracker"] },
  "fullstack-development":   { role: "Full Stack Engineer",    salary: "$100–160k", projects: ["SaaS App", "Real-time Chat", "Payment System"] },
  "data-science":            { role: "Data Scientist",         salary: "$115–185k", projects: ["Cohort Analysis", "A/B Test Lab", "Sales Forecaster"] },
  "llm-agent-architect":     { role: "Agent Architect",        salary: "$150–250k", projects: ["Tool-use Agent", "Multi-agent System", "Autonomous Workflow"] },
  "ai-product-management":   { role: "AI Product Manager",     salary: "$140–220k", projects: ["AI Product Spec", "Go-to-Market Plan", "User Research Report"] },
  "default":                 { role: "Software Engineer",      salary: "$90–150k",  projects: ["Starter Project", "Mid-level Project", "Capstone"] },
};

// ─── Work role-tracks — outcome + what you build (NO salary; these are no-code) ─
type WorkMeta = { role: string; items: string[] };
const WORK_META: Record<string, WorkMeta> = {
  "ai-foundations":          { role: "AI-Productive Pro",        items: ["The prompting patterns", "Across your real tools", "Your first workflows"] },
  "ai-for-marketers":        { role: "AI-Productive Marketer",   items: ["Full campaign pack", "Reusable prompt library", "Nova-graded drills"] },
  "ai-for-finance":          { role: "AI-Productive Finance Pro", items: ["Month-end pack", "Excel & analysis", "Verified reporting"] },
  "ai-for-creators":         { role: "AI-Productive Creator",    items: ["Content pack", "Repurposing waterfall", "Voice-matched scripts"] },
  "ai-for-founders":         { role: "AI-Productive Founder",    items: ["Operating pack", "Pitch & investor comms", "Reusable templates"] },
  "ai-for-teachers":         { role: "AI-Productive Teacher",    items: ["Teaching pack", "Differentiated lessons", "AI-aware assessment"] },
  "ai-for-project-managers": { role: "AI-Productive PM",         items: ["Delivery pack", "Status & risk register", "Stakeholder comms"] },
  "ai-for-sales":            { role: "AI-Productive Seller",     items: ["Deal pack", "Outreach & discovery", "Objection practice"] },
  "default":                 { role: "AI-Productive Pro",        items: ["Real work scenarios", "Prompt library", "Nova-graded practice"] },
};

// One resolver so the cards don't care which domain they're rendering.
function resolveMeta(slug: string, isWork: boolean): { topRight: string; role: string; items: string[] } {
  if (isWork) {
    const w = WORK_META[slug] ?? WORK_META.default;
    return { topRight: "No code", role: w.role, items: w.items };
  }
  const m = META[slug] ?? META.default;
  return { topRight: m.salary, role: m.role, items: m.projects };
}

const BRAND = "#0056CE";


// ─── Mobile card — compact tile ──────────────────────────────────────────────
function MobileCourseCard({
  course, index, isVisible, isWork, onSelect,
}: {
  course: Course; index: number; isVisible: boolean; isWork: boolean; onSelect: (c: Course) => void;
}) {
  const meta = resolveMeta(course.slug, isWork);

  return (
    <button
      onClick={() => onSelect(course)}
      className="relative group rounded-xl p-4 transition-all duration-500 will-change-transform overflow-hidden block w-full text-left"
      style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${index * 60}ms`,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-black text-slate-900 leading-tight" style={{ letterSpacing: "-0.01em" }}>
          {course.title}
        </h3>
        <span
          className="text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-full shrink-0 mt-0.5"
          style={{ background: `${BRAND}15`, color: BRAND }}
        >
          {meta.topRight}
        </span>
      </div>

      <p className="text-[11px] text-slate-500 leading-snug mb-3 line-clamp-1">{course.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0">
            <path d="M2 6h7M6 3l3 3-3 3" stroke={BRAND} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[10px] font-bold" style={{ color: BRAND }}>{meta.role}</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] text-slate-500">
          <span><span className="font-bold text-slate-600">{course.total_lessons}</span> lessons</span>
          {course.total_projects > 0 && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
              <span><span className="font-bold text-slate-600">{course.total_projects}</span> projects</span>
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${BRAND}40, ${BRAND}10)` }} />
    </button>
  );
}

// ─── Desktop card — full rich card ───────────────────────────────────────────
function DesktopCourseCard({
  course, index, isVisible, isWork, onSelect,
}: {
  course: Course; index: number; isVisible: boolean; isWork: boolean; onSelect: (c: Course) => void;
}) {
  const meta = resolveMeta(course.slug, isWork);

  return (
    <button
      onClick={() => onSelect(course)}
      className="relative group rounded-2xl p-6 lg:p-7 xl:p-5 transition-all duration-500 will-change-transform overflow-hidden block w-full text-left hover:-translate-y-1"
      style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${index * 90}ms`,
      }}
    >
      <div className="relative flex items-center justify-between mb-5 xl:mb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND }} />
          <span className="text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: BRAND }}>
            {course.status !== "active" ? "Coming Soon" : isWork ? "Role Track" : "Course"}
          </span>
        </div>
        <span
          className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full"
          style={{ background: `${BRAND}15`, color: BRAND }}
        >
          {meta.topRight}
        </span>
      </div>

      <h3 className="relative text-2xl lg:text-3xl xl:text-xl font-black text-slate-900 leading-tight mb-2"
        style={{ letterSpacing: "-0.02em" }}>
        {course.title}
      </h3>

      <p className="relative text-xs sm:text-sm xl:text-xs text-slate-600 mb-5 xl:mb-3.5 leading-relaxed line-clamp-2">
        {course.description}
      </p>

      <div className="relative space-y-1.5 mb-5 xl:mb-3.5">
        {meta.items.map((p, i) => (
          <div key={p} className="flex items-center gap-2.5 xl:gap-2 px-3 py-2 xl:px-2.5 xl:py-1.5 rounded-lg bg-slate-50/80 border border-slate-200/80">
            <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color: BRAND }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-xs sm:text-sm xl:text-xs font-semibold text-slate-700 truncate">{p}</span>
          </div>
        ))}
      </div>

      <div className="relative flex items-center gap-3 mb-4 xl:mb-3 text-[10px] text-slate-500">
        <span><span className="font-bold text-slate-700 tabular-nums">{course.total_lessons}</span> lessons</span>
        {course.total_projects > 0 && (
          <>
            <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
            <span><span className="font-bold text-slate-700 tabular-nums">{course.total_projects}</span> projects</span>
          </>
        )}
      </div>

      <div className="relative pt-4 border-t" style={{ borderColor: `${BRAND}10` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
              <path d="M2 6h7M6 3l3 3-3 3" stroke={BRAND} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] sm:text-[11px] font-bold truncate" style={{ color: BRAND }}>{meta.role}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            {isWork ? "Nova-graded" : "AI-graded track"}
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: `${BRAND}12` }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: isVisible ? "100%" : "0%",
              background: `linear-gradient(90deg, ${BRAND}, ${BRAND}cc)`,
              transitionDelay: `${index * 90 + 400}ms`,
            }}
          />
        </div>
      </div>
    </button>
  );
}

// ─── Difficulty pill colors (matches the app's own difficulty language) ───────
function difficultyStyle(d: string | null): { bg: string; fg: string } {
  switch ((d ?? "").toLowerCase()) {
    case "beginner":     return { bg: "rgba(16,185,129,0.10)", fg: "#059669" };
    case "intermediate": return { bg: "rgba(245,158,11,0.12)", fg: "#B45309" };
    case "advanced":     return { bg: "rgba(244,63,94,0.10)",  fg: "#BE123C" };
    default:             return { bg: "#F1F5F9",               fg: "#64748B" };
  }
}

// ─── Inline explorer modal — the course dossier ───────────────────────────────
// Exported: LaneMapSection reuses it so a chip click anywhere opens the same
// course detail + CTA experience.
//
// REBUILT 2026-08-23 (user call: "show the depth, get students excited"): the
// old modal showed three hardcoded sample project names. This one renders the
// course's REAL syllabus — the module spine in order and every authored
// project brief with its difficulty and hours — passed down from the DB via
// the `depth` prop. Nothing here is marketing copy: every line is a row a
// student will actually meet inside the product. Falls back to the static
// sample list only when the depth fetch failed.
export function CourseExplorer({ course, isWork, depth, onClose }: {
  course: Course; isWork: boolean; depth?: CourseDepth; onClose: () => void;
}) {
  const meta = resolveMeta(course.slug, isWork);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(true, onClose, dialogRef);

  const accent = course.color || BRAND;
  const modules = depth?.modules ?? [];
  const projects = depth?.projects ?? [];
  const hasDepth = modules.length > 0;
  const buildHours = projects.reduce((a, p) => a + (p.hours ?? 0), 0);

  const stats: { n: number; label: string }[] = [
    { n: course.total_lessons, label: "lessons" },
    ...(modules.length > 1 ? [{ n: modules.length, label: "modules" }] : []),
    ...(course.total_projects > 1 ? [{ n: course.total_projects, label: "projects" }] : []),
    ...(buildHours > 0 && course.total_projects > 1 ? [{ n: buildHours, label: "build hrs" }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={course.title}
        className="relative flex w-full max-h-[88dvh] flex-col sm:max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden animate-fade-in-up">

        {/* Header — stays pinned while the syllabus scrolls */}
        <div className="shrink-0 p-5 sm:p-6 border-b border-slate-100"
          style={{ background: `linear-gradient(135deg, ${accent}12, #fff 65%)` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="inline-flex w-11 h-11 rounded-xl items-center justify-center shrink-0"
                style={{ background: `${course.color}15`, border: `1px solid ${course.color}30` }}>
                <CourseIcon slug={course.slug} color={course.color} />
              </span>
              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{course.title}</h3>
                <p className="text-[13px] font-semibold mt-0.5" style={{ color: BRAND }}>
                  {meta.role}{!isWork && <> · <span style={{ color: "#10B981" }}>{meta.topRight}</span></>}
                  {isWork && <> · <span className="text-slate-500">No code</span></>}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-slate-500 shrink-0" aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          {/* The size of the thing, in numbers — all real counts */}
          {stats.length > 0 && (
            <div className="mt-4 flex items-stretch gap-2">
              {stats.map((s) => (
                <div key={s.label} className="flex-1 rounded-xl border border-slate-200/80 bg-white/70 px-2 py-2 text-center">
                  <p className="text-lg sm:text-xl font-black leading-none tabular-nums text-slate-900">{s.n}</p>
                  <p className="mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable body — the actual syllabus */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
          <p className="text-sm text-slate-600 leading-relaxed mb-5">{course.description}</p>

          {hasDepth ? (
            <>
              {/* The road — every core module, in the order you'll meet it */}
              <p className="text-[10px] tracking-widest uppercase font-bold text-slate-500 mb-3">
                The road — every module, in order
              </p>
              <ol className="relative mb-6 space-y-0">
                {modules.map((m, i) => (
                  <li key={`${m.title}-${i}`} className="relative flex gap-3 pb-2.5 last:pb-0 motion-safe:animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i * 45, 450)}ms` }}>
                    {/* Spine: node + connector down to the next module */}
                    <span className="flex flex-col items-center shrink-0" aria-hidden>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-black tabular-nums"
                        style={{ background: `${accent}14`, color: accent, border: `1.5px solid ${accent}45` }}>
                        {i + 1}
                      </span>
                      {i < modules.length - 1 && (
                        <span className="w-px flex-1 min-h-2" style={{ background: `${accent}30` }} />
                      )}
                    </span>
                    <span className="pt-1 text-[13px] font-semibold text-slate-700 leading-snug">{m.title}</span>
                  </li>
                ))}
              </ol>

              {/* What you'll ship — the real briefs, not sample names */}
              {projects.length > 0 && (
                <>
                  <p className="text-[10px] tracking-widest uppercase font-bold text-slate-500 mb-3">
                    {isWork
                      ? "The capstone you'll build"
                      : `What you'll ship — all ${projects.length} real project briefs`}
                  </p>
                  <div className="mb-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {projects.map((p, i) => {
                      const ds = difficultyStyle(p.difficulty);
                      return (
                        <div key={`${p.title}-${i}`}
                          className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 motion-safe:animate-fade-in-up"
                          style={{ animationDelay: `${Math.min(200 + i * 40, 600)}ms` }}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[12.5px] font-bold text-slate-800 leading-snug">
                              <span className="mr-1.5 font-mono text-[9px] font-bold tabular-nums" style={{ color: accent }}>
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              {p.title}
                            </p>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            {p.difficulty && (
                              <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide"
                                style={{ background: ds.bg, color: ds.fg }}>
                                {p.difficulty}
                              </span>
                            )}
                            {p.hours != null && p.hours > 0 && (
                              <span className="text-[10px] font-semibold text-slate-500 tabular-nums">~{p.hours}h</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {!isWork && (
                    <p className="mb-4 text-[11px] text-slate-500 leading-relaxed">
                      Every brief ships with a public starter repo and a marking rubric — Nova
                      grades what you push.
                    </p>
                  )}
                </>
              )}

              {/* Work tracks: the practice, alongside the single capstone */}
              {isWork && (
                <>
                  <p className="text-[10px] tracking-widest uppercase font-bold text-slate-500 mb-3">
                    What you&apos;ll practise, graded by Nova
                  </p>
                  <div className="space-y-2 mb-5">
                    {meta.items.map((p, i) => (
                      <div key={p} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-slate-50/60" style={{ borderColor: `${BRAND}15` }}>
                        <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color: BRAND }}>{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-sm font-semibold text-slate-700">{p}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            /* Depth fetch failed — the pre-2026-08-23 static sample list */
            <>
              <p className="text-[10px] tracking-widest uppercase font-bold text-slate-500 mb-3">
                {isWork ? "What you'll practise & build" : "Real projects you'll ship"}
              </p>
              <div className="space-y-2 mb-6">
                {meta.items.map((p, i) => (
                  <div key={p} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-slate-50/60" style={{ borderColor: `${BRAND}15` }}>
                    <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color: BRAND }}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-sm font-semibold text-slate-700">{p}</span>
                  </div>
                ))}
                <p className="text-[11px] text-slate-500 pt-1">{course.total_lessons} lessons{course.total_projects > 0 ? ` · ${course.total_projects} projects` : ""}</p>
              </div>
            </>
          )}
        </div>

        {/* CTAs — pinned under the scroll, always reachable */}
        <div className="shrink-0 flex flex-col gap-2.5 border-t border-slate-100 bg-white p-5 sm:p-6 pt-4">
          <PrimaryCta href={`/try/${course.slug}`}>Preview Lesson 1 — free</PrimaryCta>
          <Link href={`/diagnostic?subject=${course.slug}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm border-2 transition-all hover:bg-slate-50"
            style={{ borderColor: `${BRAND}25`, color: "#334155" }}>
            {isWork ? "Check your skills — free" : "Get your free skill report"}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Segmented lane toggle — sliding blue thumb, keyboard + ARIA ──────────────
type Lane = "work" | "career";

function LaneToggle({
  value, onChange, workCount, careerCount,
}: {
  value: Lane; onChange: (l: Lane) => void; workCount: number; careerCount: number;
}) {
  const order: Lane[] = ["work", "career"];
  const activeIndex = order.indexOf(value);

  const TABS: { key: Lane; label: string; sub: string; count: number; icon: ReactNode }[] = [
    {
      key: "work", label: "AI for your work", sub: "No code", count: workCount,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      ),
    },
    {
      key: "career", label: "Career tracks", sub: "Code", count: careerCount,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
  ];

  function onKeyDown(e: ReactKeyboardEvent) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = order[(activeIndex + dir + order.length) % order.length];
      onChange(next);
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Choose a course lane"
      onKeyDown={onKeyDown}
      className="relative grid grid-cols-2 w-full max-w-md mx-auto p-1 rounded-full bg-white"
      style={{ border: "1.5px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px -12px rgba(0,86,206,0.18)" }}
    >
      {/* Sliding thumb */}
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-full will-change-transform motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out"
        style={{
          width: "calc(50% - 4px)",
          transform: activeIndex === 1 ? "translateX(100%)" : "translateX(0)",
          background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)",
          boxShadow: "0 6px 16px -6px rgba(0,86,206,0.6)",
        }}
      />
      {TABS.map((t) => {
        const isActive = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(t.key)}
            className="relative z-10 flex items-center justify-center gap-2 rounded-full px-3 py-2.5 sm:py-3 text-sm font-bold transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0056CE]"
            style={{ color: isActive ? "#FFFFFF" : "#64748B", cursor: "pointer", touchAction: "manipulation" }}
          >
            <span className={isActive ? "text-white" : "text-slate-400"}>{t.icon}</span>
            <span className="flex items-baseline gap-1.5">
              <span className="whitespace-nowrap">{t.label}</span>
              <span
                className="hidden sm:inline text-[10px] font-black tabular-nums px-1.5 py-0.5 rounded-full leading-none"
                style={{ background: isActive ? "rgba(255,255,255,0.22)" : "#F1F5F9", color: isActive ? "#FFFFFF" : "#0056CE" }}
              >
                {t.count}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export function CourseGridSection({ courses: allCourses }: { courses: Course[] }) {
  const engineering = allCourses.filter((c) => !WORK_LANE_SLUGS.has(c.slug));
  const work = allCourses.filter((c) => WORK_LANE_SLUGS.has(c.slug));
  const hasWork = work.length > 0;

  const sectionRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Course | null>(null);
  const [visible, setVisible] = useState(false);
  const [lane, setLane] = useState<Lane>("work"); // no-code leads

  const activeCourses = lane === "work" ? work : engineering;
  const isWork = lane === "work";

  useEffect(() => {
    if (!sectionRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.05 }
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-14 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
      style={{
        background: `
          radial-gradient(ellipse 900px 500px at 20% 20%, rgba(0,86,206,0.08), transparent 60%),
          radial-gradient(ellipse 800px 500px at 80% 80%, rgba(14,165,233,0.07), transparent 60%),
          radial-gradient(ellipse 700px 500px at 50% 50%, rgba(0,86,206,0.05), transparent 60%),
          linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
        `,
      }}
    >
      <div className="hidden sm:block pointer-events-none absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-30 animate-blob-1"
        style={{ background: "radial-gradient(circle, rgba(0,86,206,0.15) 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="hidden sm:block pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[500px] rounded-full opacity-25 animate-blob-2"
        style={{ background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)", filter: "blur(90px)" }} />

      <div className="relative max-w-7xl mx-auto">
        {/* ═══ Header ══════════════════════════════════════════════════════ */}
        <div className="text-center mb-6 sm:mb-8">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">The Curriculum</span>
          <h2 className="mt-3 sm:mt-4 font-black tracking-tight text-slate-900 leading-[0.95]" style={{ fontSize: "clamp(28px, 6vw, 80px)" }}>
            {isWork ? <>{work.length} role tracks.</> : <>{engineering.length} subjects.</>}
            <br />
            <span style={{ background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {isWork ? "Get more from AI at work." : "One path to hired."}
            </span>
          </h2>
        </div>

        {/* ═══ Lane toggle ═════════════════════════════════════════════════ */}
        {hasWork && (
          <div className="mb-4 sm:mb-5">
            <LaneToggle value={lane} onChange={setLane} workCount={work.length} careerCount={engineering.length} />
          </div>
        )}

        {/* Lane subline — swaps with selection */}
        <p key={`sub-${lane}`} className="text-center text-xs sm:text-base text-slate-600 max-w-xl mx-auto mb-8 sm:mb-12 motion-safe:animate-fade-in-up">
          {isWork
            ? "Practise on real work scenarios in your role — graded by Nova, our AI tutor. No programming."
            : "Every course built around a real career outcome — with the salary to prove it."}
        </p>

        {/* ═══ Active lane grid — crossfades on switch (keyed) ═════════════ */}
        <div role="tabpanel" aria-live="polite">
          <div key={`m-${lane}`} className="grid grid-cols-1 gap-2.5 sm:hidden motion-safe:animate-fade-in-up">
            {activeCourses.map((course, i) => (
              <MobileCourseCard key={course.id} course={course} index={i} isVisible={visible} isWork={isWork} onSelect={setSelected} />
            ))}
          </div>
          <div key={`d-${lane}`} className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6 xl:gap-4 motion-safe:animate-fade-in-up">
            {activeCourses.map((course, i) => (
              <DesktopCourseCard key={course.id} course={course} index={i} isVisible={visible} isWork={isWork} onSelect={setSelected} />
            ))}
          </div>
        </div>

        {/* Bottom callout — one skill check for both */}
        <div className="mt-14 sm:mt-24 flex flex-col items-center gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-slate-500 text-center max-w-md">
            Not sure which track is right for you?{" "}
            <span className="font-semibold text-slate-700">The free 3-minute skill check shows you.</span>
          </p>
          <PrimaryCta href="/skill-check">Get your free skill report</PrimaryCta>
        </div>
      </div>

      {selected && <CourseExplorer course={selected} isWork={WORK_LANE_SLUGS.has(selected.slug)} onClose={() => setSelected(null)} />}
    </section>
  );
}
