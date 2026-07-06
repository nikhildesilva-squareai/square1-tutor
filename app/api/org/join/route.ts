import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirstLessonId } from "@/lib/lessons";
import { RETIRED_COURSE_SLUGS } from "@/lib/catalog";

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
      .from("organizations").select("id, name, seats").eq("join_code", code).maybeSingle();
    if (!org) return NextResponse.json({ error: "That invite link isn't valid." }, { status: 404 });

    // If the manager assigned this person a specific track, it wins over the
    // client's pick. Read it BEFORE we mark the invite accepted below.
    let effectiveSlug = courseSlug;
    if (user.email) {
      const { data: inv } = await admin
        .from("org_invites")
        .select("assigned_course_id")
        .eq("org_id", org.id).eq("status", "pending").ilike("email", user.email)
        .not("assigned_course_id", "is", null)
        .maybeSingle();
      if (inv?.assigned_course_id) {
        const { data: ac } = await admin.from("courses").select("slug").eq("id", inv.assigned_course_id).maybeSingle();
        if (ac?.slug) effectiveSlug = ac.slug;
      }
    }

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

    // Mark any pending email invite for this person as accepted (best-effort)
    if (user.email) {
      await admin.from("org_invites")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("org_id", org.id).eq("status", "pending").ilike("email", user.email);
    }

    const isNewMember = !existingMember;

    // Free enrollment in the chosen track (mirror B2C: beginner, first lesson).
    // effectiveSlug honours a manager's assignment if one exists. Server-side
    // catalog guard: only visible top-level active courses are joinable — the
    // client picker enforces this too, but never trust the slug from the wire.
    if ((RETIRED_COURSE_SLUGS as readonly string[]).includes(effectiveSlug)) {
      return NextResponse.json({ error: "That course is no longer available — pick another track." }, { status: 400 });
    }
    const { data: course } = await admin
      .from("courses").select("id")
      .eq("slug", effectiveSlug).eq("status", "active").is("parent_course_id", null)
      .maybeSingle();
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // First lesson — module-aware (lessons.order_index is per-module).
    const firstLessonId = await getFirstLessonId(admin, course.id);

    const { data: existingEnr } = await supabase
      .from("student_enrollments").select("id, current_lesson_id").eq("student_id", student.id).eq("course_id", course.id).maybeSingle();

    if (existingEnr) {
      // Re-join (e.g. clicking the invite link twice): keep their lesson
      // position — only backfill the pointer if it was never set.
      await supabase.from("student_enrollments")
        .update({
          status: "active",
          org_id: org.id,
          current_lesson_id: existingEnr.current_lesson_id ?? firstLessonId,
        })
        .eq("id", existingEnr.id);
    } else {
      const { error: enrErr } = await supabase.from("student_enrollments").insert({
        student_id: student.id,
        course_id: course.id,
        org_id: org.id,
        assessment_level: "beginner",
        current_lesson_id: firstLessonId,
        plan_months: 3,
        status: "active",
      });
      if (enrErr) {
        console.error("[org/join] enroll", enrErr);
        return NextResponse.json({ error: "Could not start your access" }, { status: 500 });
      }
    }

    // Tell the manager a seat was claimed — first join only, best-effort
    // (never blocks or fails the member's onboarding).
    if (isNewMember) {
      try {
        const { data: mgr } = await admin
          .from("org_members")
          .select("students!inner(email, email_opt_out)")
          .eq("org_id", org.id).eq("role", "manager").maybeSingle();
        const manager = (mgr as unknown as { students: { email: string; email_opt_out: boolean } } | null)?.students;
        if (manager?.email && !manager.email_opt_out) {
          const { data: courseRow } = await admin.from("courses").select("title").eq("slug", effectiveSlug).maybeSingle();
          const { data: me } = await admin.from("students").select("name, email").eq("id", student.id).maybeSingle();
          const memberLabel = me?.name || me?.email || user.email || "A team member";
          const { sendMemberJoinedAlert } = await import("@/lib/email/resend");
          await sendMemberJoinedAlert(manager.email, memberLabel, org.name, courseRow?.title ?? "their track");
        }
      } catch (e) {
        console.error("[org/join] member-joined alert", e);
      }
    }

    return NextResponse.json({ ok: true, firstLessonId: existingEnr?.current_lesson_id ?? firstLessonId });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    console.error("[org/join]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
