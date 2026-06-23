import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SubmissionForm, ScoreDisplay } from "./SubmissionForm";
import { RichContent } from "@/components/ui/rich-content";
import type { Project, ProjectSubmission, ProjectRubricCriterion, ProjectReference } from "@/types/database";

export const revalidate = 120;

interface PageProps { params: Promise<{ projectId: string }> }

const DIFF_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  beginner:     { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  intermediate: { text: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200" },
  advanced:     { text: "text-red-600",     bg: "bg-red-50",     border: "border-red-200" },
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

  const techStack = project.tech_stack ?? [];
  const dc = DIFF_COLORS[project.difficulty] ?? DIFF_COLORS.intermediate;
  const courseColor = course?.color ?? "#0056CE";
  const hasResult = submission && submission.score !== null;

  const rubric: ProjectRubricCriterion[] = Array.isArray(project.rubric) ? project.rubric : [];
  const refs: ProjectReference[] = Array.isArray(project.reference_links) ? project.reference_links : [];
  const rubricTotal = rubric.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);

  return (
    <div className="min-h-full bg-surface-soft">
      {/* ── Dark hero ─────────────────────────────────────────────────── */}
      <div className="bg-[#0A0A0A] border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs mb-6">
            <Link href="/projects" className="text-slate-500 hover:text-white transition-colors">Projects</Link>
            <span className="text-slate-700">/</span>
            <Link href={`/courses/${course?.slug}`} className="text-slate-500 hover:text-white transition-colors">{course?.title}</Link>
            <span className="text-slate-700">/</span>
            <span className="text-slate-300">{project.title}</span>
          </div>

          {/* Title + badges */}
          <div className="flex items-start gap-3 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{project.title}</h1>
            <span className={`mt-1.5 shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${dc.bg} ${dc.text} ${dc.border} border`}>
              {project.difficulty}
            </span>
            {hasResult && (
              <span className="mt-1.5 shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {submission!.score}/{submission!.max_score}
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-5 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              {project.estimated_hours}h estimated
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
              Project {project.order_index + 1} of {course?.total_projects ?? "?"}
            </span>
            {techStack.length > 0 && (
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                {techStack.join(" · ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── The brief (full authored markdown) ─────────────────────── */}
        <section className="bg-surface rounded-2xl border border-border p-5 sm:p-7 shadow-card">
          <RichContent content={project.description_md} />
        </section>

        {/* ── Dataset ─────────────────────────────────────────────────── */}
        {(project.dataset_source || project.dataset_url) && (
          <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6">
            <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={courseColor} strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0 0 18 0V5" /><path d="M3 12a9 3 0 0 0 18 0" /></svg>
              Dataset
            </h2>
            <div className="space-y-2 text-sm">
              {project.dataset_source && (
                <div className="flex gap-2"><span className="text-ink-muted w-28 shrink-0">Source</span><span className="text-ink font-medium">{project.dataset_source}</span></div>
              )}
              {project.dataset_license && (
                <div className="flex gap-2"><span className="text-ink-muted w-28 shrink-0">Licence</span><span className="text-ink">{project.dataset_license}</span></div>
              )}
              {project.dataset_attribution && (
                <div className="flex gap-2"><span className="text-ink-muted w-28 shrink-0">Attribution</span><span className="text-ink">{project.dataset_attribution}</span></div>
              )}
            </div>
            {project.dataset_url ? (
              <a href={project.dataset_url} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand/90 transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Download dataset
              </a>
            ) : (
              <p className="mt-3 text-xs text-ink-muted leading-relaxed">
                The dataset ships with the project starter (generated by its included script). It&apos;s 100% synthetic and Square 1-owned — free for you to use.
              </p>
            )}
          </section>
        )}

        {/* ── Marking rubric ──────────────────────────────────────────── */}
        {rubric.length > 0 && (
          <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={courseColor} strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                Marking rubric
              </h2>
              <span className="text-[11px] font-bold text-ink-muted">Total {rubricTotal}%</span>
            </div>
            <div className="space-y-4">
              {rubric.map((r, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span className="text-sm font-semibold text-ink">{r.criterion}</span>
                    <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: courseColor }}>{r.weight}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-alt overflow-hidden mb-1.5">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, Number(r.weight) || 0)}%`, background: courseColor }} />
                  </div>
                  {r.description && <p className="text-xs text-ink-muted leading-relaxed">{r.description}</p>}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-ink-muted mt-4 pt-3 border-t border-border">
              Nova reviews your submitted code + git history against these criteria and returns a weighted score with line-by-line feedback.
            </p>
          </section>
        )}

        {/* ── Getting started ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">Getting Started</h2>
          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6">
            {project.starter_repo_url && (
              <div className="mb-5">
                <a href={`${project.starter_repo_url}/generate`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#0A0A0A] hover:bg-[#161616] transition-all mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" className="shrink-0"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61C4.42 17.92 3.63 17.5 3.63 17.5c-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.92 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23A11.5 11.5 0 0112 5.8c1.02.01 2.04.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.21 0 1.6-.02 2.89-.02 3.28 0 .32.22.7.83.58A12 12 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Use this template</p>
                    <p className="text-[10px] text-slate-500">Creates a new repo from our starter (code + dataset)</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                </a>
                <div className="rounded-xl bg-slate-950 px-4 py-3">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">Or clone directly</p>
                  <code className="text-[11px] text-slate-300 font-mono break-all select-all leading-relaxed">git clone {project.starter_repo_url}.git</code>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {[
                "Read the brief above — it lists exactly what to build, the data, and how you're scored",
                project.starter_repo_url ? "Clone the starter template (code + dataset included)" : "Set up your project repo and generate the dataset as described in the brief",
                "Build the project, meeting the rubric criteria",
                "Push to your own public GitHub repo, then submit the URL below for AI review",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: courseColor }}>{i + 1}</span>
                  <span className="text-sm text-ink leading-relaxed pt-0.5">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Submit / Score ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">
            {hasResult ? "Submission Result" : "Submit Your Project"}
          </h2>
          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6">
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
        </section>

        {/* ── Further reading ─────────────────────────────────────────── */}
        {refs.length > 0 && (
          <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6">
            <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={courseColor} strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
              Further reading
            </h2>
            <ul className="space-y-3">
              {refs.map((r, i) => (
                <li key={i}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand hover:underline">
                    {r.title} ↗
                  </a>
                  {r.note && <p className="text-xs text-ink-muted leading-relaxed mt-0.5">{r.note}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Footer course link ──────────────────────────────────────── */}
        <div className="flex items-center justify-end pt-2 pb-4 border-t border-border">
          <Link href={`/courses/${course?.slug}`}
            className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-brand/30 hover:bg-surface transition-all text-sm text-ink-secondary hover:text-brand">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: `${courseColor}15` }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={courseColor} strokeWidth="2.5" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
            </div>
            Back to {course?.title} →
          </Link>
        </div>
      </div>
    </div>
  );
}
