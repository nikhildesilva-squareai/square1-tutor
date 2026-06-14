import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { BETA_CAP, BETA_DAYS } from "@/lib/beta";

const schema = z.object({ courseSlug: z.string().min(1).max(100) });

/**
 * POST /api/beta/claim — authed.
 * Grants a founding-beta tester instant free access: enrolls them in the chosen
 * course (no card, no assessment gate), tags them beta with a 14-day window, and
 * returns the first lesson so the client can drop them straight into it.
 *
 * The global 100-cap is checked with the service-role client; the student's own
 * writes go through their authed client (RLS-scoped).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseSlug } = schema.parse(await request.json());

    // Ensure a student record exists for this user
    let { data: student } = await supabase
      .from("students")
      .select("id, is_beta")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!student) {
      const { data: created, error: createErr } = await supabase
        .from("students")
        .insert({ user_id: user.id, email: user.email ?? "" })
        .select("id, is_beta")
        .single();
      if (createErr || !created) {
        return NextResponse.json({ error: "Could not create your account" }, { status: 500 });
      }
      student = created;
    }

    // Cap check (only matters for NEW beta testers — existing ones can add tracks)
    const admin = createAdminClient();
    if (!student.is_beta) {
      const { count } = await admin
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("is_beta", true);
      if ((count ?? 0) >= BETA_CAP) {
        return NextResponse.json({ capped: true }, { status: 200 });
      }
    }

    // Resolve course + first lesson
    const { data: course } = await admin
      .from("courses")
      .select("id")
      .eq("slug", courseSlug)
      .maybeSingle();
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const { data: firstLesson } = await admin
      .from("lessons")
      .select("id")
      .eq("course_id", course.id)
      .order("order_index", { ascending: true })
      .limit(1)
      .maybeSingle();

    const betaEnd = new Date(Date.now() + BETA_DAYS * 24 * 60 * 60 * 1000);

    // Upsert enrollment (free, beginner level, no assessment required)
    const { data: existing } = await supabase
      .from("student_enrollments")
      .select("id")
      .eq("student_id", student.id)
      .eq("course_id", course.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("student_enrollments")
        .update({ status: "active", current_lesson_id: firstLesson?.id ?? null })
        .eq("id", existing.id);
    } else {
      const { error: enrErr } = await supabase.from("student_enrollments").insert({
        student_id: student.id,
        course_id: course.id,
        assessment_level: "beginner",
        current_lesson_id: firstLesson?.id ?? null,
        target_completion_date: betaEnd.toISOString().split("T")[0],
        plan_months: 3,
        status: "active",
      });
      if (enrErr) {
        console.error("[beta/claim] enroll error:", enrErr);
        return NextResponse.json({ error: "Could not start your free access" }, { status: 500 });
      }
    }

    // Tag the student as a beta tester (set the window once)
    if (!student.is_beta) {
      await supabase
        .from("students")
        .update({ is_beta: true, beta_started_at: new Date().toISOString(), beta_expires_at: betaEnd.toISOString() })
        .eq("id", student.id);
    }

    return NextResponse.json({ ok: true, firstLessonId: firstLesson?.id ?? null });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[beta/claim]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
