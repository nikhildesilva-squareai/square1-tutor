import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendWeeklyDigest } from "@/lib/email/resend";

// Weekly progress digest — runs every Sunday at 9am via Vercel Cron
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env["CRON_SECRET"]}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Get all active students
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select("student_id, course:courses(total_lessons)")
    .eq("status", "active");

  if (!enrollments || enrollments.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const studentIds = [...new Set((enrollments as Array<{ student_id: string }>).map(e => e.student_id))];

  // Get student details
  const { data: students } = await supabase
    .from("students")
    .select("id, name, email")
    .in("id", studentIds);

  if (!students) return NextResponse.json({ sent: 0 });

  // Get completions from last 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let sent = 0;

  for (const student of students) {
    if (!student.email) continue;

    // This week's completions
    const { count: weekLessons } = await supabase
      .from("lesson_completions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student.id)
      .gte("completed_at", weekAgo);

    // Total completions
    const { count: totalCompleted } = await supabase
      .from("lesson_completions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student.id);

    // Total lessons across enrolled courses
    const studentEnrollments = (enrollments as unknown as Array<{
      student_id: string;
      course: { total_lessons: number } | null;
    }>).filter(e => e.student_id === student.id);
    const totalLessons = studentEnrollments.reduce((sum, e) => sum + (e.course?.total_lessons ?? 0), 0);

    // Projects
    const { count: projects } = await supabase
      .from("project_submissions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student.id)
      .not("score", "is", null);

    // Streak
    const { data: recentDays } = await supabase
      .from("lesson_completions")
      .select("completed_at")
      .eq("student_id", student.id)
      .order("completed_at", { ascending: false })
      .limit(30);

    let streak = 0;
    if (recentDays && recentDays.length > 0) {
      const days = [...new Set(recentDays.map(c => c.completed_at.substring(0, 10)))].sort().reverse();
      const today = new Date().toISOString().substring(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().substring(0, 10);
      if (days[0] === today || days[0] === yesterday) {
        let check = new Date(days[0]);
        for (const day of days) {
          if (day === check.toISOString().substring(0, 10)) { streak++; check.setDate(check.getDate() - 1); }
          else break;
        }
      }
    }

    const overallPct = totalLessons > 0 ? Math.round(((totalCompleted ?? 0) / totalLessons) * 100) : 0;

    try {
      await sendWeeklyDigest(student.email, student.name ?? student.email.split("@")[0], {
        lessonsCompleted: weekLessons ?? 0,
        streak,
        projectsDone: projects ?? 0,
        overallPct,
      });
      sent++;
    } catch {
      // Continue with other students
    }
  }

  return NextResponse.json({ sent });
}
