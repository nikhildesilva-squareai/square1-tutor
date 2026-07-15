import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/logo";
import { getSubject, SUBJECT_SEO } from "@/lib/diagnostic";
import { DiagnosticExperience } from "./DiagnosticExperience";

export const revalidate = 300;

interface PageProps { params: Promise<{ subject: string }> }

export default async function SubjectDiagnosticPage({ params }: PageProps) {
  const { subject: slug } = await params;
  const subject = getSubject(slug);
  const seo = SUBJECT_SEO[slug];

  if (!subject || !seo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="mb-4 text-lg text-slate-600">Subject not found.</p>
        <Link href="/diagnostic" className="text-sm font-semibold text-blue-600 hover:underline">
          Browse all skill checks
        </Link>
      </div>
    );
  }

  // Real course modules for the "What you'll learn" section.
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, total_lessons, total_projects")
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

  return (
    <div className="flex min-h-screen flex-col bg-white">
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
        totalLessons={course?.total_lessons ?? 0}
        totalProjects={course?.total_projects ?? 0}
      />
    </div>
  );
}
