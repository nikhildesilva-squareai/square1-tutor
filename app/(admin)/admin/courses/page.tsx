import { createAdminClient } from "@/lib/supabase/admin";

const COURSE_COLORS: Record<string, string> = {
  "generative-ai": "#6366f1",
  "machine-learning": "#8b5cf6",
  "cybersecurity": "#ef4444",
  "fullstack-development": "#06b6d4",
  "data-science": "#14b8a6",
  "artificial-intelligence": "#0ea5e9",
  "llm-agent-architect": "#7C3AED",
  "devops-engineering": "#F97316",
  "computer-vision": "#10b981",
  "game-development": "#f59e0b",
  "drone-technology": "#EC4899",
  "ai-product-management": "#0EA5E9",
};

function Bar({ pct, color = "#0056CE" }: { pct: number; color?: string }) {
  return (
    <div className="w-full h-2 rounded-full bg-surface-alt overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  );
}

export default async function AdminCoursesPage() {
  const db = createAdminClient();

  const [coursesRes, enrollmentsRes, completionsRes, quizRes] = await Promise.all([
    db.from("courses").select("id, slug, title, total_lessons").order("title"),
    db.from("student_enrollments").select("course_id, student_id, status, assessment_level"),
    db.from("lesson_completions").select("enrollment_id, student_id, lesson_id, enrollment:student_enrollments(course_id)"),
    db.from("quiz_attempts").select("course_id, student_id, score, max_score").not("score", "is", null),
  ]);

  const courses = coursesRes.data ?? [];
  const enrollments = enrollmentsRes.data ?? [];
  const completions = completionsRes.data ?? [];
  const quizzes = quizRes.data ?? [];

  // Build per-course stats
  const courseStats = courses.map((course) => {
    const courseEnrollments = enrollments.filter(e => e.course_id === course.id);
    const activeEnrollments = courseEnrollments.filter(e => e.status === "active");

    // Level distribution
    const levels = { beginner: 0, intermediate: 0, advanced: 0 };
    for (const e of activeEnrollments) {
      const lvl = e.assessment_level as keyof typeof levels;
      if (lvl && levels[lvl] !== undefined) levels[lvl]++;
    }

    // Lessons completed for this course
    const courseCompletions = completions.filter(c => {
      const enrollment = c.enrollment as unknown as { course_id: string } | null;
      return enrollment?.course_id === course.id;
    });
    const totalCompletedLessons = courseCompletions.length;
    const avgLessonsPerStudent = activeEnrollments.length > 0
      ? totalCompletedLessons / activeEnrollments.length
      : 0;
    const avgProgressPct = course.total_lessons > 0
      ? (avgLessonsPerStudent / course.total_lessons) * 100
      : 0;

    // Quiz scores for this course
    const courseQuizzes = quizzes.filter(q => q.course_id === course.id);
    const avgScore = courseQuizzes.length > 0
      ? courseQuizzes.reduce((sum, q) => sum + (q.score / q.max_score) * 100, 0) / courseQuizzes.length
      : 0;

    const color = COURSE_COLORS[course.slug] ?? "#0056CE";

    return {
      ...course,
      color,
      totalEnrollments: activeEnrollments.length,
      levels,
      totalCompletedLessons,
      avgProgressPct,
      avgScore,
      quizCount: courseQuizzes.length,
    };
  });

  // Sort by enrollment count
  courseStats.sort((a, b) => b.totalEnrollments - a.totalEnrollments);

  const totalEnrollments = courseStats.reduce((sum, c) => sum + c.totalEnrollments, 0);

  return (
    <div className="min-h-full px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-ink tracking-tight">Courses</h1>
        <p className="text-sm text-ink-muted mt-1">{courses.length} courses &middot; {totalEnrollments} total enrollments</p>
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {courseStats.map((course) => (
          <div key={course.id} className="bg-surface rounded-xl border border-border p-5 hover:shadow-card transition-shadow">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-10 rounded-full shrink-0" style={{ background: course.color }} />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-ink truncate">{course.title}</h3>
                <p className="text-[10px] text-ink-muted">{course.total_lessons} lessons</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-black" style={{ color: course.color }}>{course.totalEnrollments}</p>
                <p className="text-[10px] text-ink-muted">enrolled</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-ink-muted font-semibold uppercase tracking-wider">Avg Progress</span>
                <span className="text-xs font-bold text-ink">{Math.round(course.avgProgressPct)}%</span>
              </div>
              <Bar pct={course.avgProgressPct} color={course.color} />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg bg-surface-soft">
                <p className="text-sm font-bold text-ink">{course.totalCompletedLessons}</p>
                <p className="text-[9px] text-ink-muted uppercase">Lessons Done</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-surface-soft">
                <p className="text-sm font-bold text-ink">{course.quizCount}</p>
                <p className="text-[9px] text-ink-muted uppercase">Quizzes</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-surface-soft">
                <p className="text-sm font-bold text-ink">{Math.round(course.avgScore)}%</p>
                <p className="text-[9px] text-ink-muted uppercase">Avg Score</p>
              </div>
            </div>

            {/* Level distribution */}
            {course.totalEnrollments > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[9px] text-ink-muted uppercase tracking-wider">Levels:</span>
                <div className="flex gap-1.5">
                  {course.levels.beginner > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600">
                      {course.levels.beginner} Beg
                    </span>
                  )}
                  {course.levels.intermediate > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600">
                      {course.levels.intermediate} Int
                    </span>
                  )}
                  {course.levels.advanced > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600">
                      {course.levels.advanced} Adv
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
