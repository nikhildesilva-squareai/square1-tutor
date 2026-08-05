import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getFirstLessonId } from "@/lib/lessons";
import { DIAG_SUBJECTS } from "@/lib/diagnostic";

// GET /api/auth/landing — the smart post-auth router.
//
// "Where should this person land after signing in?" has one consistent
// answer now: someone who has never started anything goes STRAIGHT into
// Lesson 1 of their track (the same place the signup funnel drops them),
// and someone with history goes to the dashboard. Login and the OAuth
// callback default here instead of hard-coding /dashboard, so a stalled
// signup who comes back three days later resumes exactly where the funnel
// would have put them — consistent end to end.
//
// Deliberately auth-time only: visiting /dashboard directly mid-session
// never bounces (the lesson player's "I'm done for today" must stay an
// honest exit — momentum by choice, not by trap).

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  try {
    const { data: student } = await supabase
      .from("students")
      .select("id, subject_interest")
      .eq("user_id", user.id)
      .maybeSingle();

    // No student row yet (brand-new Google signup pre-onboarding): the (app)
    // layout's /welcome gate owns that flow — let the dashboard route handle it.
    if (!student) return NextResponse.redirect(`${origin}/dashboard`);

    const [{ count: enrollments }, { count: completions }] = await Promise.all([
      supabase.from("student_enrollments").select("id", { count: "exact", head: true })
        .eq("student_id", student.id).eq("status", "active"),
      supabase.from("lesson_completions").select("id", { count: "exact", head: true })
        .eq("student_id", student.id),
    ]);

    // Any history at all → the dashboard is genuinely theirs to use.
    if ((enrollments ?? 0) > 0 || (completions ?? 0) > 0) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    // Fresh account → Lesson 1 of their track (subject interest → diagnostic
    // map → auth-metadata stash → flagship), same resolution the funnel uses.
    const interest = (student.subject_interest ?? (user.user_metadata?.signup_subject as string | undefined) ?? "").trim().toLowerCase();
    const slug = DIAG_SUBJECTS.find((s) => s.title.toLowerCase() === interest)?.slug ?? "generative-ai";
    const { data: course } = await supabase
      .from("courses").select("id").eq("slug", slug).eq("status", "active").maybeSingle();
    const firstLessonId = course ? await getFirstLessonId(supabase, course.id) : null;

    return NextResponse.redirect(firstLessonId ? `${origin}/learn/${firstLessonId}` : `${origin}/dashboard`);
  } catch {
    // Routing sugar must never block sign-in.
    return NextResponse.redirect(`${origin}/dashboard`);
  }
}
