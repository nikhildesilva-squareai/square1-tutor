import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  lessonId: z.string(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId } = schema.parse(body);

    // Get student
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get lesson info (to find course + module)
    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, module_id, course_id, order_index")
      .eq("id", lessonId)
      .maybeSingle();

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Find enrollment for this course
    const { data: enrollment } = await supabase
      .from("student_enrollments")
      .select("id")
      .eq("student_id", student.id)
      .eq("course_id", lesson.course_id)
      .eq("status", "active")
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
    }

    // Upsert lesson completion (enrollment_id is required by the table)
    const { error: completionError } = await supabase
      .from("lesson_completions")
      .upsert(
        {
          student_id: student.id,
          lesson_id: lessonId,
          enrollment_id: enrollment.id,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "student_id,lesson_id" }
      );

    if (completionError) {
      console.error("[learn/complete] completion upsert error:", completionError);
      // Continue anyway — non-critical
    }

    // Find the next lesson in this module, or the first lesson in the next module
    let nextLessonId: string | null = null;

    // Try next lesson in same module
    const { data: nextInModule } = await supabase
      .from("lessons")
      .select("id")
      .eq("module_id", lesson.module_id)
      .gt("order_index", lesson.order_index)
      .order("order_index", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextInModule) {
      nextLessonId = nextInModule.id;
    } else {
      // Get current module's order_index
      const { data: currentModule } = await supabase
        .from("modules")
        .select("order_index")
        .eq("id", lesson.module_id)
        .maybeSingle();

      if (currentModule) {
        // Find next module
        const { data: nextModule } = await supabase
          .from("modules")
          .select("id")
          .eq("course_id", lesson.course_id)
          .gt("order_index", currentModule.order_index)
          .order("order_index", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (nextModule) {
          // First lesson in next module
          const { data: firstLesson } = await supabase
            .from("lessons")
            .select("id")
            .eq("module_id", nextModule.id)
            .order("order_index", { ascending: true })
            .limit(1)
            .maybeSingle();

          nextLessonId = firstLesson?.id ?? null;
        }
      }
    }

    // Update enrollment's current_lesson_id to next lesson
    if (nextLessonId) {
      await supabase
        .from("student_enrollments")
        .update({ current_lesson_id: nextLessonId })
        .eq("id", enrollment.id);
    }

    return NextResponse.json({ completed: true, nextLessonId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: err.issues }, { status: 400 });
    }
    console.error("[learn/complete]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
