import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/budget";
import { GRADING_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { z } from "zod";
import { rateLimitAI } from "@/lib/rate-limit";
import { fetchRepo, enrichCodeComments } from "@/lib/github/fetch-repo";
import { scoreObjective, type GradingConfig, type ObjectiveResult } from "@/lib/grading/objective";
import { reviewProject, type RubricCriterion } from "@/lib/grading/project-review";
import { checkAndMarkEnrollmentComplete } from "@/lib/enrollment-completion";

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
    // Review core lives in lib/grading/project-review.ts so the calibration
    // harness exercises the identical path; this only injects budget-checked callAI.
    const review = await reviewProject(
      project, rubric, githubUrl, repoAnalysis, description, objective,
      async ({ system, userContent, max_tokens }) => {
        const r = await callAI(student.id, {
          feature: "grading",
          system,
          max_tokens,
          temperature: 0,
          messages: [{ role: "user", content: userContent }],
        });
        return { text: r.text };
      },
      GRADING_SYSTEM_PROMPT,
    );

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

    // ── Check if enrollment is now complete ──────────────────────────────────
    const admin = createAdminClient();
    const enrollmentCompleted = await checkAndMarkEnrollmentComplete(enrollment.id, admin);

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
      enrollmentCompleted,
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
