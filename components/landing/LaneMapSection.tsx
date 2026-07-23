"use client";

import { useEffect, useRef, useState } from "react";
import { Code2, Briefcase } from "lucide-react";
import { PrimaryCta } from "@/components/ui/primary-cta";
import { WORK_LANE_SLUGS } from "@/lib/work-lanes";
import { CourseExplorer, type Course } from "@/components/landing/CourseGridSection";

// ═══════════════════════════════════════════════════════════════════════════════
// "Two ways in" lane map — the course showcase straight after the hero.
// The two lane cards sit centre; every course fans out from its card on thin
// blue connector lines (career → left, work → right), so a visitor sees the
// ENTIRE catalog and its two-lane structure in one glance. Clicking any course
// chip opens the shared CourseExplorer modal (role, projects, CTA).
// Mobile: the lines don't survive a narrow viewport, so each card simply
// stacks above its chips as wrapped pills.
// ═══════════════════════════════════════════════════════════════════════════════

const BLUE_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

type Path = { d: string };

function LaneCard({ lane, count }: { lane: "career" | "work"; count: number }) {
  const filled = lane === "career";
  const Icon = filled ? Code2 : Briefcase;
  if (filled) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-4 h-full"
        style={{
          background: "linear-gradient(150deg, #2E7BF0 0%, #0056CE 55%, #01224F 100%)",
          boxShadow: "0 1px 2px rgba(15,28,49,0.06), 0 20px 44px -20px rgba(0,86,206,0.55)",
        }}
      >
        <span aria-hidden className="pointer-events-none absolute -top-14 -right-10 w-40 h-40 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)" }} />
        <span className="w-12 h-12 rounded-[14px] flex items-center justify-center text-white shrink-0"
          style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.28)" }}>
          <Icon size={22} strokeWidth={2.1} aria-hidden />
        </span>
        <span className="flex-1 min-w-0 text-left">
          <span className="block text-[15px] font-black text-white leading-tight">Build a career in AI</span>
          <span className="block mt-1 text-[12px] font-medium leading-snug" style={{ color: "#BFD9FF" }}>
            {count} engineering &amp; data tracks — graded projects, real roles
          </span>
        </span>
      </div>
    );
  }
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5 flex items-center gap-4 h-full"
      style={{
        background: "linear-gradient(180deg, #EFF5FF 0%, #FFFFFF 60%)",
        borderColor: "#D8E7FC",
        boxShadow: "0 1px 2px rgba(15,28,49,0.05), 0 18px 40px -24px rgba(15,28,49,0.20)",
      }}
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: "linear-gradient(90deg, #3388FF, #0056CE)" }} />
      <span className="w-12 h-12 rounded-[14px] flex items-center justify-center text-white shrink-0"
        style={{ background: BLUE_GRADIENT, boxShadow: "0 8px 18px -8px rgba(0,86,206,0.6)" }}>
        <Icon size={22} strokeWidth={2.1} aria-hidden />
      </span>
      <span className="flex-1 min-w-0 text-left">
        <span className="block text-[15px] font-black text-slate-900 leading-tight">AI for your work — no&nbsp;code</span>
        <span className="block mt-1 text-[12px] font-medium text-slate-500 leading-snug">
          {count} role tracks — marketing, finance, founders &amp; more
        </span>
      </span>
    </div>
  );
}

