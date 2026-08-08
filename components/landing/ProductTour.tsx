import { createAdminClient } from "@/lib/supabase/admin";
import { LEVEL_LABELS } from "@/lib/competency";
import fixtures from "@/lib/tour-fixtures.json";
import { ProductTourClient, type TourData } from "./ProductTourClient";
import { pickEntryModule } from "@/lib/course-entry";

// ═══════════════════════════════════════════════════════════════════════════════
// "See how it works" — the five surfaces a visitor can't otherwise see, because
// they're all behind sign-in: the dashboard, a lesson, Nova grading, the
// projects, and what you leave with.
//
// Every panel is fed from the live database or from captured real output. The
// only invented numbers are the illustrative progress percentages on the
// dashboard panel, which are labelled as such in the UI — there is no real
// student to show, and pretending otherwise would be a fake screenshot.
//
// Nova's feedback comes from lib/tour-fixtures.json, produced by
// scripts/capture-nova-fixtures.ts against the real grading path. Nobody writes
// Nova's lines by hand.
// ═══════════════════════════════════════════════════════════════════════════════

// The showcase course. Data Science is the gold-standard track: full curriculum,
// hosted starter repos, narrative project briefs.
const SHOWCASE = "data-science";

export async function ProductTour() {
  let data: TourData | null = null;

  try {
    const db = createAdminClient();

    const { data: course } = await db
      .from("courses")
      .select("id, slug, title, total_lessons, total_projects")
      .eq("slug", SHOWCASE)
      .is("parent_course_id", null)
      .maybeSingle();
    if (!course) return null;

    const [{ data: modules }, { data: projects }] = await Promise.all([
      db.from("modules").select("id, title, order_index").eq("course_id", course.id)
        .order("order_index", { ascending: true }),
      db.from("projects").select("title, difficulty, estimated_hours, tech_stack, description_md, starter_repo_url")
        .eq("course_id", course.id).order("order_index", { ascending: true }).limit(1),
    ]);

    // Scoped to the showcase course's entry module, then ordered within it. Two
    // caveats, both load-bearing: ordering lessons by order_index across the
    // whole course returns whichever lesson holds the lowest index in any module
    // — not lesson 1 — and the panel is labelled "Lesson 1". And modules[0] is no
    // longer the course's own first module: the free AI Foundations block sits at
    // -1, so taking it would advertise the flagship with a generic prompting
    // lesson. pickEntryModule excludes the optional on-ramps.
    const firstModuleId = pickEntryModule(SHOWCASE, modules)?.id ?? modules?.[0]?.id;
    const { data: lessons } = firstModuleId
      ? await db.from("lessons")
          .select("title, estimated_minutes, learning_objectives, theory_md, order_index")
          .eq("module_id", firstModuleId).not("theory_md", "is", null)
          .order("order_index", { ascending: true }).limit(1)
      : { data: null };

    const lesson = lessons?.[0];
    const project = projects?.[0];
    const nova = fixtures.fixtures?.[0];
    if (!lesson || !project || !nova) return null;

    data = {
      courseTitle: course.title,
      courseSlug: course.slug,
      totalLessons: course.total_lessons ?? 0,
      totalProjects: course.total_projects ?? 0,
      modules: (modules ?? []).map((m) => m.title as string),
      lesson: {
        title: lesson.title as string,
        minutes: (lesson.estimated_minutes as number) ?? 0,
        objectives: ((lesson.learning_objectives as string[] | null) ?? []).slice(0, 4),
        excerpt: stripMd((lesson.theory_md as string) ?? "", 420),
      },
      project: {
        title: project.title as string,
        difficulty: (project.difficulty as string) ?? "",
        hours: (project.estimated_hours as number) ?? 0,
        stack: ((project.tech_stack as string[] | null) ?? []).slice(0, 5),
        brief: stripMd((project.description_md as string) ?? "", 340),
        hasRepo: Boolean(project.starter_repo_url),
      },
      nova: {
        exerciseTitle: nova.exerciseTitle,
        prompt: nova.prompt,
        studentAnswer: nova.studentAnswer,
        score: nova.score,
        maxMarks: nova.maxMarks,
        feedback: nova.feedback,
      },
      levels: [...LEVEL_LABELS],
    };
  } catch (e) {
    // The tour is a marketing section, never a reason for the homepage to fail.
    console.error("[product-tour] skipped:", e);
    return null;
  }

  return <ProductTourClient data={data} />;
}

/** Markdown → readable plain text for an excerpt. Headings and emphasis only —
 *  the source is our own authored content, not user input. */
function stripMd(md: string, max: number): string {
  const text = md
    .replace(/^##+\s*/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/[*_`>]/g, "")
    .replace(/\n{2,}/g, "\n")
    .split("\n")
    .filter((l) => l.trim())
    .slice(1) // drop the heading line; the panel supplies its own title
    .join(" ")
    .trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
