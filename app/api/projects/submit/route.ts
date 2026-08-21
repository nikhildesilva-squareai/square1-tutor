import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/budget";
import { GRADING_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { z } from "zod";
import { rateLimitAI } from "@/lib/rate-limit";
import { fetchRepo, enrichCodeComments } from "@/lib/github/fetch-repo";
import { scoreObjective, type GradingConfig, type ObjectiveResult } from "@/lib/grading/objective";
import { verifyCiActions } from "@/lib/grading/ci";
import { reviewProject, type RubricCriterion } from "@/lib/grading/project-review";
import { checkAndMarkEnrollmentComplete } from "@/lib/enrollment-completion";
import { BOOTCAMP_PASS_BAR } from "@/lib/bootcamp";
import {
  loadGateSpine,
  checkGateEligibility,
  recordGateSubmission,
  postThreadMessage,
  renderAiReviewMessage,
  attemptsRemaining,
} from "@/lib/bootcamp-gate-service";
import { loadEnrolmentContext } from "@/app/(app)/bootcamp/_lib/cockpit";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  projectId: z.string().regex(UUID_REGEX, "Invalid projectId"),
  githubUrl: z.string().url("Invalid GitHub URL"),
  liveUrl: z.string().url("Invalid live URL").optional(),
  description: z.string().max(2000).optional(),
  // The student's tool OUTPUT (findings/IOCs/recovered text/scored register), pasted
  // for the objective completion check against the withheld answer key.
  output: z.string().max(20000).optional(),
  // BOOTCAMP ONLY. Present when this submission is the evidence for a gate, in
  // which case a harder bar, an attempt budget and a human sign-off apply. Its
  // ABSENCE must leave the self-paced path byte-for-byte as it was.
  gateId: z.string().regex(UUID_REGEX, "Invalid gateId").optional(),
});

