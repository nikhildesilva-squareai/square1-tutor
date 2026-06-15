import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(4).max(40),
  courseSlug: z.string().min(1).max(100),
});

/**
 * POST /api/org/join — authed. A team member joins via the org's join code, takes
 * a free seat, and gets a free enrollment in their chosen track (no card, no
 * assessment gate) — same student experience as B2C. Seat-limited.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code, courseSlug } = schema.parse(await request.json());

    let { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
    if (!student) {
      const { data: created, error } = await supabase
        .from("students").insert({ user_id: user.id, email: user.email ?? "" }).select("id").single();
      if (error || !created) return NextResponse.json({ error: "Could not create your account" }, { status: 500 });
      student = created;
    }

    const admin = createAdminClient();
    const { data: org } = await admin
      .from("organizations").select("id, seats").eq("join_code", code).maybeSingle();
    if (!org) return NextResponse.json({ error: "That invite link isn't valid." }, { status: 404 });

    // Already a member? idempotent.
    const { data: existingMember } = await admin
      .from("org_members").select("id, role").eq("org_id", org.id).eq("student_id", student.id).maybeSingle();

    if (!existingMember) {
      // Seat check — count members (excludes the manager, who isn't a 'member')
      const { count } = await admin
        .from("org_members").select("id", { count: "exact", head: true }).eq("org_id", org.id).eq("role", "member");
      if ((count ?? 0) >= org.seats) {
        return NextResponse.json({ error: "This team has filled all its seats — ask your manager." }, { status: 409 });
      }
      const { error: memErr } = await admin
        .from("org_members").insert({ org_id: org.id, student_id: student.id, role: "member" });
      if (memErr) {
        console.error("[org/join] member", memErr);
        return NextResponse.json({ error: "Could not add you to the team" }, { status: 500 });
      }
    }

    // Free enrollment in the chosen track (mirror B2C: beginner, first lesson)
    const { data: course } = await admin.from("courses").select("id").eq("slug", courseSlug).maybeSingle();
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const { data: firstLesson } = await admin
      .from("lessons").select("id").eq("course_id", course.id).order("order_index", { ascending: true }).limit(1).maybeSingle();

    const { data: existingEnr } = await supabase
      .from("student_enrollments").select("id").eq("student_id", student.id).eq("course_id", course.id).maybeSingle();

    if (existingEnr) {
      await supabase.from("student_enrollments").update({ status: "active", current_lesson_id: firstLesson?.id ?? null }).eq("id", existingEnr.id);
    } else {
      const { error: enrErr } = await supabase.from("student_enrollments").insert({
        student_id: student.id,
        course_id: course.id,
        assessment_level: "beginner",
        current_lesson_id: firstLesson?.id ?? null,
        plan_months: 3,
        status: "active",
      });
      if (enrErr) {
        console.error("[org/join] enroll", enrErr);
        return NextResponse.json({ error: "Could not start your access" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, firstLessonId: firstLesson?.id ?? null });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    console.error("[org/join]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
