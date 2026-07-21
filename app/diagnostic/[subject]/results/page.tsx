import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter_Tight, Figtree } from "next/font/google";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { learnableHours } from "@/lib/utils";
import { FREE_ACCESS_CAP, freeWindowOpen } from "@/lib/free-access";
import { getSubject, getDiagnostic, scoreDiagnostic, decodeAnswers, readinessBand } from "@/lib/diagnostic";
import ResultsClient from "./ResultsClient";
import { DiagnosticEvent } from "@/components/DiagnosticEvent";

// The real course path for this track — modules (in order), the honest guided-
// hours number (same learnableHours model the course page uses), lesson total
// and project count. Powers the "Your path to job-ready" roadmap + role/coverage
// tiles. Returns null on any error or if the track has no course row yet, and
// the client hides the roadmap gracefully. Subject slug == course slug.
export interface CoursePath {
  modules: { title: string; lessons: number }[];
  guidedHours: number;
  totalLessons: number;
  totalProjects: number;
}

async function getCoursePath(slug: string): Promise<CoursePath | null> {
  try {
    const supabase = await createClient();
    const { data: course } = await supabase
      .from("courses").select("id, total_projects")
      .eq("slug", slug).is("parent_course_id", null).maybeSingle();
    if (!course) return null;

    const [{ data: mods }, { data: lessons }] = await Promise.all([
      supabase.from("modules").select("title, order_index, lessons(count)")
        .eq("course_id", course.id).order("order_index", { ascending: true }),
      supabase.from("lessons").select("id, estimated_minutes").eq("course_id", course.id),
    ]);

    const modules = (mods ?? []).map((m) => ({
      title: m.title as string,
      lessons: (m.lessons as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
    }));
    const lessonMinutes = (lessons ?? []).reduce((s, l) => s + ((l.estimated_minutes as number) ?? 0), 0);
    const lessonIds = (lessons ?? []).map((l) => l.id as string);
    const { data: exRows } = lessonIds.length
      ? await supabase.from("exercises").select("type").in("lesson_id", lessonIds)
      : { data: [] as { type: string }[] };
    const ex = { mcq: 0, short: 0, code: 0 };
    for (const r of (exRows ?? []) as { type: string }[]) {
      if (r.type === "mcq") ex.mcq++;
      else if (r.type === "short_answer") ex.short++;
      else if (r.type === "code") ex.code++;
    }

    return {
      modules,
      guidedHours: learnableHours(lessonMinutes, ex),
      totalLessons: modules.reduce((s, m) => s + m.lessons, 0),
      totalProjects: (course.total_projects as number) ?? 0,
    };
  } catch {
    return null;
  }
}

// Seat count resolved server-side so the "N of 500 seats left" pill renders on
// the first paint (no fallback flash from a client fetch). Returns null when the
// window is closed or on any error — the client still re-fetches to stay live.
async function getInitialSeats(): Promise<{ left: number; cap: number } | null> {
  try {
    if (!freeWindowOpen()) return null;
    const admin = createAdminClient();
    const { count } = await admin
      .from("free_trial_claims")
      .select("student_id", { count: "exact", head: true });
    return { left: Math.max(0, FREE_ACCESS_CAP - (count ?? 0)), cap: FREE_ACCESS_CAP };
  } catch {
    return null;
  }
}

// Fonts for the redesigned (light) results page — self-hosted by next/font, so
// no external request / CSP issue. Inter Tight = body+display, Figtree = eyebrows.
const interTight = Inter_Tight({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter-tight" });
const figtree = Figtree({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-figtree" });

interface Props {
  params: Promise<{ subject: string }>;
  searchParams: Promise<{ a?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { subject } = await params;
  const sp = await searchParams;
  const a = sp?.a;
  const sub = getSubject(subject);
  if (!sub) return { title: "Skill Snapshot — Square 1 AI" };

  const answers = decodeAnswers(a ?? null);
  const questions = getDiagnostic(subject);
  const result = answers ? scoreDiagnostic(questions, answers) : null;

  const title = result
    ? `${readinessBand(result.score)} in ${sub.title} — Square 1 AI Skill Snapshot`
    : `${sub.title} Skill Snapshot — Square 1 AI`;

  const description = result
    ? `I scored ${result.score}/${result.total} on the ${sub.title} skill check. Take yours free — 3 minutes, no signup.`
    : `Take the free ${sub.title} skill check — 3 minutes, no signup.`;

  const ogParams = a
    ? `?subject=${subject}&a=${a}`
    : `?subject=${subject}&score=0&total=5&level=Beginner`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: `/api/og/diagnostic${ogParams}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og/diagnostic${ogParams}`],
    },
  };
}

export default async function DiagnosticResultsPage({ params }: Props) {
  const { subject } = await params;
  const [initialSeats, coursePath] = await Promise.all([getInitialSeats(), getCoursePath(subject)]);
  return (
    <div className={`${interTight.variable} ${figtree.variable}`}>
      {/* Funnel logging: this visitor finished the skill check (reached results). */}
      <DiagnosticEvent event="finished" subject={subject} />
      <Suspense>
        <ResultsClient initialSeats={initialSeats} coursePath={coursePath} />
      </Suspense>
    </div>
  );
}
