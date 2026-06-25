import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/budget";
import { z } from "zod";
import { rateLimitAI } from "@/lib/rate-limit";
import { fetchRepo, formatRepoForReview, enrichCodeComments, type RepoAnalysis } from "@/lib/github/fetch-repo";
import { scoreObjective, type GradingConfig, type ObjectiveResult } from "@/lib/grading/objective";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  projectId: z.string().regex(UUID_REGEX, "Invalid projectId"),
  githubUrl: z.string().url("Invalid GitHub URL"),
  liveUrl: z.string().url("Invalid live URL").optional(),
  description: z.string().max(2000).optional(),
  // The student's tool OUTPUT (findings/IOCs/recovered text/scored register), pasted
  // for the objective completion check against the withheld answer key.
  output: z.string().max(20000).optional(),
});

interface RubricCriterion { criterion: string; weight: number; description?: string }

const RUBRIC_BAR = 60;   // rubric % needed when an objective gate also applies
const SOLO_BAR = 70;     // rubric % needed when there is no objective gate

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { projectId, githubUrl, liveUrl, description, output } = schema.parse(body);

    const { data: student } = await supabase
      .from("students").select("id").eq("user_id", user.id).maybeSingle();
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const rl = rateLimitAI(student.id);
    if (!rl.success) return rl.response;

    // Fetch project incl. the real rubric + private grading config
    const { data: project } = await supabase
      .from("projects")
      .select("id, title, description_md, difficulty, tech_stack, requirements, rubric, grading, course_id")
      .eq("id", projectId)
      .maybeSingle();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { data: enrollment } = await supabase
      .from("student_enrollments")
      .select("id").eq("student_id", student.id).eq("course_id", project.course_id).maybeSingle();
    if (!enrollment) return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });

    const rubric: RubricCriterion[] = Array.isArray(project.rubric) ? (project.rubric as RubricCriterion[]) : [];
    const grading = (project.grading ?? null) as GradingConfig | null;
    const hasObjective = !!(grading && grading.metric);

    // ── 1. OBJECTIVE check (token-free): student output vs withheld answer key ──
    let objective: ObjectiveResult | null = null;
    if (hasObjective) objective = scoreObjective(grading as GradingConfig, output ?? "");

    // ── 2. AI rubric review of the actual code, against THIS project's rubric ──
    const repoAnalysis = await fetchRepo(githubUrl);
    const reviewPrompt = buildReviewPrompt(project, rubric, githubUrl, repoAnalysis, description, objective);
    const aiResult = await callAI(student.id, {
      system: SYSTEM_PROMPT,
      max_tokens: 2048,
      temperature: 0,
      messages: [{ role: "user", content: reviewPrompt }],
    });

    let review: ReviewResult;
    try {
      review = JSON.parse(aiResult.text || "{}");
    } catch {
      review = fallbackReview(rubric);
    }
    if (!Array.isArray(review.breakdown) || review.breakdown.length === 0) review = fallbackReview(rubric);

    const enrichedComments = enrichCodeComments(review.code_comments ?? [], repoAnalysis);

    // ── 3. Completion gate ──────────────────────────────────────────────────
    const rubricPct = review.max_score ? (review.score / review.max_score) * 100 : 0;
    const complete = hasObjective
      ? !!objective?.passed && rubricPct >= RUBRIC_BAR
      : rubricPct >= SOLO_BAR;
    const inPortfolio = complete;

    // ── 4. Re-submission history ────────────────────────────────────────────
    const { data: existingSubmission } = await supabase
      .from("project_submissions")
      .select("score, max_score, breakdown, attempt_number, submission_history, submitted_at")
      .eq("student_id", student.id).eq("project_id", projectId).maybeSingle();

    let attemptNumber = 1;
    let submissionHistory: { attempt: number; score: number; max_score: number; breakdown: unknown[]; submitted_at: string }[] = [];
    if (existingSubmission && existingSubmission.score !== null) {
      const prevHistory = (existingSubmission.submission_history ?? []) as typeof submissionHistory;
      submissionHistory = [
        ...prevHistory,
        {
          attempt: existingSubmission.attempt_number ?? prevHistory.length + 1,
          score: existingSubmission.score,
          max_score: existingSubmission.max_score,
          breakdown: existingSubmission.breakdown ?? [],
          submitted_at: existingSubmission.submitted_at,
        },
      ];
      attemptNumber = (existingSubmission.attempt_number ?? submissionHistory.length) + 1;
    }

    const { data: submission, error: upsertError } = await supabase
      .from("project_submissions")
      .upsert(
        {
          student_id: student.id,
          project_id: projectId,
          github_url: githubUrl,
          live_url: liveUrl ?? null,
          description: description ?? null,
          student_output: output ?? null,
          score: review.score,
          max_score: review.max_score,
          objective_score: objective ? objective.score : null,
          objective_detail: objective ? { ...objective, threshold: grading?.threshold ?? null } : null,
          breakdown: review.breakdown,
          overall_feedback: review.overall_feedback,
          strengths: review.strengths,
          improvements: review.improvements,
          code_comments: enrichedComments,
          submission_history: submissionHistory,
          attempt_number: attemptNumber,
          in_portfolio: inPortfolio,
          submitted_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
        },
        { onConflict: "student_id,project_id" }
      )
      .select("id").single();

    if (upsertError) {
      console.error("[projects/submit] upsert error:", upsertError);
      return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
    }

    await supabase
      .from("student_projects")
      .update({ status: "submitted", updated_at: new Date().toISOString() })
      .eq("student_id", student.id).eq("project_id", projectId);

    const previousAttempt = submissionHistory.length > 0 ? submissionHistory[submissionHistory.length - 1] : null;

    return NextResponse.json({
      submissionId: submission.id,
      score: review.score,
      max_score: review.max_score,
      breakdown: review.breakdown,
      overall_feedback: review.overall_feedback,
      strengths: review.strengths,
      improvements: review.improvements,
      code_comments: enrichedComments,
      attempt_number: attemptNumber,
      in_portfolio: inPortfolio,
      complete,
      objective: objective
        ? { score: objective.score, passed: objective.passed, metric: objective.metric, detail: objective.detail, threshold: grading?.threshold ?? null, error: objective.error ?? null }
        : null,
      objective_required: hasObjective,
      previous_attempt: previousAttempt,
      repo_stats: {
        totalFiles: repoAnalysis.totalFiles,
        filesReviewed: repoAnalysis.files.length,
        detectedStack: repoAnalysis.detectedStack,
        hasReadme: repoAnalysis.hasReadme,
        hasTests: repoAnalysis.hasTests,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: err.issues }, { status: 400 });
    }
    console.error("[projects/submit]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReviewResult {
  score: number;
  max_score: number;
  breakdown: { criterion: string; score: number; max: number; feedback: string }[];
  overall_feedback: string;
  strengths: string[];
  improvements: string[];
  code_comments: { file: string; line?: number; comment: string; severity: "info" | "warning" | "error" }[];
}

