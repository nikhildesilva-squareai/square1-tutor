import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Course, Module, Lesson, Project } from "@/types/database";

function levelVariant(level: string): "success" | "warning" | "error" {
  if (level === "advanced") return "success";
  if (level === "intermediate") return "warning";
  return "error";
}

function difficultyVariant(difficulty: string): "success" | "warning" | "error" {
  if (difficulty === "advanced") return "error";
  if (difficulty === "intermediate") return "warning";
  return "success";
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle() as { data: Course | null };

  if (!course) notFound();

  const { data: modules } = (await supabase
    .from("modules")
    .select("id, course_id, order_index, title, description, week_number")
    .eq("course_id", course.id)
    .order("order_index", { ascending: true })) as { data: Module[] | null };

  const { data: projects } = (await supabase
    .from("projects")
    .select("id, course_id, order_index, title, description_md, difficulty, estimated_hours, tech_stack")
    .eq("course_id", course.id)
    .order("order_index", { ascending: true })
    .limit(4)) as { data: Project[] | null };

  // Fetch all lessons for this course
  const { data: lessons } = (await supabase
    .from("lessons")
    .select("id, module_id, order_index, title, estimated_minutes")
    .eq("course_id", course.id)
    .order("order_index", { ascending: true })) as { data: Pick<Lesson, "id" | "module_id" | "order_index" | "title" | "estimated_minutes">[] | null };

  // Fetch student + enrollment + completions (if logged in)
  let studentId: string | null = null;
  let currentLessonId: string | null = null;
  let completedLessonIds: Set<string> = new Set();

  if (user) {
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (student) {
      studentId = student.id;

      const { data: enrollment } = await supabase
        .from("student_enrollments")
        .select("id, current_lesson_id")
        .eq("student_id", student.id)
        .eq("course_id", course.id)
        .eq("status", "active")
        .maybeSingle();

      currentLessonId = enrollment?.current_lesson_id ?? null;

      if (enrollment) {
        const { data: completions } = await supabase
          .from("lesson_completions")
          .select("lesson_id")
          .eq("student_id", student.id);

        if (completions) {
          completedLessonIds = new Set(completions.map((c) => c.lesson_id));
        }
      }
    }
  }

  const moduleList = modules ?? [];
  const projectList = projects ?? [];
  const lessonList = lessons ?? [];

  // Group lessons by module
  const lessonsByModule: Record<string, typeof lessonList> = {};
  for (const lesson of lessonList) {
    if (!lessonsByModule[lesson.module_id]) {
      lessonsByModule[lesson.module_id] = [];
    }
    lessonsByModule[lesson.module_id].push(lesson);
  }

  // Determine if a module is fully completed
  function isModuleCompleted(moduleId: string): boolean {
    const modLessons = lessonsByModule[moduleId] ?? [];
    return modLessons.length > 0 && modLessons.every((l) => completedLessonIds.has(l.id));
  }

  // Determine lesson status
  function getLessonStatus(lessonId: string, moduleIndex: number): "completed" | "current" | "locked" {
    if (completedLessonIds.has(lessonId)) return "completed";
    if (lessonId === currentLessonId) return "current";
    // If student has no enrollment, all are locked
    if (!studentId) return "locked";
    // First lesson of first module is accessible if nothing completed
    if (moduleIndex === 0 && completedLessonIds.size === 0 && currentLessonId === null) {
      const firstModuleLessons = lessonsByModule[moduleList[0]?.id] ?? [];
      if (firstModuleLessons.length > 0 && firstModuleLessons[0].id === lessonId) return "current";
    }
    return "locked";
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-6 py-8 max-w-4xl mx-auto">
        <Link href="/courses" className="text-sm text-brand hover:underline mb-6 inline-block">
          ← Back to courses
        </Link>
        <div className="flex items-start gap-5">
          <div className="w-16 h-1.5 rounded-full mt-4 shrink-0" style={{ background: course.color }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-ink">{course.title}</h1>
              <Badge variant={levelVariant(course.level)}>
                {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
              </Badge>
            </div>
            <p className="text-ink-muted text-sm leading-relaxed max-w-2xl">
              {course.description}
            </p>
            <div className="flex items-center gap-5 mt-4 text-sm text-ink-muted">
              <span>{course.total_modules} modules</span>
              <span className="text-border-mid">·</span>
              <span>{course.total_lessons} lessons</span>
              <span className="text-border-mid">·</span>
              <span>{course.total_projects} projects</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        {/* What you'll build */}
        {projectList.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-ink mb-1">What you&apos;ll build</h2>
            <p className="text-sm text-ink-muted mb-5">
              Real projects that go straight into your portfolio.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projectList.map((project) => (
                <div
                  key={project.id}
                  className="bg-surface border border-border rounded-[var(--radius-lg)] p-4 shadow-card"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-ink leading-snug">
                      {project.title}
                    </h3>
                    <Badge variant={difficultyVariant(project.difficulty)} className="shrink-0">
                      {project.difficulty.charAt(0).toUpperCase() + project.difficulty.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-muted mb-3 line-clamp-2">
                    {project.description_md.replace(/[#*`]/g, "").substring(0, 100)}...
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(project.tech_stack ?? []).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 bg-surface-tint text-brand text-xs rounded-[var(--radius-pill)] font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Curriculum with lessons */}
        {moduleList.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-ink mb-1">Curriculum</h2>
            <p className="text-sm text-ink-muted mb-5">
              {lessonList.length} lessons across {moduleList.length} modules
            </p>
            <div className="space-y-5">
              {moduleList.map((mod, mi) => {
                const modLessons = lessonsByModule[mod.id] ?? [];
                const modCompleted = isModuleCompleted(mod.id);
                const completedCount = modLessons.filter((l) => completedLessonIds.has(l.id)).length;

                return (
                  <div key={mod.id} className="bg-surface border border-border rounded-[var(--radius-lg)] shadow-card overflow-hidden">
                    {/* Module header */}
                    <div className="px-5 py-4 flex items-center gap-4 border-b border-border">
                      <div className={[
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        modCompleted ? "bg-success-bg text-success" : "bg-surface-tint text-brand",
                      ].join(" ")}>
                        {modCompleted ? "✓" : mi + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink">
                          Module {mi + 1}: {mod.title}
                        </p>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {modLessons.length} lessons {completedCount > 0 && `· ${completedCount}/${modLessons.length} complete`}
                        </p>
                      </div>
                      <span className="text-xs text-ink-muted shrink-0">Week {mod.week_number}</span>
                    </div>

                    {/* Lessons list */}
                    <div className="divide-y divide-border">
                      {modLessons.map((lesson, li) => {
                        const status = getLessonStatus(lesson.id, mi);
                        return (
                          <div
                            key={lesson.id}
                            className={[
                              "px-5 py-3 flex items-center gap-3",
                              status === "locked" ? "opacity-60" : "",
                            ].join(" ")}
                          >
                            {/* Status indicator */}
                            <span className="w-5 h-5 flex items-center justify-center text-xs shrink-0">
                              {status === "completed" && (
                                <span className="text-success font-bold">{"✓"}</span>
                              )}
                              {status === "current" && (
                                <span className="text-brand font-bold">{"→"}</span>
                              )}
                              {status === "locked" && (
                                <span className="text-ink-muted">{"•"}</span>
                              )}
                            </span>

                            {/* Lesson info */}
                            <div className="flex-1 min-w-0">
                              <p className={[
                                "text-sm",
                                status === "completed" ? "text-ink-secondary" : "",
                                status === "current" ? "text-ink font-medium" : "",
                                status === "locked" ? "text-ink-muted" : "",
                              ].join(" ")}>
                                Lesson {li + 1}: {lesson.title}
                              </p>
                            </div>

                            {/* Action */}
                            {status === "completed" && (
                              <Link
                                href={`/learn/${lesson.id}`}
                                className="text-xs text-brand hover:underline font-medium shrink-0"
                              >
                                Review
                              </Link>
                            )}
                            {status === "current" && (
                              <Link
                                href={`/learn/${lesson.id}`}
                                className="inline-flex items-center gap-1 text-xs text-white bg-brand px-3 py-1.5 rounded-lg font-semibold hover:bg-brand-dark transition-colors shrink-0"
                              >
                                Start &rarr;
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{course.title}</p>
          <p className="text-xs text-ink-muted">20 questions · ~30 minutes</p>
        </div>
        <Link
          href={`/courses/${slug}/assess`}
          className="inline-flex items-center justify-center h-11 px-6 rounded-[var(--radius-md)] bg-brand text-white font-semibold text-sm hover:bg-brand-dark transition-colors"
        >
          Take the Assessment →
        </Link>
      </div>
    </div>
  );
}
