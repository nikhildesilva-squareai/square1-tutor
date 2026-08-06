import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/ui/logo";
import { TryLessonCards } from "./TryLessonCards";

// Public, no-login preview of a course's FIRST lesson only — served as an
// interactive CARD PLAYER (sections + real quick checks + signup gate after
// the first win), mirroring the in-app lesson experience instead of a wall
// of reading. Reads with the service-role client (read-only, lesson content
// is public marketing material) so it works regardless of RLS, and only ever
// surfaces lesson 1 — deeper lessons stay behind enrollment.

export const revalidate = 300;

interface TryMcq {
  id: string;
  prompt: string;
  options: string[];
  correct: string;
}

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
  mcqs: TryMcq[];
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
    .select("id, title, theory_md, learning_objectives, estimated_minutes")
    .order("order_index", { ascending: true })
    .limit(1);

  lessonQuery = modules && modules.length > 0
    ? lessonQuery.eq("module_id", modules[0].id)
    : lessonQuery.eq("course_id", course.id);

  const { data: lessons } = await lessonQuery;
  const lesson = lessons?.[0];
  if (!lesson) return null;

  // The lesson's first two quick checks power the interactive cards. MCQ
  // correct answers for LESSON 1 are already public-by-design in the in-app
  // player (instant inline feedback); this exposes nothing new.
  const { data: mcqRows } = await supabase
    .from("exercises")
    .select("id, prompt_md, options, correct_answer")
    .eq("lesson_id", lesson.id)
    .eq("type", "mcq")
    .order("order_index", { ascending: true })
    .limit(2);

  const mcqs: TryMcq[] = (mcqRows ?? [])
    .filter((m) => Array.isArray(m.options) && m.options.length > 1 && m.correct_answer)
    .map((m) => ({
      id: m.id as string,
      prompt: (m.prompt_md as string) ?? "",
      options: m.options as string[],
      correct: m.correct_answer as string,
    }));

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
    mcqs,
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
    <div className="min-h-dvh" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 40%)" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-slate-200/70">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/"><Logo variant="dark" size="md" /></Link>
          <Link
            href={`/signup?subject=${data.courseSlug}`}
            className="text-sm font-bold text-white px-4 py-2 rounded-full hover:-translate-y-0.5 transition-transform"
            style={{ background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)" }}
          >
            Start free →
          </Link>
        </div>
      </header>

      {/* The card player: sections → quick checks → first-win signup gate. */}
      <TryLessonCards
        slug={slug}
        courseTitle={data.courseTitle}
        icon={data.icon}
        color={data.color}
        totalLessons={data.totalLessons}
        lessonTitle={data.lessonTitle}
        minutes={data.minutes}
        objectives={data.objectives}
        theory={data.theory}
        mcqs={data.mcqs}
      />
    </div>
  );
}
