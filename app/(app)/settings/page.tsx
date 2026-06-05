import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: student } = await supabase
    .from("students")
    .select("id, name, email, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  // Get enrollment info
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select("id, assessment_level, enrolled_at, course:courses(title)")
    .eq("student_id", student?.id ?? "")
    .eq("status", "active");

  const enrollmentList = (enrollments ?? []) as unknown as Array<{
    id: string; assessment_level: string | null; enrolled_at: string;
    course: { title: string } | null;
  }>;

  const joinedDate = student?.created_at
    ? new Date(student.created_at).toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="px-4 sm:px-6 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-black text-ink">Settings</h1>
          <p className="text-sm text-ink-muted">Manage your account and preferences</p>
        </div>
      </div>

      <SettingsClient
        studentId={student?.id ?? ""}
        studentName={student?.name ?? ""}
        userEmail={user.email ?? ""}
        joinedDate={joinedDate}
        enrollments={enrollmentList}
      />
    </div>
  );
}
