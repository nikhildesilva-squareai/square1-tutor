"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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
  "generative-ai":           { role: "AI Engineer",            salary: "$130–200k", projects: ["AI Chatbot", "RAG Pipeline", "Research Agent"] },
  "machine-learning":        { role: "ML Engineer",            salary: "$140–220k", projects: ["House Price Predictor", "Image Classifier", "Fraud Detector"] },
  "artificial-intelligence": { role: "AI Engineer",            salary: "$130–200k", projects: ["Pathfinding Visualiser", "Game AI", "Decision Engine"] },
  "cybersecurity":           { role: "Cybersecurity Engineer",  salary: "$110–180k", projects: ["Vulnerability Scanner", "Password Auditor", "Secure Auth"] },
  "computer-vision":         { role: "CV Engineer",            salary: "$120–180k", projects: ["Face Detection", "OCR App", "Object Tracker"] },
  "game-development":        { role: "Game Developer",         salary: "$80–150k",  projects: ["2D Platformer", "AI Enemy System", "Multiplayer Game"] },
  "fullstack-development":   { role: "Full Stack Engineer",    salary: "$100–160k", projects: ["SaaS App", "Real-time Chat", "Payment System"] },
  "drone-technology":        { role: "Drone Engineer",         salary: "$115–185k", projects: ["Autonomous Flight", "Aerial Vision AI", "Swarm Controller"] },
  "data-science":            { role: "Data Scientist",         salary: "$115–185k", projects: ["Cohort Analysis", "A/B Test Lab", "Sales Forecaster"] },
  "llm-agent-architect":     { role: "Agent Architect",        salary: "$150–250k", projects: ["Tool-use Agent", "Multi-agent System", "Autonomous Workflow"] },
  "ai-product-management":   { role: "AI Product Manager",     salary: "$140–220k", projects: ["AI Product Spec", "Go-to-Market Plan", "User Research Report"] },
  "devops-engineering":      { role: "DevOps Engineer",        salary: "$120–190k", projects: ["CI/CD Pipeline", "K8s Deployment", "Monitoring Stack"] },
  "default":                 { role: "Software Engineer",      salary: "$90–150k",  projects: ["Starter Project", "Mid-level Project", "Capstone"] },
};

