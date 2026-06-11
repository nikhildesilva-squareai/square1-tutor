import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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
            <p className="text-sm text-slate-400 leading-relaxed max-w-lg mb-6">
              {totalProjectCount} real projects across {allCourseList.length} tech disciplines. From your first API to a production SaaS — every project is AI code-reviewed and ships to your portfolio.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link href="/courses" className="h-11 px-6 rounded-xl bg-white text-[#0F172A] font-bold text-sm hover:bg-white/90 transition-all inline-flex items-center gap-2">
                Start Free Assessment
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </Link>
              <div className="flex items-center gap-5 text-sm text-slate-400">
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

            {/* Project cards — GitHub repo card style */}
            <div className="space-y-0 border border-border rounded-xl overflow-hidden divide-y divide-border">
              {courseProjects.map((project) => {
                const sub = subMap.get(project.id);
                const hasScore = sub && sub.score !== null;
                const unlocked = isUnlocked(project);
                const globalIdx = courseProjects.indexOf(project);
                const diffColor = DIFF_DOT[project.difficulty] ?? "#F59E0B";

                return (
                  <div key={project.id} className={!unlocked ? "opacity-50" : ""}>
                    {unlocked ? (
                      <Link href={`/projects/${project.id}`}
                        className="flex items-start gap-4 px-5 py-4 bg-surface hover:bg-surface-soft transition-colors group">
                        {/* Left: project info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-brand group-hover:underline">{project.title}</h3>
                            {hasScore && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                {sub.score}/{sub.max_score}
                              </span>
                            )}
                            {!hasScore && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-alt text-ink-muted border border-border">
                                Open
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-muted line-clamp-1 mb-2.5 max-w-xl">
                            {project.description_md.replace(/[#*`]/g, "").slice(0, 140)}
                          </p>
                          {/* Meta row — GitHub style */}
                          <div className="flex items-center gap-4 text-[11px] text-ink-muted">
                            {/* Language dot + primary tech */}
                            {project.tech_stack[0] && (
                              <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full" style={{ background: diffColor }} />
                                {project.tech_stack[0]}
                              </span>
                            )}
                            {/* Additional tech */}
                            {project.tech_stack.slice(1, 3).map(t => (
                              <span key={t} className="hidden sm:inline">{t}</span>
                            ))}
                            {/* Hours */}
                            <span className="flex items-center gap-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                              {project.estimated_hours}h
                            </span>
                            {/* Difficulty */}
                            <span className="capitalize">{project.difficulty}</span>
                          </div>
                        </div>
                        {/* Right: action indicator */}
                        <div className="shrink-0 mt-1">
                          {hasScore ? (
                            <div className="flex items-center gap-1 text-emerald-600">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted group-hover:text-brand transition-colors"><polyline points="9 18 15 12 9 6" /></svg>
                          )}
                        </div>
                      </Link>
                    ) : (
                      /* Locked */
                      <div className="flex items-start gap-4 px-5 py-4 bg-surface">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-ink">{project.title}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-alt text-ink-muted border border-border flex items-center gap-1">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                              Locked
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted line-clamp-1 mb-2.5 max-w-xl">{project.description_md.replace(/[#*`]/g, "").slice(0, 140)}</p>
                          <div className="flex items-center gap-4 text-[11px] text-ink-muted">
                            {project.tech_stack[0] && (
                              <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full" style={{ background: diffColor }} />
                                {project.tech_stack[0]}
                              </span>
                            )}
                            <span>{project.estimated_hours}h</span>
                            <span className="capitalize">{project.difficulty}</span>
                            <span className="text-ink-muted">
                              {project.difficulty === "intermediate" ? `Need ${Math.max(0, 10 - lessonsComplete)} more lessons` : `Need ${Math.max(0, 25 - lessonsComplete)} more lessons`}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
