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

export default async function CoursesPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("title", { ascending: true }) as { data: Course[] | null };

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
          <div className="text-5xl mb-4">📚</div>
          <p className="text-ink-muted">No courses available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {courses.map((course) => {
            const isComingSoon = course.status === "coming_soon";
            return (
              <div
                key={course.id}
                className={[
                  "bg-surface rounded-[var(--radius-lg)] border border-border shadow-card flex flex-col",
                  isComingSoon ? "opacity-60" : "hover:shadow-card-hover transition-shadow",
                ].join(" ")}
              >
                {/* Icon */}
                <div className="px-5 pt-5 pb-3">
                  <div className="w-14 h-14 rounded-[var(--radius-lg)] bg-surface-tint flex items-center justify-center text-3xl mb-4">
                    {course.icon}
                  </div>

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-ink leading-snug">
                      {course.title}
                    </h3>
                    {isComingSoon ? (
                      <span className="shrink-0 text-lg">🔒</span>
                    ) : (
                      <Badge variant={levelVariant(course.level)} className="shrink-0">
                        {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
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
                  ) : (
                    <Link
                      href={`/courses/${course.slug}`}
                      className="flex items-center justify-center w-full h-10 rounded-[var(--radius-md)] bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
                    >
                      Start Assessment →
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
