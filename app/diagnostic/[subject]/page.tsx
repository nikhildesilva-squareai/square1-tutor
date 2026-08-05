import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/logo";
import { getSubject, SUBJECT_SEO, DIAG_SUBJECTS } from "@/lib/diagnostic";
import { DiagnosticExperience } from "./DiagnosticExperience";
import { SubjectCapture } from "@/components/SubjectCapture";
import { DiagnosticEvent } from "@/components/DiagnosticEvent";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 300;

// Canonical host. square1ai.com 301s to www at the Vercel domain layer.
const BASE = "https://www.square1ai.com";

// The subject list is fixed and known at build time, so prerender all of them.
// Only subjects that have BOTH a DIAG_SUBJECTS entry and SEO copy are valid —
// a subject missing its copy should 404, not render a half-built page.
export function generateStaticParams() {
  return DIAG_SUBJECTS
    .filter((s) => SUBJECT_SEO[s.slug])
    .map((s) => ({ subject: s.slug }));
}

// Any other slug gets a REAL 404. Previously this page returned a "Subject not
// found" body with HTTP 200 and — because it never called notFound() — Next
// emitted `index, follow` on it, so an unlimited number of junk URLs advertised
// themselves as indexable content. Rejecting the param up front also sets the
// status BEFORE the response starts streaming, which is the only point at which
// it can still be set (see the streaming note in the newsroom route).
export const dynamicParams = false;

interface PageProps { params: Promise<{ subject: string }> }

export default async function SubjectDiagnosticPage({ params }: PageProps) {
  const { subject: slug } = await params;
  const subject = getSubject(slug);
  const seo = SUBJECT_SEO[slug];

  // Unreachable while dynamicParams is false; kept as the type narrowing and a
  // guard if this ever becomes dynamic again.
  if (!subject || !seo) notFound();

  // Real course modules for the "What you'll learn" section.
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, total_lessons, total_projects")
    .eq("slug", slug)
    .is("parent_course_id", null)
    .maybeSingle();

  let modules: { title: string; lessons: number }[] = [];
  if (course) {
    const { data: mods } = await supabase
      .from("modules")
      .select("title, order_index, lessons(count)")
      .eq("course_id", course.id)
      .order("order_index", { ascending: true });
    modules = (mods ?? []).map((m) => ({
      title: m.title as string,
      lessons: (m.lessons as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
    }));
  }

  // ─── Course structured data ───────────────────────────────────────────────
  // This is the only PUBLIC page describing the course — /courses/{slug} sits
  // behind sign-in — so the Course entity belongs here, on the URL an answer
  // engine can actually fetch and cite. Built from the same DB rows the page
  // renders, so the markup can never claim a module the page doesn't show.
  //
  // Deliberately no `offers`: pricing is region-resolved per visitor and the
  // free window moves, and structured data gets cached by engines for far
  // longer than either stays true. A stale price is worse than no price.
  const courseLd = course
    ? {
        "@context": "https://schema.org",
        "@type": "Course",
        "@id": `${BASE}/diagnostic/${slug}#course`,
        name: course.title,
        url: `${BASE}/diagnostic/${slug}`,
        ...(course.description ? { description: course.description } : {}),
        // @id points at the sitewide node in app/layout.tsx, so every course
        // resolves to ONE Square 1 AI entity rather than 20 look-alikes.
        provider: { "@id": `${BASE}/#organization`, "@type": "EducationalOrganization", name: "Square 1 AI", url: BASE },
        inLanguage: "en",
        ...(modules.length
          ? {
              teaches: modules.map((m) => m.title),
              syllabusSections: modules.map((m, i) => ({
                "@type": "Syllabus",
                position: i + 1,
                name: m.title,
                ...(m.lessons ? { description: `${m.lessons} lessons` } : {}),
              })),
            }
          : {}),
        // No courseWorkload: schema.org reads it as time-per-week, and the only
        // figure the site publishes is "about 45 minutes a day" on a self-paced
        // track — converting that to a weekly number means inventing a
        // days-per-week the site never claims. Add it once that's decided.
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          instructor: { "@type": "Organization", name: "Nova, the Square 1 AI tutor" },
        },
      }
    : null;

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {courseLd ? <JsonLd data={courseLd} /> : null}
      {/* Remember the chosen track so it can attach to the profile after signup. */}
      <SubjectCapture subject={subject.title} />
      {/* Funnel logging: this visitor opened the skill check for this subject. */}
      <DiagnosticEvent event="started" subject={slug} />
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <Link href="/login" className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900">
          Sign in
        </Link>
      </header>

      <DiagnosticExperience
        slug={slug}
        subject={{ title: subject.title, role: subject.role, color: subject.color }}
        seo={seo}
        modules={modules}
        totalProjects={course?.total_projects ?? 0}
      />
    </div>
  );
}
