import { createAdminClient } from "@/lib/supabase/admin";

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "#0056CE", icon }: {
  label: string; value: string | number; sub?: string; color?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}12` }}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-ink">{value}</p>
        <p className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold">{label}</p>
        {sub && <p className="text-[10px] text-ink-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Simple Bar ──────────────────────────────────────────────────────────────
function Bar({ pct, color = "#0056CE" }: { pct: number; color?: string }) {
  return (
    <div className="w-full h-2 rounded-full bg-surface-alt overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  );
}

export default async function AdminOverviewPage() {
  const db = createAdminClient();
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // ── Parallel queries ────────────────────────────────────────────────────────
  const [
    studentsRes,
    enrollmentsRes,
    activeStudentsRes,
    lessonsCompletedRes,
    quizAttemptsRes,
    aiUsageRes,
    recentStudentsRes,
    coursesRes,
    courseEnrollmentsRes,
    recentSignupsRes,
    assessmentsRes,
    countryRes,
  ] = await Promise.all([
    // Total students
    db.from("students").select("id", { count: "exact", head: true }),
    // Total active enrollments
    db.from("student_enrollments").select("id", { count: "exact", head: true }).eq("status", "active"),
    // Active students (lesson completion in last 7 days)
    db.from("lesson_completions").select("student_id", { count: "exact", head: true }).gte("completed_at", sevenDaysAgo),
    // Total lessons completed
    db.from("lesson_completions").select("id", { count: "exact", head: true }),
    // Total assessment attempts
    db.from("assessment_attempts").select("id", { count: "exact", head: true }),
    // AI usage this month
    db.from("api_usage").select("total_calls, estimated_cost").eq("month_key", monthKey),
    // Recent students (last 10)
    db.from("students").select("id, name, email, created_at, subject_interest").order("created_at", { ascending: false }).limit(10),
    // All courses
    db.from("courses").select("id, slug, title, total_lessons"),
    // Enrollment counts by course
    db.from("student_enrollments").select("course_id, status"),
    // Signups in last 30 days
    db.from("students").select("id, created_at").gte("created_at", thirtyDaysAgo),
    // Total assessments taken
    db.from("assessment_attempts").select("id, student_id, course_id, score, max_score").not("score", "is", null),
    // Signup country (for the AU-vs-international / GST split)
    db.from("students").select("country"),
  ]);

  const totalStudents = studentsRes.count ?? 0;
  const totalEnrollments = enrollmentsRes.count ?? 0;
  const activeThisWeek = activeStudentsRes.count ?? 0;
  const totalLessonsCompleted = lessonsCompletedRes.count ?? 0;
  const totalQuizAttempts = quizAttemptsRes.count ?? 0;

  // AI usage totals
  const aiUsageData = aiUsageRes.data ?? [];
  const totalAICalls = aiUsageData.reduce((sum, r) => sum + (r.total_calls ?? 0), 0);
  const totalAICost = aiUsageData.reduce((sum, r) => sum + Number(r.estimated_cost ?? 0), 0);

  const recentStudents = recentStudentsRes.data ?? [];
  const courses = coursesRes.data ?? [];
  const courseEnrollments = courseEnrollmentsRes.data ?? [];

  // Course enrollment counts
  const enrollmentByCourse = new Map<string, number>();
  for (const e of courseEnrollments) {
    if (e.status === "active") {
      enrollmentByCourse.set(e.course_id, (enrollmentByCourse.get(e.course_id) ?? 0) + 1);
    }
  }

  // Signups per day (last 30 days)
  const signupsLast30 = recentSignupsRes.data ?? [];
  const signupsByDay = new Map<string, number>();
  for (const s of signupsLast30) {
    const day = new Date(s.created_at).toISOString().slice(0, 10);
    signupsByDay.set(day, (signupsByDay.get(day) ?? 0) + 1);
  }

  // Conversion funnel
  const totalAssessments = (assessmentsRes.data ?? []).length;
  const uniqueAssessedStudents = new Set((assessmentsRes.data ?? []).map(a => a.student_id)).size;

  // Signup country split (AU = GST applies; everyone else = no GST)
  const countryRows = (countryRes.data ?? []) as { country: string | null }[];
  const countryCounts = new Map<string, number>();
  let auCount = 0, knownCount = 0;
  for (const r of countryRows) {
    const c = (r.country ?? "").toUpperCase();
    if (!c) continue;
    knownCount++;
    if (c === "AU") auCount++;
    countryCounts.set(c, (countryCounts.get(c) ?? 0) + 1);
  }
  const intlCount = knownCount - auCount;
  const unknownCount = countryRows.length - knownCount;
  const COUNTRY_NAMES: Record<string, string> = {
    AU: "Australia", US: "United States", GB: "United Kingdom", IN: "India", CA: "Canada",
    NZ: "New Zealand", SG: "Singapore", PH: "Philippines", NG: "Nigeria", PK: "Pakistan",
    DE: "Germany", FR: "France", AE: "UAE", ZA: "South Africa", ID: "Indonesia",
  };
  const topCountries = [...countryCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="min-h-full px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-ink tracking-tight">Dashboard</h1>
        <p className="text-sm text-ink-muted mt-1">
          Square 1 AI Admin &mdash; {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Key Metrics ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Students"
          value={totalStudents}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
        />
        <StatCard
          label="Active This Week"
          value={activeThisWeek}
          sub={totalStudents > 0 ? `${Math.round((activeThisWeek / totalStudents) * 100)}% of total` : "—"}
          color="#059669"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}
        />
        <StatCard
          label="Enrollments"
          value={totalEnrollments}
          sub={totalStudents > 0 ? `${(totalEnrollments / totalStudents).toFixed(1)} per student` : "—"}
          color="#7C3AED"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>}
        />
        <StatCard
          label="AI Spend (This Month)"
          value={`$${totalAICost.toFixed(2)}`}
          sub={`${totalAICalls} API calls`}
          color="#D97706"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v12" /><path d="M8 10h8" /><path d="M8 14h8" /></svg>}
        />
      </div>

      {/* ── Second Row: Activity Metrics ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Lessons Completed"
          value={totalLessonsCompleted}
          color="#06b6d4"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>}
        />
        <StatCard
          label="Quizzes Taken"
          value={totalQuizAttempts}
          color="#8b5cf6"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
        />
        <StatCard
          label="Assessments"
          value={totalAssessments}
          sub={`${uniqueAssessedStudents} unique students`}
          color="#ef4444"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
        />
        <StatCard
          label="Signups (30 days)"
          value={signupsLast30.length}
          color="#10b981"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Conversion Funnel ─────────────────────────────────────────── */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-5">Conversion Funnel</p>
          <div className="space-y-4">
            {[
              { label: "Signed Up", value: totalStudents, pct: 100, color: "#0056CE" },
              { label: "Took Assessment", value: uniqueAssessedStudents, pct: totalStudents > 0 ? (uniqueAssessedStudents / totalStudents) * 100 : 0, color: "#7C3AED" },
              { label: "Enrolled (Paid)", value: totalEnrollments, pct: totalStudents > 0 ? (totalEnrollments / totalStudents) * 100 : 0, color: "#059669" },
            ].map((step) => (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-ink">{step.label}</span>
                  <span className="text-sm font-bold" style={{ color: step.color }}>
                    {step.value} <span className="text-ink-muted font-normal text-xs">({Math.round(step.pct)}%)</span>
                  </span>
                </div>
                <Bar pct={step.pct} color={step.color} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Popular Courses ──────────────────────────────────────────── */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-5">Course Popularity</p>
          <div className="space-y-3">
            {courses
              .map(c => ({ ...c, count: enrollmentByCourse.get(c.id) ?? 0 }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 6)
              .map((course) => {
                const maxEnroll = Math.max(1, ...Array.from(enrollmentByCourse.values()));
                return (
                  <div key={course.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-ink font-medium truncate pr-2">{course.title}</span>
                      <span className="text-sm font-bold text-brand shrink-0">{course.count}</span>
                    </div>
                    <Bar pct={(course.count / maxEnroll) * 100} />
                  </div>
                );
              })}
          </div>
        </div>

        {/* ── Recent Signups ───────────────────────────────────────────── */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-5">Recent Signups</p>
          <div className="space-y-3">
            {recentStudents.length === 0 ? (
              <p className="text-sm text-ink-muted">No students yet</p>
            ) : (
              recentStudents.map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-tint flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-brand">
                      {(s.name ?? s.email ?? "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{s.name ?? "—"}</p>
                    <p className="text-[10px] text-ink-muted truncate">{s.email}</p>
                  </div>
                  <span className="text-[10px] text-ink-muted shrink-0">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Signup Trend (Last 14 Days) ────────────────────────────────────── */}
      <div className="mt-6 bg-surface rounded-xl border border-border p-5">
        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-5">Signups — Last 14 Days</p>
        <div className="flex items-end gap-1.5 h-24">
          {Array.from({ length: 14 }, (_, i) => {
            const d = new Date(now.getTime() - (13 - i) * 24 * 60 * 60 * 1000);
            const key = d.toISOString().slice(0, 10);
            const count = signupsByDay.get(key) ?? 0;
            const maxSignups = Math.max(1, ...Array.from(signupsByDay.values()));
            const heightPct = count > 0 ? Math.max(8, (count / maxSignups) * 100) : 4;
            const isToday = i === 13;

            return (
              <div key={key} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-ink-muted">{count > 0 ? count : ""}</span>
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${heightPct}%`,
                    background: isToday ? "#0056CE" : count > 0 ? "#0056CE66" : "#E8EEF5",
                  }}
                />
                <span className="text-[8px] text-ink-muted">
                  {d.toLocaleDateString("en-GB", { day: "numeric" })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Signups by country (GST split) ─────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface rounded-xl border border-border p-5 lg:col-span-1">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Signups by Country</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-surface-soft p-4">
              <p className="text-2xl font-black text-ink">{auCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted mt-0.5">Australia</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-0.5">+ GST applies</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-soft p-4">
              <p className="text-2xl font-black text-ink">{intlCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted mt-0.5">International</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">No GST</p>
            </div>
          </div>
          {unknownCount > 0 && (
            <p className="text-[10px] text-ink-muted mt-3">{unknownCount} unknown (pre-tracking signups — captured on next login)</p>
          )}
        </div>

        <div className="bg-surface rounded-xl border border-border p-5 lg:col-span-2">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Top Countries</p>
          {topCountries.length === 0 ? (
            <p className="text-sm text-ink-muted">No country data yet — new signups are tracked from now on.</p>
          ) : (
            <div className="space-y-3">
              {topCountries.map(([code, count]) => {
                const maxC = Math.max(1, ...topCountries.map(([, n]) => n));
                return (
                  <div key={code}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-ink font-medium">
                        {COUNTRY_NAMES[code] ?? code} <span className="text-ink-muted text-xs">({code})</span>
                      </span>
                      <span className="text-sm font-bold text-brand shrink-0">{count}</span>
                    </div>
                    <Bar pct={(count / maxC) * 100} color={code === "AU" ? "#D97706" : "#0056CE"} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
