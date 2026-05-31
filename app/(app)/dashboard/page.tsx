import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

function levelVariant(level: string | null): "success" | "warning" | "error" | "muted" {
  if (level === "advanced") return "success";
  if (level === "intermediate") return "warning";
  if (level === "beginner") return "error";
  return "muted";
}

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

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
      {/* Welcome banner */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {greeting}, {name}! 👋
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            {activeEnrollments.length > 0
              ? "Keep your streak going — your next lesson is waiting."
              : "Welcome to Square 1 AI. Start by choosing a course."}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-warning-bg px-3 py-1.5 rounded-[var(--radius-pill)]">
          <span className="text-lg">🔥</span>
          <span className="text-sm font-semibold text-warning">Streak active</span>
        </div>
      </div>

      {/* Today's session */}
      {todayEnrollment ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-surface-tint flex items-center justify-center text-2xl">
                {todayEnrollment.course?.icon ?? "📚"}
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-0.5">
                  Today&apos;s Session
                </p>
                <p className="text-base font-semibold text-ink">
                  {todayEnrollment.current_lesson?.title ?? "Start your next lesson"}
                </p>
                <p className="text-sm text-ink-muted">
                  {todayEnrollment.course?.title} ·{" "}
                  {todayEnrollment.current_lesson?.estimated_minutes ?? 30} min
                </p>
              </div>
            </div>
            <Link href={`/courses/${todayEnrollment.course?.slug}`}>
              <Button size="md">Continue Learning →</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-between gap-6">
            <div>
              <p className="text-base font-semibold text-ink">No active courses yet</p>
              <p className="text-sm text-ink-muted mt-0.5">
                Browse the course catalogue and take your first assessment.
              </p>
            </div>
            <Link href="/courses">
              <Button size="md">Browse Courses →</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* My Courses */}
      {activeEnrollments.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink">My Courses</h2>
            <Link href="/courses" className="text-sm text-brand hover:underline">
              Browse more
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEnrollments.map((enrollment) => (
              <Card key={enrollment.id} className="hover:shadow-card-hover transition-shadow">
                <CardContent>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{enrollment.course?.icon ?? "📚"}</span>
                    {enrollment.assessment_level && (
                      <Badge variant={levelVariant(enrollment.assessment_level)}>
                        {enrollment.assessment_level.charAt(0).toUpperCase() + enrollment.assessment_level.slice(1)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-ink mb-3">
                    {enrollment.course?.title}
                  </p>
                  {/* Progress bar placeholder */}
                  <div className="w-full bg-surface-alt rounded-full h-1.5 mb-1">
                    <div
                      className="bg-brand h-1.5 rounded-full"
                      style={{ width: "20%" }}
                    />
                  </div>
                  <p className="text-xs text-ink-muted">Progress tracked by lessons</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Projects tracker */}
      {projects && projects.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink">Recent Projects</h2>
            <Link href="/projects" className="text-sm text-brand hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {projects.map((p) => {
              const statusMap: Record<string, { label: string; variant: "success" | "warning" | "muted" | "default" }> = {
                submitted: { label: "Submitted", variant: "success" },
                in_progress: { label: "In Progress", variant: "warning" },
                not_started: { label: "Not started", variant: "muted" },
                reviewed: { label: "Reviewed", variant: "success" },
              };
              const s = statusMap[p.status] ?? { label: p.status, variant: "muted" };
              return (
                <Card key={p.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {p.project?.title ?? "Project"}
                      </p>
                      <p className="text-xs text-ink-muted capitalize">
                        {p.project?.difficulty} difficulty
                      </p>
                    </div>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {activeEnrollments.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-ink mb-2">
            You haven&apos;t enrolled in any courses yet
          </h3>
          <p className="text-sm text-ink-muted mb-6">
            Choose a course, take the assessment, and get your personalised learning plan.
          </p>
          <Link href="/courses">
            <Button size="lg">Browse Courses</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
