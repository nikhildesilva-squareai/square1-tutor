import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface EnrollmentRow {
  id: string;
  status: string;
  assessment_level: string | null;
  target_completion_date: string | null;
  current_lesson_id: string | null;
  course: {
    id: string;
    slug: string;
    title: string;
    icon: string;
    total_lessons: number;
  } | null;
  current_lesson: {
    id: string;
    title: string;
    estimated_minutes: number;
  } | null;
}

interface ProjectRow {
  id: string;
  status: string;
  project: {
    id: string;
    title: string;
    difficulty: string;
  } | null;
}

function getGreeting() {
  const hour = new Date().getUTCHours() + 10; // rough AEST
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const POPULAR = [
  { slug: "generative-ai", title: "Generative AI", salary: "$130–200k", color: "#6366f1" },
  { slug: "machine-learning", title: "Machine Learning", salary: "$140–220k", color: "#8b5cf6" },
  { slug: "cybersecurity", title: "Cybersecurity", salary: "$110–180k", color: "#ef4444" },
  { slug: "fullstack-development", title: "Full Stack", salary: "$100–160k", color: "#06b6d4" },
];

const COURSE_COLORS: Record<string, string> = {
  "generative-ai": "#6366f1",
  "machine-learning": "#8b5cf6",
  "cybersecurity": "#ef4444",
  "fullstack-development": "#06b6d4",
  "data-science": "#f59e0b",
  "cloud-computing": "#10b981",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get student record
  const { data: student } = await supabase
    .from("students")
    .select("id, name, email")
    .eq("user_id", user.id)
    .maybeSingle();

  // Get enrollments with course + current lesson
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select(`
      id, status, assessment_level, target_completion_date, current_lesson_id,
      course:courses(id, slug, title, icon, total_lessons),
      current_lesson:lessons!student_enrollments_current_lesson_id_fkey(id, title, estimated_minutes)
    `)
    .eq("student_id", student?.id ?? "")
    .eq("status", "active")
    .order("enrolled_at", { ascending: false }) as { data: EnrollmentRow[] | null };

  // Get recent projects
  const { data: projects } = await supabase
    .from("student_projects")
    .select(`
      id, status,
      project:projects(id, title, difficulty)
    `)
    .eq("student_id", student?.id ?? "")
    .order("updated_at", { ascending: false })
    .limit(3) as { data: ProjectRow[] | null };

  const name = student?.name ?? user.email?.split("@")[0] ?? "there";
  const greeting = getGreeting();
  const activeEnrollments = enrollments ?? [];
  const todayEnrollment = activeEnrollments[0] ?? null;
  const completedProjects = (projects ?? []).filter(p => p.status === "submitted" || p.status === "reviewed").length;
  const totalProjects = (projects ?? []).length;

  // ── Empty state (no enrollments) ──────────────────────────────

  if (activeEnrollments.length === 0) {
    return (
      <div className="relative min-h-full px-6 py-10 max-w-5xl mx-auto">
        {/* Subtle gradient blobs */}
        <div className="pointer-events-none absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, #5B8DEF 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute top-40 right-0 w-[400px] h-[400px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }} />

        {/* Greeting */}
        <div className="relative mb-10">
          <h1 className="text-3xl font-bold text-white">
            {greeting}, {name}
          </h1>
          <p className="text-slate-400 mt-2 text-base">
            Let&apos;s get you started.
          </p>
        </div>

        {/* Journey card */}
        <div
          className="relative rounded-2xl p-8 mb-8 overflow-hidden"
          style={{
            background: "#0D1117",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-6">
            Your journey starts here
          </p>

          <div className="space-y-4 mb-8">
            {[
              "Pick a course",
              "Take the free assessment (30 min)",
              "Get your personalised skill report",
              "Choose your learning plan",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #5B8DEF 0%, #6366f1 100%)",
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-slate-300 text-sm">{step}</span>
              </div>
            ))}
          </div>

          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #5B8DEF 0%, #6366f1 100%)",
            }}
          >
            Browse Courses
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { value: "12", label: "subjects", sublabel: "available" },
            { value: "45 min", label: "per day", sublabel: "commitment" },
            { value: "$0", label: "to start", sublabel: "free assessment" },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-xl p-5 text-center"
              style={{
                background: "#0D1117",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="text-2xl font-black text-white mb-1">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className="text-xs text-slate-500">{stat.sublabel}</p>
            </div>
          ))}
        </div>

        {/* Popular courses */}
        <div className="relative">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">
            Popular courses
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {POPULAR.map((course) => (
              <Link
                key={course.slug}
                href={`/courses/${course.slug}`}
                className="group rounded-xl p-5 transition-all hover:scale-[1.02]"
                style={{
                  background: "#0D1117",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderLeft: `3px solid ${course.color}`,
                }}
              >
                <p className="text-sm font-semibold text-white mb-2 group-hover:text-slate-200">
                  {course.title}
                </p>
                <p className="text-xs text-slate-500">{course.salary}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Active student dashboard ──────────────────────────────────
  return (
    <div className="relative min-h-full px-6 py-10 max-w-5xl mx-auto">
      {/* Subtle gradient blobs */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, #5B8DEF 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative flex items-start justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {greeting}, {name}
          </h1>
          <p className="text-slate-400 mt-2 text-base">
            You&apos;re on track. Keep going.
          </p>
        </div>
        {/* Streak badge */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
          style={{
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            color: "#f59e0b",
            boxShadow: "0 0 20px rgba(245, 158, 11, 0.08)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1C8 1 3 6 3 9.5C3 12.5 5.2 14.5 8 14.5C10.8 14.5 13 12.5 13 9.5C13 6 8 1 8 1Z" fill="#f59e0b"/></svg>
          7 day streak
        </div>
      </div>

      {/* Today's Session */}
      {todayEnrollment && (
        <div
          className="relative rounded-2xl p-6 mb-8 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(13,17,23,1) 0%, rgba(18,24,34,1) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderLeft: "3px solid #5B8DEF",
          }}
        >
          <div className="flex items-center justify-between gap-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Today&apos;s Session
              </p>
              <p className="text-lg font-semibold text-white mb-1">
                {todayEnrollment.course?.title}
              </p>
              <p className="text-sm text-slate-400 mb-4">
                {todayEnrollment.current_lesson?.title ?? "Start your next lesson"}
              </p>
              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full max-w-xs" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: "60%",
                      background: "linear-gradient(90deg, #5B8DEF 0%, #6366f1 100%)",
                    }}
                  />
                </div>
                <span className="text-xs text-slate-500">
                  {todayEnrollment.current_lesson?.estimated_minutes ?? 30} min
                </span>
              </div>
            </div>
            <Link
              href={`/courses/${todayEnrollment.course?.slug}`}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #5B8DEF 0%, #6366f1 100%)",
              }}
            >
              Continue
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>
      )}

      {/* Progress stats */}
      <div className="mb-8">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">
          Your progress
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: "62%", label: "course", sublabel: "done" },
            { value: `${completedProjects}/${totalProjects || 12}`, label: "projects", sublabel: "shipped" },
            { value: "94", label: "score", sublabel: "/100" },
            { value: "14", label: "lessons", sublabel: "done" },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-xl p-5 text-center"
              style={{
                background: "#0D1117",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="text-2xl font-black text-white mb-1">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className="text-xs text-slate-500">{stat.sublabel}</p>
            </div>
          ))}
        </div>
      </div>

      {/* My Courses */}
      <div className="relative mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
            My courses
          </p>
          <Link href="/courses" className="text-xs text-slate-500 hover:text-white transition-colors">
            Browse more
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeEnrollments.map((enrollment) => {
            const slug = enrollment.course?.slug ?? "";
            const accentColor = COURSE_COLORS[slug] ?? "#5B8DEF";
            const level = enrollment.assessment_level
              ? enrollment.assessment_level.charAt(0).toUpperCase() + enrollment.assessment_level.slice(1)
              : null;

            return (
              <Link
                key={enrollment.id}
                href={`/courses/${slug}`}
                className="group rounded-xl p-5 transition-all hover:scale-[1.01]"
                style={{
                  background: "#0D1117",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderLeft: `3px solid ${accentColor}`,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm font-semibold text-white group-hover:text-slate-200">
                    {enrollment.course?.title}
                  </p>
                  {level && (
                    <span className="text-[10px] font-medium text-slate-500 px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
                      {level}
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: "20%",
                      background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}aa 100%)`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500">Progress tracked by lessons</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Projects */}
      {projects && projects.length > 0 && (
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
              Recent projects
            </p>
            <Link href="/projects" className="text-xs text-slate-500 hover:text-white transition-colors">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {projects.map((p) => {
              const statusStyles: Record<string, { label: string; color: string }> = {
                submitted: { label: "Submitted", color: "#10b981" },
                in_progress: { label: "In Progress", color: "#f59e0b" },
                not_started: { label: "Not started", color: "#64748b" },
                reviewed: { label: "Reviewed", color: "#10b981" },
              };
              const s = statusStyles[p.status] ?? { label: p.status, color: "#64748b" };
              return (
                <div
                  key={p.id}
                  className="rounded-xl px-5 py-4 flex items-center justify-between"
                  style={{
                    background: "#0D1117",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {p.project?.title ?? "Project"}
                    </p>
                    <p className="text-xs text-slate-500 capitalize mt-0.5">
                      {p.project?.difficulty} difficulty
                    </p>
                  </div>
                  <span
                    className="text-[11px] font-medium px-3 py-1 rounded-full"
                    style={{
                      color: s.color,
                      background: `${s.color}15`,
                    }}
                  >
                    {s.label}
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