function Chip({
  course, align, onSelect, chipRef,
}: {
  course: Course; align: "right" | "left"; onSelect: (c: Course) => void;
  chipRef: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={chipRef}
      onClick={() => onSelect(course)}
      className={`group inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 transition-all motion-safe:hover:-translate-y-px hover:text-brand ${align === "right" ? "self-end" : "self-start"}`}
      style={{ borderColor: "#D8E7FC", boxShadow: "0 1px 2px rgba(15,28,49,0.04)" }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0 transition-colors" style={{ background: "#8FB8F1" }} aria-hidden />
      {course.title}
    </button>
  );
}

export function LaneMapSection({ courses }: { courses: Course[] }) {
  const career = courses.filter((c) => !WORK_LANE_SLUGS.has(c.slug));
  const work = courses.filter((c) => WORK_LANE_SLUGS.has(c.slug));

  const containerRef = useRef<HTMLDivElement>(null);
  const careerCardRef = useRef<HTMLDivElement>(null);
  const workCardRef = useRef<HTMLDivElement>(null);
  const chipEls = useRef<Record<string, HTMLButtonElement | null>>({});

  const [paths, setPaths] = useState<Path[]>([]);
  const [selected, setSelected] = useState<Course | null>(null);
  const [visible, setVisible] = useState(false);

  // Measure card + chip positions → cubic-bezier connector paths. Re-measured
  // on any container resize so the lines track the layout exactly.
  useEffect(() => {
    const cont = containerRef.current;
    if (!cont) return;

    const measure = () => {
      if (!window.matchMedia("(min-width: 1024px)").matches) { setPaths([]); return; }
      const cRect = cont.getBoundingClientRect();
      if (cRect.width === 0) return;
      const next: Path[] = [];
      const connect = (cardEl: HTMLElement | null, chipList: Course[], side: "left" | "right") => {
        if (!cardEl) return;
        const f = cardEl.getBoundingClientRect();
        const x1 = (side === "left" ? f.left : f.right) - cRect.left;
        const y1 = f.top + f.height / 2 - cRect.top;
        for (const c of chipList) {
          const el = chipEls.current[c.slug];
          if (!el) continue;
          const t = el.getBoundingClientRect();
          const x2 = (side === "left" ? t.right : t.left) - cRect.left;
          const y2 = t.top + t.height / 2 - cRect.top;
          const mx = (x1 + x2) / 2;
          next.push({ d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}` });
        }
      };
      connect(careerCardRef.current, career, "left");
      connect(workCardRef.current, work, "right");
      setPaths(next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(cont);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses.length]);

  // Draw the lines in when the section scrolls into view.
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8"
      style={{
        background:
          "radial-gradient(ellipse 900px 500px at 50% 0%, rgba(0,86,206,0.06), transparent 60%)," +
          "linear-gradient(180deg, #FFFFFF 0%, #F7FAFF 100%)",
      }}
    >
      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 lg:mb-14">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-400 font-bold">
            Two ways in · one membership
          </span>
          <h2 className="mt-3 font-black tracking-tight text-slate-900 leading-[1.0]"
            style={{ fontSize: "clamp(26px, 4.4vw, 52px)" }}>
            {courses.length} courses.{" "}
            <span style={{ background: BLUE_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Pick your lane.
            </span>
          </h2>
          <p className="mt-3 text-xs sm:text-base text-slate-600 max-w-xl mx-auto">
            Every course graded by Nova. Tap any course to see what you&apos;ll build.
          </p>
        </div>

        {/* ── Desktop: the map — chips fan out from each lane card ─────────── */}
        <div ref={containerRef} className="relative hidden lg:grid grid-cols-[220px_1fr_1fr_220px] gap-x-12 items-center">
          {/* Connector lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
            {paths.map((p, i) => (
              <path
                key={i}
                d={p.d}
                fill="none"
                stroke="#3388FF"
                strokeWidth="1.5"
                strokeOpacity="0.38"
                strokeLinecap="round"
                pathLength={1}
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: visible ? 0 : 1,
                  transition: `stroke-dashoffset 800ms cubic-bezier(0.2,0.7,0.2,1) ${i * 55}ms`,
                }}
              />
            ))}
          </svg>

          {/* Career chips — right-aligned toward their card */}
          <div className="relative flex flex-col gap-2.5 items-end">
            {career.map((c) => (
              <Chip key={c.id} course={c} align="right" onSelect={setSelected}
                chipRef={(el) => { chipEls.current[c.slug] = el; }} />
            ))}
          </div>

          {/* The two lane cards — a lane with no courses (DB fallback) renders nothing */}
          <div ref={careerCardRef} className="relative z-10 self-center">
            {career.length > 0 && <LaneCard lane="career" count={career.length} />}
          </div>
          <div ref={workCardRef} className="relative z-10 self-center">
            {work.length > 0 && <LaneCard lane="work" count={work.length} />}
          </div>

          {/* Work chips — left-aligned toward their card */}
          <div className="relative flex flex-col gap-2.5 items-start">
            {work.map((c) => (
              <Chip key={c.id} course={c} align="left" onSelect={setSelected}
                chipRef={(el) => { chipEls.current[c.slug] = el; }} />
            ))}
          </div>
        </div>

        {/* ── Mobile / tablet: card stacked above its chips ─────────────────── */}
        <div className="lg:hidden space-y-8">
          {career.length > 0 && (
            <div>
              <LaneCard lane="career" count={career.length} />
              <div className="mt-3.5 flex flex-wrap gap-2">
                {career.map((c) => (
                  <Chip key={c.id} course={c} align="left" onSelect={setSelected} chipRef={() => {}} />
                ))}
              </div>
            </div>
          )}
          {work.length > 0 && (
            <div>
              <LaneCard lane="work" count={work.length} />
              <div className="mt-3.5 flex flex-wrap gap-2">
                {work.map((c) => (
                  <Chip key={c.id} course={c} align="left" onSelect={setSelected} chipRef={() => {}} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA — same single funnel entry */}
        <div className="mt-12 lg:mt-16 flex flex-col items-center gap-3.5">
          <p className="text-xs sm:text-sm text-slate-500 text-center max-w-md">
            Not sure which lane is yours?{" "}
            <span className="font-semibold text-slate-700">The free 3-minute skill check tells you.</span>
          </p>
          <PrimaryCta href="/diagnostic">Take the free 3-min skill check</PrimaryCta>
        </div>
      </div>

      {selected && (
        <CourseExplorer course={selected} isWork={WORK_LANE_SLUGS.has(selected.slug)} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
