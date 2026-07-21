import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { LEARNING_PATHS } from "@/lib/learning-paths";
import { ArrowRight, BookOpen, FolderGit2, GraduationCap, Sparkles, type LucideIcon } from "lucide-react";
import type { Course } from "@/types/database";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Two ways to learn AI at Square 1 — build a career in AI engineering, or use AI better at work with no code. Real projects, role tracks, and AI tutoring.",
  openGraph: {
    title: "Courses — Square 1 AI",
    description:
      "Build a career in AI engineering, or get more out of AI at your job — no code. Personalised learning, real projects, graded by Nova.",
  },
};

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

const FALLBACK = "#0056CE";
const CAT_ICON_BG = "linear-gradient(135deg, #3388FF 0%, #0056CE 60%, #01224F 100%)";

// A course-coloured cover: diagonal gradient from the colour into a darker stop.
function coverStyle(color?: string | null): React.CSSProperties {
  const c = color ?? FALLBACK;
  return {
    background: `radial-gradient(120% 140% at 85% -10%, rgba(255,255,255,0.25), transparent 55%), linear-gradient(135deg, ${c}, color-mix(in srgb, ${c} 55%, #000))`,
  };
}
function monogram(title: string): string {
  const words = title.trim().split(/\s+/);
  return (words.length >= 2 ? words[0][0] + words[1][0] : title.slice(0, 2)).toUpperCase();
}

// "AI for your work — no code" lane: non-technical, role-based courses.
// These form the second category, and appear ONLY once activated
// (status = "active") — so the lane auto-appears on launch day with no code
// change, and renders nothing while the courses stay hidden.
const WORK_LANE_SLUGS = new Set([
  "ai-foundations",
  "ai-for-marketers",
  "ai-for-finance",
  "ai-for-creators",
  "ai-for-founders",
  "ai-for-teachers",
  "ai-for-project-managers",
  "ai-for-sales",
]);

// ─── Category header — states the CATEGORY and its OUTCOME ────────────────────
// The two categories exist to serve two different outcomes: an AI engineering
// career vs. being more productive with AI at your current job. The outcome chip
// makes that promise explicit at the top of each bucket.
function CategoryHeader({
  icon: Icon,
  title,
  outcome,
  blurb,
}: {
  icon: LucideIcon;
  title: string;
  outcome: string;
  blurb: string;
}) {
  return (
    <div className="mb-7">
      <div className="flex items-start gap-3.5">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_8px_18px_-8px_rgba(0,86,206,0.6)]"
          style={{ background: CAT_ICON_BG }}
        >
          <Icon className="h-[22px] w-[22px]" strokeWidth={2.2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h2 className="text-xl font-black tracking-tight text-ink">{title}</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand">
              {outcome}
            </span>
          </div>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">{blurb}</p>
        </div>
      </div>
      <div className="mt-5 h-px w-full bg-gradient-to-r from-border via-border to-transparent" />
    </div>
  );
}

