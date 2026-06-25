import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  scaleWeek, totalWeeks, currentWeek, weekDueDate, projectStatus,
  countdownLabel, fmtDate, STATUS_STYLE, type ProjectStatus,
} from "@/lib/schedule";

export const dynamic = "force-dynamic";

interface PageProps { params: Promise<{ slug: string }>; }

interface ModuleRow { id: string; order_index: number; title: string; schedule_week_start: number | null }
interface ProjectRow { id: string; order_index: number; title: string; difficulty: string; schedule_week: number | null }
interface LessonRow { id: string; module_id: string; order_index: number }

type TimelineItem =
  | { kind: "module"; week: number; id: string; title: string; lessons: number; done: number; firstLessonId: string | null }
  | { kind: "project"; week: number; id: string; title: string; difficulty: string; due: Date | null; status: ProjectStatus; submitted: boolean };

export default async function SchedulePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: course } = await supabase
    .from("courses").select("id, slug, title, total_lessons").eq("slug", slug).maybeSingle();
  if (!course) notFound();

  const [{ data: modulesRaw }, { data: projectsRaw }, { data: lessonsRaw }] = await Promise.all([
    supabase.from("modules").select("id, order_index, title, schedule_week_start").eq("course_id", course.id).order("order_index"),
    supabase.from("projects").select("id, order_index, title, difficulty, schedule_week").eq("course_id", course.id).order("order_index"),
    supabase.from("lessons").select("id, module_id, order_index").eq("course_id", course.id).order("order_index"),
  ]);
  const modules = (modulesRaw ?? []) as ModuleRow[];
  const projects = (projectsRaw ?? []) as ProjectRow[];
  const lessons = (lessonsRaw ?? []) as LessonRow[];

  // Learner context
  let enrolledAt: Date | null = null;
  let planMonths = 6;
  let level: string | null = null;
  let completed = new Set<string>();
  let submittedProjectIds = new Set<string>();
  let weakTopics: string[] = [];

  if (user) {
    const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
    if (student) {
      const { data: enr } = await supabase
        .from("student_enrollments")
        .select("enrolled_at, plan_months, assessment_level")
        .eq("student_id", student.id).eq("course_id", course.id).eq("status", "active").maybeSingle();
      if (enr) {
        enrolledAt = enr.enrolled_at ? new Date(enr.enrolled_at) : null;
        planMonths = enr.plan_months ?? 6;
        level = enr.assessment_level ?? null;
      }
      const [{ data: comps }, { data: subs }, { data: report }] = await Promise.all([
        supabase.from("lesson_completions").select("lesson_id").eq("student_id", student.id),
        supabase.from("project_submissions").select("project_id").eq("student_id", student.id),
        supabase.from("skill_reports").select("weak_topics").eq("student_id", student.id).eq("course_id", course.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      completed = new Set((comps ?? []).map((c) => c.lesson_id as string));
      submittedProjectIds = new Set((subs ?? []).map((s) => s.project_id as string));
      if (report && Array.isArray(report.weak_topics)) weakTopics = report.weak_topics as string[];
    }
  }

  const now = new Date();
  const enrolled = !!enrolledAt;
  const nowWeek = enrolledAt ? currentWeek(enrolledAt, now) : 0;
  const tWeeks = totalWeeks(planMonths);

  // lessons grouped by module
  const lessonsByModule = new Map<string, LessonRow[]>();
  for (const l of lessons) {
    const arr = lessonsByModule.get(l.module_id) ?? [];
    arr.push(l); lessonsByModule.set(l.module_id, arr);
  }

  // Build the week-ordered timeline
  const items: TimelineItem[] = [];
  for (const m of modules) {
    const ml = (lessonsByModule.get(m.id) ?? []).sort((a, b) => a.order_index - b.order_index);
    items.push({
      kind: "module",
      week: scaleWeek(m.schedule_week_start ?? (m.order_index + 1), planMonths),
      id: m.id, title: m.title,
      lessons: ml.length,
      done: ml.filter((l) => completed.has(l.id)).length,
      firstLessonId: ml[0]?.id ?? null,
    });
  }
  for (const p of projects) {
    if (p.schedule_week == null) continue;
    const wk = scaleWeek(p.schedule_week, planMonths);
    const due = enrolledAt ? weekDueDate(enrolledAt, wk) : null;
    const submitted = submittedProjectIds.has(p.id);
    items.push({
      kind: "project", week: wk, id: p.id, title: p.title, difficulty: p.difficulty,
      due, submitted,
      status: due ? projectStatus(due, submitted, now) : (submitted ? "done" : "upcoming"),
    });
  }
  items.sort((a, b) => a.week - b.week || (a.kind === "module" ? -1 : 1));

  const totalLessons = course.total_lessons ?? lessons.length;
  const lessonsDone = completed.size;
  const pct = totalLessons ? Math.round((lessonsDone / totalLessons) * 100) : 0;
  const needsFoundations = enrolled && ((level && level.toLowerCase() === "beginner") || weakTopics.length > 0);

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      <Link href={`/courses/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-5">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        {course.title}
      </Link>

      {/* Hero */}
      <div className="rounded-2xl border border-border bg-surface shadow-card p-5 sm:p-6 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-1">Your study plan</p>
        <h1 className="text-2xl font-black text-ink tracking-tight">{planMonths}-month schedule</h1>
        <p className="text-sm text-ink-secondary mt-1">
          {enrolled
            ? <>You&apos;re in <span className="font-semibold text-ink">week {nowWeek}</span> of {tWeeks}. Each project unlocks after the lessons that teach it — deadlines are personal to your start date.</>
            : <>A {tWeeks}-week path: learn the concepts, then build the project that uses them. Enrol to get your personal deadlines.</>}
        </p>
        {enrolled && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-ink-muted mb-1.5">
              <span>{lessonsDone}/{totalLessons} lessons</span><span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface-alt overflow-hidden">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Adaptive remediation banner */}
      {needsFoundations && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 mb-6 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17.5 6.5 21 8 13.5 3 9l6.5-.5L12 2z" /></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-ink">Start with the foundations</p>
            <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
              Your assessment suggests building the basics first{weakTopics.length > 0 ? <> — especially <span className="font-semibold text-ink">{weakTopics.slice(0, 3).join(", ")}</span></> : ""}. Begin with <span className="font-semibold text-ink">Module 0 (Foundations)</span> and the early modules before the harder ones — they unlock as you go. You won&apos;t be thrown into advanced topics cold.
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-2.5">
        {items.map((it, i) => {
          const isNow = enrolled && it.week === nowWeek;
          const isPast = enrolled && it.week < nowWeek;
          return (
            <div key={`${it.kind}-${it.id}-${i}`}
              className={[
                "rounded-2xl border bg-surface shadow-card p-4 flex items-center gap-4 transition-all",
                isNow ? "border-brand/40 ring-1 ring-brand/15" : "border-border",
              ].join(" ")}>
              {/* Week chip */}
              <div className={[
                "w-12 shrink-0 text-center rounded-xl py-1.5",
                isNow ? "bg-brand text-white" : isPast ? "bg-surface-alt text-ink-muted" : "bg-surface-tint text-brand",
              ].join(" ")}>
                <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">Wk</div>
                <div className="text-base font-black leading-none">{it.week}</div>
              </div>

              {it.kind === "module" ? (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-alt text-ink-muted">Learn</span>
                      {isNow && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">This week</span>}
                    </div>
                    <p className="text-sm font-semibold text-ink mt-1 truncate">{it.title}</p>
                    <p className="text-[11px] text-ink-muted mt-0.5">{it.done}/{it.lessons} lessons{it.done === it.lessons && it.lessons > 0 ? " · done ✓" : ""}</p>
                  </div>
                  {it.firstLessonId && (
                    <Link href={`/learn/${it.firstLessonId}`} className="shrink-0 text-xs font-semibold text-brand hover:underline">
                      {it.done > 0 && it.done < it.lessons ? "Continue" : "Open"} →
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-50 text-violet-700">Project</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${STATUS_STYLE[it.status].cls}`}>{STATUS_STYLE[it.status].label}</span>
                    </div>
                    <p className="text-sm font-semibold text-ink mt-1 truncate">{it.title}</p>
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      {it.due
                        ? <>Due {fmtDate(it.due)}{!it.submitted && <span className={it.status === "overdue" ? "text-red-600 font-semibold" : it.status === "due-soon" ? "text-amber-700 font-semibold" : ""}> · {countdownLabel(it.due)}</span>}</>
                        : <>capstone of the plan</>}
                    </p>
                  </div>
                  <Link href={`/projects/${it.id}`} className="shrink-0 text-xs font-semibold text-brand hover:underline">
                    {it.submitted ? "View" : "Start"} →
                  </Link>
                </>
              )}
            </div>
          );
        })}
      </div>

      {!enrolled && (
        <div className="mt-6 rounded-2xl border border-brand/20 bg-surface-tint p-5 text-center">
          <p className="text-sm font-semibold text-ink">Enrol to start your personalised schedule</p>
          <p className="text-xs text-ink-muted mt-1">Your deadlines are set from your start date — and the schedule adapts to your pace.</p>
          <Link href={`/courses/${slug}/assess`} className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand hover:bg-brand/90 transition-all">
            Take the assessment
          </Link>
        </div>
      )}
    </div>
  );
}
