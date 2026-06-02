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

// ─── Career outcomes mapped by slug ───────────────────────────────────────────
type CareerMeta = {
  role:    string;
  salary:  string;
  blurb:   string;       // 1-line tagline for the role
  enrolled: number;      // social proof
};

const CAREER: Record<string, CareerMeta> = {
  "generative-ai":            { role: "AI Engineer",                  salary: "$130–200k", blurb: "Build LLM-powered products.",    enrolled: 1842 },
  "machine-learning":         { role: "ML Engineer",                  salary: "$140–220k", blurb: "Models that learn from data.",   enrolled: 1247 },
  "artificial-intelligence":  { role: "AI Engineer",                  salary: "$130–200k", blurb: "Intelligent systems & search.",  enrolled:  892 },
  "cybersecurity":            { role: "Cybersecurity Engineer",       salary: "$110–180k", blurb: "Defend the modern stack.",       enrolled: 1108 },
  "computer-vision":          { role: "Computer Vision Engineer",     salary: "$120–180k", blurb: "Teach machines to see.",         enrolled:  624 },
  "game-development":         { role: "Game Developer",               salary: "$80–150k",  blurb: "Ship games people play.",        enrolled:  738 },
  "frontend-development":     { role: "Frontend Engineer",            salary: "$90–150k",  blurb: "Build beautiful, fast UIs.",     enrolled: 1456 },
  "fullstack-development":    { role: "Full Stack Engineer",          salary: "$100–160k", blurb: "Ship complete web apps.",        enrolled: 1672 },
  /* fallback keys for unknown slugs */
  "default":                  { role: "Software Engineer",            salary: "$90–150k",  blurb: "Build real products.",           enrolled:  500 },
};

function getCareerMeta(slug: string): CareerMeta {
  return CAREER[slug] ?? CAREER.default;
}

// ─── Single course card ───────────────────────────────────────────────────────
function CourseCard({
  course,
  index,
  isVisible,
}: {
  course: Course;
  index: number;
  isVisible: boolean;
}) {
  const meta = getCareerMeta(course.slug);
  const isLocked = course.status !== "active" || course.slug === "#";
  const href = isLocked ? "#" : `/courses/${course.slug}`;

  return (
    <Link
      href={href}
      aria-disabled={isLocked}
      className="group relative block rounded-2xl border overflow-hidden transition-all duration-500 will-change-transform"
      style={{
        background: `
          linear-gradient(135deg, ${course.color}10 0%, #FFFFFF 50%, ${course.color}06 100%),
          #FFFFFF
        `,
        borderColor: `${course.color}25`,
        boxShadow: `0 4px 24px rgba(15,23,42,0.04), 0 0 0 1px ${course.color}08 inset`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${index * 80}ms`,
      }}
    >
      {/* Hover lift via separate transform layer */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-500 group-hover:scale-[1.02]"
        style={{ background: "transparent" }}
      />

      {/* Top accent bar — gets thicker on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-1 group-hover:h-1.5 transition-all"
        style={{ background: `linear-gradient(90deg, ${course.color}, ${course.color}aa)` }}
      />

      {/* Decorative blob in top-right */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full transition-opacity duration-500 opacity-40 group-hover:opacity-80"
        style={{
          background: `radial-gradient(circle, ${course.color}25 0%, transparent 70%)`,
          filter: "blur(20px)",
        }}
      />

      {/* CARD CONTENT */}
      <div className="relative p-6 sm:p-7 flex flex-col h-full min-h-[280px]">

        {/* Icon + Lock badge if locked */}
        <div className="flex items-start justify-between mb-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
            style={{
              background: `linear-gradient(135deg, ${course.color}20, ${course.color}08)`,
              boxShadow: `0 4px 16px ${course.color}20`,
            }}
          >
            {course.icon}
          </div>
          {isLocked ? (
            <span className="text-[9px] tracking-widest uppercase font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500">
              Coming Soon
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          )}
        </div>

        {/* Course title */}
        <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight mb-1.5 transition-colors group-hover:text-slate-900"
          style={{ letterSpacing: "-0.01em" }}>
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-500 mb-5 line-clamp-2 leading-relaxed">
          {course.description}
        </p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Career outcome row */}
        <div className="pt-4 border-t" style={{ borderColor: `${course.color}15` }}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                <path d="M2 6h7M6 3l3 3-3 3" stroke={course.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-xs sm:text-[13px] font-bold text-slate-900 truncate">
                {meta.role}
              </p>
            </div>
            <span
              className="text-[10px] sm:text-[11px] font-bold tabular-nums whitespace-nowrap px-2 py-0.5 rounded-full"
              style={{ color: course.color, background: `${course.color}12` }}
            >
              {meta.salary}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span><span className="font-bold text-slate-700 tabular-nums">{course.total_lessons}</span> lessons</span>
              <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
              <span><span className="font-bold text-slate-700 tabular-nums">{course.total_projects}</span> projects</span>
            </div>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="font-semibold text-slate-600 tabular-nums">{meta.enrolled.toLocaleString()}</span>
            </span>
          </div>
        </div>

        {/* Hover-reveal CTA strip at bottom */}
        <div
          className="absolute left-0 right-0 bottom-0 py-3 px-6 sm:px-7 flex items-center justify-between text-white text-xs sm:text-sm font-bold transition-all duration-400 translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100"
          style={{ background: `linear-gradient(90deg, ${course.color}, ${course.color}dd)` }}
        >
          <span>Start the assessment</span>
          <span className="text-base transition-transform group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export function CourseGridSection({ courses }: { courses: Course[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sectionRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
      style={{
        background: `
          radial-gradient(ellipse 900px 500px at 20% 20%, rgba(0,86,206,0.08), transparent 60%),
          radial-gradient(ellipse 800px 500px at 80% 80%, rgba(167,139,250,0.06), transparent 60%),
          radial-gradient(ellipse 700px 500px at 50% 50%, rgba(16,185,129,0.05), transparent 60%),
          linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
        `,
      }}
    >
      {/* Drifting accent blobs */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-30 animate-blob-1"
        style={{ background: "radial-gradient(circle, rgba(0,86,206,0.15) 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[500px] rounded-full opacity-25 animate-blob-2"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", filter: "blur(90px)" }} />

      <div className="relative max-w-6xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Curriculum
          </span>
          <h2 className="mt-4 font-black tracking-tight text-slate-900 leading-[0.95]"
            style={{ fontSize: "clamp(36px, 6vw, 80px)" }}>
            Eight subjects.
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
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Every course is built around a real career outcome — with the salary to prove it.
          </p>
        </div>

        {/* Course grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.5s ease" }}
        >
          {courses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} isVisible={visible} />
          ))}
        </div>

        {/* Bottom callout + CTA */}
        <div className="mt-14 sm:mt-20 flex flex-col items-center gap-4">
          <p className="text-sm text-slate-500 text-center max-w-md">
            Not sure which track is right for you?{" "}
            <span className="font-semibold text-slate-700">The assessment shows you in 30 minutes.</span>
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            style={{
              background: "linear-gradient(135deg, #0056CE 0%, #4F46E5 100%)",
              boxShadow: "0 12px 32px rgba(0,86,206,0.30)",
            }}
          >
            Find my track →
          </Link>
          <Link href="/courses" className="text-xs text-slate-500 hover:text-slate-700 transition-colors mt-1">
            or browse all 8 courses →
          </Link>
        </div>
      </div>
    </section>
  );
}