const GENERIC_RUBRIC: RubricCriterion[] = [
  { criterion: "Completeness", weight: 25 },
  { criterion: "Code Quality", weight: 25 },
  { criterion: "Error Handling", weight: 15 },
  { criterion: "Testing", weight: 10 },
  { criterion: "Documentation", weight: 15 },
  { criterion: "Best Practices", weight: 10 },
];

function fallbackReview(rubric: RubricCriterion[]): ReviewResult {
  const r = rubric.length ? rubric : GENERIC_RUBRIC;
  const breakdown = r.map((c) => ({
    criterion: c.criterion,
    score: Math.round((c.weight ?? 0) * 0.5),
    max: c.weight ?? 0,
    feedback: "Unable to fully evaluate — the AI reviewer couldn't parse this submission. Please re-submit.",
  }));
  return {
    score: breakdown.reduce((s, b) => s + b.score, 0),
    max_score: breakdown.reduce((s, b) => s + b.max, 0) || 100,
    breakdown,
    overall_feedback: "Submission received. The AI reviewer hit a parsing issue — please re-submit.",
    strengths: ["Project submitted successfully"],
    improvements: ["Re-submit so the reviewer can fully evaluate your code"],
    code_comments: [],
  };
}

// ─── System prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior engineer reviewing a student's project submission. You have their actual source code from GitHub.

