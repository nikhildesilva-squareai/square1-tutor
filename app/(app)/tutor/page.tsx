import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TutorClient } from "./TutorClient";

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

  if (!student) redirect("/dashboard");

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

  return (
    <TutorClient
      studentName={student.name ?? user.email?.split("@")[0] ?? "Student"}
      userEmail={user.email ?? ""}
      enrollments={enrollmentContexts}
      weakTopics={weakTopics}
    />
  );
}
