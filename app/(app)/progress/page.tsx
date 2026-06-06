import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

// ─── Streak calculation ──────────────────────────────────────────────────────
function calculateStreak(dates: string[]): { current: number; best: number; thisWeek: boolean[] } {
  if (dates.length === 0) return { current: 0, best: 0, thisWeek: [false,false,false,false,false,false,false] };
  const uniqueDays = [...new Set(dates.map(d => d.substring(0, 10)))].sort().reverse();
  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = today.toISOString().substring(0, 10);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().substring(0, 10);
  let current = 0;
  let checkDate = uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr ? new Date(uniqueDays[0]) : null;
  if (checkDate) {
    for (const day of uniqueDays) {
      if (day === checkDate.toISOString().substring(0, 10)) { current++; checkDate.setDate(checkDate.getDate() - 1); }
      else if (day < checkDate.toISOString().substring(0, 10)) break;
    }
  }
  let best = 0; let run = 1;
  const sorted = [...uniqueDays].sort();
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
    if (diff === 1) run++; else { best = Math.max(best, run); run = 1; }
  }
  best = Math.max(best, run); if (uniqueDays.length === 0) best = 0;
  const dayOfWeek = today.getDay();
  const monday = new Date(today); monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const thisWeek: boolean[] = [];
  for (let i = 0; i < 7; i++) { const d = new Date(monday); d.setDate(monday.getDate() + i); thisWeek.push(uniqueDays.includes(d.toISOString().substring(0, 10))); }
  return { current, best, thisWeek };
}