Your review must be:
- HONEST: if the code is weak, say so — don't inflate scores.
- SPECIFIC: reference actual files and code patterns you see.
- ACTIONABLE: every criticism includes what to do instead.
- ENCOURAGING: acknowledge genuine strengths.

You grade against the project's OWN rubric (provided). Score each criterion from 0 to its max. A correctness/detection criterion should reward code that actually implements the required behaviour — not just code that looks plausible.

Always respond with valid JSON only — no markdown fences, no extra text.`;

// ─── Build the review prompt: real brief + this project's rubric ──────────────

function buildReviewPrompt(
  project: { title: string; description_md?: string | null; difficulty: string; tech_stack: string[] },
  rubric: RubricCriterion[],
  githubUrl: string,
  repo: RepoAnalysis,
  description: string | undefined,
  objective: ObjectiveResult | null,
): string {
  const r = rubric.length ? rubric : GENERIC_RUBRIC;
  const total = r.reduce((s, c) => s + (Number(c.weight) || 0), 0) || 100;
  const repoContext = formatRepoForReview(repo);
  const codeAvailable = !repo.error && repo.files.length > 0;
  const brief = (project.description_md ?? "").slice(0, 4000);

  const rubricLines = r.map((c, i) => `${i + 1}. ${c.criterion} (0–${c.weight})${c.description ? ` — ${c.description}` : ""}`).join("\n");
  const breakdownTemplate = r
    .map((c) => `    { "criterion": ${JSON.stringify(c.criterion)}, "score": <0..${c.weight}>, "max": ${c.weight}, "feedback": "Specific feedback referencing actual code" }`)
    .join(",\n");

  const objectiveNote = objective
    ? `\n## Objective check (already computed, do NOT re-score it)
An automated check compared the student's submitted output to the hidden answer key: metric=${objective.metric}, score=${Math.round(objective.score * 100)}%, passed=${objective.passed}${objective.error ? `, note="${objective.error}"` : ""}. Use this as a strong signal of whether their tool actually works when scoring the correctness/detection criterion, but still score code quality, docs, etc. on their own merits.\n`
    : "";

  return `# Project Review Request

## Project Brief
**Title:** ${project.title}
**Difficulty:** ${project.difficulty}
**Tech stack:** ${(project.tech_stack ?? []).join(", ") || "n/a"}

${brief ? `### Full brief\n${brief}\n` : ""}
## Student Submission
**GitHub:** ${githubUrl}
${description ? `**Student notes:** ${description}` : ""}
${objectiveNote}
${repoContext}

---

## Your Task
${codeAvailable
    ? "You have the student's actual source code above. Review it thoroughly and reference SPECIFIC files in your feedback and code_comments."
    : `The repo could not be fetched (${repo.error}). Be transparent that you couldn't read the code and score conservatively.`}

Grade STRICTLY against THIS project's rubric (total ${total}). Score each criterion from 0 to its max:
${rubricLines}

Return EXACTLY this JSON (no markdown fences):
{
  "score": <sum of criterion scores>,
  "max_score": ${total},
  "breakdown": [
${breakdownTemplate}
  ],
  "overall_feedback": "3-4 sentences of specific, actionable feedback referencing files by name.",
  "strengths": ["Specific strength referencing code", "..."],
  "improvements": ["Specific improvement with what to change", "..."],
  "code_comments": [
    { "file": "path/to/file", "line": 42, "comment": "Actionable note", "severity": "error" }
  ]
}`;
}
