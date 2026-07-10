import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    studentsResult,
    enrollmentsResult,
    completedLessonsResult,
    totalLessonsResult,
    projectSubmissionsResult,
    assessmentResultsResult,
    courseStatsResult,
  ] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("student_enrollments").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("lesson_completions").select("id", { count: "exact", head: true }),
    supabase.from("lessons").select("id", { count: "exact", head: true }),
    supabase.from("project_submissions").select("score, project_id, course_id").not("score", "is", null),
    supabase.from("assessment_attempts").select("score, max_score, course_id, level_determined"),
    supabase.from("student_enrollments")
      .select("course_id, course:courses(title, slug)")
      .eq("status", "active"),
  ]);

  const totalStudents = studentsResult.count ?? 0;
  const activeEnrollments = enrollmentsResult.count ?? 0;
  const completedLessons = completedLessonsResult.count ?? 0;
  const totalLessons = totalLessonsResult.count ?? 0;
  const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Project scores
  const projectScores = (projectSubmissionsResult.data ?? []).map(s => s.score).filter((s): s is number => s !== null);
  const avgProjectScore = projectScores.length > 0
    ? Math.round(projectScores.reduce((a, b) => a + b, 0) / projectScores.length)
    : 0;
  const totalProjectsSubmitted = projectScores.length;

  // Assessment scores by level
  const assessments = assessmentResultsResult.data ?? [];
  const assessmentsByLevel: Record<string, { count: number; avgScore: number }> = {};
  for (const a of assessments) {
    const level = a.level_determined ?? "unknown";
    if (!assessmentsByLevel[level]) assessmentsByLevel[level] = { count: 0, avgScore: 0 };
    assessmentsByLevel[level].count++;
    assessmentsByLevel[level].avgScore += (a.score ?? 0);
  }
  for (const level in assessmentsByLevel) {
    const entry = assessmentsByLevel[level];
    entry.avgScore = entry.count > 0 ? Math.round(entry.avgScore / entry.count) : 0;
  }

  // Enrollments per course
  const courseEnrollments: Record<string, { title: string; count: number }> = {};
  for (const e of courseStatsResult.data ?? []) {
    const course = e.course as unknown as { title: string; slug: string } | null;
    const key = e.course_id;
    if (!courseEnrollments[key]) {
      courseEnrollments[key] = { title: course?.title ?? key, count: 0 };
    }
    courseEnrollments[key].count++;
  }
  const topCourses = Object.entries(courseEnrollments)
    .map(([id, data]) => ({ courseId: id, ...data }))
    .sort((a, b) => b.count - a.count);

  // Score distribution
  const scoreDistribution = {
    excellent: projectScores.filter(s => s >= 90).length,
    good: projectScores.filter(s => s >= 70 && s < 90).length,
    fair: projectScores.filter(s => s >= 50 && s < 70).length,
    needsWork: projectScores.filter(s => s < 50).length,
  };

  return NextResponse.json({
    snapshot: new Date().toISOString(),
    students: {
      total: totalStudents,
      activeEnrollments,
    },
    lessons: {
      completed: completedLessons,
      total: totalLessons,
      completionRate,
    },
    projects: {
      totalSubmitted: totalProjectsSubmitted,
      avgScore: avgProjectScore,
      scoreDistribution,
    },
    assessments: {
      total: assessments.length,
      byLevel: assessmentsByLevel,
    },
    courses: {
      topByEnrollment: topCourses.slice(0, 10),
    },
  });
}
