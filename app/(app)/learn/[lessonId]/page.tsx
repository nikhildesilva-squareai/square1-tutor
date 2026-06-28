import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { LearnClient } from "./LearnClient";

interface PageProps {
  params: Promise<{ lessonId: string }>;
}

export default async function LearnPage({ params }: PageProps) {
  const { lessonId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get student
  const { data: student } = await supabase
    .from("students")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!student) redirect("/dashboard");

  // Get lesson with its module and course
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, module_id, course_id, order_index, title, theory_md, estimated_minutes, learning_objectives, case_study, reference_links, applied_task")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson) notFound();

  // Get module info
  const { data: module } = await supabase
    .from("modules")
    .select("id, title, order_index, course_id")
    .eq("id", lesson.module_id)
    .maybeSingle();

  // Get course info
  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, title, total_lessons")
    .eq("id", lesson.course_id)
    .maybeSingle();

  // Get all lessons in this module to determine position
  const { data: moduleLessons } = await supabase
    .from("lessons")
    .select("id, order_index, title")
    .eq("module_id", lesson.module_id)
    .order("order_index", { ascending: true });

  const lessonList = moduleLessons ?? [];
  const lessonIndex = lessonList.findIndex((l) => l.id === lessonId);
  const totalLessonsInModule = lessonList.length;

  // Course-wide ordered lessons → previous/next navigation that flows across modules,
  // so a learner can always step back to review (or forward through) any lesson.
  const [{ data: allCourseLessons }, { data: allCourseModules }] = await Promise.all([
    supabase.from("lessons").select("id, order_index, module_id").eq("course_id", lesson.course_id),
    supabase.from("modules").select("id, order_index").eq("course_id", lesson.course_id),
  ]);
  const modOrder = new Map((allCourseModules ?? []).map((m) => [m.id, m.order_index ?? 0]));
  const orderedLessons = (allCourseLessons ?? []).slice().sort((a, b) =>
    ((modOrder.get(a.module_id) ?? 0) - (modOrder.get(b.module_id) ?? 0)) || (a.order_index - b.order_index)
  );
  const courseIdx = orderedLessons.findIndex((l) => l.id === lessonId);
  const prevLessonId = courseIdx > 0 ? orderedLessons[courseIdx - 1].id : null;
  const nextLessonId = courseIdx >= 0 && courseIdx < orderedLessons.length - 1 ? orderedLessons[courseIdx + 1].id : null;

  // Get exercises for this lesson
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, lesson_id, order_index, type, title, prompt_md, starter_code, marks, language, options, correct_answer")
    .eq("lesson_id", lessonId)
    .order("order_index", { ascending: true });

  // Strip sensitive fields before sending to client:
  // - MCQ: keep correct_answer (needed for instant inline quiz feedback — answers are in the options anyway)
  // - Short answer / Code: STRIP correct_answer (would leak the model answer / solution)
  // - solution_code: NEVER sent (not even queried above)
  const safeExercises = (exercises ?? []).map((ex) => ({
    ...ex,
    correct_answer: ex.type === "mcq" ? ex.correct_answer : null,
  }));

  // Check if already completed
  const { data: completion } = await supabase
    .from("lesson_completions")
    .select("id")
    .eq("student_id", student.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  // Advanced course — fetch for the "What's Next" CTA shown on the final lesson
  let advancedCourse: { slug: string; title: string } | null = null;
  if (course && nextLessonId === null) {
    const { data: adv } = await supabase
      .from("courses")
      .select("slug, title")
      .eq("slug", `${course.slug}-advanced`)
      .eq("status", "active")
      .maybeSingle();
    advancedCourse = adv ?? null;
  }

  // Pull the learner's most recent assessment weak topics so in-lesson Nova
  // can connect explanations back to where they're actually struggling.
  const { data: skillReport } = await supabase
    .from("skill_reports")
    .select("weak_topics")
    .eq("student_id", student.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const weakTopics = Array.isArray(skillReport?.weak_topics)
    ? (skillReport.weak_topics as string[])
    : [];

  return (
    <LearnClient
      lesson={lesson}
      module={module}
      course={course}
      exercises={safeExercises}
      lessonPosition={lessonIndex + 1}
      totalLessonsInModule={totalLessonsInModule}
      prevLessonId={prevLessonId}
      nextLessonId={nextLessonId}
      alreadyCompleted={!!completion}
      weakTopics={weakTopics}
      advancedCourse={advancedCourse}
    />
  );
}
