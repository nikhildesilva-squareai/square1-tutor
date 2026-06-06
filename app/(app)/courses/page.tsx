import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/types/database";

function levelVariant(level: string): "success" | "warning" | "error" | "muted" {
  if (level === "advanced") return "success";
  if (level === "intermediate") return "warning";
  if (level === "beginner") return "error";
  return "muted";
}

function formatLevel(level: string): string {
  return level
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" to ");
}

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("title", { ascending: true }) as { data: Course[] | null };

  // Fetch enrolled course IDs for this student
  const enrolledCourseIds = new Set<string>();
  if (user) {
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (student) {
      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select("course_id")
        .eq("student_id", student.id)
        .eq("status", "active");

      for (const e of enrollments ?? []) {
        enrolledCourseIds.add(e.course_id);
      }
    }
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Choose your course</h1>
        <p className="text-ink-muted mt-1 text-sm">
          Pick a subject, take the assessment, and get your personalised learning plan.
        </p>
      </div>

      {!courses || courses.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-ink-muted">No courses available yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {courses.map((course) => {
            const isComingSoon = course.status === "coming_soon";
            const isEnrolled = enrolledCourseIds.has(course.id);
            return (
              <div
                key={course.id}
                className={[
                  "bg-surface rounded-[var(--radius-lg)] border shadow-card flex flex-col",
                  isComingSoon ? "opacity-60 border-border" :
                  isEnrolled ? "border-brand/30 hover:shadow-card-hover transition-shadow" :
                  "border-border hover:shadow-card-hover transition-shadow",
                ].join(" ")}
              >
                <div className="px-5 pt-5 pb-3 overflow-hidden">
                  {/* Course colour accent bar */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-1 rounded-full" style={{ background: course.color }} />
                    {isEnrolled && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        Enrolled
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-ink leading-snug mb-2">
                    {course.title}
                  </h3>

                  {/* Level badge — own line so it never clips */}
                  <div className="mb-3">
                    {isComingSoon ? (
                      <span className="text-[10px] font-bold tracking-widest uppercase text-ink-muted px-2 py-0.5 rounded-full border border-border">Soon</span>
                    ) : (
                      <Badge variant={levelVariant(course.level)} className="text-[10px]">
                        {formatLevel(course.level)}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-ink-muted leading-relaxed mb-3">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-ink-muted">
                    <span>{course.total_lessons} lessons</span>
                    <span className="text-border-mid">·</span>
                    <span>{course.total_projects} projects</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 pb-5 mt-auto pt-3">
                  {isComingSoon ? (
                    <div className="w-full h-10 flex items-center justify-center rounded-[var(--radius-md)] bg-surface-alt text-xs font-semibold text-ink-muted">
                      Coming soon
                    </div>
                  ) : isEnrolled ? (
                    <Link
                      href={`/courses/${course.slug}`}
                      className="flex items-center justify-center w-full h-10 rounded-[var(--radius-md)] border border-brand/30 bg-surface-tint text-brand text-sm font-semibold hover:bg-brand hover:text-white transition-colors"
                    >
                      Continue Learning
                    </Link>
                  ) : (
                    <Link
                      href={`/courses/${course.slug}`}
                      className="flex items-center justify-center w-full h-10 rounded-[var(--radius-md)] bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
                    >
                      Start Assessment
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
