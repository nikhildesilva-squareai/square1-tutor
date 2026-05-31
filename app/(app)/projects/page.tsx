import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProjectRow {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  project: {
    id: string;
    title: string;
    description_md: string;
    difficulty: string;
    estimated_hours: number;
    tech_stack: string[];
    course_id: string;
  } | null;
}

function statusVariant(status: string): "success" | "warning" | "muted" | "default" {
  if (status === "submitted" || status === "reviewed") return "success";
  if (status === "in_progress") return "warning";
  return "muted";
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    not_started: "Not started",
    in_progress: "In Progress",
    submitted: "Submitted",
    reviewed: "Reviewed",
  };
  return labels[status] ?? status;
}

function difficultyVariant(difficulty: string): "success" | "warning" | "error" {
  if (difficulty === "beginner") return "success";
  if (difficulty === "intermediate") return "warning";
  return "error";
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

  const { data: projects } = await supabase
    .from("student_projects")
    .select(`
      id, status, created_at, updated_at,
      project:projects(id, title, description_md, difficulty, estimated_hours, tech_stack, course_id)
    `)
    .eq("student_id", student?.id ?? "")
    .order("updated_at", { ascending: false }) as { data: ProjectRow[] | null };

  const allProjects = projects ?? [];

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">My Projects</h1>
          <p className="text-ink-muted mt-1 text-sm">
            Track your project submissions and portfolio progress.
          </p>
        </div>
        {allProjects.length > 0 && (
          <div className="text-sm text-ink-muted">
            {allProjects.filter((p) => p.status === "submitted" || p.status === "reviewed").length} / {allProjects.length} completed
          </div>
        )}
      </div>

      {allProjects.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🚀</div>
          <h3 className="text-lg font-semibold text-ink mb-2">No projects yet</h3>
          <p className="text-sm text-ink-muted mb-6">
            Enrol in a course and start building real projects for your portfolio.
          </p>
          <Link href="/courses">
            <Button>Browse Courses</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {allProjects.map((p) => (
            <Card key={p.id} className="hover:shadow-card-hover transition-shadow">
              <CardContent className="flex items-start gap-4 py-5">
                <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-surface-tint flex items-center justify-center text-xl shrink-0">
                  🔨
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="text-sm font-semibold text-ink leading-snug">
                      {p.project?.title ?? "Project"}
                    </h3>
                    <Badge variant={statusVariant(p.status)} className="shrink-0">
                      {statusLabel(p.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-muted mb-3 line-clamp-2">
                    {(p.project?.description_md ?? "").replace(/[#*`]/g, "").substring(0, 120)}...
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {p.project?.difficulty && (
                      <Badge variant={difficultyVariant(p.project.difficulty)}>
                        {p.project.difficulty.charAt(0).toUpperCase() + p.project.difficulty.slice(1)}
                      </Badge>
                    )}
                    {p.project?.estimated_hours && (
                      <span className="text-xs text-ink-muted">{p.project.estimated_hours}h estimated</span>
                    )}
                    {(p.project?.tech_stack ?? []).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 bg-surface-tint text-brand text-xs rounded-[var(--radius-pill)] font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
