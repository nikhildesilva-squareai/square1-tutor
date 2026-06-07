import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/budget";
import { z } from "zod";
import { rateLimitAI } from "@/lib/rate-limit";

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

    // 6. Trigger AI review (budget-checked via callAI)
    const reviewPrompt = buildReviewPrompt(project, githubUrl, description);

    const aiResult = await callAI(student.id, {
      system: "You are a senior engineer reviewing a student project submission. Always respond with valid JSON only, no markdown fences or extra text.",
      max_tokens: 1024,
      temperature: 0,
      messages: [{ role: "user", content: reviewPrompt }],
    });

    const responseText = aiResult.text || "{}";

    let review: {
      score: number;
      max_score: number;
      breakdown: { criterion: string; score: number; max: number; feedback: string }[];
      overall_feedback: string;
      strengths: string[];
      improvements: string[];
    };

    try {
      review = JSON.parse(responseText);
    } catch {
      // Fallback if AI returns malformed JSON
      review = {
        score: 50,
        max_score: 100,
        breakdown: [
          { criterion: "Completeness", score: 15, max: 30, feedback: "Unable to fully evaluate." },
          { criterion: "Code Quality", score: 13, max: 25, feedback: "Unable to fully evaluate." },
          { criterion: "Error Handling", score: 10, max: 20, feedback: "Unable to fully evaluate." },
          { criterion: "Documentation", score: 7, max: 15, feedback: "Unable to fully evaluate." },
          { criterion: "Best Practices", score: 5, max: 10, feedback: "Unable to fully evaluate." },
        ],
        overall_feedback: "Submission received. The AI reviewer encountered an issue parsing the evaluation. Please try resubmitting.",
        strengths: ["Project submitted successfully"],
        improvements: ["Consider adding more detail in the notes field"],
      };
    }

    // 7. Upsert into project_submissions
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

    // 8. Also update student_projects status if it exists
    await supabase
      .from("student_projects")
      .update({ status: "submitted", updated_at: new Date().toISOString() })
      .eq("student_id", student.id)
      .eq("project_id", projectId);

    // 9. Return result
    return NextResponse.json({
      submissionId: submission.id,
      score: review.score,
      max_score: review.max_score,
      breakdown: review.breakdown,
      overall_feedback: review.overall_feedback,
      strengths: review.strengths,
      improvements: review.improvements,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: err.issues }, { status: 400 });
    }
    console.error("[projects/submit]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildReviewPrompt(
  project: { title: string; description_md: string; tech_stack: string[]; requirements: string[] },
  githubUrl: string,
  description?: string,
): string {
  return `You are a senior engineer reviewing a student project submission.

Project: ${project.title}
Requirements: ${(project.requirements ?? []).join(", ")}
Tech Stack: ${(project.tech_stack ?? []).join(", ")}
GitHub URL: ${githubUrl}
${description ? `Student Notes: ${description}` : ""}

Since you cannot access the GitHub URL directly, evaluate based on:
1. The project requirements - are they likely met based on the description?
2. The tech stack - is it appropriate?
3. The student's notes about their implementation

Score out of 100:
- Completeness (requirements met): /30
- Code Quality (inferred from description): /25
- Error Handling & Edge Cases: /20
- Documentation: /15
- Best Practices: /10

Return JSON (no markdown fences):
{
  "score": <number>,
  "max_score": 100,
  "breakdown": [
    { "criterion": "Completeness", "score": <number>, "max": 30, "feedback": "..." },
    { "criterion": "Code Quality", "score": <number>, "max": 25, "feedback": "..." },
    { "criterion": "Error Handling", "score": <number>, "max": 20, "feedback": "..." },
    { "criterion": "Documentation", "score": <number>, "max": 15, "feedback": "..." },
    { "criterion": "Best Practices", "score": <number>, "max": 10, "feedback": "..." }
  ],
  "overall_feedback": "2-3 sentences of specific, actionable feedback",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"]
}`;
}
