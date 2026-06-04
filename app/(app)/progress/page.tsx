import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// ─── Streak calculation ──────────────────────────────────────────────────────

function calculateStreak(dates: string[]): { current: number; best: number; thisWeek: boolean[] } {
  if (dates.length === 0) return { current: 0, best: 0, thisWeek: [false, false, false, false, false, false, false] };

  // Normalize to date strings (YYYY-MM-DD) and deduplicate
  const uniqueDays = [...new Set(dates.map((d) => d.substring(0, 10)))].sort().reverse();

  // Current streak: count consecutive days ending today (or yesterday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().substring(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().substring(0, 10);

  let current = 0;
  let checkDate = uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr ? new Date(uniqueDays[0]) : null;

  if (checkDate) {
    for (const day of uniqueDays) {
      const expected = checkDate.toISOString().substring(0, 10);
      if (day === expected) {
        current++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (day < expected) {
        break;
      }
    }
  }

  // Best streak: find longest consecutive run
  let best = 0;
  let run = 1;
  const sorted = [...uniqueDays].sort();
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      run++;
    } else {
      best = Math.max(best, run);
      run = 1;
    }
  }
  best = Math.max(best, run);
  if (uniqueDays.length === 0) best = 0;

  // This week (Mon-Sun)
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const thisWeek: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dStr = d.toISOString().substring(0, 10);
    thisWeek.push(uniqueDays.includes(dStr));
  }

  return { current, best, thisWeek };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: student } = await supabase
    .from("students")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!student) redirect("/dashboard");

  // Get active enrollments with course info
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select("id, course_id, enrolled_at, course:courses(id, title, total_lessons)")
    .eq("student_id", student.id)
    .eq("status", "active");

  const enrollmentList = (enrollments ?? []) as unknown as Array<{
    id: string;
    course_id: string;
    enrolled_at: string;
    course: { id: string; title: string; total_lessons: number } | null;
  }>;

  // Get all lesson completions
  const { data: completions } = await supabase
    .from("lesson_completions")
    .select("id, lesson_id, completed_at")
    .eq("student_id", student.id)
    .order("completed_at", { ascending: false });

  const completionList = completions ?? [];

  // Calculate total lessons across all courses
  const totalLessons = enrollmentList.reduce((sum, e) => sum + (e.course?.total_lessons ?? 0), 0);
  const completedLessons = completionList.length;
  const overallPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Calculate week number (from earliest enrollment)
  const earliestEnrollment = enrollmentList
    .map((e) => new Date(e.enrolled_at).getTime())
    .sort()[0];
  const weekNumber = earliestEnrollment
    ? Math.max(1, Math.ceil((Date.now() - earliestEnrollment) / (7 * 24 * 60 * 60 * 1000)))
    : 1;

  // Get project counts
  const { count: projectsDone } = await supabase
    .from("student_projects")
    .select("id", { count: "exact", head: true })
    .eq("student_id", student.id)
    .in("status", ["submitted", "reviewed"]);

  const { count: projectsTotal } = await supabase
    .from("student_projects")
    .select("id", { count: "exact", head: true })
    .eq("student_id", student.id);

  // Streak calculation
  const completionDates = completionList.map((c) => c.completed_at);
  const streak = calculateStreak(completionDates);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Assessment attempts (for skill growth)
  const { data: assessmentAttempts } = await supabase
    .from("assessment_attempts")
    .select("id, course_id, score, max_score, topic_scores, status")
    .eq("student_id", student.id)
    .eq("status", "graded")
    .order("submitted_at", { ascending: true });

  const assessments = (assessmentAttempts ?? []) as Array<{
    id: string;
    course_id: string;
    score: number;
    max_score: number;
    topic_scores: Record<string, { score: number; max: number }> | null;
    status: string;
  }>;

  // Build skill growth data from topic_scores
  const skillGrowth: Array<{ topic: string; original: number; current: number }> = [];
  if (assessments.length > 0) {
    const firstAttempt = assessments[0];
    const latestAttempt = assessments[assessments.length - 1];

    if (firstAttempt.topic_scores) {
      for (const [topic, data] of Object.entries(firstAttempt.topic_scores)) {
        const originalPct = data.max > 0 ? Math.round((data.score / data.max) * 100) : 0;
        let currentPct = originalPct;

        // Check if latest attempt has updated score for this topic
        if (latestAttempt.topic_scores && latestAttempt.id !== firstAttempt.id) {
          const latestData = latestAttempt.topic_scores[topic];
          if (latestData) {
            currentPct = latestData.max > 0 ? Math.round((latestData.score / latestData.max) * 100) : originalPct;
          }
        }

        skillGrowth.push({ topic, original: originalPct, current: currentPct });
      }
    }
  }

  // Activity log: last 7 lesson completions
  const recentActivity = completionList.slice(0, 7);

  // Fetch lesson titles for the recent activity
  const recentLessonIds = recentActivity.map((c) => c.lesson_id);
  const { data: recentLessons } = recentLessonIds.length > 0
    ? await supabase
        .from("lessons")
        .select("id, title")
        .in("id", recentLessonIds)
    : { data: [] };

  const lessonTitleMap: Record<string, string> = {};
  for (const l of (recentLessons ?? [])) {
    lessonTitleMap[l.id] = l.title;
  }

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Your Progress</h1>
        <p className="text-sm text-ink-muted mt-1">Track your learning journey.</p>
      </div>

      {/* ── OVERALL ────────────────────────────────────────────── */}
      <section className="mb-8">
        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">
          Overall
        </p>
        <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1">
              <div className="w-full bg-surface-alt rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-brand transition-all"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
            </div>
            <span className="text-lg font-black text-ink shrink-0">{overallPercent}%</span>
          </div>
          <p className="text-sm text-ink-secondary">
            Week {weekNumber} &middot; {completedLessons}/{totalLessons} lessons &middot; {projectsDone ?? 0}/{projectsTotal ?? 0} projects
          </p>
        </div>
      </section>

      {/* ── STREAK ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">
          Streak
        </p>
        <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-6 mb-4">
            <div>
              <p className="text-2xl font-black text-ink">{streak.current}</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Current days</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <p className="text-2xl font-black text-ink">{streak.best}</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Best streak</p>
            </div>
          </div>

          {/* This week grid */}
          <div className="flex items-center gap-2">
            {dayNames.map((day, i) => (
              <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={[
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors",
                    streak.thisWeek[i]
                      ? "bg-brand text-white"
                      : "bg-surface-alt text-ink-muted",
                  ].join(" ")}
                >
                  {streak.thisWeek[i] ? "■" : "○"}
                </div>
                <span className="text-[10px] text-ink-muted font-medium">{day}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SKILL GROWTH ───────────────────────────────────────── */}
      {skillGrowth.length > 0 && (
        <section className="mb-8">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">
            Skill Growth
          </p>
          <div className="bg-surface border border-border rounded-xl p-5 shadow-card space-y-4">
            {skillGrowth.map((skill) => {
              const growth = skill.current - skill.original;
              return (
                <div key={skill.topic}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-ink">{skill.topic}</span>
                    <span className="text-xs text-ink-muted">
                      {skill.original}% → {skill.current}%
                      {growth > 0 && (
                        <span className="text-success ml-1 font-semibold">+{growth}%</span>
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-surface-alt rounded-full h-2 relative">
                    {/* Original score marker */}
                    <div
                      className="absolute h-2 rounded-full bg-surface-tint"
                      style={{ width: `${skill.original}%` }}
                    />
                    {/* Current score bar */}
                    <div
                      className="absolute h-2 rounded-full bg-brand transition-all"
                      style={{ width: `${skill.current}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── ACTIVITY LOG ───────────────────────────────────────── */}
      <section className="mb-8">
        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">
          Activity Log
        </p>
        {recentActivity.length > 0 ? (
          <div className="bg-surface border border-border rounded-xl shadow-card divide-y divide-border">
            {recentActivity.map((activity) => {
              const date = new Date(activity.completed_at);
              const dateStr = date.toLocaleDateString("en-AU", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              return (
                <div
                  key={activity.id}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-success text-xs font-bold">{"✓"}</span>
                    <span className="text-sm text-ink">
                      {lessonTitleMap[activity.lesson_id] ?? "Lesson"}
                    </span>
                  </div>
                  <span className="text-xs text-ink-muted">{dateStr}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-6 text-center">
            <p className="text-sm text-ink-muted">
              No activity yet. Complete your first lesson to see your progress here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
