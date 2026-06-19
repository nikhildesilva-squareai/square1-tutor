import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// GDPR Art. 20 — right to data portability.
// Returns every row this learner owns, as a single downloadable JSON file.
// Auth-verified: we resolve the student from the session, then the admin
// client gathers their rows scoped strictly by student_id (ownership proven).

// Tables keyed by student_id that hold this user's personal data.
const STUDENT_OWNED_TABLES = [
  "student_enrollments",
  "lesson_completions",
  "exercise_submissions",
  "project_submissions",
  "skill_reports",
  "assessment_attempts",
  "study_notes",
  "tutor_conversations",
  "tutor_messages",
  "ai_wallets",
  "api_usage",
  "email_log",
  "enrollment_interest",
  "org_members",
] as const;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!student) return NextResponse.json({ error: "No account found" }, { status: 404 });

  const admin = createAdminClient();

  // Gather every owned table in parallel, scoped by the verified student id.
  const tables: Record<string, unknown> = {};
  await Promise.all(
    STUDENT_OWNED_TABLES.map(async (table) => {
      const { data } = await admin.from(table).select("*").eq("student_id", student.id);
      tables[table] = data ?? [];
    })
  );

  const payload = {
    exported_at: new Date().toISOString(),
    account: {
      email: user.email ?? null,
      user_id: user.id,
    },
    profile: student,
    data: tables,
  };

  const filename = `square1-data-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
