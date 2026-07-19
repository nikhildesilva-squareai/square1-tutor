import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CourseSwitcher } from "@/components/CourseSwitcher";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { computeStreak } from "@/lib/streaks";
import { SubjectSync } from "@/components/SubjectSync";
import { DIAG_SUBJECTS } from "@/lib/diagnostic";

// ─── Course career mapping ────────────────────────────────────────────────────
const COURSES = [
  { slug: "generative-ai",         title: "Generative AI",         role: "AI Engineer",            salary: "$130–200k", color: "#6366f1" },
  { slug: "machine-learning",      title: "Machine Learning",      role: "ML Engineer",            salary: "$140–220k", color: "#8b5cf6" },
  { slug: "cybersecurity",         title: "Cybersecurity",         role: "Cybersecurity Engineer",  salary: "$110–180k", color: "#ef4444" },
  { slug: "fullstack-development", title: "Full Stack Dev",        role: "Full Stack Engineer",     salary: "$100–160k", color: "#06b6d4" },
  { slug: "data-science",          title: "Data Science",          role: "Data Scientist",          salary: "$115–185k", color: "#14b8a6" },
  { slug: "artificial-intelligence",title: "AI Fundamentals",      role: "AI Engineer",             salary: "$130–200k", color: "#0ea5e9" },
  { slug: "llm-agent-architect",   title: "LLM Agent Architect",   role: "Agent Architect",         salary: "$150–250k", color: "#7C3AED" },
  { slug: "computer-vision",       title: "Computer Vision",       role: "CV Engineer",             salary: "$120–180k", color: "#10b981" },
  { slug: "ai-product-management", title: "AI Product Mgmt",       role: "AI PM",                   salary: "$140–220k", color: "#0EA5E9" },
];

const COURSE_COLORS: Record<string, string> = Object.fromEntries(COURSES.map(c => [c.slug, c.color]));