const RUBRIC_BAR = 60;   // rubric % needed when an objective gate also applies
const SOLO_BAR = 70;     // rubric % needed when there is no objective gate
// The bootcamp bar (75) comes from lib/bootcamp/gates.ts — the same constant
// evaluateGate applies, so the number enforced at submission and the number
// enforced at review cannot drift apart.

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { projectId, githubUrl, liveUrl, description, output, gateId } = schema.parse(body);

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

    // ── 0. GATE BINDING (bootcamp only) ─────────────────────────────────────
    //
    // Resolved BEFORE any grading work: refusing after we have spent an AI call
    // and two GitHub round-trips on a submission the student was never allowed
    // to make is money and latency thrown away, and it tells them "no" a minute
    // later than we knew.
    //
    // Everything below reads the gate under the SERVICE ROLE, because
    // `bootcamp_gates.requires` carries no grant to `authenticated` (migration
    // 021) — it is a withheld answer key. The thresholds never leave this route.
    const admin = createAdminClient();
    let gateBinding: {
      gateId: string;
      title: string;
      enrolmentId: string;
      previousAttempts: number;
      hasExistingRow: boolean;
      bar: number;
    } | null = null;

    if (gateId) {
      const ctx = await loadEnrolmentContext();
      if (!ctx) {
        return NextResponse.json(
          { error: "You are not enrolled in a bootcamp cohort." },
          { status: 403 },
        );
      }
      // A suspended enrolment loses live access AND gate submissions — /bootcamp/home
      // says so in the billing banner, and a gate accepted while payment has failed
      // would contradict it.
      if (ctx.enrolment.status !== "active") {
        return NextResponse.json(
          { error: "Gate submissions are paused while your enrolment is not active." },
          { status: 403 },
        );
      }

      const spine = await loadGateSpine(admin, ctx.bootcamp.id, ctx.enrolment.id);
      const gate = spine.gates.find((g) => g.id === gateId);
      // A gate from ANOTHER bootcamp is not "not found" by accident — it is the
      // shape a cross-cohort forgery attempt takes. Same 404 either way.
      if (!gate) return NextResponse.json({ error: "Gate not found" }, { status: 404 });

      const eligibility = checkGateEligibility(spine, gate.id, new Date());
      if (!eligibility.allowed) {
        return NextResponse.json(
          { error: eligibility.reason ?? "This gate is not open to you.", gateBlocked: true },
          { status: 409 },
        );
      }

      // The gate names the projects that count as its evidence. Submitting an
      // unrelated project against it would let a student clear a capstone gate
      // with a week-2 exercise.
      const gateProjects = gate.requires.project_ids ?? [];
      if (gateProjects.length > 0 && !gateProjects.includes(projectId)) {
        return NextResponse.json(
          { error: "That project is not the evidence this gate asks for." },
          { status: 400 },
        );
      }

      const existing = spine.results.get(gate.id) ?? null;
      gateBinding = {
        gateId: gate.id,
        title: gate.title,
        enrolmentId: ctx.enrolment.id,
        previousAttempts: existing?.attempts ?? 0,
        hasExistingRow: !!existing,
        // requires.min_score when the gate sets one, otherwise the bootcamp bar.
        // Never the self-paced 60/70.
        bar: gate.requires.min_score ?? BOOTCAMP_PASS_BAR,
      };
    }

    const rubric: RubricCriterion[] = Array.isArray(project.rubric) ? (project.rubric as RubricCriterion[]) : [];
    const grading = (project.grading ?? null) as GradingConfig | null;
    const hasObjective = !!(grading && grading.metric);

    // ── 1. OBJECTIVE check (token-free): student output vs withheld answer key,
    //       or — for ci_actions kits — live GitHub verification that the kit's
    //       unmodified contract tests pass in Actions on the current HEAD. ──
    let objective: ObjectiveResult | null = null;
    if (hasObjective) {
      objective = (grading as GradingConfig).metric === "ci_actions"
        ? await verifyCiActions(githubUrl, grading as GradingConfig)
        : scoreObjective(grading as GradingConfig, output ?? "");
    }

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
    // A gate submission is held to the bootcamp bar on BOTH branches — the
    // 60-with-an-objective concession is a self-paced affordance, and people
    // paying for a cohort are paying for the harder standard.
    const objectiveBar = gateBinding ? gateBinding.bar : RUBRIC_BAR;
    const soloBar = gateBinding ? gateBinding.bar : SOLO_BAR;
    const complete = hasObjective
      ? !!objective?.passed && rubricPct >= objectiveBar
      : rubricPct >= soloBar;

    // ── 4. Re-submission history ────────────────────────────────────────────
    const { data: existingSubmission } = await supabase
      .from("project_submissions")
      .select("score, max_score, breakdown, attempt_number, submission_history, submitted_at, in_portfolio")
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

    // Publishing is the student's choice, never a side effect of passing.
    // /portfolio/[studentId] is a public page carrying their name and scores,
    // so nothing lands there until they ask for it on the result screen. A
    // student who already opted in keeps that choice across re-submissions.
    const inPortfolio = existingSubmission?.in_portfolio ?? false;

    // Service role: students hold no write privilege on the grade tables, so a
    // score can only be set by this route, after Nova has actually graded the
    // work. student_id comes from the session, never the request body.
    const { data: submission, error: upsertError } = await admin
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

    // ── Check if enrollment is now complete ──────────────────────────────────
    const enrollmentCompleted = await checkAndMarkEnrollmentComplete(enrollment.id, admin);

    // ── 5. GATE RESULT + FEEDBACK THREAD (bootcamp only) ────────────────────
    //
    // status goes to 'submitted' and NEVER to 'passed'. The AI has scored; the
    // decision is a human's, made on /desk/bootcamp/gates, and the DB CHECK
    // bootcamp_gate_results_decision_attributed refuses a decided row that names
    // no reviewer anyway. `attempts` is incremented inside recordGateSubmission,
    // which is the single place that number moves.
    let gateResponse: {
      gateId: string;
      status: "submitted";
      attempt: number;
      attemptsRemaining: number;
      bar: number;
    } | null = null;

    if (gateBinding) {
      // The two columns mean different things and must not double-count one
      // result: a `ci_actions` kit is verified by GitHub Actions (ci_passed),
      // everything else by the withheld answer key (objective_passed).
      const isCi = !!objective && objective.metric === "ci_actions";
      const objectivePassed = objective && !isCi ? objective.passed : null;
      const ciPassed = isCi ? objective!.passed : null;

      const recorded = await recordGateSubmission(admin, {
        enrolmentId: gateBinding.enrolmentId,
        gateId: gateBinding.gateId,
        submissionId: submission.id,
        rubricPct,
        autoScore: review.score,
        objectivePassed,
        ciPassed,
        previousAttempts: gateBinding.previousAttempts,
        hasExistingRow: gateBinding.hasExistingRow,
      });

      if (recorded.error) {
        // The grade is saved either way; what failed is the gate binding. Say so
        // rather than returning a success that quietly did not count.
        console.error("[projects/submit] gate result write:", recorded.error);
        return NextResponse.json(
          { error: "Your work was graded but the gate did not record it. Contact the desk before resubmitting." },
          { status: 500 },
        );
      }

      // Message #1 of the private thread. Service role, because the migration-021
      // trigger forces author_kind='student' on any authenticated insert — which
      // is exactly the protection that stops a student manufacturing a sign-off.
      await postThreadMessage(admin, {
        submissionId: submission.id,
        authorKind: "ai",
        authorId: null,
        bodyMd: renderAiReviewMessage({
          gateTitle: gateBinding.title,
          rubricPct,
          attempt: recorded.attempts,
          strengths: review.strengths ?? [],
          improvements: review.improvements ?? [],
          overallFeedback: review.overall_feedback ?? "",
          objectivePassed,
          ciPassed,
        }),
      });

      gateResponse = {
        gateId: gateBinding.gateId,
        status: "submitted",
        attempt: recorded.attempts,
        attemptsRemaining: attemptsRemaining(recorded.attempts),
        bar: gateBinding.bar,
      };
    }

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
      // Null on every self-paced submission — the shape of the response is
      // otherwise unchanged.
      gate: gateResponse,
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
