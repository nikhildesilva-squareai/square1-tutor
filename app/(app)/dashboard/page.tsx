import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

// ─── Course career mapping ────────────────────────────────────────────────────
const COURSES = [
  { slug: "generative-ai",         title: "Generative AI",         role: "AI Engineer",            salary: "$130–200k", color: "#6366f1" },
  { slug: "machine-learning",      title: "Machine Learning",      role: "ML Engineer",            salary: "$140–220k", color: "#8b5cf6" },
  { slug: "cybersecurity",         title: "Cybersecurity",         role: "Cybersecurity Engineer",  salary: "$110–180k", color: "#ef4444" },
  { slug: "fullstack-development", title: "Full Stack Dev",        role: "Full Stack Engineer",     salary: "$100–160k", color: "#06b6d4" },
  { slug: "data-science",          title: "Data Science",          role: "Data Scientist",          salary: "$115–185k", color: "#14b8a6" },
  { slug: "artificial-intelligence",title: "AI Fundamentals",      role: "AI Engineer",             salary: "$130–200k", color: "#0ea5e9" },
  { slug: "llm-agent-architect",   title: "LLM Agent Architect",   role: "Agent Architect",         salary: "$150–250k", color: "#7C3AED" },
  { slug: "devops-engineering",    title: "DevOps Engineering",    role: "DevOps Engineer",         salary: "$120–190k", color: "#F97316" },
  { slug: "computer-vision",       title: "Computer Vision",       role: "CV Engineer",             salary: "$120–180k", color: "#10b981" },
  { slug: "game-development",      title: "Game Development",      role: "Game Developer",          salary: "$80–150k",  color: "#f59e0b" },
  { slug: "drone-technology",      title: "Drone Technology",      role: "Drone Engineer",          salary: "$115–185k", color: "#EC4899" },
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
  course: { id: string; slug: string; title: string; icon: string; total_lessons: number } | null;
  current_lesson: { id: string; title: string; estimated_minutes: number } | null;
}

interface ProjectRow {
  id: string;
  status: string;
  project: { id: string; title: string; difficulty: string } | null;
}

