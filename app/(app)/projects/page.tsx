import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface CourseRow {
  id: string;
  slug: string;
  title: string;
  color: string;
}

interface ProjectRow {
  id: string;
  title: string;
  description_md: string;
  difficulty: string;
  estimated_hours: number;
  tech_stack: string[];
  requirements: string[];
  course_id: string;
  order_index: number;
}

interface SubmissionRow {
  project_id: string;
  score: number | null;
  max_score: number;
}

/* ─── Difficulty config ──────────────────────────────────────────────────── */
const DIFF: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  beginner:     { label: "Beginner",     color: "text-emerald-600", bg: "bg-emerald-50",  border: "border-emerald-200", dot: "bg-emerald-500" },
  intermediate: { label: "Intermediate", color: "text-amber-600",   bg: "bg-amber-50",    border: "border-amber-200",   dot: "bg-amber-500" },
  advanced:     { label: "Advanced",     color: "text-red-600",     bg: "bg-red-50",      border: "border-red-200",     dot: "bg-red-500" },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PROJECT LAB PAGE — Only shows enrolled course projects                   */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Get active enrollments
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select("course_id")
    .eq("student_id", student?.id ?? "")
    .eq("status", "active");

  const enrolledCourseIds = (enrollments ?? []).map((e) => e.course_id);

  /* ── NOT ENROLLED — CTA to enrol ───────────────────────────────────── */
  if (enrolledCourseIds.length === 0) {
    return (
      <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-ink">Project Lab</h1>
              <p className="text-sm text-ink-muted">Build real projects. Get AI-reviewed. Ship to your portfolio.</p>
            </div>
          </div>
        </div>

        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-surface-tint flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-ink mb-2">Your project roadmap awaits</h3>
          <p className="text-sm text-ink-muted mb-6 max-w-sm mx-auto">
            Take an assessment and enrol in a course to unlock your personalised project roadmap — 10-12 real projects from beginner to advanced.
          </p>
          <Link href="/courses"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand/90 transition-all hover:shadow-lg hover:shadow-brand/20">
            Browse Courses
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </div>
    );
  }

  /* ── ENROLLED — Fetch course + project data ────────────────────────── */

  // Get enrolled courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title, color")
    .in("id", enrolledCourseIds)
    .order("title") as { data: CourseRow[] | null };

  // Get projects for enrolled courses only
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, description_md, difficulty, estimated_hours, tech_stack, requirements, course_id, order_index")
    .in("course_id", enrolledCourseIds)
    .order("order_index", { ascending: true }) as { data: ProjectRow[] | null };

  // Get submissions
  const { data: submissions } = await supabase
    .from("project_submissions")
    .select("project_id, score, max_score")
    .eq("student_id", student?.id ?? "") as { data: SubmissionRow[] | null };

  // Lesson completions per course for unlock logic
  const { data: completions } = await supabase
    .from("lesson_completions")
    .select("lesson_id, lessons!inner(course_id)")
    .eq("student_id", student?.id ?? "");

  const completionsByCourse = new Map<string, number>();
  for (const c of completions ?? []) {
    const cid = (c as Record<string, unknown>).lessons as Record<string, string>;
    const courseId = cid?.course_id;
    if (courseId) completionsByCourse.set(courseId, (completionsByCourse.get(courseId) ?? 0) + 1);
  }

  const courseList = courses ?? [];
  const projectList = projects ?? [];
  const subMap = new Map((submissions ?? []).map((s) => [s.project_id, s]));

  // Group projects by course
  const grouped = new Map<string, ProjectRow[]>();
  for (const p of projectList) {
    const list = grouped.get(p.course_id) ?? [];
    list.push(p);
    grouped.set(p.course_id, list);
  }

  // Unlock logic
  function isUnlocked(project: ProjectRow): boolean {
    const done = completionsByCourse.get(project.course_id) ?? 0;
    if (project.difficulty === "beginner") return true;
    if (project.difficulty === "intermediate") return done >= 10;
    return done >= 25;
  }

  // Stats
  const totalProjects = projectList.length;
  const completedProjects = (submissions ?? []).filter(s => s.score !== null).length;

  return (
    <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-ink">Project Lab</h1>
            <p className="text-sm text-ink-muted">Build real projects. Get AI-reviewed. Ship to your portfolio.</p>
          </div>
        </div>
      </div>

      {/* Course sections */}
      <div className="space-y-10">
        {courseList.map((course) => {
          const courseProjects = grouped.get(course.id) ?? [];
          if (courseProjects.length === 0) return null;
          const completed = courseProjects.filter(p => subMap.has(p.id) && subMap.get(p.id)!.score !== null).length;
          const lessonsComplete = completionsByCourse.get(course.id) ?? 0;

          // Group by difficulty
          const beginnerProjects = courseProjects.filter(p => p.difficulty === "beginner");
          const intermediateProjects = courseProjects.filter(p => p.difficulty === "intermediate");
          const advancedProjects = courseProjects.filter(p => p.difficulty === "advanced");

          return (
            <section key={course.id}>
              {/* Course header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-8 rounded-full" style={{ background: course.color }} />
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-ink">{course.title}</h2>
                  <p className="text-xs text-ink-muted">{completed}/{courseProjects.length} projects completed · {lessonsComplete} lessons done</p>
                </div>
                {/* Overall progress */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-20 h-2 rounded-full bg-surface-alt overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(completed / courseProjects.length) * 100}%`, background: course.color }} />
                  </div>
                  <span className="text-xs text-ink-muted font-semibold tabular-nums">{Math.round((completed / courseProjects.length) * 100)}%</span>
                </div>
              </div>

              {/* Difficulty sections */}
              {[
                { label: "Foundation", projects: beginnerProjects, unlockMsg: "Open — start anytime" },
                { label: "Intermediate", projects: intermediateProjects, unlockMsg: `Unlocks after 10 lessons (${Math.min(lessonsComplete, 10)}/10)` },
                { label: "Advanced", projects: advancedProjects, unlockMsg: `Unlocks after 25 lessons (${Math.min(lessonsComplete, 25)}/25)` },
              ].map((section) => {
                if (section.projects.length === 0) return null;
                return (
                  <div key={section.label} className="mt-5">
                    <div className="flex items-center gap-2 mb-3 pl-5">
                      <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">{section.label}</p>
                      <div className="flex-1 h-px bg-border" />
                      <p className="text-[10px] text-ink-muted">{section.unlockMsg}</p>
                    </div>

                    <div className="space-y-2">
                      {section.projects.map((project, idx) => {
                        const sub = subMap.get(project.id);
                        const hasScore = sub && sub.score !== null;
                        const unlocked = isUnlocked(project);
                        const d = DIFF[project.difficulty] ?? DIFF.intermediate;
                        const globalIdx = courseProjects.indexOf(project);

                        if (unlocked) {
                          return (
                            <Link key={project.id} href={`/projects/${project.id}`}
                              className="flex items-center gap-4 px-5 py-4 bg-surface rounded-xl border border-border hover:shadow-card hover:border-brand/20 transition-all group">
                              {/* Number */}
                              <span className={[
                                "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
                                hasScore ? "bg-emerald-100 text-emerald-600" : "bg-surface-tint text-brand",
                              ].join(" ")}>
                                {hasScore ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                ) : globalIdx + 1}
                              </span>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-ink group-hover:text-brand transition-colors mb-0.5">{project.title}</h3>
                                <p className="text-xs text-ink-muted line-clamp-1">{project.description_md.slice(0, 120)}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {project.tech_stack.slice(0, 3).map((tech) => (
                                    <span key={tech} className="px-2 py-0.5 rounded-md bg-surface-tint text-[10px] font-semibold text-brand border border-brand/10">{tech}</span>
                                  ))}
                                  {project.tech_stack.length > 3 && (
                                    <span className="text-[10px] text-ink-muted">+{project.tech_stack.length - 3}</span>
                                  )}
                                  <span className="text-[10px] text-ink-muted ml-auto">{project.estimated_hours}h est.</span>
                                </div>
                              </div>

                              {/* Score or arrow */}
                              {hasScore ? (
                                <div className="flex flex-col items-center shrink-0">
                                  <span className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-black border border-emerald-200">
                                    {sub.score}
                                  </span>
                                  <span className="text-[9px] text-emerald-600 font-bold mt-0.5">/{sub.max_score}</span>
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-surface-alt flex items-center justify-center group-hover:bg-brand/10 transition-colors shrink-0">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted group-hover:text-brand transition-colors"><polyline points="9 18 15 12 9 6" /></svg>
                                </div>
                              )}
                            </Link>
                          );
                        }

                        /* Locked project — visible brief, can't click */
                        return (
                          <div key={project.id} className="flex items-center gap-4 px-5 py-4 bg-surface/50 rounded-xl border border-border opacity-50">
                            <span className="w-9 h-9 rounded-xl bg-surface-alt text-ink-muted flex items-center justify-center text-sm font-bold shrink-0">
                              {globalIdx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-ink mb-0.5">{project.title}</h3>
                              <p className="text-xs text-ink-muted line-clamp-1">{project.description_md.slice(0, 120)}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {project.tech_stack.slice(0, 3).map((tech) => (
                                  <span key={tech} className="px-2 py-0.5 rounded-md bg-surface-alt text-[10px] font-semibold text-ink-muted">{tech}</span>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col items-center shrink-0">
                              <div className="w-9 h-9 rounded-xl bg-surface-alt flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted">
                                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
}
