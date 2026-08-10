import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubject } from "@/lib/diagnostic";

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/diagnostic/progress?subject=<slug> — the "living report" feed
// (audit R6b, 2026-08-10).
//
// The diagnostic results permalink is emailed to every lead and gets re-opened
// later. For a signed-in student who has since enrolled in that track, the
// frozen snapshot should visibly MOVE: this endpoint returns their real
// progress so the results page can say "since your check: 4 of 40 lessons
// done" instead of pretending time stood still.
//
// Auth-scoped via the cookie session — it only ever reports the caller's own
// progress. Everything here is measured (enrollment + lesson_completions);
// nothing is estimated. Signed-out (or not enrolled) → { enrolled: false }.
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("subject") ?? "";
    if (!getSubject(slug)) return NextResponse.json({ enrolled: false });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ enrolled: false });

    const { data: student } = await supabase
      .from("students").select("id").eq("user_id", user.id).maybeSingle();
    if (!student?.id) return NextResponse.json({ enrolled: false });

    const { data: course } = await supabase
      .from("courses").select("id, title, total_lessons").eq("slug", slug).maybeSingle();
    if (!course?.id) return NextResponse.json({ enrolled: false });

    const { data: enrollment } = await supabase
      .from("student_enrollments")
      .select("id, enrolled_at, current_lesson_id, completed_at")
      .eq("student_id", student.id)
      .eq("course_id", course.id)
      .maybeSingle();
    if (!enrollment?.id) return NextResponse.json({ enrolled: false });

    const { count: lessonsCompleted } = await supabase
      .from("lesson_completions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student.id)
      .eq("enrollment_id", enrollment.id);

    return NextResponse.json({
      enrolled: true,
      courseTitle: course.title as string,
      totalLessons: (course.total_lessons as number) ?? 0,
      lessonsCompleted: lessonsCompleted ?? 0,
      enrolledAt: enrollment.enrolled_at as string | null,
      currentLessonId: (enrollment.current_lesson_id as string | null) ?? null,
      courseCompleted: Boolean(enrollment.completed_at),
    });
  } catch {
    // The results page must render identically whether this works or not.
    return NextResponse.json({ enrolled: false });
  }
}
