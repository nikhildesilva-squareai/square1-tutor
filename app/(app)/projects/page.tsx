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

  /* ── NOT ENROLLED ──────────────────────────────────────────────────── */
  if (enrolledCourseIds.length === 0) {
    return (
      <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-ink">Projects</h1>
          <p className="text-sm text-ink-muted mt-1">Build real-world projects, get AI code review, ship to your portfolio.</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-alt flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
          </div>
          <h3 className="text-base font-bold text-ink mb-1">No projects yet</h3>
          <p className="text-sm text-ink-muted mb-5 max-w-xs mx-auto">Enrol in a course to unlock your project roadmap.</p>
          <Link href="/courses" className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand/90 transition-all">
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  /* ── ENROLLED ──────────────────────────────────────────────────────── */
  const { data: courses } = await supabase.from("courses").select("id, slug, title, color").in("id", enrolledCourseIds).order("title") as { data: CourseRow[] | null };
  const { data: projects } = await supabase.from("projects").select("id, title, description_md, difficulty, estimated_hours, tech_stack, requirements, course_id, order_index").in("course_id", enrolledCourseIds).order("order_index", { ascending: true }) as { data: ProjectRow[] | null };
  const { data: submissions } = await supabase.from("project_submissions").select("project_id, score, max_score").eq("student_id", student?.id ?? "") as { data: SubmissionRow[] | null };
  const { data: completions } = await supabase.from("lesson_completions").select("lesson_id, lessons!inner(course_id)").eq("student_id", student?.id ?? "");

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
