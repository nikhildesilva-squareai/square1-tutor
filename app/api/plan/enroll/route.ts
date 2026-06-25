import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirstLessonId } from "@/lib/lessons";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  reportId: z.string().regex(UUID_REGEX, "Invalid reportId"),
  planMonths: z.union([z.literal(3), z.literal(6), z.literal(9)]),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reportId, planMonths } = schema.parse(body);

    // Get student
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Load skill report
    const { data: report } = await supabase
      .from("skill_reports")
      .select("id, student_id, course_id, level_determined")
      .eq("id", reportId)
      .eq("student_id", student.id)
      .maybeSingle();

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (!report.course_id) {
      return NextResponse.json({ error: "Report has no associated course" }, { status: 400 });
    }

    // Calculate target completion date
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + planMonths);
    const targetCompletionDate = targetDate.toISOString().split("T")[0];

    // First lesson — module-aware (lessons.order_index is per-module).
    const firstLessonId = await getFirstLessonId(supabase, report.course_id);

    // Check for existing active enrollment
    const { data: existingEnrollment } = await supabase
      .from("student_enrollments")
      .select("id")
      .eq("student_id", student.id)
      .eq("course_id", report.course_id)
      .maybeSingle();

    let enrollmentId: string;

    if (existingEnrollment) {
      // Update existing enrollment
      const { data: updated, error } = await supabase
        .from("student_enrollments")
        .update({
          assessment_level: report.level_determined,
          current_lesson_id: firstLessonId,
          target_completion_date: targetCompletionDate,
          plan_months: planMonths,
          status: "active",
        })
        .eq("id", existingEnrollment.id)
        .select("id")
        .single();

      if (error || !updated) {
        console.error("[plan/enroll] update error:", error);
        return NextResponse.json({ error: "Failed to update enrollment" }, { status: 500 });
      }
      enrollmentId = updated.id;
    } else {
      // Create new enrollment
      const { data: enrollment, error } = await supabase
        .from("student_enrollments")
        .insert({
          student_id: student.id,
          course_id: report.course_id,
          assessment_level: report.level_determined,
          current_lesson_id: firstLessonId,
          target_completion_date: targetCompletionDate,
          plan_months: planMonths,
          status: "active",
        })
        .select("id")
        .single();

      if (error || !enrollment) {
        console.error("[plan/enroll] insert error:", error);
        return NextResponse.json({ error: "Failed to create enrollment" }, { status: 500 });
      }
      enrollmentId = enrollment.id;
    }

    return NextResponse.json({ enrollmentId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: err.issues }, { status: 400 });
    }
    console.error("[plan/enroll]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
