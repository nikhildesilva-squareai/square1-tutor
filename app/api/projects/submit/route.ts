import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/budget";
import { z } from "zod";
import { rateLimitAI } from "@/lib/rate-limit";
import { fetchRepo, formatRepoForReview, enrichCodeComments, type RepoAnalysis } from "@/lib/github/fetch-repo";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  projectId: z.string().regex(UUID_REGEX, "Invalid projectId"),
  githubUrl: z.string().url("Invalid GitHub URL"),
  liveUrl: z.string().url("Invalid live URL").optional(),
  description: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate inputs
    const body = await request.json();
    const { projectId, githubUrl, liveUrl, description } = schema.parse(body);

    // 3. Find student
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Rate limit: 15 AI requests per minute
    const rl = rateLimitAI(student.id);
    if (!rl.success) return rl.response;

    // 4. Fetch the project details
    const { data: project } = await supabase
      .from("projects")
      .select("id, title, description_md, difficulty, tech_stack, requirements, course_id")
      .eq("id", projectId)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 5. Verify enrollment for this project's course
    const { data: enrollment } = await supabase
      .from("student_enrollments")
      .select("id")
      .eq("student_id", student.id)
      .eq("course_id", project.course_id)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. FETCH ACTUAL CODE FROM GITHUB
    // ═══════════════════════════════════════════════════════════════════════════
    const repoAnalysis = await fetchRepo(githubUrl);

    // 7. Build the AI review prompt with real code
    const reviewPrompt = buildReviewPrompt(project, githubUrl, repoAnalysis, description);

    const aiResult = await callAI(student.id, {
      system: SYSTEM_PROMPT,
      max_tokens: 2048, // More tokens for detailed code feedback
      temperature: 0,
      messages: [{ role: "user", content: reviewPrompt }],
    });

    const responseText = aiResult.text || "{}";

    let review: ReviewResult;

    try {
      review = JSON.parse(responseText);
    } catch {
      // Fallback if AI returns malformed JSON
      review = {
        score: 50,
        max_score: 100,
        breakdown: [
          { criterion: "Completeness", score: 15, max: 25, feedback: "Unable to fully evaluate." },
          { criterion: "Code Quality", score: 10, max: 25, feedback: "Unable to fully evaluate." },
          { criterion: "Error Handling", score: 8, max: 15, feedback: "Unable to fully evaluate." },
          { criterion: "Testing", score: 5, max: 10, feedback: "Unable to fully evaluate." },
          { criterion: "Documentation", score: 7, max: 15, feedback: "Unable to fully evaluate." },
          { criterion: "Best Practices", score: 5, max: 10, feedback: "Unable to fully evaluate." },
        ],
        overall_feedback: "Submission received. The AI reviewer encountered an issue parsing the evaluation. Please try resubmitting.",
        strengths: ["Project submitted successfully"],
        improvements: ["Consider adding more detail in the notes field"],
        code_comments: [],
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 8. ENRICH CODE COMMENTS WITH ACTUAL SNIPPETS
    // ═══════════════════════════════════════════════════════════════════════════
    const enrichedComments = enrichCodeComments(
      review.code_comments ?? [],
      repoAnalysis,
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // 9. RE-SUBMISSION TRACKING — build history from previous attempt
    // ═══════════════════════════════════════════════════════════════════════════
    const { data: existingSubmission } = await supabase
      .from("project_submissions")
      .select("score, max_score, breakdown, attempt_number, submission_history, submitted_at")
      .eq("student_id", student.id)
      .eq("project_id", projectId)
      .maybeSingle();

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

    // Auto-portfolio: score >= 70 → show in portfolio
    const inPortfolio = review.score >= 70;

    // 10. Upsert into project_submissions
    const { data: submission, error: upsertError } = await supabase
      .from("project_submissions")
      .upsert(
        {
          student_id: student.id,
          project_id: projectId,
          github_url: githubUrl,
          live_url: liveUrl ?? null,
          description: description ?? null,
          score: review.score,
          max_score: review.max_score,
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
      .select("id")
      .single();

    if (upsertError) {
      console.error("[projects/submit] upsert error:", upsertError);
      return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
    }

    // 11. Also update student_projects status if it exists
    await supabase
      .from("student_projects")
      .update({ status: "submitted", updated_at: new Date().toISOString() })
      .eq("student_id", student.id)
      .eq("project_id", projectId);

    // Build previous attempt for diff display
    const previousAttempt = submissionHistory.length > 0
      ? submissionHistory[submissionHistory.length - 1]
      : null;

    // 12. Return result with enriched comments + history
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

// ─── System prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior software engineer at a top tech company, reviewing a student's project submission. You have access to their actual source code from GitHub.

Your review must be:
- HONEST: If the code is bad, say so. Don't inflate scores.
- SPECIFIC: Reference actual files and code patterns you see.
- ACTIONABLE: Every criticism must include what to do instead.
- ENCOURAGING: Acknowledge genuine strengths.

Score strictly but fairly. A beginner project with clean, working code can score 80+.
An advanced project with sloppy code should score lower.

Always respond with valid JSON only — no markdown fences, no extra text.`;

// ─── Build the review prompt with real code ──────────────────────────────────

function buildReviewPrompt(
  project: { title: string; description_md: string; difficulty: string; tech_stack: string[]; requirements: string[] },
  githubUrl: string,
  repo: RepoAnalysis,
  description?: string,
): string {
  const repoContext = formatRepoForReview(repo);
  const codeAvailable = !repo.error && repo.files.length > 0;

  return `# Project Review Request

## Project Brief
**Title:** ${project.title}
**Difficulty:** ${project.difficulty}
**Required Tech Stack:** ${(project.tech_stack ?? []).join(", ")}
**Requirements:**
${(project.requirements ?? []).map((r, i) => `${i + 1}. ${r}`).join("\n")}

## Student Submission
**GitHub:** ${githubUrl}
${description ? `**Student Notes:** ${description}` : ""}

${repoContext}

---

## Your Task

${codeAvailable
    ? `You have the student's actual source code above. Review it thoroughly.

For each criterion, reference SPECIFIC files and code patterns.
In code_comments, point to specific files (and line numbers if possible) with actionable feedback.`
    : `The repo could not be fetched (${repo.error}). Review based on what's available.
Be transparent that you couldn't read the code — score conservatively.`
}

Score out of 100:
- **Completeness** (requirements met, features working): /25
- **Code Quality** (clean code, naming, structure, DRY): /25
- **Error Handling** (edge cases, validation, graceful failures): /15
- **Testing** (has tests, test quality, coverage): /10
- **Documentation** (README, code comments, types): /15
- **Best Practices** (security, performance, accessibility): /10

Return this exact JSON structure (no markdown fences):
{
  "score": <total_number>,
  "max_score": 100,
  "breakdown": [
    { "criterion": "Completeness", "score": <number>, "max": 25, "feedback": "Specific feedback referencing actual code..." },
    { "criterion": "Code Quality", "score": <number>, "max": 25, "feedback": "..." },
    { "criterion": "Error Handling", "score": <number>, "max": 15, "feedback": "..." },
    { "criterion": "Testing", "score": <number>, "max": 10, "feedback": "..." },
    { "criterion": "Documentation", "score": <number>, "max": 15, "feedback": "..." },
    { "criterion": "Best Practices", "score": <number>, "max": 10, "feedback": "..." }
  ],
  "overall_feedback": "3-4 sentences of specific, actionable feedback. Reference files by name.",
  "strengths": ["Specific strength 1 referencing code", "Specific strength 2"],
  "improvements": ["Specific improvement 1 with what to change", "Specific improvement 2"],
  "code_comments": [
    { "file": "src/app.ts", "line": 42, "comment": "This fetch call has no error handling — wrap in try/catch", "severity": "error" },
    { "file": "src/utils.ts", "comment": "Good use of TypeScript generics here", "severity": "info" }
  ]
}`;
}