// Shared course card — used by both categories so they stay visually identical.
function CourseCard({
  course,
  isEnrolled,
  hasAssessment,
}: {
  course: Course;
  isEnrolled: boolean;
  hasAssessment: boolean;
}) {
  const isComingSoon = course.status === "coming_soon";
  return (
    <div
      className={[
        "group flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-card transition-[transform,box-shadow]",
        isComingSoon
          ? "border-border opacity-70"
          : "border-border hover:-translate-y-1 hover:shadow-card-hover",
      ].join(" ")}
    >
      {/* Course-coloured cover */}
      <div className="relative h-20 overflow-hidden" style={coverStyle(course.color)}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "14px 14px", maskImage: "radial-gradient(70% 100% at 90% 0, #000, transparent 75%)", WebkitMaskImage: "radial-gradient(70% 100% at 90% 0, #000, transparent 75%)" }}
        />
        <span className="pointer-events-none absolute -bottom-3 right-3 select-none text-[64px] font-black leading-none text-white/20">
          {monogram(course.title)}
        </span>
        {isEnrolled && (
          <span className="absolute left-4 top-3.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Enrolled
          </span>
        )}
        {isComingSoon && (
          <span className="absolute left-4 top-3.5 rounded-full bg-black/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            Soon
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold leading-snug text-ink">{course.title}</h3>

        <div className="mt-2">
          {isComingSoon ? (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-ink-muted">Coming soon</span>
          ) : (
            <Badge variant={levelVariant(course.level)} className="text-[10px]">
              {formatLevel(course.level)}
            </Badge>
          )}
        </div>

        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-muted">
          {course.description}
        </p>

        {/* Footer — pinned to the bottom so the stats row and CTA
            line up across every card, whatever the title/description length */}
        <div className="mt-auto pt-4">
          <div className="mb-4 flex items-center gap-4 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> {course.total_lessons} lessons
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FolderGit2 className="h-3.5 w-3.5" /> {course.total_projects} projects
            </span>
          </div>
          {isComingSoon ? (
            <div className="flex h-10 w-full items-center justify-center rounded-xl bg-surface-alt text-xs font-semibold text-ink-muted">
              Coming soon
            </div>
          ) : isEnrolled ? (
            <Link
              href={`/courses/${course.slug}`}
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-brand/30 bg-surface-tint text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
            >
              Continue learning <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href={`/courses/${course.slug}`}
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              {hasAssessment ? "Start assessment" : "View course"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch courses and student in parallel
  const [{ data: courses }, studentResult, { data: papers }] = await Promise.all([
    supabase.from("courses").select("*").order("title", { ascending: true }) as unknown as Promise<{ data: Course[] | null }>,
    user ? supabase.from("students").select("id").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("assessment_papers").select("course_id") as unknown as Promise<{ data: { course_id: string }[] | null }>,
  ]);
  // Courses with a placement assessment show "Start Assessment"; open-access tracks
  // (e.g. Advanced Data Science, direct-enrol) show "View course" instead.
  const assessmentCourseIds = new Set((papers ?? []).map((p) => p.course_id));

  const enrolledCourseIds = new Set<string>();
  const student = studentResult.data;
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

  // Map slugs -> course rows so the curated career paths render live titles/colours.
  const coursesBySlug = new Map((courses ?? []).map((c) => [c.slug, c] as const));
  const visibleCourses = (courses ?? []).filter((c) => !c.parent_course_id);

  // The two categories. Work lane = only activated lane courses (nothing pre-launch);
  // engineering = everything else (the technical, career-outcome catalog).
  const workLaneCourses = visibleCourses.filter(
    (c) => WORK_LANE_SLUGS.has(c.slug) && c.status === "active",
  );
  const engineeringCourses = visibleCourses.filter((c) => !WORK_LANE_SLUGS.has(c.slug));

  return (
    <div className="min-h-full bg-surface-soft">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* ── Page header ─────────────────────────────────────────────── */}
        <header className="mb-11">
          <h1 className="text-3xl font-black tracking-tight text-ink">Choose your path</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-ink-secondary">
            Two ways to learn AI — <span className="font-semibold text-ink">build a career in it</span>, or{" "}
            <span className="font-semibold text-ink">get more out of it at your job</span>. Both are hands-on and graded by Nova, our AI tutor.
          </p>
        </header>

        {/* ═══ CATEGORY 1 — AI Engineering (career outcome) ═══════════════ */}
        <section className="mb-16">
          <CategoryHeader
            icon={GraduationCap}
            title="AI Engineering — build a career"
            outcome="Outcome: get hired"
            blurb="Job-ready engineering and data tracks. Get assessed, follow a personalised plan, and ship graded projects employers can actually run."
          />

          {/* Guided paths to a role */}
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-ink-secondary">Guided paths to a role</h3>
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
            {LEARNING_PATHS.map((path) => {
              const steps = path.courseSlugs
                .map((s) => coursesBySlug.get(s))
                .filter((c): c is Course => Boolean(c));
              if (steps.length === 0) return null;
              const first = steps[0];
              const lead = first.color ?? FALLBACK;
              const last = steps[steps.length - 1].color ?? lead;
              return (
                <div
                  key={path.slug}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-shadow hover:shadow-card-hover"
                >
                  {/* Colour accent strip across the path's course colours */}
                  <div className="h-1" style={{ background: `linear-gradient(90deg, ${lead}, ${last})` }} />

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white"
                        style={coverStyle(lead)}
                      >
                        {monogram(path.name)}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold leading-tight text-ink">{path.name}</h3>
                        <p className="text-[13px] font-semibold text-brand">{path.role}</p>
                      </div>
                    </div>

                    <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">{path.tagline}</p>

                    <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                      {steps.map((c, i) => (
                        <span key={c.id} className="flex items-center gap-1.5">
                          {i > 0 && <ArrowRight className="h-3.5 w-3.5 text-border-mid" aria-hidden />}
                          <Link
                            href={`/courses/${c.slug}`}
                            className="flex items-center gap-1.5 rounded-full border border-border bg-surface-alt px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:border-brand/40 hover:bg-surface-tint"
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color ?? undefined }} />
                            {c.title}
                          </Link>
                        </span>
                      ))}
                      {path.comingSoon?.map((t) => (
                        <span key={t} className="flex items-center gap-1.5">
                          <ArrowRight className="h-3.5 w-3.5 text-border-mid" aria-hidden />
                          <span className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-ink-muted">
                            {t} · soon
                          </span>
                        </span>
                      ))}
                    </div>

                    <div className="mt-4">
                      <Link
                        href={`/courses/${first.slug}`}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark"
                      >
                        Start with {first.title}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* All engineering courses */}
          <div className="mb-4 mt-10 flex items-baseline gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-secondary">All engineering courses</h3>
            <span className="text-sm text-ink-muted">{engineeringCourses.length} available</span>
          </div>
          {engineeringCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface py-20 text-center">
              <p className="text-ink-muted">No courses available yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {engineeringCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isEnrolled={enrolledCourseIds.has(course.id)}
                  hasAssessment={assessmentCourseIds.has(course.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ═══ CATEGORY 2 — AI for your work, no code (productivity outcome) ═══ */}
        {workLaneCourses.length > 0 && (
          <section className="mb-8">
            <CategoryHeader
              icon={Sparkles}
              title="AI for your work — no code"
              outcome="Outcome: productive at work"
              blurb="Get real value from ChatGPT, Claude, Copilot and Gemini in your role — practise on real work scenarios, graded by Nova. No programming required."
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {workLaneCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isEnrolled={enrolledCourseIds.has(course.id)}
                  hasAssessment={assessmentCourseIds.has(course.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
