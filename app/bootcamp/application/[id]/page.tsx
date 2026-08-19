import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { BOOTCAMP_ENABLED } from "@/lib/flags";
import { formatCohortDate } from "@/lib/bootcamp/catalog";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BootcampApplication, BootcampApplicationStatus } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

/** What the applicant sees, and what they should do about it. Deliberately plain:
 *  a decision about someone's next six months should not arrive as jargon. */
const COPY: Record<BootcampApplicationStatus, { heading: string; body: string; tone: "neutral" | "good" | "bad" }> = {
  submitted: {
    heading: "Application received",
    tone: "neutral",
    body: "Next is a short assessment so we can see where you are starting from. It is not pass-or-fail in the usual sense — it tells us whether this track is the right level for you right now, and we would rather say so before you pay than after.",
  },
  assessed: {
    heading: "Assessment complete — with us for review",
    tone: "neutral",
    body: "A human is reading your application. You will hear either way; we do not leave people wondering.",
  },
  accepted: {
    heading: "You're in",
    tone: "good",
    body: "A seat is held for you. The next step is the deposit, which is credited against your tuition and is refundable until two weeks after the cohort starts.",
  },
  waitlisted: {
    heading: "Waitlisted",
    tone: "neutral",
    body: "You met the bar but the cohort filled. You are first in line if a seat frees up, and you have priority on the next intake.",
  },
  rejected: {
    heading: "Not this cohort",
    tone: "bad",
    body: "We do not think this track is the right level for you yet, and taking your money anyway would be the wrong thing to do. The self-paced curriculum is the same material without the deadlines — build up there and apply again.",
  },
  withdrawn: {
    heading: "Application withdrawn",
    tone: "neutral",
    body: "You withdrew this application. You are welcome to apply again for a future cohort.",
  },
  deferred: {
    heading: "Moved to the next cohort",
    tone: "neutral",
    body: "Your application has been carried over to the next intake. Nothing is lost and you keep your place in the queue.",
  },
};

export default async function ApplicationStatusPage({ params }: PageProps) {
  if (!BOOTCAMP_ENABLED) notFound();

  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/bootcamp/application/${id}`)}`);

  const { data: student } = await supabase
    .from("students").select("id").eq("user_id", user.id).maybeSingle();
  if (!student) notFound();

  const admin = createAdminClient();
  const { data } = await admin
    .from("bootcamp_applications")
    .select("*, cohort:bootcamp_cohorts(name, starts_on, timezone, bootcamp:bootcamps(slug, title))")
    .eq("id", id)
    .maybeSingle();

  // Scoped to the owner explicitly: the admin client bypasses RLS, so this check
  // IS the authorisation. Without it, any signed-in user could read any
  // application by guessing a UUID.
  const app = data as (BootcampApplication & {
    cohort: { name: string; starts_on: string; timezone: string; bootcamp: { slug: string; title: string } };
  }) | null;
  if (!app || app.student_id !== (student as { id: string }).id) notFound();

  const copy = COPY[app.status];
  const tone =
    copy.tone === "good" ? "border-success bg-success-bg"
    : copy.tone === "bad" ? "border-error bg-error-bg"
    : "border-border bg-surface";

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
          {app.cohort.bootcamp.title} · {app.cohort.name}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{copy.heading}</h1>

        <div className={`mt-6 border rounded-[12px] p-6 shadow-sm ${tone}`}>
          <p className="text-sm leading-relaxed">{copy.body}</p>
        </div>

        <dl className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-5">
          <div>
            <dt className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Cohort starts</dt>
            <dd className="mt-1 font-semibold text-sm">{formatCohortDate(app.cohort.starts_on)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Your timezone</dt>
            <dd className="mt-1 font-semibold text-sm">{app.timezone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Hours a week</dt>
            <dd className="mt-1 font-semibold text-sm">{app.hours_committed ?? "—"}</dd>
          </div>
        </dl>

        {app.status === "rejected" && (
          <Link
            href="/"
            className="mt-8 inline-flex rounded-[8px] border border-border font-semibold text-sm px-5 py-2.5 hover:border-brand hover:text-brand transition"
          >
            See the self-paced track
          </Link>
        )}

        {app.status === "submitted" && (
          <p className="mt-8 text-sm text-ink-secondary">
            The assessment link will appear here and arrive by email. Nothing has been charged.
          </p>
        )}
      </div>
    </main>
  );
}
