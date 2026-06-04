import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Course } from "@/types/database";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ReassessPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, title, color")
    .eq("slug", slug)
    .maybeSingle() as { data: Pick<Course, "id" | "slug" | "title" | "color"> | null };

  if (!course) notFound();

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 max-w-2xl mx-auto">
      <Link
        href={`/courses/${slug}`}
        className="text-sm text-brand hover:underline mb-6 inline-block"
      >
        &larr; Back to {course.title}
      </Link>

      <div className="bg-surface border border-border rounded-xl p-8 shadow-card text-center">
        <div
          className="w-12 h-1.5 rounded-full mx-auto mb-6"
          style={{ background: course.color }}
        />

        <h1 className="text-xl font-bold text-ink mb-2">
          Module Re-Assessment -- Coming Soon
        </h1>

        <p className="text-sm text-ink-secondary leading-relaxed max-w-md mx-auto mb-6">
          After completing each module, you will be able to take a
          5-question mini-test to measure your improvement.
        </p>

        <p className="text-sm text-ink-secondary leading-relaxed max-w-md mx-auto mb-8">
          Your original assessment score will be compared to your
          new score to show your growth.
        </p>

        <div className="bg-surface-alt rounded-xl p-5 max-w-sm mx-auto">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-black text-ink">5</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Questions</p>
            </div>
            <div>
              <p className="text-lg font-black text-ink">~10</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Minutes</p>
            </div>
            <div>
              <p className="text-lg font-black text-ink">1</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Module</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href={`/courses/${slug}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-ink-secondary border border-border hover:bg-surface-alt transition-all"
          >
            Return to course
          </Link>
        </div>
      </div>
    </div>
  );
}