// ─── Progress ring SVG ───────────────────────────────────────────────────────
function ProgressRing({ pct, size = 100, stroke = 6, color = "#0056CE", label, sublabel }: {
  pct: number; size?: number; stroke?: number; color?: string; label: string; sublabel: string;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-ink">{label}</span>
        </div>
      </div>
      <p className="text-[10px] text-ink-muted uppercase tracking-wider font-bold mt-2">{sublabel}</p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: student } = await supabase.from("students").select("id, name").eq("user_id", user.id).maybeSingle();
  if (!student) redirect("/dashboard");

  // Enrollments
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select("id, course_id, enrolled_at, assessment_level, course:courses(id, title, slug, total_lessons, color)")
    .eq("student_id", student.id).eq("status", "active");
  const enrollmentList = (enrollments ?? []) as unknown as Array<{
    id: string; course_id: string; enrolled_at: string; assessment_level: string | null;
    course: { id: string; title: string; slug: string; total_lessons: number; color: string } | null;
  }>;

  // All completions
  const { data: completions } = await supabase.from("lesson_completions")
    .select("id, lesson_id, completed_at, enrollment_id, time_spent_minutes, exercise_scores")
    .eq("student_id", student.id).order("completed_at", { ascending: false });
  const completionList = completions ?? [];

  const totalLessons = enrollmentList.reduce((s, e) => s + (e.course?.total_lessons ?? 0), 0);
  const completedLessons = completionList.length;
  const overallPct = totalLessons > 0 ? completedLessons / totalLessons : 0;

  // Per-course completions
  const completionsByEnrollment = new Map<string, number>();
  for (const c of completionList) { if (c.enrollment_id) completionsByEnrollment.set(c.enrollment_id, (completionsByEnrollment.get(c.enrollment_id) ?? 0) + 1); }

  // Week number
  const earliest = enrollmentList.map(e => new Date(e.enrolled_at).getTime()).sort()[0];
  const weekNum = earliest ? Math.max(1, Math.ceil((Date.now() - earliest) / (7 * 24 * 60 * 60 * 1000))) : 1;

  // Projects
  const { data: projectSubs } = await supabase.from("project_submissions").select("id, score, max_score, submitted_at")
    .eq("student_id", student.id).not("score", "is", null);
  const projectsDone = (projectSubs ?? []).length;
  const avgProjectScore = projectsDone > 0
    ? Math.round((projectSubs ?? []).reduce((s, p) => s + (p.score ?? 0), 0) / projectsDone) : 0;

  // Streak
  const streak = calculateStreak(completionList.map(c => c.completed_at));
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIdx = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; })();

  // Time invested
  const totalMinutes = completionList.reduce((s, c) => s + (c.time_spent_minutes ?? 25), 0);
  const totalHours = Math.round(totalMinutes / 60);

  // Skill reports for topic mastery
  const { data: skillReports } = await supabase.from("skill_reports")
    .select("course_id, topic_mastery_json, weak_topics, strong_topics, level_determined, estimated_score, max_score")
    .eq("student_id", student.id);

  // Parse topic mastery across all reports
  const topicScores: { topic: string; pct: number; course: string }[] = [];
  const weakTopics: string[] = [];
  const strongTopics: string[] = [];
  for (const report of skillReports ?? []) {
    const course = enrollmentList.find(e => e.course_id === report.course_id)?.course?.title ?? "";
    if (report.topic_mastery_json && typeof report.topic_mastery_json === "object") {
      for (const [topic, data] of Object.entries(report.topic_mastery_json as Record<string, { correct: number; total: number }>)) {
        if (data.total > 0) topicScores.push({ topic, pct: Math.round((data.correct / data.total) * 100), course });
      }
    }
    if (report.weak_topics) weakTopics.push(...(report.weak_topics as string[]));
    if (report.strong_topics) strongTopics.push(...(report.strong_topics as string[]));
  }

  // Activity heatmap — last 12 weeks (84 days)
  const heatmapDays: { date: string; count: number; dayOfWeek: number }[] = [];
  const now = new Date(); now.setHours(0,0,0,0);
  const completionDayMap = new Map<string, number>();
  for (const c of completionList) {
    const d = c.completed_at.substring(0, 10);
    completionDayMap.set(d, (completionDayMap.get(d) ?? 0) + 1);
  }
  for (let i = 83; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const ds = d.toISOString().substring(0, 10);
    heatmapDays.push({ date: ds, count: completionDayMap.get(ds) ?? 0, dayOfWeek: d.getDay() });
  }

  // Learning velocity — lessons per week over last 8 weeks
  const velocityWeeks: { week: string; count: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - (w * 7 + now.getDay()));
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
    const ws = weekStart.toISOString().substring(0, 10);
    const we = weekEnd.toISOString().substring(0, 10);
    const count = completionList.filter(c => { const d = c.completed_at.substring(0, 10); return d >= ws && d < we; }).length;
    velocityWeeks.push({ week: `W${8 - w}`, count });
  }
  const maxVelocity = Math.max(...velocityWeeks.map(w => w.count), 1);

  // Recent activity
  const recentIds = completionList.slice(0, 8).map(c => c.lesson_id);
  const { data: recentLessons } = recentIds.length > 0
    ? await supabase.from("lessons").select("id, title, course_id").in("id", recentIds) : { data: [] };
  const lessonMap = new Map((recentLessons ?? []).map(l => [l.id, l]));

  // Assessment scores
  const { data: assessments } = await supabase.from("assessment_attempts")
    .select("course_id, score, max_score, percentage").eq("student_id", student.id).eq("status", "graded");

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
        </div>
        <div>
          <h1 className="text-2xl font-black text-ink">Your Progress</h1>
          <p className="text-sm text-ink-muted">Week {weekNum} of your learning journey</p>
        </div>
      </div>

      {/* ── Overview rings ──────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border shadow-card p-6 sm:p-8 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 place-items-center">
          <ProgressRing pct={overallPct} label={`${Math.round(overallPct * 100)}%`} sublabel="Overall" color="#0056CE" />
          <ProgressRing pct={completedLessons / Math.max(totalLessons, 1)} size={80} stroke={5} label={String(completedLessons)} sublabel={`of ${totalLessons} lessons`} color="#8B5CF6" />
          <ProgressRing pct={Math.min(projectsDone / 10, 1)} size={80} stroke={5} label={String(projectsDone)} sublabel="Projects" color="#059669" />
          <ProgressRing pct={Math.min(totalHours / 100, 1)} size={80} stroke={5} label={`${totalHours}h`} sublabel="Time Invested" color="#F59E0B" />
        </div>
      </div>

      {/* ── Main grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Activity heatmap — GitHub contribution graph style */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Activity — Last 12 Weeks</p>
              <p className="text-xs text-ink-muted">{completionList.length} total lessons completed</p>
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-[3px] min-w-[500px]">
                {/* Group by week (columns) */}
                {Array.from({ length: 12 }, (_, weekIdx) => {
                  const weekDays = heatmapDays.slice(weekIdx * 7, weekIdx * 7 + 7);
                  return (
                    <div key={weekIdx} className="flex flex-col gap-[3px]">
                      {weekDays.map((day, di) => {
                        const intensity = day.count === 0 ? "bg-surface-alt" :
                          day.count === 1 ? "bg-brand/30" :
                          day.count === 2 ? "bg-brand/50" :
                          day.count >= 3 ? "bg-brand" : "bg-surface-alt";
                        return (
                          <div key={di} className={`w-3.5 h-3.5 rounded-sm ${intensity}`} title={`${day.date}: ${day.count} lessons`} />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-2 mt-3 justify-end">
                <span className="text-[10px] text-ink-muted">Less</span>
                <div className="w-3 h-3 rounded-sm bg-surface-alt" />
                <div className="w-3 h-3 rounded-sm bg-brand/30" />
                <div className="w-3 h-3 rounded-sm bg-brand/50" />
                <div className="w-3 h-3 rounded-sm bg-brand" />
                <span className="text-[10px] text-ink-muted">More</span>
              </div>
            </div>
          </div>

          {/* Weekly streak */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Weekly Streak</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round"><path d="M12 2C6 8 2 12 2 16a10 10 0 0020 0c0-4-4-8-10-14z" /></svg>
                  <span className="text-sm font-bold text-ink">{streak.current} day{streak.current !== 1 ? "s" : ""}</span>
                </div>
                <span className="text-xs text-ink-muted">Best: {streak.best}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              {dayNames.map((day, i) => (
                <div key={day} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-[10px] text-ink-muted font-medium">{day}</span>
                  <div className={["w-full aspect-square max-w-[44px] rounded-xl flex items-center justify-center transition-all",
                    streak.thisWeek[i] ? "bg-brand text-white" : i === todayIdx ? "bg-surface-tint border-2 border-brand/30" : "bg-surface-alt"
                  ].join(" ")}>
                    {streak.thisWeek[i] ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : i === todayIdx ? <div className="w-2 h-2 rounded-full bg-brand" /> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Learning velocity — bar chart */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Learning Velocity — Lessons Per Week</p>
            <div className="flex items-end gap-2 h-24">
              {velocityWeeks.map((w, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold text-ink-muted tabular-nums">{w.count || ""}</span>
                  <div className="w-full rounded-t-md transition-all" style={{
                    height: `${Math.max(4, (w.count / maxVelocity) * 80)}px`,
                    background: i === velocityWeeks.length - 1 ? "#0056CE" : "#E2E8F0",
                  }} />
                  <span className="text-[9px] text-ink-muted">{w.week}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Course progress */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Course Progress</p>
            <div className="space-y-4">
              {enrollmentList.map(e => {
                const done = completionsByEnrollment.get(e.id) ?? 0;
                const total = e.course?.total_lessons ?? 40;
                const pct = total > 0 ? done / total : 0;
                const color = e.course?.color ?? "#0056CE";
                const assess = (assessments ?? []).find(a => a.course_id === e.course_id);
                return (
                  <Link key={e.id} href={`/courses/${e.course?.slug}`}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border hover:border-brand/20 hover:bg-surface-soft transition-all group">
                    <div className="w-2 h-10 rounded-full shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-ink truncate group-hover:text-brand transition-colors">{e.course?.title}</p>
                        {e.assessment_level && <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-alt text-ink-muted capitalize">{e.assessment_level}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-surface-alt overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct * 100}%`, background: color }} />
                        </div>
                        <span className="text-xs text-ink-muted font-semibold tabular-nums shrink-0">{done}/{total}</span>
                      </div>
                    </div>
                    {assess && (
                      <div className="text-center shrink-0">
                        <p className="text-sm font-bold" style={{ color }}>{assess.percentage ?? Math.round(((assess.score ?? 0) / (assess.max_score ?? 1)) * 100)}%</p>
                        <p className="text-[9px] text-ink-muted">Assessment</p>
                      </div>
                    )}
                  </Link>
                );
              })}
              {enrollmentList.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm text-ink-muted mb-3">No active courses yet</p>
                  <Link href="/courses" className="text-sm text-brand font-semibold hover:underline">Browse courses</Link>
                </div>
              )}
            </div>
          </div>

          {/* Topic mastery — horizontal bars */}
          {topicScores.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-5">
              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Topic Mastery</p>
              <div className="space-y-3">
                {topicScores.sort((a, b) => b.pct - a.pct).slice(0, 10).map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-ink w-28 truncate">{t.topic}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-surface-alt overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${t.pct}%`,
                        background: t.pct >= 70 ? "#22C55E" : t.pct >= 40 ? "#F59E0B" : "#EF4444",
                      }} />
                    </div>
                    <span className="text-[10px] font-bold tabular-nums w-8 text-right" style={{
                      color: t.pct >= 70 ? "#22C55E" : t.pct >= 40 ? "#F59E0B" : "#EF4444"
                    }}>{t.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-6">

          {/* Quick stats */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Stats</p>
            <div className="space-y-3">
              {[
                { label: "Lessons Completed", value: String(completedLessons), color: "#8B5CF6" },
                { label: "Projects Shipped", value: String(projectsDone), color: "#059669" },
                { label: "Avg Project Score", value: projectsDone > 0 ? `${avgProjectScore}%` : "—", color: "#0056CE" },
                { label: "Total Study Time", value: `${totalHours}h ${totalMinutes % 60}m`, color: "#F59E0B" },
                { label: "Current Streak", value: `${streak.current} days`, color: "#D97706" },
                { label: "Best Streak", value: `${streak.best} days`, color: "#D97706" },
                { label: "Active Courses", value: String(enrollmentList.length), color: "#0056CE" },
                { label: "Week", value: String(weekNum), color: "#8B5CF6" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-ink-muted">{s.label}</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths + weaknesses */}
          {(strongTopics.length > 0 || weakTopics.length > 0) && (
            <div className="bg-surface rounded-xl border border-border p-5">
              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Skill Assessment</p>
              {strongTopics.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-2">Strengths</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...new Set(strongTopics)].slice(0, 5).map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {weakTopics.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-2">Focus Areas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...new Set(weakTopics)].slice(0, 5).map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent activity */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Recent Activity</p>
            {completionList.length > 0 ? (
              <div className="space-y-1">
                {completionList.slice(0, 8).map(activity => {
                  const lesson = lessonMap.get(activity.lesson_id);
                  const date = new Date(activity.completed_at);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const dateStr = isToday ? "Today" : date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
                  return (
                    <div key={activity.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-soft transition-colors">
                      <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-ink truncate">{lesson?.title ?? "Lesson"}</p>
                        {activity.time_spent_minutes && <p className="text-[10px] text-ink-muted">{activity.time_spent_minutes}m</p>}
                      </div>
                      <span className="text-[10px] text-ink-muted shrink-0">{dateStr}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-xl bg-surface-alt flex items-center justify-center mx-auto mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
                </div>
                <p className="text-xs text-ink-muted">Complete a lesson to start tracking</p>
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Milestones</p>
            <div className="space-y-2">
              {[
                { label: "First Lesson", threshold: 1, icon: "M4 19.5A2.5 2.5 0 016.5 17H20" },
                { label: "10 Lessons", threshold: 10, icon: "M12 2L2 7l10 5 10-5-10-5z" },
                { label: "50 Lessons", threshold: 50, icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
                { label: "First Project", threshold: 1, icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z", useProjects: true },
                { label: "5 Projects", threshold: 5, icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", useProjects: true },
                { label: "7-Day Streak", threshold: 7, icon: "M12 2C6 8 2 12 2 16a10 10 0 0020 0c0-4-4-8-10-14z", useStreak: true },
                { label: "50% Complete", threshold: 50, icon: "M22 11.08V12a10 10 0 11-5.93-9.14", usePct: true },
                { label: "100% Complete", threshold: 100, icon: "M22 11.08V12a10 10 0 11-5.93-9.14", usePct: true },
              ].map(m => {
                const val = (m as { useProjects?: boolean }).useProjects ? projectsDone :
                  (m as { usePct?: boolean }).usePct ? Math.round(overallPct * 100) :
                  (m as { useStreak?: boolean }).useStreak ? streak.best :
                  completedLessons;
                const earned = val >= m.threshold;
                return (
                  <div key={m.label} className={["flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all",
                    earned ? "border-brand/20 bg-surface-tint" : "border-border opacity-40"
                  ].join(" ")}>
                    <div className={["w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                      earned ? "bg-brand text-white" : "bg-surface-alt text-ink-muted"
                    ].join(" ")}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={m.icon} /></svg>
                    </div>
                    <span className={["text-xs font-semibold", earned ? "text-ink" : "text-ink-muted"].join(" ")}>{m.label}</span>
                    {earned && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" className="ml-auto"><polyline points="20 6 9 17 4 12" /></svg>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
