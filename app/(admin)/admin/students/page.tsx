import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminStudentsPage() {
  const db = createAdminClient();
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Parallel queries
  const [studentsRes, enrollmentsRes, completionsRes, aiUsageRes, recentActivityRes] = await Promise.all([
    db.from("students").select("id, name, email, subject_interest, created_at").order("created_at", { ascending: false }),
    db.from("student_enrollments").select("student_id, course_id, status, assessment_level, enrolled_at, course:courses(title, slug)").eq("status", "active"),
    db.from("lesson_completions").select("student_id"),
    db.from("api_usage").select("student_id, total_calls, estimated_cost").eq("month_key", monthKey),
    db.from("lesson_completions").select("student_id").gte("completed_at", sevenDaysAgo),
  ]);

  const students = studentsRes.data ?? [];
  const enrollments = enrollmentsRes.data ?? [];
  const completions = completionsRes.data ?? [];
  const aiUsage = aiUsageRes.data ?? [];
  const recentActivity = recentActivityRes.data ?? [];

  // Build lookup maps
  const enrollmentsByStudent = new Map<string, typeof enrollments>();
  for (const e of enrollments) {
    const list = enrollmentsByStudent.get(e.student_id) ?? [];
    list.push(e);
    enrollmentsByStudent.set(e.student_id, list);
  }

  const lessonCountByStudent = new Map<string, number>();
  for (const c of completions) {
    lessonCountByStudent.set(c.student_id, (lessonCountByStudent.get(c.student_id) ?? 0) + 1);
  }

  const aiSpendByStudent = new Map<string, { calls: number; cost: number }>();
  for (const u of aiUsage) {
    aiSpendByStudent.set(u.student_id, {
      calls: u.total_calls ?? 0,
      cost: Number(u.estimated_cost ?? 0),
    });
  }

  const activeStudentIds = new Set(recentActivity.map(r => r.student_id));

  return (
    <div className="min-h-full px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-ink tracking-tight">Students</h1>
        <p className="text-sm text-ink-muted mt-1">{students.length} total students</p>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-soft">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Student</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Courses</th>
                <th className="text-center px-5 py-3 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Level</th>
                <th className="text-center px-5 py-3 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Lessons</th>
                <th className="text-center px-5 py-3 text-[10px] font-bold text-ink-muted uppercase tracking-widest">AI Spend</th>
                <th className="text-center px-5 py-3 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Status</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((student) => {
                const studentEnrollments = enrollmentsByStudent.get(student.id) ?? [];
                const lessonCount = lessonCountByStudent.get(student.id) ?? 0;
                const aiData = aiSpendByStudent.get(student.id);
                const isActive = activeStudentIds.has(student.id);
                const level = studentEnrollments[0]?.assessment_level ?? "—";

                return (
                  <tr key={student.id} className="hover:bg-surface-soft transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-tint flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-brand">
                            {(student.name ?? student.email ?? "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-ink">{student.name ?? "—"}</p>
                          <p className="text-[10px] text-ink-muted">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {studentEnrollments.length === 0 ? (
                        <span className="text-ink-muted">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {studentEnrollments.map((e, i) => (
                            <span key={i} className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-tint text-brand border border-brand/10">
                              {(e.course as unknown as { title: string } | null)?.title ?? "—"}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        level === "advanced" ? "bg-emerald-50 text-emerald-700" :
                        level === "intermediate" ? "bg-amber-50 text-amber-700" :
                        level === "beginner" ? "bg-blue-50 text-blue-700" :
                        "bg-surface-alt text-ink-muted"
                      }`}>
                        {level}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center font-semibold text-ink">
                      {lessonCount}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {aiData ? (
                        <div>
                          <p className="font-semibold text-ink">${aiData.cost.toFixed(2)}</p>
                          <p className="text-[10px] text-ink-muted">{aiData.calls} calls</p>
                        </div>
                      ) : (
                        <span className="text-ink-muted">$0.00</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? "bg-emerald-50 text-emerald-700" : "bg-surface-alt text-ink-muted"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-ink-muted"}`} />
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-ink-muted text-xs">
                      {student.created_at ? new Date(student.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                );
              })}

              {students.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-ink-muted">
                    No students yet. They&apos;ll appear here once they sign up.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
