import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { BOOTCAMP_ENABLED } from "@/lib/flags";
import { getBootcamp, formatCohortDate } from "@/lib/bootcamp/catalog";
import { firstClassInstant } from "@/lib/bootcamp/localtime";
import { ApplyForm } from "@/components/bootcamp/ApplyForm";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = { robots: { index: false } }; // a form, not a landing page
export const dynamic = "force-dynamic";

export default async function ApplyPage({ params }: PageProps) {
  if (!BOOTCAMP_ENABLED) notFound();

  const { slug } = await params;
  const entry = await getBootcamp(slug);
  if (!entry) notFound();

  const { bootcamp, cohort, availability } = entry;

  // Not sellable right now — the sales page already has correct, state-specific
  // copy for every reason (not open yet / closed / full / no cohort), so send
  // them there rather than duplicating that messaging in a dead form.
  if (availability.state !== "open" || !cohort) {
    redirect(`/bootcamp/${slug}`);
  }

  // An application is a row against students(id), so identity is structural, not
  // a gate we chose to add. Round-trip through signup and come straight back.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const returnTo = `/bootcamp/${slug}/apply`;

  if (!user) {
    return (
      <Shell title={bootcamp.title}>
        <div className="bg-surface border border-border rounded-[12px] p-6 shadow-sm max-w-lg">
          <h2 className="text-lg font-semibold">Create an account to apply</h2>
          <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
            Applying is free. We need an account so your assessment, your application and —
            if you join — your graded work all live in one place.
          </p>
          <Link
            href={`/signup?next=${encodeURIComponent(returnTo)}`}
            className="mt-5 inline-flex rounded-[8px] bg-brand text-white font-semibold text-sm px-5 py-2.5 hover:opacity-90 transition"
          >
            Create a free account
          </Link>
          <p className="mt-3 text-xs text-ink-muted">
            Already have one?{" "}
            <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="text-brand hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </Shell>
    );
  }

  // Already applied? Show them where it stands instead of letting them create a
  // second row and hit the unique constraint as an error.
  const admin = createAdminClient();
  const { data: student } = await supabase
    .from("students").select("id").eq("user_id", user.id).maybeSingle();

  if (student) {
    const { data: existing } = await admin
      .from("bootcamp_applications")
      .select("id")
      .eq("cohort_id", cohort.id)
      .eq("student_id", student.id)
      .maybeSingle();
    if (existing) redirect(`/bootcamp/application/${(existing as { id: string }).id}`);
  }

  const firstClassISO = firstClassInstant(cohort.starts_on, cohort.timezone).toISOString();

  return (
    <Shell title={bootcamp.title}>
      <p className="text-sm text-ink-secondary mb-8 max-w-2xl leading-relaxed">
        Cohort 1 starts {formatCohortDate(cohort.starts_on)} and runs for {bootcamp.weeks} weeks.
        Two questions, then a short assessment. Nothing is charged today.
      </p>
      <ApplyForm
        slug={slug}
        cohortId={cohort.id}
        cohortTimeZone={cohort.timezone}
        firstClassISO={firstClassISO}
        weeks={bootcamp.weeks}
        hoursPerWeek={bootcamp.hours_per_week}
      />
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-surface-soft text-ink">
      <nav className="max-w-3xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="shrink-0"><Logo variant="dark" size="sm" /></Link>
        <Link href="/bootcamp" className="text-sm font-medium text-ink-secondary hover:text-brand">
          All bootcamps
        </Link>
      </nav>
      <div className="max-w-3xl mx-auto px-6 sm:px-8 pt-6 pb-20">
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
          Apply
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">{title}</h1>
        {children}
      </div>
    </main>
  );
}
