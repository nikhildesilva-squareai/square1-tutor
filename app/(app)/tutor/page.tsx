import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TutorClient } from "./TutorClient";
import { getUsageSummary } from "@/lib/ai/budget";

interface EnrollmentContext {
  enrollmentId: string;
  courseTitle: string;
  courseSlug: string;
  currentLessonTitle: string | null;
}

export default async function TutorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: student } = await supabase
    .from("students")
    .select("id, name, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/10 to-violet-500/10 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
          </div>
          <h2 className="text-lg font-bold text-ink mb-2">Nova is ready when you are</h2>
          <p className="text-sm text-ink-muted mb-6">Enrol in a course first and Nova will have full lesson context to help you.</p>
          <a href="/courses" className="inline-flex h-11 px-6 items-center rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand/90 transition-all">Browse courses</a>
        </div>
      </div>
    );
  }

  // Get active enrollments with course + current lesson
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select(`id, course_id, current_lesson_id,
      course:courses(id, slug, title),
      current_lesson:lessons!student_enrollments_current_lesson_id_fkey(id, title)`)
    .eq("student_id", student.id)
    .eq("status", "active")
    .order("enrolled_at", { ascending: false });

  const enrollmentContexts: EnrollmentContext[] = (enrollments ?? []).map((e) => {
    const course = e.course as unknown as { id: string; slug: string; title: string } | null;
    const currentLesson = e.current_lesson as unknown as { id: string; title: string } | null;
    return {
      enrollmentId: e.id,
      courseTitle: course?.title ?? "Unknown Course",
      courseSlug: course?.slug ?? "",
      currentLessonTitle: currentLesson?.title ?? null,
    };
  });

  // Load current lesson's learning objectives + content summary for AI context
  const primaryEnrollment = enrollments?.[0];
  const currentLessonId = primaryEnrollment?.current_lesson_id;
  let lessonObjectives: string[] = [];
  let lessonContentSummary = "";
  if (currentLessonId) {
    const { data: lessonData } = await supabase
      .from("lessons")
      .select("learning_objectives, theory_md")
      .eq("id", currentLessonId)
      .maybeSingle();
    if (lessonData) {
      lessonObjectives = (lessonData.learning_objectives as string[]) ?? [];
      const theory = (lessonData.theory_md as string) ?? "";
      lessonContentSummary = theory.length > 1500 ? theory.slice(0, 1500) + "..." : theory;
    }
  }

  // Get assessment weak topics (from latest graded attempt)
  const { data: assessmentAttempts } = await supabase
    .from("assessment_attempts")
    .select("topic_scores")
    .eq("student_id", student.id)
    .eq("status", "graded")
    .order("submitted_at", { ascending: false })
    .limit(1);

  let weakTopics: string[] = [];
  if (assessmentAttempts && assessmentAttempts.length > 0) {
    const topicScores = assessmentAttempts[0].topic_scores as Record<string, { score: number; max: number }> | null;
    if (topicScores) {
      weakTopics = Object.entries(topicScores)
        .filter(([, data]) => data.max > 0 && (data.score / data.max) < 0.6)
        .map(([topic]) => topic);
    }
  }

  // AI usage for the subtle budget meter (graceful — never blocks the page)
  let usagePercent = 0;
  try {
    const usage = await getUsageSummary(student.id);
    usagePercent = usage.percentUsed;
  } catch {
    // ignore — meter just won't show
  }

  return (
    <TutorClient
      studentName={student.name ?? user.email?.split("@")[0] ?? "Student"}
      userEmail={user.email ?? ""}
      enrollments={enrollmentContexts}
      weakTopics={weakTopics}
      lessonObjectives={lessonObjectives}
      lessonContentSummary={lessonContentSummary}
      usagePercent={usagePercent}
    />
  );
}
