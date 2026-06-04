import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  course_id: string;
  order_index: number;
}

interface StudentProjectRow {
  id: string;
  status: string;
  project_id: string;
}

interface SubmissionRow {
  project_id: string;
  score: number | null;
}

function difficultyVariant(difficulty: string): "success" | "warning" | "error" {
  if (difficulty === "beginner") return "success";
  if (difficulty === "intermediate") return "warning";
  return "error";
}

function statusBadge(
  status: string | undefined,
  score: number | null | undefined,
): { label: string; variant: "success" | "warning" | "muted" } {
  if (status === "submitted" || status === "reviewed") {
    return { label: score !== null && score !== undefined ? `${score}` : "Submitted", variant: "success" };
  }
  if (status === "in_progress") {
    return { label: "In Progress", variant: "warning" };
  }
  return { label: "Not Started", variant: "muted" };
}

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Get all enrollments
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select("course_id")
    .eq("student_id", student?.id ?? "")
    .eq("status", "active");

  const enrolledCourseIds = (enrollments ?? []).map((e) => e.course_id);

  if (enrolledCourseIds.length === 0) {
    return (
      <div className="px-6 py-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-ink mb-2">My Projects</h1>
        <p className="text-ink-muted text-sm mb-8">
          Track your project submissions and portfolio progress.
        </p>
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-surface-tint flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-ink mb-2">No projects yet</h3>
          <p className="text-sm text-ink-muted mb-6">
            Enrol in a course and start building real projects for your portfolio.
          </p>
          <Link href="/courses">
            <Button>Browse Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title, color")
    .in("id", enrolledCourseIds) as { data: CourseRow[] | null };

  // Get all projects for enrolled courses
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, description_md, difficulty, estimated_hours, tech_stack, course_id, order_index")
    .in("course_id", enrolledCourseIds)
    .order("order_index", { ascending: true }) as { data: ProjectRow[] | null };

  // Get student_projects for status
  const { data: studentProjects } = await supabase
    .from("student_projects")
    .select("id, status, project_id")
    .eq("student_id", student?.id ?? "") as { data: StudentProjectRow[] | null };

  // Get submissions for scores
  const { data: submissions } = await supabase
    .from("project_submissions")
    .select("project_id, score")
    .eq("student_id", student?.id ?? "") as { data: SubmissionRow[] | null };

  const courseList = courses ?? [];
  const projectList = projects ?? [];
  const spMap = new Map((studentProjects ?? []).map((sp) => [sp.project_id, sp]));
  const subMap = new Map((submissions ?? []).map((s) => [s.project_id, s]));

  // Group projects by course
  const courseMap = new Map(courseList.map((c) => [c.id, c]));
  const grouped = new Map<string, ProjectRow[]>();
  for (const p of projectList) {
    const list = grouped.get(p.course_id) ?? [];
    list.push(p);
    grouped.set(p.course_id, list);
  }

  // Count stats
  const totalProjects = projectList.length;
  const completedProjects = projectList.filter((p) => {
    const sp = spMap.get(p.id);
    return sp?.status === "submitted" || sp?.status === "reviewed";
  }).length;

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">My Projects</h1>
          <p className="text-ink-muted mt-1 text-sm">
            Track your project submissions and portfolio progress.
          </p>
        </div>
        {totalProjects > 0 && (
          <div className="text-sm text-ink-muted">
            {completedProjects} / {totalProjects} completed
          </div>
        )}
      </div>

      <div className="space-y-10">
        {Array.from(grouped.entries()).map(([courseId, courseProjects]) => {
          const course = courseMap.get(courseId);
          if (!course) return null;

          return (
            <section key={courseId}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 rounded-full" style={{ background: course.color }} />
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                  {course.title}
                </h2>
                <span className="text-xs text-ink-muted">
                  {courseProjects.length} projects
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {courseProjects.map((project) => {
                  const sp = spMap.get(project.id);
                  const sub = subMap.get(project.id);
                  const { label, variant } = statusBadge(sp?.status, sub?.score);
                  const isCompleted = sp?.status === "submitted" || sp?.status === "reviewed";

                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="group bg-surface border border-border rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all"
                    >
                      <h3 className="text-sm font-semibold text-ink mb-1 leading-snug group-hover:text-brand transition-colors line-clamp-2">
                        {project.title}
                      </h3>
                      <Badge
                        variant={difficultyVariant(project.difficulty)}
                        className="mb-3"
                      >
                        {project.difficulty.charAt(0).toUpperCase() + project.difficulty.slice(1)}
                      </Badge>

                      <div className="mt-auto pt-2 border-t border-border">
                        {isCompleted && sub?.score !== null && sub?.score !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                            <span className="text-xs font-bold text-success">{label}</span>
                          </div>
                        ) : variant === "warning" ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-warning shrink-0" />
                            <span className="text-xs font-semibold text-warning">{label}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-border shrink-0" />
                            <span className="text-xs text-ink-muted">{label}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
