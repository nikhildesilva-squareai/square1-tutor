import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { ProjectSubmission } from "@/types/database";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface ProjectWithSubmission {
  submission: ProjectSubmission;
  project: { id: string; title: string; tech_stack: string[]; difficulty: string; course_id: string; order_index: number };
  course: { title: string; color: string; icon: string } | null;
}

function getCareerLevel(avgScore: number): { label: string; color: string; bg: string } {
  if (avgScore >= 90) return { label: "Senior Engineer", color: "text-emerald-600", bg: "bg-emerald-50" };
  if (avgScore >= 80) return { label: "AI Engineer", color: "text-brand", bg: "bg-brand/5" };
  if (avgScore >= 70) return { label: "Mid-Level Engineer", color: "text-amber-600", bg: "bg-amber-50" };
  if (avgScore >= 60) return { label: "Junior Engineer", color: "text-orange-600", bg: "bg-orange-50" };
  return { label: "Building Foundations", color: "text-ink-muted", bg: "bg-surface-alt" };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CAREER PORTFOLIO PAGE                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default async function PortfolioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: student } = await supabase
    .from("students")
    .select("id, name, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!student) return null;

  // Fetch submissions with scores
  const { data: submissions } = await supabase
    .from("project_submissions")
    .select("*")
    .eq("student_id", student.id)
    .not("score", "is", null)
    .order("submitted_at", { ascending: false }) as { data: ProjectSubmission[] | null };

  const allSubmissions = submissions ?? [];

  // Fetch projects + courses
  const projectIds = allSubmissions.map((s) => s.project_id);
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, tech_stack, difficulty, course_id, order_index")
    .in("id", projectIds.length > 0 ? projectIds : ["__none__"]);

  const projectMap = new Map((projects ?? []).map((p) => [p.id, p]));
  const courseIds = [...new Set((projects ?? []).map((p) => p.course_id))];

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, color, icon")
    .in("id", courseIds.length > 0 ? courseIds : ["__none__"]);

  const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));

  // Enriched list
  const enriched: ProjectWithSubmission[] = allSubmissions.reduce<ProjectWithSubmission[]>((acc, s) => {
    const project = projectMap.get(s.project_id);
    if (!project) return acc;
    acc.push({ submission: s, project, course: courseMap.get(project.course_id) ?? null });
    return acc;
  }, []);

  // Stats
  const scores = allSubmissions.map((s) => s.score).filter((s): s is number => s !== null);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  // Total available projects
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select("course_id")
    .eq("student_id", student.id)
    .eq("status", "active");

  const enrolledCourseIds = (enrollments ?? []).map((e) => e.course_id);
  const { count: totalProjects } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .in("course_id", enrolledCourseIds.length > 0 ? enrolledCourseIds : ["__none__"]);

  const total = totalProjects ?? 0;
  const deployed = scores.length;
  const readinessPct = total > 0 ? Math.round((deployed / total) * 100) : 0;
  const career = getCareerLevel(avgScore);

  // Tech stack frequency
  const techCount = new Map<string, number>();
  for (const item of enriched) {
    for (const tech of item.project.tech_stack ?? []) {
      techCount.set(tech, (techCount.get(tech) ?? 0) + 1);
    }
  }
  const topTech = [...techCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

  // Group by course
  const byCourse = new Map<string, ProjectWithSubmission[]>();
  for (const item of enriched) {
    const cid = item.project.course_id;
    const list = byCourse.get(cid) ?? [];
    list.push(item);
    byCourse.set(cid, list);
  }

  /* ═══ EMPTY STATE — Preview of what portfolio WILL look like ═══ */
  if (enriched.length === 0) {
    return (
      <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-ink">Career Portfolio</h1>
              <p className="text-sm text-ink-muted">Your public showcase of completed projects</p>
            </div>
          </div>
        </div>

        {/* Preview mockup */}
        <div className="relative">
          {/* Blur overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-soft/60 to-surface-soft z-10 flex items-end justify-center pb-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-ink mb-2">Your portfolio starts here</h3>
              <p className="text-sm text-ink-muted mb-6 max-w-sm mx-auto">
                Complete your first project to start building your career portfolio. Employers will see your work, scores, and tech skills.
              </p>
              <Link href="/projects"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand/90 transition-all hover:shadow-lg hover:shadow-brand/20">
                Go to Project Lab →
              </Link>
            </div>
          </div>

          {/* Blurred preview cards */}
          <div className="opacity-30 blur-[2px] pointer-events-none select-none">
            {/* Mock profile */}
            <div className="bg-surface rounded-2xl border border-border p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-alt" />
                <div className="flex-1">
                  <div className="h-5 w-40 bg-surface-alt rounded mb-2" />
                  <div className="h-3 w-24 bg-surface-alt rounded" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center"><div className="h-8 w-12 bg-surface-alt rounded mx-auto mb-1" /><div className="h-2 w-10 bg-surface-alt rounded mx-auto" /></div>
                  <div className="text-center"><div className="h-8 w-12 bg-surface-alt rounded mx-auto mb-1" /><div className="h-2 w-10 bg-surface-alt rounded mx-auto" /></div>
                  <div className="text-center"><div className="h-8 w-12 bg-surface-alt rounded mx-auto mb-1" /><div className="h-2 w-10 bg-surface-alt rounded mx-auto" /></div>
                </div>
              </div>
            </div>
            {/* Mock project cards */}
            {[1,2,3].map(i => (
              <div key={i} className="bg-surface rounded-xl border border-border p-5 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-alt" />
                  <div className="flex-1">
                    <div className="h-4 w-48 bg-surface-alt rounded mb-2" />
                    <div className="h-3 w-32 bg-surface-alt rounded" />
                  </div>
                  <div className="h-10 w-14 bg-surface-alt rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══ PORTFOLIO WITH DATA ═══ */
  return (
    <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-ink">Career Portfolio</h1>
            <p className="text-sm text-ink-muted">Your public showcase of completed projects</p>
          </div>
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-surface rounded-2xl border border-border shadow-card p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center text-white text-xl font-black shrink-0">
            {(student.name ?? student.email ?? "?")[0].toUpperCase()}
          </div>

          {/* Name + level */}
          <div className="flex-1">
            <h2 className="text-lg font-bold text-ink">{student.name ?? student.email}</h2>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mt-1 ${career.color} ${career.bg}`}>
              <span>🎯</span> {career.label}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 text-center shrink-0">
            <div>
              <p className="text-2xl font-black text-ink">{avgScore}</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Avg Score</p>
            </div>
            <div>
              <p className="text-2xl font-black text-ink">{deployed}/{total}</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Projects</p>
            </div>
            <div>
              <p className="text-2xl font-black text-brand">{readinessPct}%</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Career Ready</p>
            </div>
          </div>
        </div>

        {/* Career readiness bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-secondary">Career Readiness</span>
            <span className="text-xs text-ink-muted">{deployed} of {total} projects completed</span>
          </div>
          <div className="w-full h-3 rounded-full bg-surface-alt overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-emerald-500 transition-all duration-700"
              style={{ width: `${readinessPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tech skills */}
      {topTech.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-3">Skills Demonstrated</h3>
          <div className="flex flex-wrap gap-2">
            {topTech.map(([tech, count]) => (
              <div key={tech} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border text-sm">
                <span className="font-semibold text-ink">{tech}</span>
                <span className="text-[10px] text-ink-muted bg-surface-alt px-1.5 py-0.5 rounded-full font-bold">{count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects by course */}
      <div className="space-y-8">
        {Array.from(byCourse.entries()).map(([courseId, items]) => {
          const course = courseMap.get(courseId);
          if (!course) return null;

          return (
            <section key={courseId}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: `${course.color}15` }}>
                  {course.icon || "📚"}
                </div>
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">{course.title}</h3>
                <span className="text-xs text-ink-muted">{items.length} project{items.length > 1 ? "s" : ""}</span>
              </div>

              <div className="grid gap-3">
                {items.map((item) => (
                  <div key={item.submission.id} className="bg-surface rounded-xl border border-border p-5 hover:shadow-card transition-all">
                    <div className="flex items-start gap-4">
                      {/* Score badge */}
                      <div className="shrink-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black ${
                          (item.submission.score ?? 0) >= 80
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : (item.submission.score ?? 0) >= 60
                            ? "bg-amber-50 text-amber-600 border border-amber-200"
                            : "bg-red-50 text-red-600 border border-red-200"
                        }`}>
                          {item.submission.score}/{item.submission.max_score}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-ink mb-1">{item.project.title}</h4>

                        {/* Tech stack */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-3">
                          {(item.project.tech_stack ?? []).map((tech) => (
                            <span key={tech} className="px-2 py-0.5 rounded-md bg-surface-tint text-[10px] font-semibold text-brand border border-brand/10">
                              {tech}
                            </span>
                          ))}
                        </div>

                        {/* Links */}
                        <div className="flex items-center gap-4 text-xs">
                          <a href={item.submission.github_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-ink-muted hover:text-brand transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61C4.42 17.92 3.63 17.5 3.63 17.5c-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.92 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23A11.5 11.5 0 0112 5.8c1.02.01 2.04.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.21 0 1.6-.02 2.89-.02 3.28 0 .32.22.7.83.58A12 12 0 0024 12c0-6.63-5.37-12-12-12z"/>
                            </svg>
                            GitHub
                          </a>
                          {item.submission.live_url && (
                            <a href={item.submission.live_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-brand font-semibold hover:underline">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                              Live Demo
                            </a>
                          )}
                        </div>

                        {/* Strengths */}
                        {item.submission.strengths && item.submission.strengths.length > 0 && (
                          <div className="mt-3 flex items-start gap-2">
                            <span className="text-emerald-500 text-xs mt-0.5">✓</span>
                            <p className="text-xs text-ink-muted leading-relaxed">
                              {item.submission.strengths.slice(0, 2).join(" · ")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
