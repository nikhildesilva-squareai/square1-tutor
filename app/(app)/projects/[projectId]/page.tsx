import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SubmissionForm, ScoreDisplay } from "./SubmissionForm";
import type { Project, ProjectSubmission } from "@/types/database";

interface Milestone { title?: string; description?: string; [key: string]: unknown }
interface PageProps { params: Promise<{ projectId: string }> }

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseSections(md: string) {
  const sections: Record<string, string> = {};
  let current = "overview";
  const lines = md.split("\n");

  for (const line of lines) {
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      current = h2[1].toLowerCase().trim();
      continue;
    }
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      sections[current] = (sections[current] ?? "") + "\n" + line;
      continue;
    }
    sections[current] = (sections[current] ?? "") + "\n" + line;
  }

  for (const key of Object.keys(sections)) {
    sections[key] = sections[key].trim();
  }
  return sections;
}

function extractBullets(text: string): string[] {
  return text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.startsWith("- "))
    .map(l => l.replace(/^- /, "").replace(/\*\*/g, ""));
}

function extractOverview(text: string): string {
  return text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith("#"))
    .join(" ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
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

  const sections = parseSections(project.description_md);
  const overview = extractOverview(sections["overview"] ?? "");
  const learnings = extractBullets(sections["what you'll learn"] ?? "");
  const deliverables = extractBullets(sections["deliverables"] ?? "");
  const tips = extractBullets(sections["tips & guidance"] ?? "");
  const evalCriteria = extractBullets(sections["how you'll be evaluated"] ?? "");
  const careerRelevance = (sections["career relevance"] ?? "").replace(/\*\*/g, "").trim();

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

          {/* Overview text */}
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-3xl mb-6">
            {overview}
          </p>

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
            <span className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
              {techStack.join(" · ")}
            </span>
          </div>
        </div>
      </div>

      {/* ── Body — single column, max-w-4xl ───────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── What You'll Learn — feature grid ──────────────────────── */}
        {learnings.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">What You&apos;ll Learn</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {learnings.map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-surface rounded-xl border border-border p-4">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${courseColor}15` }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={courseColor} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <span className="text-sm text-ink leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Milestones — horizontal stepper ──────────────────────── */}
        {milestones.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">
              Milestones
            </h2>
            <div className="bg-surface rounded-xl border border-border p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {milestones.map((ms, i) => (
                  <div key={i} className="relative">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: courseColor }}>
                        {i + 1}
                      </span>
                      <p className="text-sm font-semibold text-ink">{ms.title ?? `Milestone ${i + 1}`}</p>
                    </div>
                    {ms.description && (
                      <p className="text-xs text-ink-muted leading-relaxed ml-[38px]">{ms.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Requirements ─────────────────────────────────────────── */}
        {requirements.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">Requirements</h2>
            <div className="bg-surface rounded-xl border border-border p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {requirements.map((req, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-1.5">
                    <div className="w-4 h-4 rounded border border-border flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <span className="text-sm text-ink leading-snug">{req}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Deliverables + Evaluation — two-col ──────────────────── */}
        {(deliverables.length > 0 || evalCriteria.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {deliverables.length > 0 && (
              <section className="bg-surface rounded-xl border border-border p-5">
                <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-3">Deliverables</h2>
                <ul className="space-y-2">
                  {deliverables.map((d, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-ink">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: courseColor }} />
                      {d}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {evalCriteria.length > 0 && (
              <section className="bg-surface rounded-xl border border-border p-5">
                <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-3">How You&apos;ll Be Evaluated</h2>
                <ul className="space-y-2">
                  {evalCriteria.map((c, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-ink">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-amber-400" />
                      {c}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {/* ── Tips ──────────────────────────────────────────────────── */}
        {tips.length > 0 && (
          <section className="bg-brand/[0.04] rounded-xl border border-brand/10 p-5">
            <h2 className="text-xs font-bold text-brand uppercase tracking-widest mb-3 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
              Tips &amp; Guidance
            </h2>
            <ul className="space-y-2">
              {tips.map((t, i) => (
                <li key={i} className="text-sm text-ink-secondary leading-relaxed pl-5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-brand/40">
                  {t}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Getting Started ──────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">Getting Started</h2>
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Left — template + clone */}
              <div>
                <a href={`https://github.com/nikhildesilva-squareai/starter-${toSlug(project.title)}/generate`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#0A0A0A] hover:bg-[#161616] transition-all group mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" className="shrink-0">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61C4.42 17.92 3.63 17.5 3.63 17.5c-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.92 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23A11.5 11.5 0 0112 5.8c1.02.01 2.04.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.21 0 1.6-.02 2.89-.02 3.28 0 .32.22.7.83.58A12 12 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Use this template</p>
                    <p className="text-[10px] text-slate-400">Creates a new repo from our starter</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                </a>
                <div className="rounded-xl bg-slate-950 px-4 py-3">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">Or clone directly</p>
                  <code className="text-[11px] text-slate-300 font-mono break-all select-all leading-relaxed">
                    git clone https://github.com/nikhildesilva-squareai/starter-{toSlug(project.title)}.git
                  </code>
                </div>
              </div>
              {/* Right — steps */}
              <div className="space-y-3">
                {[
                  "Clone the starter template",
                  "Build the project following the requirements",
                  "Push to your own public GitHub repo",
                  "Submit the repo URL below for AI review",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: courseColor }}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-ink leading-relaxed pt-0.5">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Submit / Score ────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">
            {hasResult ? "Submission Result" : "Submit Your Project"}
          </h2>
          <div className="bg-surface rounded-xl border border-border p-5">
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

        {/* ── Career relevance + course link footer ─────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 pb-4 border-t border-border">
          {careerRelevance && (
            <p className="text-xs text-ink-muted leading-relaxed">{careerRelevance}</p>
          )}
          <Link href={`/courses/${course?.slug}`}
            className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-brand/30 hover:bg-surface transition-all text-sm text-ink-secondary hover:text-brand">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: `${courseColor}15` }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={courseColor} strokeWidth="2.5" strokeLinecap="round">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
            </div>
            {course?.title} →
          </Link>
        </div>
      </div>
    </div>
  );
}
