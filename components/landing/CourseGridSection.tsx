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
  enrolled: number;
  projects: string[];
};

const META: Record<string, CourseMeta> = {
  "generative-ai":           { role: "AI Engineer",            salary: "$130–200k", enrolled: 1842, projects: ["AI Chatbot", "RAG Pipeline", "Research Agent"] },
  "machine-learning":        { role: "ML Engineer",            salary: "$140–220k", enrolled: 1247, projects: ["House Price Predictor", "Image Classifier", "Fraud Detector"] },
  "artificial-intelligence": { role: "AI Engineer",            salary: "$130–200k", enrolled:  892, projects: ["Pathfinding Visualiser", "Game AI", "Decision Engine"] },
  "cybersecurity":           { role: "Cybersecurity Engineer", salary: "$110–180k", enrolled: 1108, projects: ["Vulnerability Scanner", "Password Auditor", "Secure Auth"] },
  "computer-vision":         { role: "Computer Vision Engineer", salary: "$120–180k", enrolled: 624, projects: ["Face Detection", "OCR App", "Object Tracker"] },
  "game-development":        { role: "Game Developer",         salary: "$80–150k",  enrolled:  738, projects: ["2D Platformer", "AI Enemy System", "Multiplayer Game"] },
  "frontend-development":    { role: "Frontend Engineer",      salary: "$90–150k",  enrolled: 1456, projects: ["Portfolio Site", "E-commerce UI", "Dashboard"] },
  "fullstack-development":   { role: "Full Stack Engineer",    salary: "$100–160k", enrolled: 1672, projects: ["SaaS App", "Real-time Chat", "Payment System"] },
  "drone-technology":        { role: "Drone / Robotics Engineer", salary: "$115–185k", enrolled: 542, projects: ["Autonomous Flight", "Aerial Vision AI", "Swarm Controller"] },
  "data-science":            { role: "Data Scientist",         salary: "$115–185k", enrolled: 1156, projects: ["Cohort Analysis", "A/B Test Lab", "Sales Forecaster"] },
  "default":                 { role: "Software Engineer",      salary: "$90–150k",  enrolled:  500, projects: ["Starter Project", "Mid-level Project", "Capstone"] },
};

function getMeta(slug: string): CourseMeta {
  return META[slug] ?? META.default;
}

// Highest enrollment for relative popularity bar
const MAX_ENROLLED = Math.max(...Object.values(META).map((m) => m.enrolled));

// ─── Single course card — matches TimelineSection card design ─────────────────
function CourseCard({
  course,
  index,
  isVisible,
}: {
  course: Course;
  index: number;
  isVisible: boolean;
}) {
  const meta = getMeta(course.slug);
  const isLocked = course.status !== "active" || course.slug === "#";
  const href = isLocked ? "#" : `/courses/${course.slug}`;
  const popularity = Math.round((meta.enrolled / MAX_ENROLLED) * 100);

  return (
    <Link
      href={href}
      aria-disabled={isLocked}
      className="relative group rounded-3xl p-6 lg:p-7 transition-all duration-700 will-change-transform border overflow-hidden block"
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
            {isLocked ? "Coming Soon" : "Course"}
          </span>
        </div>
        <span
          className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full"
          style={{ background: `${course.color}20`, color: course.color }}
        >
          {meta.salary}
        </span>
      </div>

      {/* Course title — big bold */}
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

      {/* Schedule line — lessons · projects */}
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
            <span className="tabular-nums">{meta.enrolled.toLocaleString()}</span> enrolled
          </span>
        </div>
        {/* Popularity bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: `${course.color}15` }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: isVisible ? `${popularity}%` : "0%",
              background: `linear-gradient(90deg, ${course.color}, ${course.color}cc)`,
              transitionDelay: `${index * 90 + 400}ms`,
            }}
          />
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
          radial-gradient(ellipse 800px 500px at 80% 80%, rgba(167,139,250,0.07), transparent 60%),
          radial-gradient(ellipse 700px 500px at 50% 50%, rgba(16,185,129,0.05), transparent 60%),
          linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
        `,
      }}
    >
      {/* Drifting accent blobs */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-30 animate-blob-1"
        style={{ background: "radial-gradient(circle, rgba(0,86,206,0.15) 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[500px] rounded-full opacity-25 animate-blob-2"
        style={{ background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)", filter: "blur(90px)" }} />

      <div className="relative max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            The Curriculum
          </span>
          <h2 className="mt-4 font-black tracking-tight text-slate-900 leading-[0.95]"
            style={{ fontSize: "clamp(36px, 6vw, 80px)" }}>
            8 subjects.
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
            Every course built around a real career outcome — with the salary to prove it.
          </p>
        </div>

        {/* 8 course cards — same grid as timeline (3 cols on lg) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {courses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} isVisible={visible} />
          ))}
        </div>

        {/* Bottom callout */}
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
        </div>
      </div>
    </section>
  );
}
