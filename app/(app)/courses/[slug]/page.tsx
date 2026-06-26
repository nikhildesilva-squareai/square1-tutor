import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import type { Course, Module, Lesson, Project } from "@/types/database";

export const revalidate = 120;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase.from("courses").select("title, description, color").eq("slug", slug).maybeSingle();
  if (!course) return { title: "Course Not Found" };
  return {
    title: course.title,
    description: course.description ?? `Learn ${course.title} with AI-powered personalised lessons, real projects, and an AI tutor.`,
    openGraph: {
      title: `${course.title} — Square 1 AI`,
      description: course.description ?? `Master ${course.title} with 40 lessons, 10 projects, and AI-powered tutoring.`,
    },
  };
}

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
  // Per-lesson mastery rolled up from the learner's spaced-retrieval review cards.
  const masteryByLesson = new Map<string, { total: number; reviewed: number; mastered: number; due: number }>();
  const nowIso = new Date().toISOString();

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

      // Curriculum spaced-retrieval cards → per-lesson mastery rollup. review_count
      // is the SM-2 success streak; a card is "mastered" once it's been recalled
      // correctly twice (interval has grown past the early steps).
      const { data: reviewCards } = await supabase
        .from("study_notes")
        .select("lesson_id, review_count, next_review_at")
        .eq("student_id", student.id)
        .eq("course_id", course.id)
        .not("source_exercise_id", "is", null);

      for (const c of reviewCards ?? []) {
        if (!c.lesson_id) continue;
        const m = masteryByLesson.get(c.lesson_id) ?? { total: 0, reviewed: 0, mastered: 0, due: 0 };
        m.total += 1;
        const rc = c.review_count ?? 0;
        if (rc >= 1) m.reviewed += 1;
        if (rc >= 2) m.mastered += 1;
        if (c.next_review_at && c.next_review_at <= nowIso) m.due += 1;
        masteryByLesson.set(c.lesson_id, m);
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
  function getLessonStatus(lessonId: string, moduleIndex: number): "completed" | "current" | "open" | "locked" {
    if (completedLessonIds.has(lessonId)) return "completed";
    if (lessonId === currentLessonId) return "current";
    // If student has no enrollment, all are locked
    if (!studentId) return "locked";
    // Module 0 — the foundations on-ramp — is ALWAYS open: it's the beginner floor
    // and review material, accessible no matter where you are in the course.
    if (moduleIndex === 0) return "open";
    return "locked";
  }

  // Small non-blocking mastery pill from the learner's review-deck performance.
  // Priority: due (actionable) > mastered > learning. No badge until cards exist.
  function masteryBadge(lessonId: string) {
    const m = masteryByLesson.get(lessonId);
    if (!m || m.total === 0) return null;
    if (m.due > 0)
      return (
        <Link href="/notes?filter=flashcard" className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
          Review due
        </Link>
      );
    if (m.mastered === m.total)
      return <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">Mastered</span>;
    if (m.reviewed > 0)
      return <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">Learning</span>;
    return null;
  }

  const isEnrolled = !!studentId && !!currentLessonId;
  const completedCount = completedLessonIds.size;
  const progressPct = lessonList.length > 0 ? Math.round((completedCount / lessonList.length) * 100) : 0;

  return (
    <div className="min-h-full bg-surface-soft pb-24">
      {/* ── Dark Hero Header ───────────────────────────────────────── */}
      <div className="bg-[linear-gradient(135deg,#0056CE_0%,#0b3b97_50%,#1e1b4b_100%)] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link href="/courses" className="text-white/60 hover:text-white transition-colors">Courses</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white font-medium">{course.title}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{course.title}</h1>
                <span className={[
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border capitalize",
                  course.level === "advanced" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  course.level === "intermediate" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-blue-500/10 text-blue-400 border-blue-500/20",
                ].join(" ")}>
                  {course.level}
                </span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed max-w-2xl mb-4">{course.description}</p>
              <div className="flex items-center flex-wrap gap-3 sm:gap-5 text-sm text-white/70">
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                  {course.total_modules} modules
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  {course.total_lessons} lessons
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                  {course.total_projects} projects
                </span>
              </div>
            </div>

            {/* Progress or CTA */}
            {isEnrolled ? (
              <div className="flex flex-col items-center shrink-0 bg-white/5 rounded-xl px-5 py-4">
                <p className="text-2xl font-black text-white">{progressPct}%</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider font-bold">Complete</p>
                <div className="w-20 h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: course.color }} />
                </div>
                <Link href={`/courses/${slug}/reassess`}
                  className="mt-3 text-[11px] text-white/60 hover:text-white font-medium transition-colors flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                  </svg>
                  Re-assess
                </Link>
              </div>
            ) : (
              <Link href={`/courses/${slug}/assess`}
                className="shrink-0 h-11 px-6 rounded-xl bg-white text-ink font-bold text-sm hover:bg-white/90 transition-all inline-flex items-center gap-2">
                Take Assessment
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Curriculum (2/3) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-ink">Curriculum</h2>
              <span className="text-xs text-ink-muted">{completedCount}/{lessonList.length} lessons</span>
            </div>

            <div className="space-y-3">
              {moduleList.map((mod, mi) => {
                const modLessons = lessonsByModule[mod.id] ?? [];
                const modCompleted = isModuleCompleted(mod.id);
                const modCompletedCount = modLessons.filter(l => completedLessonIds.has(l.id)).length;
                const modPct = modLessons.length > 0 ? modCompletedCount / modLessons.length : 0;

                return (
                  <div key={mod.id} className="bg-surface rounded-xl border border-border overflow-hidden">
                    {/* Module header */}
                    <div className="px-4 py-3 flex items-center gap-3 border-b border-border">
                      <div className={[
                        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0",
                        modCompleted ? "bg-emerald-100 text-emerald-600" : "bg-surface-tint text-brand",
                      ].join(" ")}>
                        {modCompleted ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : mi + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink">{mod.title}</p>
                        <p className="text-[10px] text-ink-muted">Week {mod.week_number} · {modLessons.length} lessons</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-12 h-1.5 rounded-full bg-surface-alt overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${modPct * 100}%`, background: modCompleted ? "#059669" : course.color }} />
                        </div>
                        <span className="text-[10px] text-ink-muted font-semibold tabular-nums">{modCompletedCount}/{modLessons.length}</span>
                      </div>
                    </div>

                    {/* Lessons */}
                    <div className="divide-y divide-border">
                      {modLessons.map((lesson, li) => {
                        const status = getLessonStatus(lesson.id, mi);
                        return (
                          <div key={lesson.id} className={["px-4 py-2.5 flex items-center gap-3", status === "locked" ? "opacity-50" : ""].join(" ")}>
                            <div className={[
                              "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                              status === "completed" ? "bg-emerald-100" :
                              status === "current" ? "bg-brand" : "bg-surface-alt",
                            ].join(" ")}>
                              {status === "completed" ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                              ) : status === "current" ? (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                              ) : (
                                <span className="text-[9px] font-bold text-ink-muted">{li + 1}</span>
                              )}
                            </div>
                            <p className={["text-sm flex-1 min-w-0 truncate",
                              status === "completed" ? "text-ink-secondary" : status === "current" ? "text-ink font-medium" : status === "open" ? "text-ink-secondary" : "text-ink-muted"
                            ].join(" ")}>{lesson.title}</p>
                            {masteryBadge(lesson.id)}
                            {status === "completed" && <Link href={`/learn/${lesson.id}`} className="text-[10px] text-brand font-semibold hover:underline shrink-0">Review</Link>}
                            {status === "open" && <Link href={`/learn/${lesson.id}`} className="text-[10px] text-brand font-semibold hover:underline shrink-0">Open</Link>}
                            {status === "current" && (
                              <Link href={`/learn/${lesson.id}`}
                                className="h-7 px-3 rounded-lg bg-brand text-white text-[10px] font-bold inline-flex items-center gap-1 hover:bg-brand/90 transition-all shrink-0">
                                Start
                                <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
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
          </div>

          {/* Right: Sidebar (1/3) */}
          <div className="space-y-4">
            {/* Quick actions */}
            {isEnrolled && currentLessonId && (
              <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
                <Link href={`/learn/${currentLessonId}`}
                  className="w-full h-11 rounded-xl bg-brand text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand/90 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  Continue Learning
                </Link>
                <Link href={`/courses/${slug}/reassess`}
                  className="w-full h-10 rounded-xl border border-border text-ink-secondary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-surface-soft hover:border-brand/20 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                  </svg>
                  Re-Assess My Skills
                </Link>
                <p className="text-[10px] text-ink-muted text-center leading-relaxed">
                  5 questions, ~10 min. See how much you&apos;ve improved.
                </p>
              </div>
            )}

            {!isEnrolled && (
              <div className="bg-surface rounded-xl border border-border p-5">
                <p className="text-sm font-semibold text-ink mb-2">Get started</p>
                <p className="text-xs text-ink-muted mb-4">Take the free assessment to see your skill level and get a personalised learning plan.</p>
                <Link href={`/courses/${slug}/assess`}
                  className="w-full h-11 rounded-xl bg-brand text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand/90 transition-all">
                  Take Assessment
                </Link>
              </div>
            )}

            {/* What you'll build */}
            {projectList.length > 0 && (
              <div className="bg-surface rounded-xl border border-border p-5">
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">Featured Projects</p>
                <div className="space-y-3">
                  {projectList.slice(0, 3).map(project => (
                    <div key={project.id} className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: course.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-ink">{project.title}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {project.tech_stack.slice(0, 2).map(t => (
                            <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-surface-alt text-ink-muted">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course info */}
            <div className="bg-surface rounded-xl border border-border p-5">
              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">About</p>
              <div className="space-y-3 text-sm text-ink-secondary">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
                  <span>{course.total_modules} modules, {course.total_lessons} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  <span>~{Math.round(course.total_lessons * 25 / 60)} hours total</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                  <span>{course.total_projects} portfolio projects</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  <span>AI-graded exercises</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA — only for non-enrolled */}
      {!isEnrolled && (
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 print:hidden z-30">
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
      )}
    </div>
  );
}
