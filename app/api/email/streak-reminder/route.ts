import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendStreakReminder } from "@/lib/email/resend";

// This endpoint sends streak reminders to students who haven't studied today.
// Call it daily via Vercel Cron or external scheduler.
// Requires CRON_SECRET env var for security.

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env["CRON_SECRET"]}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Get all active students with enrollments
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select(`
      student_id,
      current_lesson_id,
      students!inner(id, name, email),
      current_lesson:lessons!student_enrollments_current_lesson_id_fkey(title)
    `)
    .eq("status", "active");

  if (!enrollments || enrollments.length === 0) {
    return NextResponse.json({ sent: 0, message: "No active enrollments" });
  }

  // Get today's completions to exclude students who already studied
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const studentIds = [...new Set((enrollments as Array<{ student_id: string }>).map(e => e.student_id))];

  const { data: todayCompletions } = await supabase
    .from("lesson_completions")
    .select("student_id")
    .in("student_id", studentIds)
    .gte("completed_at", today.toISOString());

  const alreadyStudied = new Set((todayCompletions ?? []).map(c => c.student_id));

  // Calculate streak for each student and send reminders
  let sent = 0;
  const errors: string[] = [];

  for (const enrollment of enrollments as unknown as Array<{
    student_id: string;
    students: { id: string; name: string | null; email: string };
    current_lesson: { title: string } | null;
  }>) {
    if (alreadyStudied.has(enrollment.student_id)) continue;

    const studentEmail = enrollment.students?.email;
    const studentName = enrollment.students?.name ?? studentEmail?.split("@")[0] ?? "there";
    const lessonTitle = enrollment.current_lesson?.title ?? "Your next lesson";

    if (!studentEmail) continue;

    // Get streak
    const { data: recentCompletions } = await supabase
      .from("lesson_completions")
      .select("completed_at")
      .eq("student_id", enrollment.student_id)
      .order("completed_at", { ascending: false })
      .limit(30);

    let streak = 0;
    if (recentCompletions && recentCompletions.length > 0) {
      const days = [...new Set(recentCompletions.map(c => c.completed_at.substring(0, 10)))].sort().reverse();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const ydStr = yesterday.toISOString().substring(0, 10);

      if (days[0] === ydStr) {
        let check = new Date(yesterday);
        for (const day of days) {
          if (day === check.toISOString().substring(0, 10)) {
            streak++;
            check.setDate(check.getDate() - 1);
          } else break;
        }
      }
    }

    try {
      await sendStreakReminder(studentEmail, studentName, streak, lessonTitle);
      sent++;
    } catch (err) {
      errors.push(`${studentEmail}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return NextResponse.json({ sent, errors: errors.length > 0 ? errors : undefined });
}