function getMeta(slug: string): CourseMeta {
  return META[slug] ?? META.default;
}

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
      className="relative group rounded-2xl p-4 transition-all duration-500 will-change-transform border overflow-hidden block w-full text-left"
      style={{
        background: `linear-gradient(135deg, ${course.color}10 0%, #FFFFFF 60%, ${course.color}06 100%)`,
        borderColor: `${course.color}25`,
        boxShadow: `0 4px 16px ${course.color}10`,
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
          style={{ background: `${course.color}15`, color: course.color }}
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
            <path d="M2 6h7M6 3l3 3-3 3" stroke={course.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[10px] font-bold" style={{ color: course.color }}>
            {meta.role}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[9px] text-slate-400">
          <span><span className="font-bold text-slate-600">{course.total_lessons}</span> lessons</span>
          <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
          <span><span className="font-bold text-slate-600">{course.total_projects}</span> projects</span>
        </div>
      </div>

      {/* Thin accent line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${course.color}40, ${course.color}10)` }} />
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
      className="relative group rounded-3xl p-6 lg:p-7 transition-all duration-700 will-change-transform border overflow-hidden block w-full text-left"
      style={{
        background: `
          linear-gradient(135deg, ${course.color}14 0%, #FFFFFF 50%, ${course.color}08 100%),
          radial-gradient(circle at top right, ${course.color}10, transparent 60%)
        `,
        borderColor: `${course.color}30`,
        boxShadow: `0 10px 32px ${course.color}15, 0 0 0 1px ${course.color}10 inset`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${index * 90}ms`,
      }}
    >
      {/* Decorative blob top-right */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-50"
        style={{ background: `radial-gradient(circle, ${course.color}30 0%, transparent 70%)`, filter: "blur(16px)" }} />

      {/* Top badge */}
      <div className="relative flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="relative flex items-center justify-center">
            <span className="absolute w-2.5 h-2.5 rounded-full animate-ping opacity-50" style={{ background: course.color }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: course.color }} />
          </span>
          <span className="text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: course.color }}>
            {course.status !== "active" ? "Coming Soon" : "Course"}
          </span>
        </div>
        <span
          className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full"
          style={{ background: `${course.color}20`, color: course.color }}
        >
          {meta.salary}
        </span>
      </div>

      {/* Course title */}
      <h3 className="relative text-2xl lg:text-3xl font-black text-slate-900 leading-tight mb-2"
        style={{ letterSpacing: "-0.02em" }}>
        {course.title}
      </h3>

      {/* Blurb */}
      <p className="relative text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed line-clamp-2">
        {course.description}
      </p>

      {/* Sample projects */}
      <div className="relative space-y-1.5 mb-5">
        {meta.projects.map((p, i) => (
          <div
            key={p}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-white/60"
            style={{ borderColor: `${course.color}20` }}
          >
            <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color: course.color }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-700">{p}</span>
          </div>
        ))}
      </div>

      {/* Schedule line */}
      <div className="relative flex items-center gap-3 mb-4 text-[10px] text-slate-500">
        <span><span className="font-bold text-slate-700 tabular-nums">{course.total_lessons}</span> lessons</span>
        <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
        <span><span className="font-bold text-slate-700 tabular-nums">{course.total_projects}</span> projects</span>
      </div>

      {/* Bottom — career role + popularity bar */}
      <div className="relative pt-4 border-t" style={{ borderColor: `${course.color}15` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
              <path d="M2 6h7M6 3l3 3-3 3" stroke={course.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] sm:text-[11px] font-bold truncate" style={{ color: course.color }}>
              {meta.role}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            AI-graded track
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: `${course.color}15` }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: isVisible ? "100%" : "0%",
              background: `linear-gradient(90deg, ${course.color}, ${course.color}cc)`,
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
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Accent header */}
        <div className="p-6 sm:p-7" style={{ background: `linear-gradient(135deg, ${course.color}14, #fff)` }}>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-2xl">{course.icon}</span>
              <h3 className="mt-2 text-2xl font-black text-slate-900 leading-tight">{course.title}</h3>
              <p className="text-sm font-semibold mt-1" style={{ color: course.color }}>
                {meta.role} · <span style={{ color: "#10B981" }}>{meta.salary}</span>
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-slate-400" aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-7 pt-5">
          <p className="text-sm text-slate-600 leading-relaxed mb-5">{course.description}</p>

          <p className="text-[10px] tracking-widest uppercase font-bold text-slate-400 mb-3">Real projects you&apos;ll ship</p>
          <div className="space-y-2 mb-6">
            {meta.projects.map((p, i) => (
              <div key={p} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-slate-50/60" style={{ borderColor: `${course.color}20` }}>
                <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color: course.color }}>{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm font-semibold text-slate-700">{p}</span>
              </div>
            ))}
            <p className="text-[11px] text-slate-400 pt-1">+ {Math.max(0, course.total_projects - meta.projects.length)} more · {course.total_lessons} lessons</p>
          </div>

          {/* Two next steps */}
          <div className="flex flex-col gap-2.5">
            <Link href={`/try/${course.slug}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-bold text-sm hover:-translate-y-0.5 transition-transform"
              style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)", boxShadow: "0 12px 32px rgba(0,86,206,0.25)" }}>
              Preview Lesson 1 — free →
            </Link>
            <Link href={`/diagnostic?subject=${course.slug}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border-2 transition-all hover:bg-slate-50"
              style={{ borderColor: `${course.color}30`, color: "#334155" }}>
              Get your free skill report
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export function CourseGridSection({ courses }: { courses: Course[] }) {
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

      <div className="relative max-w-6xl mx-auto">
        {/* Heading — tighter on mobile */}
        <div className="text-center mb-8 sm:mb-16">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            The Curriculum
          </span>
          <h2 className="mt-3 sm:mt-4 font-black tracking-tight text-slate-900 leading-[0.95]"
            style={{ fontSize: "clamp(28px, 6vw, 80px)" }}>
            12 subjects.
            <br />
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
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
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
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
          <Link
            href="/diagnostic"
            className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full text-white font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            style={{
              background: "linear-gradient(135deg, #0056CE 0%, #4F46E5 100%)",
              boxShadow: "0 12px 32px rgba(0,86,206,0.30)",
            }}
          >
            Get your free skill report →
          </Link>
        </div>
      </div>

      {/* Inline explorer */}
      {selected && <CourseExplorer course={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