export default async function DashboardPage() {
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
    .select(`id, status, assessment_level, target_completion_date, current_lesson_id,
      course:courses(id, slug, title, icon, total_lessons),
      current_lesson:lessons!student_enrollments_current_lesson_id_fkey(id, title, estimated_minutes)`)
    .eq("student_id", student?.id ?? "")
    .eq("status", "active")
    .order("enrolled_at", { ascending: false }) as { data: EnrollmentRow[] | null };

  const { data: projects } = await supabase
    .from("student_projects")
    .select(`id, status, project:projects(id, title, difficulty)`)
    .eq("student_id", student?.id ?? "")
    .order("updated_at", { ascending: false })
    .limit(3) as { data: ProjectRow[] | null };

  const name = student?.name ?? user.email?.split("@")[0] ?? "there";
  const firstName = name.split(" ")[0];
  const greeting = getGreeting();
  const activeEnrollments = enrollments ?? [];
  const todayEnrollment = activeEnrollments[0] ?? null;

  // Find the student's preferred course
  const preferredCourse = COURSES.find(c => c.title.toLowerCase().includes((student?.subject_interest ?? "").toLowerCase()));

  // ── EMPTY STATE ──────────────────────────────────────────────────
  if (activeEnrollments.length === 0) {
    return (
      <div className="min-h-full px-4 sm:px-6 py-8 max-w-6xl mx-auto">

        {/* Hero greeting — gradient banner */}
        <div className="relative rounded-2xl overflow-hidden mb-8 p-8 sm:p-10"
          style={{ background: "linear-gradient(135deg, #0056CE 0%, #4F46E5 50%, #7C3AED 100%)" }}>
          {/* Decorative circles */}
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
              Your career in tech starts with one assessment. Pick a course, take the test, and see exactly where you stand.
            </p>
          </div>
        </div>

        {/* 3-column action grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* Step 1 — Pick a course */}
          <div className="relative bg-surface rounded-2xl border border-border p-6 hover:shadow-card-hover transition-shadow group">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold">1</span>
              <span className="text-[10px] tracking-widest uppercase font-bold text-ink-muted">Step one</span>
            </div>
            <h3 className="text-lg font-bold text-ink mb-2">Pick your course</h3>
            <p className="text-sm text-ink-muted mb-5 leading-relaxed">
              12 subjects. Each one leads to a real career with a real salary.
            </p>
            <Link href="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-dark transition-all">
              Browse courses
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>

          {/* Step 2 — Take the assessment */}
          <div className="bg-surface rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-surface-alt text-ink-muted flex items-center justify-center text-sm font-bold">2</span>
              <span className="text-[10px] tracking-widest uppercase font-bold text-ink-muted">Step two</span>
            </div>
            <h3 className="text-lg font-bold text-ink mb-2">Take the assessment</h3>
            <p className="text-sm text-ink-muted mb-5 leading-relaxed">
              20 questions. MCQ + short answer + code. AI grades everything in 30 minutes.
            </p>
            <span className="text-xs text-ink-muted flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              ~30 minutes · Free forever
            </span>
          </div>

          {/* Step 3 — Get your report */}
          <div className="bg-surface rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-surface-alt text-ink-muted flex items-center justify-center text-sm font-bold">3</span>
              <span className="text-[10px] tracking-widest uppercase font-bold text-ink-muted">Step three</span>
            </div>
            <h3 className="text-lg font-bold text-ink mb-2">Get your skill report</h3>
            <p className="text-sm text-ink-muted mb-5 leading-relaxed">
              See your strengths, gaps, and a personalised AI recommendation for what to learn first.
            </p>
            <span className="text-xs text-ink-muted flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Topic-by-topic breakdown
            </span>
          </div>
        </div>

        {/* Recommended for you (if we know their interest) */}
        {preferredCourse && (
          <div className="mb-10">
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-4">
              Recommended for you
            </p>
            <Link href={`/courses/${preferredCourse.slug}`}
              className="group flex items-center justify-between bg-surface rounded-2xl border border-border p-6 hover:shadow-card-hover transition-shadow">
              <div className="flex items-center gap-5">
                <div className="w-12 h-1.5 rounded-full shrink-0" style={{ background: preferredCourse.color }} />
                <div>
                  <h3 className="text-lg font-bold text-ink group-hover:text-brand transition-colors">
                    {preferredCourse.title}
                  </h3>
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

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { value: "12", label: "courses available", color: "#0056CE" },
            { value: "45 min", label: "per day", color: "#6366f1" },
            { value: "$0", label: "to start", color: "#10B981" },
            { value: "12", label: "projects per course", color: "#F59E0B" },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-4 text-center bg-surface border border-border">
              <p className="text-xl font-black text-ink mb-0.5">{s.value}</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* All courses — compact grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">All courses</p>
            <Link href="/courses" className="text-xs text-brand hover:underline font-semibold">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {COURSES.map((course) => (
              <Link key={course.slug} href={`/courses/${course.slug}`}
                className="group bg-surface rounded-xl border border-border p-4 hover:shadow-card-hover hover:border-brand/30 transition-all">
                <div className="w-8 h-1 rounded-full mb-3" style={{ background: course.color }} />
                <p className="text-sm font-semibold text-ink mb-1 group-hover:text-brand transition-colors leading-snug">
                  {course.title}
                </p>
                <p className="text-[10px] text-ink-muted">{course.role}</p>
                <p className="text-[10px] font-semibold mt-1" style={{ color: course.color }}>{course.salary}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE STUDENT DASHBOARD ─────────────────────────────────────
  const courseColor = todayEnrollment?.course?.slug ? COURSE_COLORS[todayEnrollment.course.slug] ?? "#0056CE" : "#0056CE";

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 max-w-6xl mx-auto">

      {/* Hero greeting — gradient banner */}
      <div className="relative rounded-2xl overflow-hidden mb-8 p-8 sm:p-10"
        style={{ background: `linear-gradient(135deg, ${courseColor} 0%, ${courseColor}cc 50%, ${courseColor}99 100%)` }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-white/60 text-sm font-medium mb-1">{greeting}</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
              {firstName}&apos;s Dashboard
            </h1>
            <p className="text-white/70 text-sm">
              {todayEnrollment?.course?.title} · {todayEnrollment?.assessment_level ?? "In progress"}
            </p>
          </div>
          {/* Streak */}
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6 8 2 12 2 16a10 10 0 0020 0c0-4-4-8-10-14z" fill="#FBBF24"/>
            </svg>
            <span className="text-sm font-bold text-white">Active</span>
          </div>
        </div>
      </div>

      {/* Today's session */}
      {todayEnrollment && (
        <div className="bg-surface rounded-2xl border border-border shadow-card p-6 mb-8"
          style={{ borderLeft: `4px solid ${courseColor}` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-1">Today&apos;s Session</p>
              <h3 className="text-lg font-bold text-ink mb-1">
                {todayEnrollment.current_lesson?.title ?? "Start your next lesson"}
              </h3>
              <p className="text-sm text-ink-muted">
                {todayEnrollment.course?.title} · {todayEnrollment.current_lesson?.estimated_minutes ?? 45} min
              </p>
            </div>
            <Link href={`/courses/${todayEnrollment.course?.slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-dark transition-all shrink-0">
              Continue
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>
      )}

      {/* Progress stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { value: `${activeEnrollments.length}`, label: "Active courses" },
          { value: `${(projects ?? []).filter(p => p.status === "submitted" || p.status === "reviewed").length}/${(projects ?? []).length || 0}`, label: "Projects done" },
          { value: "—", label: "Portfolio score" },
          { value: `${todayEnrollment?.assessment_level?.charAt(0).toUpperCase() ?? "—"}${todayEnrollment?.assessment_level?.slice(1) ?? ""}`, label: "Your level" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-4 text-center bg-surface border border-border">
            <p className="text-xl font-black text-ink mb-0.5">{s.value}</p>
            <p className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Enrolled courses */}
      {activeEnrollments.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">My Courses</p>
            <Link href="/courses" className="text-xs text-brand hover:underline font-semibold">Browse more →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEnrollments.map((e) => {
              const color = e.course?.slug ? COURSE_COLORS[e.course.slug] ?? "#0056CE" : "#0056CE";
              return (
                <Link key={e.id} href={`/courses/${e.course?.slug}`}
                  className="group bg-surface rounded-xl border border-border p-5 hover:shadow-card-hover transition-shadow">
                  <div className="w-10 h-1 rounded-full mb-4" style={{ background: color }} />
                  <h3 className="text-sm font-bold text-ink mb-2 group-hover:text-brand transition-colors">
                    {e.course?.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-ink-muted mb-3">
                    <span>{e.assessment_level ?? "—"}</span>
                    <span>{e.course?.total_lessons} lessons</span>
                  </div>
                  <div className="w-full bg-surface-alt rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: "20%", background: color }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent projects */}
      {projects && projects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Recent Projects</p>
            <Link href="/projects" className="text-xs text-brand hover:underline font-semibold">View all →</Link>
          </div>
          <div className="space-y-2">
            {projects.map((p) => {
              const statusColors: Record<string, string> = {
                submitted: "bg-success-bg text-success",
                reviewed: "bg-success-bg text-success",
                in_progress: "bg-warning-bg text-warning",
                not_started: "bg-surface-alt text-ink-muted",
              };
              const cls = statusColors[p.status] ?? "bg-surface-alt text-ink-muted";
              return (
                <div key={p.id} className="bg-surface rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">{p.project?.title ?? "Project"}</p>
                    <p className="text-xs text-ink-muted capitalize">{p.project?.difficulty}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${cls}`}>
                    {p.status.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
