import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirstLessonId } from "@/lib/lessons";

// POST /api/courses/enroll-free
// Direct, no-placement enrolment for open-access tracks (e.g. the Advanced
// Data Science course). No assessment, no trial seat-cap or window — free.
// Used for courses that have no assessment paper (an opt-in senior track you
// choose, rather than one you're placement-tested into).

const schema = z.object({ courseSlug: z.string().min(1).max(100) });

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseSlug } = schema.parse(await request.json());

    // Resolve / lazily create the student (mirrors the org-join + free-access flows).
    let { data: student } = await supabase
      .from("students").select("id").eq("user_id", user.id).maybeSingle();
    if (!student) {
      const { data: created, error } = await supabase
        .from("students").insert({ user_id: user.id, email: user.email ?? "", country: (user.user_metadata?.signup_country as string | undefined) ?? null, subject_interest: (user.user_metadata?.signup_subject as string | undefined) ?? null }).select("id").single();
      if (error || !created) return NextResponse.json({ error: "Could not create your account" }, { status: 500 });
      student = created;
    }

    const { data: course } = await supabase
      .from("courses").select("id, slug, level").eq("slug", courseSlug).maybeSingle();
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // Only allow direct enrolment for courses with NO assessment paper. Courses
    // that have a placement assessment must go through it (keeps the normal flow intact).
    const { count: paperCount } = await supabase
      .from("assessment_papers").select("id", { count: "exact", head: true }).eq("course_id", course.id);
    if ((paperCount ?? 0) > 0) {
      return NextResponse.json({ error: "This course uses a placement assessment — take that first." }, { status: 400 });
    }

    const firstLessonId = await getFirstLessonId(supabase, course.id);

    const months = 6;
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + months);
    const targetCompletionDate = targetDate.toISOString().split("T")[0];

    const payload = {
      // No placement test on these tracks; record the course's own level for display/cert.
      assessment_level: course.level === "advanced" ? "advanced" : "beginner",
      current_lesson_id: firstLessonId,
      target_completion_date: targetCompletionDate,
      plan_months: months,
      status: "active",
    };

    const { data: existing } = await supabase
      .from("student_enrollments").select("id").eq("student_id", student.id).eq("course_id", course.id).maybeSingle();

    if (existing) {
      const { error } = await supabase.from("student_enrollments").update(payload).eq("id", existing.id);
      if (error) {
        console.error("[courses/enroll-free] update", error);
        return NextResponse.json({ error: "Could not start the course" }, { status: 500 });
      }
    } else {
      const { error } = await supabase
        .from("student_enrollments").insert({ student_id: student.id, course_id: course.id, ...payload });
      if (error) {
        console.error("[courses/enroll-free] insert", error);
        return NextResponse.json({ error: "Could not start the course" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, firstLessonId, courseSlug: course.slug });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    console.error("[courses/enroll-free]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
