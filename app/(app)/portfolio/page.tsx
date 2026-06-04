import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProjectSubmission } from "@/types/database";

interface ProjectWithSubmission {
  submission: ProjectSubmission;
  project: {
    id: string;
    title: string;
    tech_stack: string[];
    difficulty: string;
    course_id: string;
  };
  course: {
    title: string;
    color: string;
  } | null;
}

function getCareerReadiness(avgScore: number): string {
  if (avgScore >= 90) return "Senior Engineer";
  if (avgScore >= 80) return "AI Engineer";
  if (avgScore >= 70) return "Mid-Level Engineer";
  if (avgScore >= 60) return "Junior Engineer";
  return "Building Foundations";
}

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

  // Fetch all submissions with scores
  const { data: submissions } = await supabase
    .from("project_submissions")
    .select("*")
    .eq("student_id", student.id)
    .not("score", "is", null)
    .order("submitted_at", { ascending: false }) as { data: ProjectSubmission[] | null };

  const allSubmissions = submissions ?? [];

  // Fetch project details for each submission
  const projectIds = allSubmissions.map((s) => s.project_id);
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, tech_stack, difficulty, course_id")
    .in("id", projectIds.length > 0 ? projectIds : ["__none__"]);

  const projectMap = new Map((projects ?? []).map((p) => [p.id, p]));

  // Fetch courses for colour/title
  const courseIds = [...new Set((projects ?? []).map((p) => p.course_id))];
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, color")
    .in("id", courseIds.length > 0 ? courseIds : ["__none__"]);

  const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));

  // Build enriched list
  const enriched: ProjectWithSubmission[] = allSubmissions.reduce<ProjectWithSubmission[]>((acc, s) => {
    const project = projectMap.get(s.project_id);
    if (!project) return acc;
    acc.push({
      submission: s,
      project,
      course: courseMap.get(project.course_id) ?? null,
    });
    return acc;
  }, []);

  // Stats
  const scores = allSubmissions.map((s) => s.score).filter((s): s is number => s !== null);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  // Get total projects across enrolled courses
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

  // Collect all tech stacks
  const allTech = new Map<string, number>();
  for (const item of enriched) {
    for (const tech of item.project.tech_stack ?? []) {
      allTech.set(tech, (allTech.get(tech) ?? 0) + 1);
    }
  }
  const topTech = [...allTech.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Empty state
  if (enriched.length === 0) {
    return (
      <div className="px-6 py-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-ink mb-2">Your Portfolio</h1>
        <p className="text-ink-muted text-sm mb-8">
          Your public-facing portfolio of completed projects.
        </p>
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-surface-tint flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand">
              <path d="M12 15l-3-3m0 0l3-3m-3 3h12M5 19.5A2.5 2.5 0 017.5 17h9a2.5 2.5 0 012.5 2.5v0a.5.5 0 01-.5.5h-14a.5.5 0 01-.5-.5v0z" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="8" r="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-ink mb-2">No projects in your portfolio yet</h3>
          <p className="text-sm text-ink-muted mb-6">
            Submit your first project to start building your portfolio.
          </p>
          <Link href="/projects">
            <Button>Go to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-ink mb-2">Your Portfolio</h1>
      <p className="text-ink-muted text-sm mb-8">
        Your public-facing portfolio of completed projects.
      </p>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-surface border border-border rounded-xl p-5 text-center shadow-card">
          <p className="text-2xl font-black text-ink mb-0.5">{avgScore}/100</p>
          <p className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Portfolio Score</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 text-center shadow-card">
          <p className="text-2xl font-black text-ink mb-0.5">{deployed}/{total}</p>
          <p className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Projects Deployed</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 text-center shadow-card">
          <p className="text-2xl font-black text-ink mb-0.5">{getCareerReadiness(avgScore)}</p>
          <p className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Career Readiness</p>
        </div>
      </div>

      {/* Deployed projects */}
      <section className="mb-10">
        <div className="border-t border-border pt-8 mb-5">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Deployed Projects</h2>
        </div>

        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
          {enriched.map((item) => (
            <div
              key={item.submission.id}
              className="bg-surface px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  {item.course && (
                    <div className="w-6 h-1 rounded-full shrink-0" style={{ background: item.course.color }} />
                  )}
                  <h3 className="text-sm font-semibold text-ink truncate">{item.project.title}</h3>
                  <Badge variant="success" className="shrink-0">
                    Score: {item.submission.score}/{item.submission.max_score}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap ml-9">
                  {(item.project.tech_stack ?? []).map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 bg-surface-tint text-brand text-xs rounded-[var(--radius-pill)] font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 ml-9 mt-2 text-xs text-ink-muted">
                  <a
                    href={item.submission.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:underline"
                  >
                    {item.submission.github_url.replace("https://", "")}
                  </a>
                  {item.submission.live_url && (
                    <a
                      href={item.submission.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline font-semibold"
                    >
                      Live
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="inline ml-1">
                        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skill summary */}
      {topTech.length > 0 && (
        <section>
          <div className="border-t border-border pt-8 mb-5">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-1">Skill Summary</h2>
            <p className="text-xs text-ink-muted">Based on your project scores and tech stack usage</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {topTech.map(([tech, count]) => (
              <div
                key={tech}
                className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-card"
              >
                <span className="text-sm font-semibold text-ink">{tech}</span>
                <span className="text-xs text-ink-muted">{count} project{count > 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
