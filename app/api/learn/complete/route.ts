import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkAndMarkEnrollmentComplete } from "@/lib/enrollment-completion";

const schema = z.object({
  lessonId: z.string(),
  // Answers to the lesson's MCQ comprehension checks — required to complete.
  answers: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, answers } = schema.parse(body);

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

    // Server-side gate: every MCQ comprehension check in this lesson must be
    // answered correctly. Prevents marking a lesson complete via the API without
    // actually engaging the checks (the client-side gate alone was spoofable).
    const { data: mcqs } = await supabase
      .from("exercises")
      .select("id, correct_answer")
      .eq("lesson_id", lessonId)
      .eq("type", "mcq");

    if (mcqs && mcqs.length > 0) {
      const provided = answers ?? {};
      const allAnswered = mcqs.every((m) => {
        const a = provided[m.id];
        return typeof a === "string" && m.correct_answer != null
          && a.trim().toLowerCase() === m.correct_answer.trim().toLowerCase();
      });
      if (!allAnswered) {
        return NextResponse.json(
          { error: "Answer all comprehension checks before completing this lesson." },
          { status: 403 }
        );
      }
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

    // ── Spaced-retrieval seeding ───────────────────────────────────────────
    // Turn this lesson's recall items (its MCQ + short-answer exercises) into
    // spaced-repetition flashcards in the learner's deck, first due the NEXT day
    // (proper spacing — they just practised these in-lesson). Reuses the existing
    // study_notes SRS, the /notes review UI, and the dashboard "due" card.
    // Best-effort + idempotent (source_exercise_id) — never blocks completion.
    try {
      const { data: recallEx } = await supabase
        .from("exercises")
        .select("id, type, title, prompt_md, correct_answer")
        .eq("lesson_id", lessonId)
        .in("type", ["mcq", "short_answer"])
        .order("order_index", { ascending: true });

      if (recallEx && recallEx.length > 0) {
        // Skip exercises already seeded for this student (idempotent re-completion).
        const exIds = recallEx.map((e) => e.id);
        const { data: existing } = await supabase
          .from("study_notes")
          .select("source_exercise_id")
          .eq("student_id", student.id)
          .in("source_exercise_id", exIds);
        const seeded = new Set((existing ?? []).map((r) => r.source_exercise_id));

        const fresh = recallEx.filter((e) => !seeded.has(e.id) && e.prompt_md && e.correct_answer);

        if (fresh.length > 0) {
          const [{ data: lessonMeta }, { data: moduleMeta }, { data: courseMeta }] = await Promise.all([
            supabase.from("lessons").select("title").eq("id", lessonId).maybeSingle(),
            supabase.from("modules").select("title").eq("id", lesson.module_id).maybeSingle(),
            supabase.from("courses").select("id, title").eq("id", lesson.course_id).maybeSingle(),
          ]);

          const firstDue = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // tomorrow

          const cards = fresh.map((e) => ({
            student_id: student.id,
            type: "flashcard",
            title: e.title,
            content: e.prompt_md as string,
            flashcard_answer: e.correct_answer as string,
            color: "blue",
            source_exercise_id: e.id,
            lesson_id: lessonId,
            lesson_title: lessonMeta?.title ?? null,
            module_title: moduleMeta?.title ?? null,
            course_id: courseMeta?.id ?? lesson.course_id,
            course_title: courseMeta?.title ?? null,
            tags: ["curriculum-review"],
            next_review_at: firstDue,
            ease_factor: 2.5,
            interval_days: 0,
            review_count: 0,
          }));

          const { error: seedError } = await supabase.from("study_notes").insert(cards);
          if (seedError) console.error("[learn/complete] review-seed insert error:", seedError);
        }
      }
    } catch (seedErr) {
      console.error("[learn/complete] review-seed error:", seedErr);
      // Non-critical — never block completion on review seeding.
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

    // ── Check if enrollment is now complete ──────────────────────────────────
    const admin = createAdminClient();
    const enrollmentCompleted = await checkAndMarkEnrollmentComplete(enrollment.id, admin);

    return NextResponse.json({ completed: true, nextLessonId, enrollmentCompleted });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: err.issues }, { status: 400 });
    }
    console.error("[learn/complete]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
