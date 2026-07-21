"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { PrimaryCta } from "@/components/ui/primary-cta";
import { CourseIcon } from "@/components/ui/course-icon";

type Course = {
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

function getMeta(slug: string): CourseMeta {
  return META[slug] ?? META.default;
}

const BRAND = "#0056CE";

// ─── Mobile card — compact tile ──────────────────────────────────────────────
function MobileCourseCard({
  course,
  index,
  isVisible,
  onSelect,
}: {
  course: Course;
  index: number;
  isVisible: boolean;
  onSelect: (c: Course) => void;
}) {
  const meta = getMeta(course.slug);

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
      {/* Top row: title + salary */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-black text-slate-900 leading-tight" style={{ letterSpacing: "-0.01em" }}>
          {course.title}
        </h3>
        <span
          className="text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-full shrink-0 mt-0.5"
          style={{ background: `${BRAND}15`, color: BRAND }}
        >
          {meta.salary}
        </span>
      </div>

      {/* Description — single line */}
      <p className="text-[11px] text-slate-500 leading-snug mb-3 line-clamp-1">
        {course.description}
      </p>

      {/* Bottom: role + stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0">
            <path d="M2 6h7M6 3l3 3-3 3" stroke={BRAND} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[10px] font-bold" style={{ color: BRAND }}>
            {meta.role}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[9px] text-slate-500">
          <span><span className="font-bold text-slate-600">{course.total_lessons}</span> lessons</span>
          <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
          <span><span className="font-bold text-slate-600">{course.total_projects}</span> projects</span>
        </div>
      </div>

      {/* Thin accent line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${BRAND}40, ${BRAND}10)` }} />
    </button>
  );
}

// ─── Desktop card — full rich card ───────────────────────────────────────────
function DesktopCourseCard({
  course,
  index,
  isVisible,
  onSelect,
}: {
  course: Course;
  index: number;
  isVisible: boolean;
  onSelect: (c: Course) => void;
}) {
  const meta = getMeta(course.slug);

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
      {/* Top badge */}
      <div className="relative flex items-center justify-between mb-5 xl:mb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND }} />
          <span className="text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: BRAND }}>
            {course.status !== "active" ? "Coming Soon" : "Course"}
          </span>
        </div>
        <span
          className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full"
          style={{ background: `${BRAND}15`, color: BRAND }}
        >
          {meta.salary}
        </span>
      </div>

      {/* Course title */}
      <h3 className="relative text-2xl lg:text-3xl xl:text-xl font-black text-slate-900 leading-tight mb-2"
        style={{ letterSpacing: "-0.02em" }}>
        {course.title}
      </h3>

      {/* Blurb */}
      <p className="relative text-xs sm:text-sm xl:text-xs text-slate-600 mb-5 xl:mb-3.5 leading-relaxed line-clamp-2">
        {course.description}
      </p>

      {/* Sample projects */}
      <div className="relative space-y-1.5 mb-5 xl:mb-3.5">
        {meta.projects.map((p, i) => (
          <div
            key={p}
            className="flex items-center gap-2.5 xl:gap-2 px-3 py-2 xl:px-2.5 xl:py-1.5 rounded-lg bg-slate-50/80 border border-slate-200/80"
          >
            <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color: BRAND }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-xs sm:text-sm xl:text-xs font-semibold text-slate-700 truncate">{p}</span>
          </div>
        ))}
      </div>

      {/* Schedule line */}
      <div className="relative flex items-center gap-3 mb-4 xl:mb-3 text-[10px] text-slate-500">
        <span><span className="font-bold text-slate-700 tabular-nums">{course.total_lessons}</span> lessons</span>
        <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
        <span><span className="font-bold text-slate-700 tabular-nums">{course.total_projects}</span> projects</span>
      </div>

      {/* Bottom — career role + progress bar */}
      <div className="relative pt-4 border-t" style={{ borderColor: `${BRAND}10` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
              <path d="M2 6h7M6 3l3 3-3 3" stroke={BRAND} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] sm:text-[11px] font-bold truncate" style={{ color: BRAND }}>
              {meta.role}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            AI-graded track
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

// ─── Inline explorer modal — opens when a course card is clicked ──────────────
function CourseExplorer({ course, onClose }: { course: Course; onClose: () => void }) {
  const meta = getMeta(course.slug);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(true, onClose, dialogRef);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={course.title}
        className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Accent header */}
        <div className="p-6 sm:p-7" style={{ background: `linear-gradient(135deg, ${BRAND}10, #fff)` }}>
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex w-11 h-11 rounded-xl items-center justify-center"
                style={{ background: `${course.color}15`, border: `1px solid ${course.color}30` }}>
                <CourseIcon slug={course.slug} color={course.color} />
              </span>
              <h3 className="mt-2 text-2xl font-black text-slate-900 leading-tight">{course.title}</h3>
              <p className="text-sm font-semibold mt-1" style={{ color: BRAND }}>
                {meta.role} · <span style={{ color: "#10B981" }}>{meta.salary}</span>
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-slate-500" aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-7 pt-5">
          <p className="text-sm text-slate-600 leading-relaxed mb-5">{course.description}</p>

          <p className="text-[10px] tracking-widest uppercase font-bold text-slate-500 mb-3">Real projects you&apos;ll ship</p>
          <div className="space-y-2 mb-6">
            {meta.projects.map((p, i) => (
              <div key={p} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-slate-50/60" style={{ borderColor: `${BRAND}15` }}>
                <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color: BRAND }}>{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm font-semibold text-slate-700">{p}</span>
              </div>
            ))}
            <p className="text-[11px] text-slate-500 pt-1">+ {Math.max(0, course.total_projects - meta.projects.length)} more · {course.total_lessons} lessons</p>
          </div>

          {/* Two next steps */}
          <div className="flex flex-col gap-2.5">
            <PrimaryCta href={`/try/${course.slug}`}>
              Preview Lesson 1 — free
            </PrimaryCta>
            <Link href={`/diagnostic?subject=${course.slug}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border-2 transition-all hover:bg-slate-50"
              style={{ borderColor: `${BRAND}25`, color: "#334155" }}>
              Get your free skill report
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Non-code work role-tracks live in their own WorkBlock section (they don't fit
// this grid's salary/role framing). Exclude them here so this stays the CAREER
// curriculum showcase and its count is correct.
const WORK_LANE_SLUGS = new Set([
  "ai-foundations", "ai-for-marketers", "ai-for-finance", "ai-for-creators",
  "ai-for-founders", "ai-for-teachers", "ai-for-project-managers", "ai-for-sales",
]);

// ─── Main section ─────────────────────────────────────────────────────────────
export function CourseGridSection({ courses: allCourses }: { courses: Course[] }) {
  const courses = allCourses.filter((c) => !WORK_LANE_SLUGS.has(c.slug));
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Course | null>(null);
  const [visible, setVisible] = useState(false);

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
      {/* Drifting accent blobs — hidden on mobile for performance */}
      <div className="hidden sm:block pointer-events-none absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-30 animate-blob-1"
        style={{ background: "radial-gradient(circle, rgba(0,86,206,0.15) 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="hidden sm:block pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[500px] rounded-full opacity-25 animate-blob-2"
        style={{ background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)", filter: "blur(90px)" }} />

      <div className="relative max-w-7xl mx-auto">
        {/* Heading — tighter on mobile */}
        <div className="text-center mb-8 sm:mb-16">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            The Curriculum
          </span>
          <h2 className="mt-3 sm:mt-4 font-black tracking-tight text-slate-900 leading-[0.95]"
            style={{ fontSize: "clamp(28px, 6vw, 80px)" }}>
            {courses.length} subjects.
            <br />
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              One path to hired.
            </span>
          </h2>
          <p className="mt-3 sm:mt-4 text-xs sm:text-base text-slate-600 max-w-xl mx-auto">
            Every course built around a real career outcome — with the salary to prove it.
          </p>
        </div>

        {/* ── MOBILE: Compact 2-col grid (visible only on small screens) ──── */}
        <div className="grid grid-cols-1 gap-2.5 sm:hidden">
          {courses.map((course, i) => (
            <MobileCourseCard key={course.id} course={course} index={i} isVisible={visible} onSelect={setSelected} />
          ))}
        </div>

        {/* ── DESKTOP: Full rich card grid (hidden on small screens) ──────── */}
        {/* 10 courses → xl shows 5 across = two clean rows (no orphan card) */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 lg:gap-6 xl:gap-4">
          {courses.map((course, i) => (
            <DesktopCourseCard key={course.id} course={course} index={i} isVisible={visible} onSelect={setSelected} />
          ))}
        </div>

        {/* Bottom callout */}
        <div className="mt-10 sm:mt-20 flex flex-col items-center gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-slate-500 text-center max-w-md">
            Not sure which track is right for you?{" "}
            <span className="font-semibold text-slate-700">The free 3-minute skill check shows you.</span>
          </p>
          <PrimaryCta href="/diagnostic">
            Get your free skill report
          </PrimaryCta>
        </div>
      </div>

      {/* Inline explorer */}
      {selected && <CourseExplorer course={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
