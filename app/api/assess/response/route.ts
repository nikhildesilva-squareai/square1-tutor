import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 15k chars ≈ 4k tokens — caps what a single answer can add to a grading batch
// (the prompt builders in lib/grading/assessment.ts also truncate as backstop).
const MAX_ANSWER_CHARS = 15_000;

const schema = z.object({
  attemptId: z.string().regex(UUID_REGEX, "Invalid attemptId"),
  questionId: z.string().regex(UUID_REGEX, "Invalid questionId"),
  selectedOption: z.string().optional(),
  responseText: z.string().max(MAX_ANSWER_CHARS, "Answer is too long — please keep it under 15,000 characters.").optional(),
  codeResponse: z.string().max(MAX_ANSWER_CHARS, "Code is too long — please keep it under 15,000 characters.").optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { attemptId, questionId, selectedOption, responseText, codeResponse } = schema.parse(body);

    // Verify attempt belongs to this user's student
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const { data: attempt } = await supabase
      .from("assessment_attempts")
      .select("id, status")
      .eq("id", attemptId)
      .eq("student_id", student.id)
      .maybeSingle();

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.status !== "in_progress") {
      return NextResponse.json({ error: "Attempt already submitted" }, { status: 400 });
    }

    // Upsert response — no updated_at column exists, removed it
    const { error } = await supabase
      .from("assessment_responses")
      .upsert({
        attempt_id: attemptId,
        question_id: questionId,
        selected_option: selectedOption ?? null,
        response_text: responseText ?? null,
        code_response: codeResponse ?? null,
      }, {
        onConflict: "attempt_id,question_id",
      });

    if (error) {
      console.error("[assess/response] upsert error:", JSON.stringify(error));
      return NextResponse.json({ error: "Failed to save response", detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: err.issues }, { status: 400 });
    }
    console.error("[assess/response]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
