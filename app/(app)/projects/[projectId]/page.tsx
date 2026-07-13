import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SubmissionForm, ScoreDisplay } from "./SubmissionForm";
import { ProjectNotesPanel } from "./ProjectNotesPanel";
import { RichContent } from "@/components/ui/rich-content";
import type { Project, ProjectSubmission, ProjectRubricCriterion, ProjectReference, ProjectDataCard } from "@/types/database";
import { scaleWeek, weekDueDate, projectStatus, countdownLabel, fmtDate, STATUS_STYLE, type ProjectStatus } from "@/lib/schedule";

export const revalidate = 120;

interface PageProps { params: Promise<{ projectId: string }> }

// The hero + "At a glance" strip already show the title and the
// "Course · Project N · difficulty · hours · stack" meta, so drop a leading
// duplicate of them from the brief body — only when they actually match, so
// briefs that don't lead with a title are untouched.
function stripRedundantHeader(md: string, title: string): string {
  const lines = (md ?? "").replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  const h = lines[i]?.match(/^#{1,3}\s+(.+?)\s*$/);
  if (h && h[1].replace(/[*_`]/g, "").trim().toLowerCase() === title.trim().toLowerCase()) {
    lines.splice(i, 1);
    while (i < lines.length && lines[i].trim() === "") lines.splice(i, 1);
    if (/^\*\*Course:?\*\*/i.test(lines[i]?.trim() ?? "")) {
      lines.splice(i, 1);
      while (i < lines.length && lines[i].trim() === "") lines.splice(i, 1);
    }
  }
  return lines.join("\n").trim();
}


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
  let myNotes: { id: string; title: string | null; content: string; type: string; lesson_title: string | null; tags: string[] }[] = [];
  if (student) {
    const { data } = await supabase.from("project_submissions").select("*").eq("student_id", student.id).eq("project_id", projectId).maybeSingle() as { data: ProjectSubmission | null };
    submission = data;

    // The learner's own code snippets + bug-fix logs for this course, for the
    // side panel — their personal reference while building the project.
    const { data: notes } = await supabase
      .from("study_notes")
      .select("id, title, content, type, lesson_title, tags")
      .eq("student_id", student.id)
      .eq("course_id", project.course_id)
      .or("type.eq.code_snippet,tags.cs.{error-log}")
      .order("created_at", { ascending: false })
      .limit(50);
    myNotes = notes ?? [];
  }

  // Rolling deadline for this learner (enrolled + project scheduled)
  let due: Date | null = null;
  let dueStatus: ProjectStatus | null = null;
  const schedWeek = (project as unknown as { schedule_week?: number | null }).schedule_week ?? null;
  if (student && schedWeek != null) {
    const { data: enr } = await supabase
      .from("student_enrollments")
      .select("enrolled_at, plan_months")
      .eq("student_id", student.id).eq("course_id", project.course_id).eq("status", "active").maybeSingle();
    if (enr?.enrolled_at) {
      due = weekDueDate(new Date(enr.enrolled_at as string), scaleWeek(schedWeek, enr.plan_months as number | null));
      dueStatus = projectStatus(due, !!(submission && submission.score !== null));
    }
  }

  const techStack = project.tech_stack ?? [];
  const courseColor = course?.color ?? "#0056CE";
  const hasResult = submission && submission.score !== null;

  const rubric: ProjectRubricCriterion[] = Array.isArray(project.rubric) ? project.rubric : [];
  const refs: ProjectReference[] = Array.isArray(project.reference_links) ? project.reference_links : [];
  const rubricTotal = rubric.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);

  // Structured brief content the old page never surfaced.
  const requirements: string[] = Array.isArray(project.requirements)
    ? project.requirements.filter((r): r is string => typeof r === "string" && r.trim().length > 0)
    : [];
  const milestoneLabels: string[] = Array.isArray(project.milestone_checkpoints)
    ? project.milestone_checkpoints
        .map((m) => {
          if (typeof m === "string") return m;
          const o = (m ?? {}) as Record<string, unknown>;
          return String(o.title ?? o.label ?? o.name ?? o.step ?? o.text ?? "");
        })
        .filter((s) => s.trim().length > 0)
    : [];
  const diffHex: Record<string, string> = { beginner: "#22C55E", intermediate: "#F59E0B", advanced: "#EF4444" };
  const diffColor = diffHex[project.difficulty] ?? "#F59E0B";

  const dataCard: ProjectDataCard | null =
    project.data_card && typeof project.data_card === "object" && !Array.isArray(project.data_card)
      ? (project.data_card as ProjectDataCard)
      : null;
  const dcCols = Array.isArray(dataCard?.columns) ? dataCard!.columns : [];
  const dcRows = Array.isArray(dataCard?.sample_rows) ? dataCard!.sample_rows : [];
  const dcHeaders = dcCols.length > 0 ? dcCols.map((c) => c.name) : Object.keys(dcRows[0] ?? {});

  const showNotesPanel = !!student;

  return (
    <div className="min-h-full bg-surface-soft">
      {showNotesPanel && <ProjectNotesPanel snippets={myNotes} courseTitle={course?.title ?? "this course"} />}

      {/* ── Hero (course-coloured, with depth) ────────────────────────── */}
      <div className="relative overflow-hidden border-b border-white/10"
        style={{ background: `radial-gradient(90% 130% at 88% -20%, rgba(255,255,255,0.20), transparent 55%), linear-gradient(135deg, ${courseColor}, color-mix(in srgb, ${courseColor} 55%, #000))` }}>
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "34px 34px", WebkitMaskImage: "radial-gradient(80% 120% at 85% 0, #000, transparent 70%)", maskImage: "radial-gradient(80% 120% at 85% 0, #000, transparent 70%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-9">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs mb-5">
            <Link href="/projects" className="text-white/70 hover:text-white transition-colors">Projects</Link>
            <span className="text-white/40">/</span>
            <Link href={`/courses/${course?.slug}`} className="text-white/70 hover:text-white transition-colors">{course?.title}</Link>
            <span className="text-white/40">/</span>
            <span className="text-white/90">{project.title}</span>
          </div>

          {/* Title + badges */}
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{project.title}</h1>
            <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/15 text-white border border-white/25 capitalize">
              {project.difficulty}
            </span>
            {hasResult && (
              <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-100 border border-emerald-400/30">
                {submission!.score}/{submission!.max_score}
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-x-5 gap-y-2 text-xs text-white/80 flex-wrap">
            <span className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              {project.estimated_hours}h estimated
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
              Project {project.order_index + 1} of {course?.total_projects ?? "?"}
            </span>
            {due && dueStatus && (
              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${STATUS_STYLE[dueStatus].cls}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                Due {fmtDate(due)}{dueStatus !== "done" && <> · {countdownLabel(due)}</>}
              </span>
            )}
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── At a glance ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
            <div className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-1.5">Difficulty</div>
            <div className="flex items-center gap-2 text-sm font-bold text-ink capitalize"><span className="w-2.5 h-2.5 rounded-full" style={{ background: diffColor }} />{project.difficulty}</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
            <div className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-1.5">Est. time</div>
            <div className="text-sm font-bold text-ink">{project.estimated_hours} hours</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
            <div className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-1.5">Deliverables</div>
            <div className="text-sm font-bold text-ink">{requirements.length > 0 ? `${requirements.length} to meet` : "See brief"}</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
            <div className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-1.5">Scoring</div>
            <div className="text-sm font-bold text-ink">Nova review{rubricTotal ? ` · ${rubricTotal}%` : ""}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1.6fr)_340px] gap-6 items-start">

          {/* ═══ MAIN COLUMN ═══ */}
          <div className="space-y-6 min-w-0">

            {/* Result (only once graded) */}
            {hasResult && (
              <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-card">
                <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">Your result</h2>
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
              </section>
            )}

            {/* ── Overview (the brief) ─────────────────────────────────── */}
            <section className="bg-surface rounded-2xl border border-border p-5 sm:p-7 shadow-card">
              <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={courseColor} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                Overview
              </h2>
              <RichContent content={stripRedundantHeader(project.description_md, project.title)} />
            </section>

            {/* ── What you'll deliver (surfaced from requirements[]) ────── */}
            {requirements.length > 0 && (
              <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-card">
                <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={courseColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                  What you&apos;ll deliver
                </h2>
                <p className="text-xs text-ink-muted mb-4">Your submission has to meet each of these — it&apos;s exactly what Nova checks against.</p>
                <ul className="space-y-2.5">
                  {requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: `${courseColor}18`, color: courseColor }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </span>
                      <span className="text-sm text-ink-secondary leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ── Milestones (if authored) ─────────────────────────────── */}
            {milestoneLabels.length > 0 && (
              <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-card">
                <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={courseColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  Milestones
                </h2>
                <ol className="space-y-3">
                  {milestoneLabels.map((m, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: courseColor }}>{i + 1}</span>
                      <span className="text-sm text-ink-secondary leading-relaxed pt-0.5">{m}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* ── Dataset ─────────────────────────────────────────────── */}
            {(project.dataset_source || project.dataset_url) && (
              <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-card">
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
                    The dataset ships with the project starter. It&apos;s 100% synthetic and Square 1-owned — the same standardized dataset every learner uses.
                  </p>
                )}
              </section>
            )}

            {/* ── Data card (columns + sample rows) ───────────────────────── */}
            {dataCard && (dcCols.length > 0 || dataCard.summary) && (
              <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-card">
                <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={courseColor} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></svg>
                  The data
                </h2>
                {dataCard.summary && <p className="text-sm text-ink-secondary leading-relaxed mb-4">{dataCard.summary}</p>}

                {dcCols.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-border mb-4">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-surface-tint/60 border-b border-border">
                          <th className="text-left px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Column</th>
                          <th className="text-left px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Type</th>
                          <th className="text-left px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dcCols.map((c, i) => (
                          <tr key={i} className="border-b border-border/60 last:border-0">
                            <td className="px-3 py-2 font-mono text-[13px] text-ink font-medium whitespace-nowrap">{c.name}</td>
                            <td className="px-3 py-2 text-ink-muted whitespace-nowrap">{c.type}</td>
                            <td className="px-3 py-2 text-ink-secondary">{c.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {dcRows.length > 0 && dcHeaders.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">Sample rows</p>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-surface-tint/60 border-b border-border">
                            {dcHeaders.map((h) => (
                              <th key={h} className="text-left px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dcRows.slice(0, 6).map((row, i) => (
                            <tr key={i} className="border-b border-border/60 last:border-0">
                              {dcHeaders.map((h) => (
                                <td key={h} className="px-3 py-2 text-ink-secondary font-mono text-[12px] whitespace-nowrap">
                                  {String((row as Record<string, unknown>)[h] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {dataCard.notes && <p className="text-xs text-ink-muted leading-relaxed mt-3">{dataCard.notes}</p>}
              </section>
            )}

            {/* ── Marking rubric ──────────────────────────────────────────── */}
            {rubric.length > 0 && (
              <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-card">
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

            {/* ── Further reading (cards) ──────────────────────────────── */}
            {refs.length > 0 && (
              <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-card">
                <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={courseColor} strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                  Further reading
                </h2>
                <div className="space-y-2.5">
                  {refs.map((r, i) => (
                    <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="group flex items-start gap-3 rounded-xl border border-border p-3.5 transition-colors hover:border-brand/30 hover:bg-surface-tint/40">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-brand">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-brand group-hover:underline">{r.title} ↗</span>
                        {r.note && <span className="block text-xs text-ink-muted leading-relaxed mt-0.5">{r.note}</span>}
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ═══ ACTION RAIL (sticky) ═══ */}
          <aside className="lg:sticky lg:top-6 space-y-4">

            {/* Status */}
            <div className="bg-surface rounded-2xl border border-border p-5 shadow-card">
              <div className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-3">Your status</div>
              <span className="mb-3 inline-flex rounded-full px-3 py-1 text-xs font-bold" style={{ background: hasResult ? "rgba(25,166,95,0.14)" : `${courseColor}18`, color: hasResult ? "#19A65F" : courseColor }}>
                {hasResult ? "Completed" : "Not started"}
              </span>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-ink-muted">Difficulty</span><span className="font-medium text-ink capitalize">{project.difficulty}</span></div>
                <div className="flex items-center justify-between"><span className="text-ink-muted">Estimated</span><span className="font-medium text-ink">{project.estimated_hours}h</span></div>
                {due && dueStatus && (
                  <div className="flex items-center justify-between"><span className="text-ink-muted">Due</span><span className="font-medium text-ink">{fmtDate(due)}</span></div>
                )}
                {hasResult && (
                  <div className="flex items-center justify-between"><span className="text-ink-muted">Score</span><span className="font-bold text-emerald-600">{submission!.score}/{submission!.max_score}</span></div>
                )}
              </div>
            </div>

            {/* Getting started */}
            <div className="bg-surface rounded-2xl border border-border p-5 shadow-card">
              <div className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-3">Getting started</div>
              {project.starter_repo_url && (
                <>
                  <a href={`${project.starter_repo_url}/generate`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-brand hover:bg-brand/90 transition-all mb-2.5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" className="shrink-0"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61C4.42 17.92 3.63 17.5 3.63 17.5c-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.92 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23A11.5 11.5 0 0112 5.8c1.02.01 2.04.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.21 0 1.6-.02 2.89-.02 3.28 0 .32.22.7.83.58A12 12 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">Use this template</p>
                      <p className="text-[10px] text-white/70">New repo from our starter (code + dataset)</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                  </a>
                  <div className="rounded-xl bg-slate-950 px-3.5 py-3 mb-4">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">Or clone directly</p>
                    <code className="text-[11px] text-slate-300 font-mono break-all select-all leading-relaxed">git clone {project.starter_repo_url}.git</code>
                  </div>
                </>
              )}
              <div className="space-y-2.5">
                {[
                  "Read the brief — it lists what to build, the data, and how you're scored",
                  project.starter_repo_url ? "Clone the starter template (code + dataset included)" : "Set up your repo and generate the dataset as described",
                  "Build the project, meeting every deliverable",
                  "Push to a public GitHub repo, then submit below for AI review",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: courseColor }}>{i + 1}</span>
                    <span className="text-[13px] text-ink-secondary leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            {!hasResult && (
              <div className="bg-surface rounded-2xl border border-border p-5 shadow-card">
                <div className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-3">Submit for review</div>
                <SubmissionForm
                  projectId={projectId}
                  submitFormat={(project as unknown as { grading?: { submit_format?: string } | null }).grading?.submit_format ?? null}
                />
              </div>
            )}
          </aside>
        </div>

        {/* ── Footer course link ──────────────────────────────────────── */}
        <div className="flex items-center justify-end pt-8 mt-8 border-t border-border">
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