function getGreeting() {
  const hour = new Date().getUTCHours() + 10;
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface EnrollmentRow {
  id: string;
  status: string;
  assessment_level: string | null;
  target_completion_date: string | null;
  current_lesson_id: string | null;
  completed_at: string | null;
  course: { id: string; slug: string; title: string; icon: string; total_lessons: number } | null;
  current_lesson: { id: string; title: string; estimated_minutes: number; module_id: string } | null;
}

interface ModuleRow {
  id: string;
  title: string;
  order_index: number;
  week_number: number;
  course_id: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PROGRESS RING (SVG)                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */
function ProgressRing({ pct, size = 56, stroke = 4, color = "#0056CE", trackColor = "#E2E8F0" }: { pct: number; size?: number; stroke?: number; color?: string; trackColor?: string }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease" }} />
    </svg>
  );
}

interface DashboardProps {
  searchParams: Promise<{ course?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const { course: courseParam } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: student } = await supabase
    .from("students")
    .select("id, name, email, subject_interest")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select(`id, status, assessment_level, target_completion_date, current_lesson_id, completed_at,
      course:courses(id, slug, title, icon, total_lessons),
      current_lesson:lessons!student_enrollments_current_lesson_id_fkey(id, title, estimated_minutes, module_id)`)
    .eq("student_id", student?.id ?? "")
    .eq("status", "active")
    .order("enrolled_at", { ascending: false }) as { data: EnrollmentRow[] | null };

  const name = student?.name ?? user.email?.split("@")[0] ?? "there";
  const firstName = name.split(" ")[0];
  const greeting = getGreeting();
  const allEnrollments = enrollments ?? [];

  // Split enrollments into active (in-progress) and completed
  const currentEnrollments = allEnrollments.filter(e => !e.completed_at);
  const finishedEnrollments = allEnrollments.filter(e => e.completed_at).sort((a, b) => {
    // Sort by completed_at DESC (newest first)
    return new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime();
  });

  // Course switcher: if ?course=slug param is present, use that enrollment as primary
  let primaryEnrollment = currentEnrollments[0] ?? null;
  if (courseParam && currentEnrollments.length > 1) {
    const match = currentEnrollments.find(e => e.course?.slug === courseParam);
    if (match) primaryEnrollment = match;
  }

  const preferredCourse = COURSES.find(c => c.title.toLowerCase().includes((student?.subject_interest ?? "").toLowerCase()));

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  PRE-ENROLLMENT DASHBOARD — Onboarding funnel                         */
  /* ═══════════════════════════════════════════════════════════════════════ */
  if (currentEnrollments.length === 0 && finishedEnrollments.length === 0) {
    // Zero-friction activation: let a brand-new user open a REAL lesson (Module 0,
    // Lesson 1 — the Foundations on-ramp) immediately, with no assessment gate.
    // /learn/[id] renders for any logged-in student. Default to the flagship course
    // when we don't yet know their interest (subject_interest is captured
    // post-signup and is often still null for fresh ad signups).
    // Resolve the learner's chosen track to a course slug via the diagnostic
    // subject map (exact title match — robust for every track, unlike the
    // brittle substring match preferredCourse uses). Falls back to the flagship.
    const interest = (student?.subject_interest ?? "").trim().toLowerCase();
    const matchedSubject = DIAG_SUBJECTS.find((s) => s.title.toLowerCase() === interest);
    const startSlug = matchedSubject?.slug ?? preferredCourse?.slug ?? "generative-ai";
    let firstLessonId: string | null = null;
    const { data: startCourseRow } = await supabase.from("courses").select("id").eq("slug", startSlug).maybeSingle();
    if (startCourseRow?.id) {
      const { data: m0 } = await supabase.from("modules").select("id").eq("course_id", startCourseRow.id).eq("order_index", 0).maybeSingle();
      if (m0?.id) {
        const { data: l1 } = await supabase.from("lessons").select("id").eq("module_id", m0.id).order("order_index", { ascending: true }).limit(1).maybeSingle();
        firstLessonId = l1?.id ?? null;
      }
    }

    return (
      <div className="min-h-full px-4 sm:px-6 py-8 max-w-6xl mx-auto">
        {/* Attach the diagnostic subject choice to this profile (once). */}
        <SubjectSync />

        {/* Hero greeting */}
        <div className="relative rounded-2xl overflow-hidden mb-8 p-8 sm:p-10"
          style={{ background: "linear-gradient(135deg, #0056CE 0%, #4F46E5 50%, #7C3AED 100%)" }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, white 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, white 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />
          <div className="relative">
            <p className="text-white/60 text-sm font-medium mb-1">{greeting}</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
              Welcome, {firstName}
            </h1>
            <p className="text-white/70 text-base max-w-md">
              Jump straight into your first lesson — free, no test, about 5 minutes.
              Prefer a personalised plan? Take the assessment below.
            </p>
            {firstLessonId && (
              <Link href={`/learn/${firstLessonId}`}
                className="mt-6 inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-white text-brand text-sm font-bold hover:bg-white/90 transition-all shadow-lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><polygon points="6 4 20 12 6 20 6 4" /></svg>
                Start your first lesson — free
              </Link>
            )}
          </div>
        </div>

        {/* 3-step funnel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <div className="relative bg-surface rounded-2xl border border-border p-6 hover:shadow-card transition-shadow group">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold">1</span>
              <span className="text-[10px] tracking-widest uppercase font-bold text-ink-muted">Step one</span>
            </div>
            <h3 className="text-lg font-bold text-ink mb-2">Pick your course</h3>
            <p className="text-sm text-ink-muted mb-5 leading-relaxed">
              Every subject leads to a real career with a real salary.
            </p>
            <Link href="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand/90 transition-all">
              Browse courses
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>

          <div className="bg-surface rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-surface-alt text-ink-muted flex items-center justify-center text-sm font-bold">2</span>
              <span className="text-[10px] tracking-widest uppercase font-bold text-ink-muted">Step two</span>
            </div>
            <h3 className="text-lg font-bold text-ink mb-2">Take the assessment</h3>
            <p className="text-sm text-ink-muted mb-5 leading-relaxed">
              20 questions. MCQ + short answer + code. AI grades instantly.
            </p>
            <span className="text-xs text-ink-muted flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              ~30 minutes
            </span>
          </div>

          <div className="bg-surface rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-surface-alt text-ink-muted flex items-center justify-center text-sm font-bold">3</span>
              <span className="text-[10px] tracking-widest uppercase font-bold text-ink-muted">Step three</span>
            </div>
            <h3 className="text-lg font-bold text-ink mb-2">Get your skill report</h3>
            <p className="text-sm text-ink-muted mb-5 leading-relaxed">
              See your strengths, gaps, and a personalised learning plan.
            </p>
            <span className="text-xs text-ink-muted flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
              Topic-by-topic breakdown
            </span>
          </div>
        </div>

        {/* Recommended course */}
        {preferredCourse && (
          <div className="mb-10">
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-4">Recommended for you</p>
            <Link href={`/courses/${preferredCourse.slug}`}
              className="group flex items-center justify-between bg-surface rounded-2xl border border-border p-6 hover:shadow-card hover:border-brand/20 transition-all">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${preferredCourse.color}12` }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={preferredCourse.color} strokeWidth="2" strokeLinecap="round">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink group-hover:text-brand transition-colors">{preferredCourse.title}</h3>
                  <p className="text-sm text-ink-muted mt-0.5">
                    {preferredCourse.role} · <span style={{ color: preferredCourse.color }} className="font-semibold">{preferredCourse.salary}</span>
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-brand flex items-center gap-1 group-hover:gap-2 transition-all">
                Start Assessment
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </Link>
          </div>
        )}

        {/* All courses grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">All courses</p>
            <Link href="/courses" className="text-xs text-brand hover:underline font-semibold">View all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {COURSES.map((course) => (
              <Link key={course.slug} href={`/courses/${course.slug}`}
                className="group bg-surface rounded-2xl border border-border shadow-card p-4 hover:shadow-card hover:border-brand/20 transition-all">
                <div className="w-8 h-1 rounded-full mb-3" style={{ background: course.color }} />
                <p className="text-sm font-semibold text-ink mb-1 group-hover:text-brand transition-colors leading-snug">{course.title}</p>
                <p className="text-[10px] text-ink-muted">{course.role}</p>
                <p className="text-[10px] font-semibold mt-1" style={{ color: course.color }}>{course.salary}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  POST-ENROLLMENT DASHBOARD — Daily learning hub                       */
  /* ═══════════════════════════════════════════════════════════════════════ */
  const courseColor = primaryEnrollment?.course?.slug ? COURSE_COLORS[primaryEnrollment.course.slug] ?? "#0056CE" : "#0056CE";
  const courseSlug = primaryEnrollment?.course?.slug ?? "";
  const courseTitle = primaryEnrollment?.course?.title ?? "Your Course";
  const totalLessons = primaryEnrollment?.course?.total_lessons ?? 40;
  const currentLesson = primaryEnrollment?.current_lesson;
  const level = primaryEnrollment?.assessment_level ?? "beginner";

  // Fire all independent queries in parallel
  const studentId = student?.id ?? "";
  const courseId = primaryEnrollment?.course?.id ?? "";
  const enrollmentId = primaryEnrollment?.id ?? "";
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: completedLessonCount },
    { data: modules },
    { data: completedLessons },
    { data: allLessons },
    { data: recentCompletions },
    { data: projectSubmissions },
    { data: nextProject },
    { data: allCompletionDates },
    { count: dueFlashcardCount },
  ] = await Promise.all([
    supabase.from("lesson_completions").select("id", { count: "exact", head: true }).eq("student_id", studentId).eq("enrollment_id", enrollmentId),
    supabase.from("modules").select("id, title, order_index, week_number, course_id").eq("course_id", courseId).order("order_index", { ascending: true }) as unknown as Promise<{ data: ModuleRow[] | null }>,
    supabase.from("lesson_completions").select("lesson_id").eq("student_id", studentId),
    supabase.from("lessons").select("id, module_id, title, order_index").eq("course_id", courseId).order("order_index", { ascending: true }),
    supabase.from("lesson_completions").select("completed_at").eq("student_id", studentId).gte("completed_at", sevenDaysAgo),
    supabase.from("project_submissions").select("id, score").eq("student_id", studentId).not("score", "is", null),
    supabase.from("projects").select("id, title, difficulty").eq("course_id", courseId).order("order_index", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("lesson_completions").select("completed_at").eq("student_id", studentId).gte("completed_at", ninetyDaysAgo),
    supabase.from("study_notes").select("id", { count: "exact", head: true }).eq("student_id", studentId).eq("type", "flashcard").lte("next_review_at", now.toISOString()),
  ]);

  const dueFlashcards = dueFlashcardCount ?? 0;

  const lessonsCompleted = completedLessonCount ?? 0;
  const progressPct = totalLessons > 0 ? lessonsCompleted / totalLessons : 0;

  const completedLessonIds = new Set((completedLessons ?? []).map(l => l.lesson_id));

  // Group lessons by module
  const lessonsByModule = new Map<string, { id: string; title: string; completed: boolean }[]>();
  for (const l of allLessons ?? []) {
    const list = lessonsByModule.get(l.module_id) ?? [];
    list.push({ id: l.id, title: l.title, completed: completedLessonIds.has(l.id) });
    lessonsByModule.set(l.module_id, list);
  }

  // Weekly streak
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = now.getDay();
  const streakData: { day: string; active: boolean }[] = [];
  const activeDays = new Set((recentCompletions ?? []).map(c => new Date(c.completed_at).getDay()));
  for (let i = 1; i <= 7; i++) {
    const dayNum = i === 7 ? 0 : i;
    streakData.push({ day: weekDays[i - 1], active: activeDays.has(dayNum) });
  }

  const projectsDone = (projectSubmissions ?? []).length;

  // Streak computation
  const streakInfo = computeStreak((allCompletionDates ?? []).map(c => c.completed_at));
  const heatmapDates = (allCompletionDates ?? []).map(c => c.completed_at);

  // Weekly + window active-day tallies for the This Week bar and Activity pill.
  const activeThisWeek = streakData.filter(d => d.active).length;
  const activeDaysCount = new Set(heatmapDates.map(d => new Date(d).toDateString())).size;

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 max-w-6xl mx-auto">
      {/* Attach the diagnostic subject choice to this profile (once). */}
      <SubjectSync />

      {/* ── Hero: Continue Learning (THE primary action) ──────────────── */}
      <div className="relative rounded-2xl overflow-hidden mb-6 p-6 sm:p-8"
        style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 34%), linear-gradient(135deg, rgba(0,0,0,0) 52%, rgba(0,0,0,0.22) 100%), ${courseColor}` }}>
        {/* Faint grid texture for depth */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />

        <div className="relative flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left: Course pills + greeting + lesson + CTA */}
          <div className="flex-1 min-w-0">
            {currentEnrollments.length > 1 && (
              <div className="mb-6">
                <CourseSwitcher
                  courses={currentEnrollments.map(e => ({
                    slug: e.course?.slug ?? "",
                    title: e.course?.title ?? "Course",
                    color: e.course?.slug ? COURSE_COLORS[e.course.slug] ?? "#0056CE" : "#0056CE",
                  }))}
                  activeSlug={courseSlug}
                />
              </div>
            )}

            <p className="text-white/70 text-sm font-medium mb-2">{greeting}, {firstName}</p>

            {currentLesson ? (
              <>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                  Continue Learning
                </h1>
                <p className="text-white/80 text-base mb-6">
                  {currentLesson.title}
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <Link href={`/learn/${currentLesson.id}`}
                    className="inline-flex items-center gap-2.5 pl-6 pr-5 py-3.5 rounded-xl text-sm font-bold bg-white text-ink hover:bg-white/90 hover:-translate-y-0.5 transition-all shadow-lg">
                    Resume Lesson
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4" /></svg>
                  </Link>
                  <span className="text-white/75 text-sm flex items-center gap-1.5">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {currentLesson.estimated_minutes} min
                  </span>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                  {courseTitle}
                </h1>
                <p className="text-white/75 text-base mb-6">
                  Level: {level.charAt(0).toUpperCase() + level.slice(1)}
                </p>
                <Link href={`/courses/${courseSlug}`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-white text-ink hover:bg-white/90 hover:-translate-y-0.5 transition-all shadow-lg">
                  Go to Course
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              </>
            )}
          </div>

          {/* Right: Progress card — ring + bar + up-next */}
          <div className="lg:w-[300px] shrink-0 rounded-2xl bg-white/10 border border-white/15 p-6 flex flex-col justify-center">
            <div className="flex justify-center">
              <div className="relative">
                <ProgressRing pct={progressPct} size={132} stroke={7} color="white" trackColor="rgba(255,255,255,0.18)" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[26px] leading-none font-black text-white tabular-nums">{Math.round(progressPct * 100)}%</span>
                  <span className="text-white/60 text-[10px] uppercase tracking-[0.15em] font-bold mt-1.5">Complete</span>
                </div>
              </div>
            </div>

            <div className="mt-6 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-[width] duration-700 ease-out"
                style={{ width: `${Math.max(progressPct * 100, progressPct > 0 ? 3 : 0)}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-white/60 text-xs">Up next</span>
              <span className="text-white text-xs font-bold">
                {lessonsCompleted >= totalLessons ? "Complete" : `Lesson ${Math.min(lessonsCompleted + 1, totalLessons)}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Day-one welcome — celebrate, don't show a wall of zeros ────── */}
      {lessonsCompleted === 0 && (
        <div className="mb-6 rounded-2xl border border-border bg-surface shadow-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          {/* Spark icon — lights the first streak */}
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `${courseColor}14`, color: courseColor }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.5l1.9 5.4 5.4 1.9-5.4 1.9L12 17l-1.9-5.3L4.7 9.8l5.4-1.9L12 2.5z" />
              <path d="M19 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
            </svg>
          </div>
          {/* Copy */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: courseColor }}>Getting started</p>
            <p className="text-sm font-bold text-ink">Day one — let&apos;s light your first streak.</p>
            <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
              Finish lesson 1 today and your streak, heatmap, and progress all come alive.
            </p>
          </div>
          {/* CTA */}
          {currentLesson && (
            <Link href={`/learn/${currentLesson.id}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shrink-0 w-full sm:w-auto shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
              style={{ background: courseColor }}>
              Start lesson 1
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            </Link>
          )}
        </div>
      )}

      {/* ── Finished Courses Section ─────────────────────────────────── */}
      {finishedEnrollments.length > 0 && (
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-4">Completed Courses</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {finishedEnrollments.map((enrollment) => {
              const courseSlugValue = enrollment.course?.slug ?? "";
              const completedDate = enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—";
              return (
                <div key={enrollment.id} className="bg-surface rounded-2xl border border-border shadow-card p-5 hover:shadow-card-hover transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">✅</span>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-ink">{enrollment.course?.title}</h3>
                        <p className="text-[10px] text-ink-muted">Completed {completedDate}</p>
                      </div>
                    </div>
                  </div>
                  <Link href={`/certificate/${courseSlugValue}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all">
                    View Certificate
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-surface rounded-2xl border border-border shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-tint flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2" strokeLinecap="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-black text-ink">{lessonsCompleted}</p>
            <p className="text-[10px] text-ink-muted uppercase tracking-wider">Lessons Done</p>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-black text-ink">{projectsDone}</p>
            <p className="text-[10px] text-ink-muted uppercase tracking-wider">Projects</p>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${courseColor}10` }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={courseColor} strokeWidth="2" strokeLinecap="round">
              <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-black text-ink capitalize">{level}</p>
            <p className="text-[10px] text-ink-muted uppercase tracking-wider">Your Level</p>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1012 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z" /></svg>
          </div>
          <div>
            <p className="text-lg font-black text-ink">{streakInfo.current}</p>
            <p className="text-[10px] text-ink-muted uppercase tracking-wider">Day Streak</p>
          </div>
        </div>
      </div>

      {/* ── Two column layout ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column — Course roadmap (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Streak + Daily Goal */}
          <div className="bg-surface rounded-2xl border border-border shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">This Week</p>
              <div className="flex items-center gap-2">
                {streakInfo.current > 0 && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1012 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z" /></svg>
                    {streakInfo.current} day streak
                  </span>
                )}
                {streakInfo.todayDone ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    Goal hit
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-ink-muted bg-surface-alt px-2 py-1 rounded-full">
                    1 lesson to go
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-stretch justify-between gap-2">
              {streakData.map((d, i) => {
                const isToday = (today === 0 ? 6 : today - 1) === i;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2.5">
                    <span className="text-xs text-ink-muted font-semibold">{d.day.charAt(0)}</span>
                    <div className={[
                      "w-full aspect-square max-w-[52px] rounded-2xl flex items-center justify-center transition-all",
                      d.active
                        ? "bg-brand text-white shadow-sm"
                        : isToday
                        ? "bg-surface-tint ring-2 ring-brand/50"
                        : "bg-surface-alt",
                    ].join(" ")}>
                      {d.active ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : isToday ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-5">
              <div className="flex-1 h-2 rounded-full bg-surface-alt overflow-hidden">
                <div className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out"
                  style={{ width: `${Math.max((activeThisWeek / 7) * 100, 4)}%` }} />
              </div>
              <p className="text-sm text-ink-muted shrink-0">
                <span className="font-bold text-ink tabular-nums">{activeThisWeek} of 7</span> active days
              </p>
            </div>
          </div>

          {/* Activity heatmap */}
          <div className="bg-surface rounded-2xl border border-border shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Activity — Last 13 Weeks</p>
              <span className="text-[11px] font-semibold text-ink-muted bg-surface-alt px-2.5 py-1 rounded-full tabular-nums">{activeDaysCount} active {activeDaysCount === 1 ? "day" : "days"}</span>
            </div>
            <ActivityHeatmap activeDates={heatmapDates} weeks={13} />
          </div>

          {/* Module roadmap */}
          <div className="bg-surface rounded-2xl border border-border shadow-card p-5">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Course Roadmap</p>
              <div className="flex items-center gap-3">
                <Link href={`/courses/${courseSlug}/schedule`} className="text-xs text-brand font-semibold hover:underline">Schedule &amp; deadlines</Link>
                <Link href={`/courses/${courseSlug}`} className="text-xs text-ink-muted font-semibold hover:underline">View course</Link>
              </div>
            </div>

            <div className="space-y-3">
              {(modules ?? []).map((mod) => {
                const modLessons = lessonsByModule.get(mod.id) ?? [];
                const modCompleted = modLessons.filter(l => l.completed).length;
                const modTotal = modLessons.length;
                const modPct = modTotal > 0 ? modCompleted / modTotal : 0;
                const isCurrentModule = currentLesson && currentLesson.module_id === mod.id;
                const isDone = modPct === 1;

                return (
                  <div key={mod.id} className={[
                    "flex items-center gap-4 px-4 py-3 rounded-xl border transition-all",
                    isCurrentModule
                      ? "border-brand/30 bg-surface-tint"
                      : isDone
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-border",
                  ].join(" ")}>
                    {/* Module number */}
                    <div className={[
                      "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
                      isDone
                        ? "bg-emerald-100 text-emerald-600"
                        : isCurrentModule
                        ? "bg-brand text-white"
                        : "bg-surface-alt text-ink-muted",
                    ].join(" ")}>
                      {isDone ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : mod.week_number}
                    </div>

                    {/* Module info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={[
                          "text-sm font-semibold truncate",
                          isCurrentModule ? "text-brand" : isDone ? "text-emerald-700" : "text-ink",
                        ].join(" ")}>
                          {mod.title}
                        </p>
                        {isCurrentModule && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-ink-muted mt-0.5">
                        Week {mod.week_number} · {modCompleted}/{modTotal} lessons
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="w-20 shrink-0">
                      <div className="w-full h-1.5 rounded-full bg-surface-alt overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{
                          width: `${modPct * 100}%`,
                          background: isDone ? "#059669" : isCurrentModule ? courseColor : "#CBD5E1",
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column — Quick actions (1/3 width) */}
        <div className="space-y-4">

          {/* Quick actions */}
          <div className="bg-surface rounded-2xl border border-border shadow-card p-5">
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Quick Actions</p>
            <div className="space-y-2">
              {dueFlashcards > 0 && (
                <Link href="/notes?filter=flashcard"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="13" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h9a2 2 0 012 2v9a2 2 0 01-2 2h-2"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900 truncate">{dueFlashcards} flashcard{dueFlashcards !== 1 ? "s" : ""} due</p>
                    <p className="text-[10px] text-amber-700/90 truncate">2 minutes of review keeps it stuck</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-amber-600"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </Link>
              )}
              {currentLesson && (
                <Link href={`/learn/${currentLesson.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-brand/20 bg-surface-tint hover:bg-brand/5 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">Continue Lesson</p>
                    <p className="text-[10px] text-ink-muted truncate">{currentLesson.title}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-ink-muted group-hover:text-brand transition-colors"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </Link>
              )}

              {nextProject && (
                <Link href={`/projects/${nextProject.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-brand/20 hover:bg-surface-soft transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2" strokeLinecap="round">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">Next Project</p>
                    <p className="text-[10px] text-ink-muted truncate">{nextProject.title}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-ink-muted group-hover:text-brand transition-colors"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </Link>
              )}

              <Link href={`/courses/${courseSlug}/reassess`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-brand/20 hover:bg-surface-soft transition-all group">
                <div className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2" strokeLinecap="round">
                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">Re-Assessment</p>
                  <p className="text-[10px] text-ink-muted">Test your progress</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-ink-muted group-hover:text-brand transition-colors"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </Link>

              <Link href="/tutor"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-brand/20 hover:bg-surface-soft transition-all group">
                <div className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">Nova</p>
                  <p className="text-[10px] text-ink-muted">Your AI learning companion</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-ink-muted group-hover:text-brand transition-colors"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </Link>

              <Link href="/portfolio"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-brand/20 hover:bg-surface-soft transition-all group">
                <div className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">Portfolio</p>
                  <p className="text-[10px] text-ink-muted">{projectsDone} project{projectsDone !== 1 ? "s" : ""} deployed</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-ink-muted group-hover:text-brand transition-colors"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </Link>
            </div>
          </div>

          {/* My courses + Add course */}
          <div className="bg-surface rounded-2xl border border-border shadow-card p-5">
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">
              {currentEnrollments.length > 1 || finishedEnrollments.length > 0 ? "My Courses" : "Explore"}
            </p>
            {currentEnrollments.length > 1 && (
              <div className="space-y-2 mb-3">
                <p className="text-[9px] font-semibold text-ink-muted uppercase tracking-wider px-2 mb-2">In Progress</p>
                {currentEnrollments.slice(1).map((e) => {
                  const color = e.course?.slug ? COURSE_COLORS[e.course.slug] ?? "#0056CE" : "#0056CE";
                  return (
                    <Link key={e.id} href={`/courses/${e.course?.slug}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-soft transition-all group">
                      <div className="w-2 h-8 rounded-full shrink-0" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate group-hover:text-brand transition-colors">{e.course?.title}</p>
                        <p className="text-[10px] text-ink-muted capitalize">{e.assessment_level ?? "—"}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            {finishedEnrollments.length > 0 && (
              <div className="space-y-2 mb-3">
                <p className="text-[9px] font-semibold text-ink-muted uppercase tracking-wider px-2 mb-2">Completed</p>
                {finishedEnrollments.map((e) => {
                  const color = e.course?.slug ? COURSE_COLORS[e.course.slug] ?? "#0056CE" : "#0056CE";
                  const completedDate = e.completed_at ? new Date(e.completed_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—";
                  return (
                    <Link key={e.id} href={`/certificate/${e.course?.slug}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-soft transition-all group">
                      <div className="w-2 h-8 rounded-full shrink-0" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate group-hover:text-brand transition-colors flex items-center gap-1.5">
                          <span>✅</span>
                          {e.course?.title}
                        </p>
                        <p className="text-[10px] text-ink-muted">{completedDate}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            <Link href="/courses"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-brand/30 hover:bg-surface-tint hover:border-brand/50 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand">Add Another Course</p>
                <p className="text-[10px] text-ink-muted">Explore 9 career paths</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-ink-muted group-hover:text-brand transition-colors"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
