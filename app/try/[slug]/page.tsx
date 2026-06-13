import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/ui/logo";
import { RichContent } from "@/components/ui/rich-content";

// Public, no-login preview of a course's FIRST lesson only.
// Reads with the service-role client (read-only, lesson content is public
// marketing material) so it works regardless of RLS, and only ever surfaces
// lesson 1 — deeper lessons stay behind enrollment.

export const revalidate = 300;

interface FirstLesson {
  courseTitle: string;
  courseSlug: string;
  icon: string;
  color: string;
  totalLessons: number;
  lessonTitle: string;
  theory: string;
  objectives: string[];
  minutes: number | null;
}

async function getFirstLesson(slug: string): Promise<FirstLesson | null> {
  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return null; // service role key not configured
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, title, icon, color, total_lessons")
    .eq("slug", slug)
    .maybeSingle();
  if (!course) return null;

  // First module, then first lesson in it; fall back to first lesson by course
  const { data: modules } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", course.id)
    .order("order_index", { ascending: true })
    .limit(1);

  let lessonQuery = supabase
    .from("lessons")
    .select("title, theory_md, learning_objectives, estimated_minutes")
    .order("order_index", { ascending: true })
    .limit(1);

  lessonQuery = modules && modules.length > 0
    ? lessonQuery.eq("module_id", modules[0].id)
    : lessonQuery.eq("course_id", course.id);

  const { data: lessons } = await lessonQuery;
  const lesson = lessons?.[0];
  if (!lesson) return null;

  return {
    courseTitle: course.title,
    courseSlug: course.slug,
    icon: course.icon ?? "📘",
    color: course.color ?? "#0056CE",
    totalLessons: course.total_lessons ?? 40,
    lessonTitle: lesson.title,
    theory: (lesson.theory_md as string) ?? "",
    objectives: (lesson.learning_objectives as string[]) ?? [],
    minutes: (lesson.estimated_minutes as number) ?? null,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getFirstLesson(slug);
  if (!data) return { title: "Free Lesson Preview" };
  return {
    title: `Free Lesson: ${data.lessonTitle}`,
    description: `Try the first lesson of ${data.courseTitle} free — no signup. ${data.lessonTitle}.`,
    openGraph: {
      title: `Free Lesson — ${data.courseTitle} | Square 1 AI`,
      description: `Read the real first lesson of ${data.courseTitle}, free and with no signup.`,
    },
  };
}

export default async function TryLessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getFirstLesson(slug);
  if (!data) notFound();

  const accent = data.color;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 40%)" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-slate-200/70">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/"><Logo variant="dark" size="md" /></Link>
          <Link
            href={`/signup?subject=${data.courseSlug}`}
            className="text-sm font-bold text-white px-4 py-2 rounded-full hover:-translate-y-0.5 transition-transform"
            style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)" }}
          >
            Start free →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-6 py-10 sm:py-14">
        {/* Free-preview banner */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold mb-6"
          style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}30` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
          FREE PREVIEW · LESSON 1 OF {data.totalLessons} · NO SIGNUP
        </div>

        {/* Course + lesson title */}
        <div className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: accent }}>
          <span className="text-lg">{data.icon}</span> {data.courseTitle}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
          {data.lessonTitle}
        </h1>
        {data.minutes && (
          <p className="text-sm text-slate-500 mb-8">~{data.minutes} min read · taught by Nova inside the full course</p>
        )}

        {/* Objectives */}
        {data.objectives.length > 0 && (
          <div className="rounded-2xl border p-5 mb-8" style={{ borderColor: `${accent}25`, background: `${accent}08` }}>
            <p className="text-[10px] tracking-widest uppercase font-bold text-slate-500 mb-3">What you&apos;ll learn</p>
            <ul className="space-y-2">
              {data.objectives.map((o, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-700">
                  <span className="font-black tabular-nums" style={{ color: accent }}>{String(i + 1).padStart(2, "0")}</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Lesson body */}
        <article className="text-[15px] leading-relaxed">
          <RichContent content={data.theory} />
        </article>

        {/* End-of-lesson conversion */}
        <div className="mt-12 rounded-3xl border overflow-hidden">
          <div className="p-7 sm:p-9 text-center" style={{ background: "linear-gradient(135deg,#050B14,#0B1626)" }}>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">
              That&apos;s lesson 1 of {data.totalLessons}.
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto mb-6">
              Inside the full course, Nova tutors you on this in real time, grades every line of code you write,
              and walks you to {data.totalLessons - 1} more lessons plus real deployed projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/signup?subject=${data.courseSlug}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-sm hover:-translate-y-0.5 transition-transform"
                style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)", boxShadow: "0 12px 32px rgba(0,86,206,0.35)" }}
              >
                Get your free skill report →
              </Link>
              <Link
                href="/diagnostic"
                className="inline-flex items-center justify-center px-6 py-4 rounded-xl text-white text-sm font-semibold transition-all hover:bg-white/[0.06]"
                style={{ border: "1px solid rgba(255,255,255,0.15)" }}
              >
                Take the 3-min skill check
              </Link>
            </div>
            <p className="text-[11px] text-slate-600 mt-4">Free forever · No credit card</p>
          </div>
        </div>

        {/* Try another */}
        <div className="text-center mt-8">
          <Link href="/diagnostic" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
            ← Explore other tracks
          </Link>
        </div>
      </main>
    </div>
  );
}
