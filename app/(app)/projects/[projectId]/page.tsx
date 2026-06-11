import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SubmissionForm, ScoreDisplay } from "./SubmissionForm";
import { RichContent } from "@/components/ui/rich-content";
import type { Project, ProjectSubmission } from "@/types/database";

interface Milestone { title?: string; description?: string; [key: string]: unknown }
interface PageProps { params: Promise<{ projectId: string }> }

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function extractSummary(md: string, maxLen = 200): string {
  const lines = md.split("\n").map(l => l.trim()).filter(Boolean);
  const body = lines.filter(l => !l.startsWith("#")).join(" ").replace(/[*`]/g, "");
  if (body.length <= maxLen) return body;
  return body.substring(0, maxLen).replace(/\s\S*$/, "") + "…";
}

const DIFF_COLORS: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  beginner:     { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", dot: "#22C55E" },
  intermediate: { text: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   dot: "#F59E0B" },
  advanced:     { text: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",     dot: "#EF4444" },
};

export default async function ProjectBriefPage({ params }: PageProps) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle() as { data: Project | null };
  if (!project) notFound();

  const { data: course } = await supabase.from("courses").select("id, title, slug, color, total_projects").eq("id", project.course_id).maybeSingle();
  const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();

  let submission: ProjectSubmission | null = null;
  if (student) {
    const { data } = await supabase.from("project_submissions").select("*").eq("student_id", student.id).eq("project_id", projectId).maybeSingle() as { data: ProjectSubmission | null };
    submission = data;
  }

  const milestones = (project.milestone_checkpoints ?? []) as Milestone[];
  const requirements = project.requirements ?? [];
  const techStack = project.tech_stack ?? [];
  const dc = DIFF_COLORS[project.difficulty] ?? DIFF_COLORS.intermediate;
  const courseColor = course?.color ?? "#0056CE";
  const hasResult = submission && submission.score !== null;

  return (
    <div className="min-h-full bg-surface-soft">
      {/* ── Dark hero header — Vercel deployment style ──────────────── */}
      <div className="bg-[#0A0A0A] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link href="/projects" className="text-slate-400 hover:text-white transition-colors">Projects</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-slate-400">{course?.title}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white font-medium">{project.title}</span>
          </div>

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{project.title}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${dc.bg} ${dc.text} ${dc.border} border`}>
                  {project.difficulty}
                </span>
                {hasResult && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Submitted
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                {extractSummary(project.description_md)}
              </p>
            </div>
          </div>

          {/* Meta cards — Vercel deployment info style */}
          <div className="flex items-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2 text-slate-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{project.estimated_hours} hours</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
              <span>Project {project.order_index + 1} of {course?.total_projects ?? "?"}</span>
            </div>
            {hasResult && (
              <div className="flex items-center gap-2 text-emerald-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                <span className="font-semibold">{submission!.score}/{submission!.max_score}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column — main content (2/3) */}
          <div className="lg:col-span-2 space-y-6">

            {/* About — full description */}
            <div className="bg-surface rounded-xl border border-border p-5">
              <h2 className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">About This Project</h2>
              <RichContent content={project.description_md} className="text-sm text-ink-secondary leading-relaxed" />
            </div>

            {/* Tech Stack */}
            <div className="bg-surface rounded-xl border border-border p-5">
              <h2 className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Tech Stack</h2>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech) => (
                  <div key={tech} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-soft border border-border">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: courseColor }} />
                    <span className="text-sm font-medium text-ink">{tech}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements — checklist style */}
            {requirements.length > 0 && (
              <div className="bg-surface rounded-xl border border-border p-5">
                <h2 className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Requirements</h2>
                <div className="space-y-2">
                  {requirements.map((req, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-surface-soft transition-colors">
                      <div className="w-5 h-5 rounded border border-border flex items-center justify-center shrink-0 mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <span className="text-sm text-ink leading-relaxed">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones — timeline style */}
            {milestones.length > 0 && (
              <div className="bg-surface rounded-xl border border-border p-5">
                <h2 className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">
                  Milestones
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-surface-alt text-ink-muted text-[10px] font-bold">{milestones.length}</span>
                </h2>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />
                  <div className="space-y-4">
                    {milestones.map((ms, i) => (
                      <div key={i} className="flex items-start gap-4 relative">
                        <div className="w-6 h-6 rounded-full bg-surface border-2 border-border flex items-center justify-center z-10 shrink-0">
                          <span className="text-[9px] font-bold text-ink-muted">{i + 1}</span>
                        </div>
                        <div className="flex-1 pb-1">
                          <p className="text-sm font-semibold text-ink">{ms.title ?? `Milestone ${i + 1}`}</p>
                          {ms.description && <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{ms.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Submission / Score */}
            <div className="bg-surface rounded-xl border border-border p-5">
              <h2 className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-5">
                {hasResult ? "Submission Result" : "Submit Your Project"}
              </h2>
              {hasResult ? (
                <ScoreDisplay
                  result={{
                    score: submission!.score!,
                    max_score: submission!.max_score,
                    breakdown: submission!.breakdown ?? [],
                    overall_feedback: submission!.overall_feedback ?? "",
                    strengths: submission!.strengths ?? [],
                    improvements: submission!.improvements ?? [],
                    code_comments: ((submission as unknown as Record<string, unknown>).code_comments ?? []) as { file: string; line?: number; comment: string; severity: "info" | "warning" | "error"; snippet?: { startLine: number; lines: { num: number; text: string; highlighted: boolean }[] }; githubUrl?: string }[],
                    attempt_number: submission!.attempt_number ?? 1,
                    in_portfolio: submission!.in_portfolio ?? false,
                    submission_history: ((submission as unknown as Record<string, unknown>).submission_history ?? []) as { attempt: number; score: number; max_score: number; breakdown: { criterion: string; score: number; max: number; feedback: string }[]; submitted_at: string }[],
                    previous_attempt: (() => {
                      const hist = ((submission as unknown as Record<string, unknown>).submission_history ?? []) as { attempt: number; score: number; max_score: number; breakdown: { criterion: string; score: number; max: number; feedback: string }[]; submitted_at: string }[];
                      return hist.length > 0 ? hist[hist.length - 1] : null;
                    })(),
                  }}
                />
              ) : (
                <SubmissionForm projectId={projectId} />
              )}
            </div>
          </div>

          {/* Right column — sidebar (1/3) */}
          <div className="space-y-4">

            {/* Quick info — GitHub repo sidebar style */}
            <div className="bg-surface rounded-xl border border-border p-5">
              <h3 className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">Quick Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-ink-secondary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{project.estimated_hours} hours estimated</span>
                </div>
                <div className="flex items-center gap-2 text-ink-secondary">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ background: dc.dot }} />
                  <span className="capitalize">{project.difficulty}</span>
                </div>
                <div className="flex items-center gap-2 text-ink-secondary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>{requirements.length} requirements</span>
                </div>
                <div className="flex items-center gap-2 text-ink-secondary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
                  </svg>
                  <span>{milestones.length} milestones</span>
                </div>
              </div>
            </div>

            {/* Getting Started — Starter Template */}
            <div className="bg-surface rounded-xl border border-border p-5">
              <h3 className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">Getting Started</h3>

              {/* Use Template button */}
              <a href={`https://github.com/nikhildesilva-squareai/starter-${toSlug(project.title)}/generate`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-3 rounded-lg bg-[#0A0A0A] hover:bg-[#1a1a1a] transition-all group mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" className="shrink-0">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61C4.42 17.92 3.63 17.5 3.63 17.5c-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.92 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23A11.5 11.5 0 0112 5.8c1.02.01 2.04.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.21 0 1.6-.02 2.89-.02 3.28 0 .32.22.7.83.58A12 12 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Use this template</p>
                  <p className="text-[10px] text-slate-400">Creates a new repo from our starter</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              </a>

              {/* Clone command */}
              <div className="rounded-lg bg-slate-950 px-3 py-2.5 mb-3">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">Or clone directly</p>
                <code className="text-[11px] text-slate-300 font-mono break-all select-all">
                  git clone https://github.com/nikhildesilva-squareai/starter-{toSlug(project.title)}.git
                </code>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {[
                  { step: "1", text: "Clone the starter template above" },
                  { step: "2", text: "Build the project following the requirements" },
                  { step: "3", text: "Push to your own public GitHub repo" },
                  { step: "4", text: "Submit the repo URL below for AI review" },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-surface-alt flex items-center justify-center text-[10px] font-bold text-ink-muted shrink-0">
                      {s.step}
                    </span>
                    <span className="text-xs text-ink-secondary leading-relaxed">{s.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course context */}
            <div className="bg-surface rounded-xl border border-border p-5">
              <h3 className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">Course</h3>
              <Link href={`/courses/${course?.slug}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:border-brand/30 hover:bg-surface-soft transition-all group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${courseColor}15` }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={courseColor} strokeWidth="2" strokeLinecap="round">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink group-hover:text-brand transition-colors">{course?.title}</p>
                  <p className="text-[10px] text-ink-muted">View course</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
