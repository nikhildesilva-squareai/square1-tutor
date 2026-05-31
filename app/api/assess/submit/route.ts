import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  attemptId: z.string().regex(UUID_REGEX, "Invalid attemptId"),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { attemptId } = schema.parse(body);

    // Verify student owns this attempt
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
      // Already submitted — idempotent
      return NextResponse.json({ attemptId });
    }

    const { error } = await supabase
      .from("assessment_attempts")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", attemptId);

    if (error) {
      console.error("[assess/submit]", error);
      return NextResponse.json({ error: "Failed to submit attempt" }, { status: 500 });
    }

    return NextResponse.json({ attemptId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: err.issues }, { status: 400 });
    }
    console.error("[assess/submit]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
