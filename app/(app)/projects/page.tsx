import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { CSSProperties } from "react";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface CourseRow { id: string; slug: string; title: string; color: string }
interface ProjectRow {
  id: string; title: string; description_md: string; difficulty: string;
  estimated_hours: number; tech_stack: string[]; requirements: string[];
  course_id: string; order_index: number;
}
interface SubmissionRow { project_id: string; score: number | null; max_score: number }

const DIFF_DOT: Record<string, string> = {
  beginner: "#22C55E", intermediate: "#F59E0B", advanced: "#EF4444",
};

/* ─── Score ring (completed projects) ───────────────────────────────────── */
function ScoreRing({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.min(1, score / max) : 0;
  const r = 18, c = 2 * Math.PI * r, off = c * (1 - pct);
  return (
    <div className="relative h-11 w-11 shrink-0">
      <svg width="44" height="44" className="-rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--color-surface-alt)" strokeWidth="4" />
        <circle cx="22" cy="22" r={r} fill="none" stroke="#19A65F" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[12px] font-extrabold text-emerald-600">{score}</span>
    </div>
  );
}

/* ─── Project card — cover + status + hover effects ─────────────────────── */
function ProjectCard({ project, number, color, sub, unlocked, lessonsComplete }: {
  project: ProjectRow; number: number; color: string;
  sub: SubmissionRow | undefined; unlocked: boolean; lessonsComplete: number;
}) {
  const hasScore = !!sub && sub.score !== null;
  const diffColor = DIFF_DOT[project.difficulty] ?? "#F59E0B";
  const accStyle = { "--acc": color } as CSSProperties;

  const cover = (
    <div className="relative h-24 overflow-hidden"
      style={{ background: unlocked ? `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 55%, #000))` : "linear-gradient(135deg, #64748B, #334155)" }}>
      {/* dot texture, faded toward the lower-left */}
      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-50"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.25) 1px, transparent 1.4px)", backgroundSize: "16px 16px", WebkitMaskImage: "radial-gradient(80% 100% at 80% 0, #000, transparent 75%)", maskImage: "radial-gradient(80% 100% at 80% 0, #000, transparent 75%)" }} />
      {/* shine sweep on hover */}
      {unlocked && (
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-[-60%] w-2/5 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent transition-[left] duration-700 group-hover:left-[130%]" />
      )}
      <span className="absolute left-4 top-3.5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/30 bg-white/20 text-white backdrop-blur-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 18 6-6-6-6M8 6l-6 6 6 6" /></svg>
      </span>
      <span className="pointer-events-none absolute -bottom-2 right-4 select-none text-[58px] font-black leading-none text-white/20">{number}</span>
      {hasScore ? (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>Completed
        </span>
      ) : unlocked ? (
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-ink">Open</span>
      ) : (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-slate-900/55 px-2.5 py-1 text-[11px] font-bold text-white">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>Locked
        </span>
      )}
    </div>
  );

  const body = (
    <div className="flex flex-1 flex-col p-4">
      <h3 className="mb-2.5 text-[15px] font-bold leading-snug tracking-tight text-ink">{project.title}</h3>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {project.tech_stack.slice(0, 3).map((t) => (
          <span key={t} className="rounded-full bg-surface-alt px-2.5 py-[3px] text-[10.5px] font-semibold text-ink-secondary">{t}</span>
        ))}
      </div>
      <div className="mb-3.5 flex items-center gap-4 text-[11.5px] text-ink-muted">
        <span className="flex items-center gap-1.5 capitalize"><span className="h-2.5 w-2.5 rounded-full" style={{ background: diffColor }} />{project.difficulty}</span>
        <span className="flex items-center gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>{project.estimated_hours}h</span>
      </div>
      <div className="mt-auto">
        {hasScore ? (
          <div className="flex items-center gap-3">
            <ScoreRing score={sub!.score!} max={sub!.max_score} />
            <span className="text-[13px] font-bold text-brand group-hover:underline">View project →</span>
          </div>
        ) : unlocked ? (
          <span className="inline-flex h-[38px] items-center gap-2 rounded-[10px] px-4 text-[13px] font-bold text-white shadow-[0_8px_18px_-8px_var(--acc)]" style={{ background: color }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4" /></svg>Start project
          </span>
        ) : (() => {
          const threshold = project.difficulty === "intermediate" ? 10 : 25;
          const remaining = Math.max(0, threshold - lessonsComplete);
          const pct = Math.min(100, (lessonsComplete / threshold) * 100);
          return (
            <div>
              <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} /></div>
              <div className="text-[11px] font-semibold text-ink-muted tabular-nums">{remaining} more {remaining === 1 ? "lesson" : "lessons"} to unlock</div>
            </div>
          );
        })()}
      </div>
    </div>
  );

  const base = "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-200";
  if (unlocked) {
    return (
      <Link href={`/projects/${project.id}`} style={accStyle}
        className={`${base} hover:-translate-y-1.5 hover:border-[var(--acc)] hover:shadow-[0_20px_40px_-24px_var(--acc)]`}>
        {cover}
        {body}
      </Link>
    );
  }
  return (
    <div style={accStyle} className={`${base} opacity-70 saturate-[0.6]`}>
      {cover}
      {body}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
  const { data: enrollments } = await supabase.from("student_enrollments").select("course_id").eq("student_id", student?.id ?? "").eq("status", "active");
  const enrolledCourseIds = (enrollments ?? []).map((e) => e.course_id);

  /* ── NOT ENROLLED — Showcase that sells the dream ───────────────── */
  if (enrolledCourseIds.length === 0) {
    const [{ data: allCourses }, { data: allProjects }] = await Promise.all([
      supabase.from("courses").select("id, slug, title, color").eq("status", "active").order("title") as unknown as Promise<{ data: CourseRow[] | null }>,
      supabase.from("projects").select("id, title, description_md, difficulty, estimated_hours, tech_stack, requirements, course_id, order_index").order("order_index", { ascending: true }) as unknown as Promise<{ data: ProjectRow[] | null }>,
    ]);

    const allCourseList = allCourses ?? [];
    const allProjectList = allProjects ?? [];
    const totalProjectCount = allProjectList.length;

    // Group by course and get capstone (last project)
    const byCourse = new Map<string, ProjectRow[]>();
    for (const p of allProjectList) { const l = byCourse.get(p.course_id) ?? []; l.push(p); byCourse.set(p.course_id, l); }

    // Get capstones (the most impressive project per course)
    const capstones: (ProjectRow & { courseTitle: string; courseColor: string; courseSlug: string; projectCount: number })[] = [];
    for (const course of allCourseList) {
      const projects = byCourse.get(course.id) ?? [];
      const capstone = projects[projects.length - 1];
      if (capstone) {
        capstones.push({ ...capstone, courseTitle: course.title, courseColor: course.color, courseSlug: course.slug, projectCount: projects.length });
      }
    }

    return (
      <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden mb-8" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)" }}>
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-rule='evenodd'%3E%3Cpath d='M0 0h1v40H0V0zm39 0h1v40h-1V0zM0 0h40v1H0V0zm0 39h40v1H0v-1z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
          <div className="relative p-8 sm:p-10">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Project Lab</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
              Build what companies<br />actually hire for.
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-lg mb-6">
              {totalProjectCount} real projects across {allCourseList.length} tech disciplines. From your first API to a production SaaS — every project is AI code-reviewed and ships to your portfolio.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link href="/courses" className="h-11 px-6 rounded-xl bg-white text-[#0F172A] font-bold text-sm hover:bg-white/90 transition-all inline-flex items-center gap-2">
                Start Free Assessment
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </Link>
              <div className="flex items-center gap-5 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  AI code review
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  Portfolio-ready
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── "What you'll build" — Featured capstones ────────── */}
        <div className="mb-8">
          <h2 className="text-lg font-black text-ink mb-1">What you&apos;ll build</h2>
          <p className="text-sm text-ink-muted mb-5">The capstone project from each course — this is what you ship by the end.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {capstones.map((cap) => (
              <Link key={cap.id} href={`/courses/${cap.courseSlug}`}
                className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md hover:scale-[1.01] transition-all duration-300">
                {/* Top accent line */}
                <div className="h-1" style={{ background: cap.courseColor }} />

                <div className="p-5">
                  {/* Course + count row */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: cap.courseColor }}>
                      {cap.courseTitle}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {cap.projectCount} projects
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-brand transition-colors leading-snug">
                    {cap.title}
                  </h3>

                  {/* Brief */}
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                    {cap.description_md.replace(/[#*`]/g, "").slice(0, 120)}
                  </p>

                  {/* Tech stack */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-4">
                    {cap.tech_stack.slice(0, 3).map((t: string) => (
                      <span key={t} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-200">{t}</span>
                    ))}
                    {cap.tech_stack.length > 3 && (
                      <span className="text-[10px] text-gray-400">+{cap.tech_stack.length - 3}</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        {cap.estimated_hours}h
                      </span>
                      <span className="capitalize flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: DIFF_DOT[cap.difficulty] ?? "#F59E0B" }} />
                        {cap.difficulty}
                      </span>
                    </div>
                    <span className="text-xs font-semibold group-hover:underline" style={{ color: cap.courseColor }}>
                      Start free
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="inline ml-1"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Journey: Beginner → Advanced progression ──────── */}
        <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 mb-8">
          <h2 className="text-lg font-black text-ink mb-1">Your progression</h2>
          <p className="text-sm text-ink-muted mb-6">Every course follows the same proven path.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { phase: "Foundation", count: "3-4 projects", desc: "Build core skills. REST APIs, basic UIs, data pipelines.", color: "#22C55E", icon: "M12 2L2 7l10 5 10-5-10-5z" },
              { phase: "Intermediate", count: "4-5 projects", desc: "Real complexity. Auth, real-time, testing, deployment.", color: "#F59E0B", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
              { phase: "Capstone", count: "2-3 projects", desc: "Production-grade. The project that gets you hired.", color: "#EF4444", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
            ].map((phase) => (
              <div key={phase.phase} className="text-center p-5 rounded-xl border border-border">
                <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${phase.color}15` }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={phase.color} strokeWidth="2" strokeLinecap="round"><path d={phase.icon} /></svg>
                </div>
                <p className="text-sm font-bold text-ink mb-0.5">{phase.phase}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: phase.color }}>{phase.count}</p>
                <p className="text-xs text-ink-muted leading-relaxed">{phase.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA ───────────────────────────────────── */}
        <div className="text-center py-6">
          <p className="text-sm text-ink-muted mb-4">Take a free assessment to unlock your personalised project roadmap.</p>
          <Link href="/courses" className="h-12 px-8 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/20 transition-all inline-flex items-center gap-2">
            Get Started Free
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </Link>
        </div>
      </div>
    );
  }

  /* ── ENROLLED ──────────────────────────────────────────────────────── */
  const [{ data: courses }, { data: projects }, { data: submissions }, { data: completions }] = await Promise.all([
    supabase.from("courses").select("id, slug, title, color").in("id", enrolledCourseIds).order("title") as unknown as Promise<{ data: CourseRow[] | null }>,
    supabase.from("projects").select("id, title, description_md, difficulty, estimated_hours, tech_stack, requirements, course_id, order_index").in("course_id", enrolledCourseIds).order("order_index", { ascending: true }) as unknown as Promise<{ data: ProjectRow[] | null }>,
    supabase.from("project_submissions").select("project_id, score, max_score").eq("student_id", student?.id ?? "") as unknown as Promise<{ data: SubmissionRow[] | null }>,
    supabase.from("lesson_completions").select("lesson_id, lessons!inner(course_id)").eq("student_id", student?.id ?? ""),
  ]);

  const completionsByCourse = new Map<string, number>();
  for (const c of completions ?? []) {
    const cid = (c as Record<string, unknown>).lessons as Record<string, string>;
    if (cid?.course_id) completionsByCourse.set(cid.course_id, (completionsByCourse.get(cid.course_id) ?? 0) + 1);
  }

  const courseList = courses ?? [];
  const projectList = projects ?? [];
  const subMap = new Map((submissions ?? []).map(s => [s.project_id, s]));

  const grouped = new Map<string, ProjectRow[]>();
  for (const p of projectList) { const l = grouped.get(p.course_id) ?? []; l.push(p); grouped.set(p.course_id, l); }

  function isUnlocked(project: ProjectRow): boolean {
    const done = completionsByCourse.get(project.course_id) ?? 0;
    if (project.difficulty === "beginner") return true;
    if (project.difficulty === "intermediate") return done >= 10;
    return done >= 25;
  }

  const totalProjects = projectList.length;
  const completedProjects = (submissions ?? []).filter(s => s.score !== null).length;

  return (
    <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      {/* Header — GitHub style */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-ink">Projects</h1>
          <p className="text-sm text-ink-muted mt-0.5">{completedProjects} of {totalProjects} completed</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search-style filter (visual only for now) */}
          <div className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-surface text-sm text-ink-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <span className="text-xs">Find a project...</span>
          </div>
        </div>
      </div>

      {/* Course sections */}
      {courseList.map((course) => {
        const courseProjects = grouped.get(course.id) ?? [];
        if (courseProjects.length === 0) return null;
        const completed = courseProjects.filter(p => subMap.has(p.id) && subMap.get(p.id)!.score !== null).length;
        const lessonsComplete = completionsByCourse.get(course.id) ?? 0;

        return (
          <div key={course.id} className="mb-8">
            {/* Course label — like GitHub org header */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
              <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: course.color }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20V2H6.5A2.5 2.5 0 014 4.5v15z" /></svg>
              </div>
              <span className="text-sm font-semibold text-ink">{course.title}</span>
              <span className="text-xs text-ink-muted">{completed}/{courseProjects.length}</span>
              <div className="flex-1" />
              <div className="flex items-center gap-1">
                <div className="w-16 h-1.5 rounded-full bg-surface-alt overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${courseProjects.length > 0 ? (completed/courseProjects.length)*100 : 0}%`, background: course.color }} />
                </div>
              </div>
            </div>

            {/* Project cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courseProjects.map((project, idx) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  number={idx + 1}
                  color={course.color || "#0056CE"}
                  sub={subMap.get(project.id)}
                  unlocked={isUnlocked(project)}
                  lessonsComplete={lessonsComplete}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
