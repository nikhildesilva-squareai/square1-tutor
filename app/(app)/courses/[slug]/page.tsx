import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Course, Module, Project } from "@/types/database";

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

  const moduleList = modules ?? [];
  const projectList = projects ?? [];

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

        {/* Curriculum */}
        {moduleList.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-ink mb-5">Curriculum overview</h2>
            <div className="space-y-3">
              {moduleList.map((mod, i) => (
                <div
                  key={mod.id}
                  className="bg-surface border border-border rounded-[var(--radius-lg)] px-5 py-4 flex items-center gap-4 shadow-card"
                >
                  <div className="w-8 h-8 rounded-full bg-surface-tint flex items-center justify-center text-xs font-bold text-brand shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink">{mod.title}</p>
                    {mod.description && (
                      <p className="text-xs text-ink-muted mt-0.5 truncate">{mod.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-ink-muted shrink-0">Week {mod.week_number}</span>
                </div>
              ))}
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
