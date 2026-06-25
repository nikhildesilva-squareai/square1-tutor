import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { allocateWallet } from "@/lib/ai/budget";
import { FREE_ACCESS_CAP, FREE_ACCESS_WALLET_USD, freeWindowOpen } from "@/lib/free-access";
import { getFirstLessonId } from "@/lib/lessons";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  // Preferred: the assessment report personalises the enrolment (level + course).
  reportId: z.string().regex(UUID_REGEX).optional(),
  planMonths: z.union([z.literal(3), z.literal(6), z.literal(9)]).optional(),
  // Fallback when there's no report (direct nav): enrol by slug at beginner.
  courseSlug: z.string().min(1).max(100).optional(),
});

/**
 * POST /api/free-access/enroll
 *
 * Grants a student free, full access to a course during the early-access trial.
 * Claims one of the limited seats atomically (cap enforced in the DB), then
 * creates/activates the enrolment and ring-fences a small trial AI wallet so
 * cost stays bounded. Reverts to the normal paid/reserve flow once the window
 * closes or the cap is reached.
 */
export async function POST(request: Request) {
  try {
    if (!freeWindowOpen()) {
      return NextResponse.json({ error: "Free early access has closed." }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { reportId, planMonths, courseSlug } = schema.parse(await request.json());

    // Resolve student (create lazily, mirroring org/join).
    let { data: student } = await supabase
      .from("students").select("id").eq("user_id", user.id).maybeSingle();
    if (!student) {
      const { data: created, error } = await supabase
        .from("students").insert({ user_id: user.id, email: user.email ?? "" }).select("id").single();
      if (error || !created) return NextResponse.json({ error: "Could not create your account" }, { status: 500 });
      student = created;
    }

    // Resolve the target course + assessment level, preferring the report.
    let courseId: string | null = null;
    let level = "beginner";
    let slug = courseSlug ?? null;

    if (reportId) {
      const { data: report } = await supabase
        .from("skill_reports")
        .select("course_id, level_determined")
        .eq("id", reportId)
        .eq("student_id", student.id)
        .maybeSingle();
      if (report?.course_id) {
        courseId = report.course_id;
        level = report.level_determined ?? "beginner";
      }
    }

    const admin = createAdminClient();
    if (!courseId && slug) {
      const { data: course } = await admin.from("courses").select("id").eq("slug", slug).maybeSingle();
      courseId = course?.id ?? null;
    }
    if (courseId && !slug) {
      const { data: course } = await admin.from("courses").select("slug").eq("id", courseId).maybeSingle();
      slug = course?.slug ?? null;
    }
    if (!courseId) {
      return NextResponse.json({ error: "No course to enrol in — take the assessment first." }, { status: 400 });
    }

    // Atomically claim a seat (idempotent for returning students, cap-enforced).
    const { data: claimRows, error: claimErr } = await admin.rpc("claim_free_trial_seat", {
      p_student: student.id,
      p_cap: FREE_ACCESS_CAP,
      p_slug: slug,
      p_email: user.email ?? null,
    });
    if (claimErr) {
      console.error("[free-access/enroll] claim", claimErr);
      return NextResponse.json({ error: "Could not reserve your free spot" }, { status: 500 });
    }
    const claim = Array.isArray(claimRows) ? claimRows[0] : claimRows;
    if (!claim?.claimed) {
      return NextResponse.json(
        { error: "All free spots have been taken.", full: true },
        { status: 409 },
      );
    }

    // First lesson of the course — module-aware (lessons.order_index is per-module).
    const firstLessonId = await getFirstLessonId(admin, courseId);

    const months = planMonths ?? 3;
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + months);
    const targetCompletionDate = targetDate.toISOString().split("T")[0];

    // Create or re-activate the enrolment (no org_id — this is B2C).
    const { data: existing } = await supabase
      .from("student_enrollments").select("id").eq("student_id", student.id).eq("course_id", courseId).maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("student_enrollments")
        .update({
          assessment_level: level,
          current_lesson_id: firstLessonId,
          target_completion_date: targetCompletionDate,
          plan_months: months,
          status: "active",
        })
        .eq("id", existing.id);
      if (error) {
        console.error("[free-access/enroll] update", error);
        return NextResponse.json({ error: "Could not start your access" }, { status: 500 });
      }
    } else {
      const { error } = await supabase
        .from("student_enrollments")
        .insert({
          student_id: student.id,
          course_id: courseId,
          assessment_level: level,
          current_lesson_id: firstLessonId,
          target_completion_date: targetCompletionDate,
          plan_months: months,
          status: "active",
        });
      if (error) {
        console.error("[free-access/enroll] insert", error);
        return NextResponse.json({ error: "Could not start your access" }, { status: 500 });
      }
    }

    // Ring-fence a small trial AI wallet so per-student cost is explicit + bounded.
    try {
      await allocateWallet(student.id, FREE_ACCESS_WALLET_USD, "free-trial");
    } catch (e) {
      console.error("[free-access/enroll] wallet (non-fatal)", e);
    }

    return NextResponse.json({
      ok: true,
      firstLessonId,
      courseSlug: slug,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[free-access/enroll]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
