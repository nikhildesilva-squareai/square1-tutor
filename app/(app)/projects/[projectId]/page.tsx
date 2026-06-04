import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SubmissionForm, ScoreDisplay } from "./SubmissionForm";
import type { Project, ProjectSubmission } from "@/types/database";

function difficultyVariant(difficulty: string): "success" | "warning" | "error" {
  if (difficulty === "advanced") return "error";
  if (difficulty === "intermediate") return "warning";
  return "success";
}

interface Milestone {
  title?: string;
  description?: string;
  [key: string]: unknown;
}

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectBriefPage({ params }: PageProps) {
  const { projectId } = await params;
  const supabase = await createClient();

  // Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch project
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle() as { data: Project | null };

  if (!project) notFound();

  // Fetch the course for context (project order, total count)
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug, color, total_projects")
    .eq("id", project.course_id)
    .maybeSingle();

  // Get the student
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Check for existing submission
  let submission: ProjectSubmission | null = null;
  if (student) {
    const { data } = await supabase
      .from("project_submissions")
      .select("*")
      .eq("student_id", student.id)
      .eq("project_id", projectId)
      .maybeSingle() as { data: ProjectSubmission | null };
    submission = data;
  }

  const milestones = (project.milestone_checkpoints ?? []) as Milestone[];
  const requirements = project.requirements ?? [];
  const techStack = project.tech_stack ?? [];

  return (
    <div className="pb-24">
      <div className="px-6 py-8 max-w-4xl mx-auto">
        {/* Back link */}
        <Link href="/projects" className="text-sm text-brand hover:underline mb-6 inline-block">
          ← Back to projects
        </Link>

        {/* Header */}
        <div className="flex items-start gap-5 mb-2">
          <div
            className="w-16 h-1.5 rounded-full mt-4 shrink-0"
            style={{ background: course?.color ?? "#0056CE" }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 text-xs text-ink-muted mb-2">
              <span>
                Project {project.order_index + 1} of {course?.total_projects ?? "?"}
              </span>
              <span className="text-border-mid">·</span>
              <Badge variant={difficultyVariant(project.difficulty)}>
                {project.difficulty.charAt(0).toUpperCase() + project.difficulty.slice(1)}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-ink mb-3">{project.title}</h1>
            <p className="text-sm text-ink-muted leading-relaxed max-w-2xl">
              {project.description_md.replace(/[#*`]/g, "").substring(0, 300)}
            </p>

            {/* Meta */}
            <div className="flex items-center gap-5 mt-4 text-sm text-ink-muted flex-wrap">
              {techStack.length > 0 && (
                <span>
                  <span className="font-semibold text-ink text-xs uppercase tracking-wider">Tech Stack:</span>{" "}
                  {techStack.join(" · ")}
                </span>
              )}
              {project.estimated_hours > 0 && (
                <>
                  <span className="text-border-mid">·</span>
                  <span>
                    <span className="font-semibold text-ink text-xs uppercase tracking-wider">Estimated:</span>{" "}
                    {project.estimated_hours} hours
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 space-y-10">
        {/* Requirements */}
        {requirements.length > 0 && (
          <section>
            <div className="border-t border-border pt-8">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-4">Requirements</h2>
              <ul className="space-y-2">
                {requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-ink">
                    <span className="text-success mt-0.5 shrink-0 font-bold">{"✓"}</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Milestones */}
        {milestones.length > 0 && (
          <section>
            <div className="border-t border-border pt-8">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-1">
                Milestones
              </h2>
              <p className="text-xs text-ink-muted mb-5">{milestones.length} checkpoints</p>
              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                {milestones.map((ms, i) => (
                  <div key={i} className="px-5 py-4 bg-surface flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-surface-tint flex items-center justify-center text-xs font-bold text-brand shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink">{ms.title ?? `Milestone ${i + 1}`}</p>
                      {ms.description && (
                        <p className="text-xs text-ink-muted mt-0.5">{ms.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Starter Kit */}
        <section>
          <div className="border-t border-border pt-8">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-4">Starter Kit</h2>
            <a
              href={`https://github.com/square1ai/starter-${project.title.toLowerCase().replace(/\s+/g, "-")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-brand font-semibold hover:underline"
            >
              Clone from GitHub
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <p className="text-xs text-ink-muted mt-1">
              github.com/square1ai/starter-{project.title.toLowerCase().replace(/\s+/g, "-")}
            </p>
          </div>
        </section>

        {/* Submission Section */}
        <section>
          <div className="border-t border-border pt-8">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-5">
              Submit Your Project
            </h2>

            {submission && submission.score !== null ? (
              <ScoreDisplay
                result={{
                  score: submission.score,
                  max_score: submission.max_score,
                  breakdown: submission.breakdown ?? [],
                  overall_feedback: submission.overall_feedback ?? "",
                  strengths: submission.strengths ?? [],
                  improvements: submission.improvements ?? [],
                }}
              />
            ) : (
              <SubmissionForm projectId={projectId} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
