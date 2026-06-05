import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface CourseRow {
  id: string;
  slug: string;
  title: string;
  color: string;
  icon: string;
}

interface ProjectRow {
  id: string;
  title: string;
  description_md: string;
  difficulty: string;
  estimated_hours: number;
  tech_stack: string[];
  course_id: string;
  order_index: number;
}

interface SubmissionRow {
  project_id: string;
  score: number | null;
  max_score: number;
}

/* ─── Difficulty config ──────────────────────────────────────────────────── */
const DIFF: Record<string, { label: string; color: string; bg: string; border: string }> = {
  beginner:     { label: "Beginner",     color: "text-emerald-600", bg: "bg-emerald-50",  border: "border-emerald-200" },
  intermediate: { label: "Intermediate", color: "text-amber-600",   bg: "bg-amber-50",    border: "border-amber-200" },
  advanced:     { label: "Advanced",     color: "text-red-600",     bg: "bg-red-50",      border: "border-red-200" },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PROJECT LAB PAGE                                                         */
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

  // Get enrollments
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select("course_id")
    .eq("student_id", student?.id ?? "")
    .eq("status", "active");

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.course_id));

  // Get ALL courses + ALL projects (show everything, not just enrolled)
  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title, color, icon")
    .eq("status", "active")
    .order("title") as { data: CourseRow[] | null };

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, description_md, difficulty, estimated_hours, tech_stack, course_id, order_index")
    .order("order_index", { ascending: true }) as { data: ProjectRow[] | null };

  // Get submissions for this student
  const { data: submissions } = await supabase
    .from("project_submissions")
    .select("project_id, score, max_score")
    .eq("student_id", student?.id ?? "") as { data: SubmissionRow[] | null };

  // Get lesson completion count per course for unlock logic
  const { data: completions } = await supabase
    .from("lesson_completions")
    .select("lesson_id, lessons!inner(course_id)")
    .eq("student_id", student?.id ?? "");

  // Count completions per course
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

  // Stats
  const totalProjects = projectList.length;
  const completedProjects = (submissions ?? []).filter(s => s.score !== null).length;

  // Determine if a project is unlocked
  // Rules: beginner projects always unlocked for enrolled courses
  // Intermediate: need 10+ lessons completed, Advanced: need 25+ lessons
  function isUnlocked(project: ProjectRow): boolean {
    if (!enrolledIds.has(project.course_id)) return false;
    const done = completionsByCourse.get(project.course_id) ?? 0;
    if (project.difficulty === "beginner") return true;
    if (project.difficulty === "intermediate") return done >= 10;
    return done >= 25; // advanced
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M2 20h20" /><path d="M5 20V10l7-7 7 7v10" /><rect x="9" y="14" width="6" height="6" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-ink">Project Lab</h1>
            <p className="text-sm text-ink-muted">Build real projects. Get AI-reviewed. Ship to your portfolio.</p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-6 mt-4 px-5 py-3 bg-surface rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">📁</span>
            <div>
              <p className="text-sm font-bold text-ink">{totalProjects}</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider">Total Projects</p>
            </div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <div>
              <p className="text-sm font-bold text-ink">{completedProjects}</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider">Completed</p>
            </div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <div>
              <p className="text-sm font-bold text-ink">{enrolledIds.size}</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider">Courses Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course sections */}
      <div className="space-y-10">
        {courseList.map((course) => {
          const courseProjects = grouped.get(course.id) ?? [];
          if (courseProjects.length === 0) return null;
          const isEnrolled = enrolledIds.has(course.id);
          const completed = courseProjects.filter(p => subMap.has(p.id) && subMap.get(p.id)!.score !== null).length;

          return (
            <section key={course.id}>
              {/* Course header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${course.color}15` }}>
                  {course.icon || "📚"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-ink">{course.title}</h2>
                    {isEnrolled ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        Enrolled
                      </span>
                    ) : (
                      <Link href={`/courses/${course.slug}`}
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-alt text-ink-muted border border-border hover:border-brand hover:text-brand transition-colors">
                        Enrol →
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted">{courseProjects.length} projects &middot; {completed} completed</p>
                </div>
                {/* Progress bar for enrolled */}
                {isEnrolled && (
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-surface-alt overflow-hidden">
                      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(completed / courseProjects.length) * 100}%` }} />
                    </div>
                    <span className="text-xs text-ink-muted font-semibold tabular-nums">{completed}/{courseProjects.length}</span>
                  </div>
                )}
              </div>

              {/* Project roadmap */}
              <div className="relative">
                {/* Connection line */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden sm:block" />

                <div className="grid gap-3">
                  {courseProjects.map((project, idx) => {
                    const sub = subMap.get(project.id);
                    const hasScore = sub && sub.score !== null;
                    const unlocked = isUnlocked(project);
                    const d = DIFF[project.difficulty] ?? DIFF.intermediate;

                    return (
                      <div key={project.id} className="relative">
                        {/* Timeline dot */}
                        <div className="absolute left-3.5 top-5 w-5 h-5 rounded-full border-2 border-surface bg-surface z-10 hidden sm:flex items-center justify-center">
                          {hasScore ? (
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          ) : unlocked ? (
                            <div className="w-3 h-3 rounded-full bg-brand" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-border" />
                          )}
                        </div>

                        {/* Project card */}
                        {unlocked || !isEnrolled ? (
                          <Link
                            href={isEnrolled ? `/projects/${project.id}` : `/courses/${course.slug}`}
                            className="block sm:ml-12 bg-surface border border-border rounded-xl p-5 hover:shadow-card hover:border-brand/20 transition-all group"
                          >
                            <div className="flex items-start gap-4">
                              {/* Number + difficulty */}
                              <div className="flex flex-col items-center gap-1 shrink-0">
                                <span className="w-8 h-8 rounded-lg bg-surface-tint text-brand flex items-center justify-center text-sm font-black">
                                  {idx + 1}
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${d.color}`}>
                                  {d.label}
                                </span>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-ink group-hover:text-brand transition-colors mb-1">
                                  {project.title}
                                </h3>
                                <p className="text-xs text-ink-muted leading-relaxed line-clamp-2 mb-3">
                                  {project.description_md.slice(0, 150)}{project.description_md.length > 150 ? "..." : ""}
                                </p>
                                {/* Tech stack pills */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {project.tech_stack.slice(0, 4).map((tech) => (
                                    <span key={tech} className="px-2 py-0.5 rounded-md bg-surface-tint text-[10px] font-semibold text-brand border border-brand/10">
                                      {tech}
                                    </span>
                                  ))}
                                  <span className="text-[10px] text-ink-muted ml-1">{project.estimated_hours}h</span>
                                </div>
                              </div>

                              {/* Status */}
                              <div className="shrink-0">
                                {hasScore ? (
                                  <div className="flex flex-col items-center">
                                    <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-black border border-emerald-200">
                                      {sub.score}
                                    </span>
                                    <span className="text-[9px] text-emerald-600 font-bold mt-1">Done</span>
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-surface-alt flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted group-hover:text-brand transition-colors">
                                      <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        ) : (
                          /* Locked project — brief visible but can't click through */
                          <div className="sm:ml-12 bg-surface/60 border border-border rounded-xl p-5 opacity-60">
                            <div className="flex items-start gap-4">
                              <div className="flex flex-col items-center gap-1 shrink-0">
                                <span className="w-8 h-8 rounded-lg bg-surface-alt text-ink-muted flex items-center justify-center text-sm font-black">
                                  {idx + 1}
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${d.color}`}>
                                  {d.label}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-ink mb-1">{project.title}</h3>
                                <p className="text-xs text-ink-muted leading-relaxed line-clamp-2 mb-3">
                                  {project.description_md.slice(0, 150)}{project.description_md.length > 150 ? "..." : ""}
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {project.tech_stack.slice(0, 4).map((tech) => (
                                    <span key={tech} className="px-2 py-0.5 rounded-md bg-surface-alt text-[10px] font-semibold text-ink-muted">
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-surface-alt flex items-center justify-center">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted">
                                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                                  </svg>
                                </div>
                                <p className="text-[8px] text-ink-muted text-center mt-1 leading-tight">
                                  {project.difficulty === "intermediate" ? "10 lessons" : "25 lessons"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
