import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { fetchRepoTree } from "@/lib/github/tree";
import {
  REVIEW_SLA_HOURS,
  hoursWaiting,
  slaState,
  byLongestWaiting,
  medianHours,
  diffAgainstStarter,
  type StarterDiff,
} from "@/lib/bootcamp";
import { GateDecisionForm } from "@/components/bootcamp/GateDecisionForm";

// ═══════════════════════════════════════════════════════════════════════════════
// S7 — the reviewer queue. Every gate submission waiting on a human.
//
// ORDERED BY TIME IN QUEUE, NOT BY ANYTHING ELSE. The 72h SLA is the promise
// that separates a paid cohort from a self-paced course with a Discord, so the
// thing a reviewer opens next has to be the thing that has been waiting longest.
// Sorting by cohort or by score would let one student quietly age out.
//
// FOUR ARTIFACTS PER ROW, in descending order of signal:
//
//   1. THE DIFF AGAINST THE STARTER. Every kit is a template repo, so the honest
//      question is "which of these files did this person actually write". Two
//      git tree listings answer it exactly — a blob SHA is a content hash, so an
//      identical SHA means an untouched file. A repo with nothing modified and
//      nothing added is a fork with a commit on it.
//   2. The objective / CI result — machine-checked against a withheld key.
//   3. The AI rubric score — a first pass, never a verdict.
//   4. The repo itself.
//
// Auth is session-based (getUser + isAdminEmail), matching /desk/bootcamp.
// Nothing about the caller comes from the query string.
//
// TODO(S7-github): squad gates should also show PRs authored and reviews given
// PER STUDENT, pulled from the GitHub API — that is what stops someone passing
// on a teammate's work (ST-30). It needs a GitHub App installation (repo-scoped
// token + per-author PR listing) that does not exist yet, so the queue shows the
// individual's own repo diff and nothing about squad attribution. The hook goes
// here, beside the diff, on the same row.
// ═══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

/** How many repo pairs we are willing to diff on one page render. Each pair is
 *  two GitHub calls; an unbounded queue would blow the rate limit and stall the
 *  page. Rows beyond this render without a diff rather than not at all. */
const MAX_DIFFS = 12;

interface QueueRow {
  resultId: string;
  enrolmentId: string;
  gateId: string;
  gateTitle: string;
  gateOrder: number;
  studentName: string;
  studentEmail: string;
  cohortName: string;
  submittedAt: string | null;
  attempts: number;
  rubricPct: number | null;
  objectivePassed: boolean | null;
  ciPassed: boolean | null;
  projectTitle: string | null;
  githubUrl: string | null;
  starterRepoUrl: string | null;
}

export default async function GateReviewQueuePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

  const admin = createAdminClient();
  const now = new Date();

  const { data: resultRows } = await admin
    .from("bootcamp_gate_results")
    .select("id, bootcamp_enrollment_id, gate_id, submission_id, attempts, rubric_pct, objective_passed, ci_passed, submitted_at")
    .eq("status", "submitted");

  const results = (resultRows ?? []) as {
    id: string; bootcamp_enrollment_id: string; gate_id: string;
    submission_id: string | null; attempts: number; rubric_pct: number | null;
    objective_passed: boolean | null; ci_passed: boolean | null;
    submitted_at: string | null;
  }[];

  const rows = results.length > 0 ? await hydrate(admin, results) : [];
  rows.sort(byLongestWaiting);

  // Median wait across what is IN the queue. Null on an empty queue — printing
  // "0h median" because nothing is waiting is a number the desk would act on.
  const median = medianHours(rows.map((r) => hoursWaiting(r.submittedAt, now)));
  const breached = rows.filter(
    (r) => slaState(hoursWaiting(r.submittedAt, now)) === "breached",
  ).length;

  // Diffs for the oldest rows only — the ones a reviewer will actually open.
  const diffs = await loadDiffs(rows.slice(0, MAX_DIFFS));

  return (
    <main className="min-h-screen bg-surface-soft text-ink">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10">
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
          Desk
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Gate review queue</h1>

        <nav className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link href="/desk/bootcamp" className="text-brand hover:underline">Admissions</Link>
          <Link href="/desk/bootcamp/roster" className="text-brand hover:underline">Roster</Link>
          <Link href="/desk/bootcamp/health" className="text-brand hover:underline">Cohort health</Link>
        </nav>

        {/* ── SLA ──────────────────────────────────────────────────────── */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Waiting" value={String(rows.length)} note="Submissions with no decision" />
          <Stat
            label="Median wait"
            value={median === null ? "—" : `${median.toFixed(1)}h`}
            note={`Against a ${REVIEW_SLA_HOURS}h promise`}
          />
          <Stat
            label="Past SLA"
            value={String(breached)}
            note={breached > 0 ? "Open these first" : "Nothing overdue"}
          />
        </section>

        {rows.length === 0 ? (
          <p className="mt-8 rounded-[12px] border border-border bg-surface p-5 text-sm text-ink-secondary shadow-sm">
            Nothing waiting. Submissions land here the moment a student sends one to a
            gate, already scored — the decision is still yours.
          </p>
        ) : (
          <div className="mt-8 space-y-4">
            {rows.map((row) => (
              <QueueCard
                key={row.resultId}
                row={row}
                now={now}
                diff={diffs.get(row.resultId) ?? null}
              />
            ))}
          </div>
        )}

        <p className="mt-12 text-xs text-ink-muted max-w-2xl leading-relaxed">
          No gate passes without a person. The scores above are an automated first pass;
          every decision made here writes an audit row with who made it and why, and the
          written reasons go straight into the student&rsquo;s feedback thread.
        </p>
      </div>
    </main>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function QueueCard({
  row,
  now,
  diff,
}: {
  row: QueueRow;
  now: Date;
  diff: StarterDiff | { error: string } | null;
}) {
  const waited = hoursWaiting(row.submittedAt, now);
  const sla = slaState(waited);
  const slaCls =
    sla === "breached"
      ? "bg-error-bg text-error"
      : sla === "due_soon"
        ? "bg-warning-bg text-[#8a6d0b]"
        : "bg-surface-alt text-ink-secondary";

  return (
    <article className="bg-surface border border-border rounded-[12px] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm">
            {row.studentName}{" "}
            <span className="font-normal text-ink-muted">{row.studentEmail}</span>
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Gate {row.gateOrder} · {row.gateTitle} · {row.cohortName} · attempt{" "}
            {row.attempts}
            {row.projectTitle && ` · ${row.projectTitle}`}
          </p>
        </div>
        <span className={`shrink-0 text-[11px] font-semibold rounded-full px-2.5 py-1 ${slaCls}`}>
          {waited.toFixed(0)}h in queue
        </span>
      </div>

      {/* ── Machine evidence ───────────────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill
          label="Rubric"
          value={row.rubricPct === null ? "—" : `${Math.round(Number(row.rubricPct))}%`}
          tone={row.rubricPct === null ? "neutral" : Number(row.rubricPct) >= 75 ? "good" : "bad"}
        />
        {row.objectivePassed !== null && (
          <Pill
            label="Answer key"
            value={row.objectivePassed ? "matched" : "no match"}
            tone={row.objectivePassed ? "good" : "bad"}
          />
        )}
        {row.ciPassed !== null && (
          <Pill
            label="CI"
            value={row.ciPassed ? "green" : "failing"}
            tone={row.ciPassed ? "good" : "bad"}
          />
        )}
        {row.githubUrl && (
          <a
            href={row.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[6px] bg-surface-alt px-2.5 py-1 text-[11px] font-semibold text-brand hover:underline"
          >
            Repository ↗
          </a>
        )}
      </div>

      {/* ── Diff against the starter ───────────────────────────────────── */}
      <div className="mt-4 rounded-[12px] border border-border bg-surface-soft p-4">
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
          Against the starter
        </p>
        {diff === null ? (
          <p className="mt-1.5 text-xs text-ink-muted">
            {row.starterRepoUrl
              ? "Not computed for this row — open the repo to compare by hand."
              : "This project has no starter repository to compare against."}
          </p>
        ) : "error" in diff ? (
          <p className="mt-1.5 text-xs text-ink-muted">Could not compare: {diff.error}</p>
        ) : (
          <>
            <p className="mt-1.5 text-sm text-ink-secondary">
              <span className="font-semibold text-ink">{diff.added.length}</span> files added ·{" "}
              <span className="font-semibold text-ink">{diff.modified.length}</span> starter files
              changed · <span className="font-semibold text-ink">{diff.untouched.length}</span> left
              untouched
              {diff.removed.length > 0 && ` · ${diff.removed.length} deleted`}
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {diff.touchedPct.toFixed(0)}% of the starter was touched
            </p>
            {diff.isUntouchedFork && (
              <p className="mt-2 rounded-[8px] bg-error-bg text-error text-xs font-semibold px-3 py-2">
                Nothing was changed and nothing was added. This is the starter template
                with a commit on it — worth opening before you score it.
              </p>
            )}
            {diff.added.length > 0 && (
              <p className="mt-2 text-xs text-ink-muted break-words">
                <span className="font-semibold">Their files:</span>{" "}
                {diff.added.slice(0, 12).join(", ")}
                {diff.added.length > 12 && ` … +${diff.added.length - 12} more`}
              </p>
            )}
          </>
        )}
      </div>

      <GateDecisionForm
        enrolmentId={row.enrolmentId}
        gateId={row.gateId}
        studentName={row.studentName}
      />
    </article>
  );
}

// ─── Loaders ─────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
async function hydrate(
  admin: ReturnType<typeof createAdminClient>,
  results: {
    id: string; bootcamp_enrollment_id: string; gate_id: string;
    submission_id: string | null; attempts: number; rubric_pct: number | null;
    objective_passed: boolean | null; ci_passed: boolean | null;
    submitted_at: string | null;
  }[],
): Promise<QueueRow[]> {
  const enrolmentIds = [...new Set(results.map((r) => r.bootcamp_enrollment_id))];
  const gateIds = [...new Set(results.map((r) => r.gate_id))];
  const submissionIds = results.map((r) => r.submission_id).filter(Boolean) as string[];

  const [{ data: enrolRows }, { data: gateRows }, { data: subRows }] = await Promise.all([
    admin
      .from("bootcamp_enrollments")
      // Named FK: bootcamp_enrollments references bootcamp_cohorts twice
      // (cohort_id and deferred_to_cohort_id), and the bare embed is rejected
      // with PGRST201 — which here emptied the whole reviewer queue.
      .select(
        "id, student_id, student:students(name, email), cohort:bootcamp_cohorts!bootcamp_enrollments_cohort_id_fkey(name)",
      )
      .in("id", enrolmentIds),
    // `requires` is NOT selected. The desk does not need the thresholds to make
    // a judgement, and the fewer places that touch the answer key the better.
    admin.from("bootcamp_gates").select("id, order_index, title").in("id", gateIds),
    submissionIds.length
      ? admin
          .from("project_submissions")
          .select("id, github_url, project_id")
          .in("id", submissionIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const submissions = (subRows ?? []) as { id: string; github_url: string; project_id: string }[];
  const projectIds = [...new Set(submissions.map((s) => s.project_id))];
  const { data: projectRows } = projectIds.length
    ? await admin.from("projects").select("id, title, starter_repo_url").in("id", projectIds)
    : { data: [] as any[] };

  const enrolments = new Map(
    ((enrolRows ?? []) as unknown as {
      id: string;
      student: { name: string | null; email: string } | null;
      cohort: { name: string } | null;
    }[]).map((e) => [e.id, e]),
  );
  const gates = new Map(
    ((gateRows ?? []) as { id: string; order_index: number; title: string }[]).map((g) => [g.id, g]),
  );
  const subs = new Map(submissions.map((s) => [s.id, s]));
  const projects = new Map(
    ((projectRows ?? []) as {
      id: string; title: string; starter_repo_url: string | null;
    }[]).map((p) => [p.id, p]),
  );

  return results.map((r) => {
    const enrol = enrolments.get(r.bootcamp_enrollment_id) ?? null;
    const gate = gates.get(r.gate_id) ?? null;
    const sub = r.submission_id ? subs.get(r.submission_id) ?? null : null;
    const project = sub ? projects.get(sub.project_id) ?? null : null;

    return {
      resultId: r.id,
      enrolmentId: r.bootcamp_enrollment_id,
      gateId: r.gate_id,
      gateTitle: gate?.title ?? "Unknown gate",
      gateOrder: gate?.order_index ?? 0,
      studentName: enrol?.student?.name ?? "—",
      studentEmail: enrol?.student?.email ?? "",
      cohortName: enrol?.cohort?.name ?? "—",
      submittedAt: r.submitted_at,
      attempts: r.attempts,
      rubricPct: r.rubric_pct,
      objectivePassed: r.objective_passed,
      ciPassed: r.ci_passed,
      projectTitle: project?.title ?? null,
      githubUrl: sub?.github_url ?? null,
      starterRepoUrl: project?.starter_repo_url ?? null,
    };
  });
}

/**
 * One starter diff per row, from two git tree listings each.
 *
 * Starter trees are fetched ONCE per distinct template and reused across every
 * student on that project — a cohort of 50 submitting the same kit costs one
 * starter fetch, not fifty.
 */
async function loadDiffs(
  rows: QueueRow[],
): Promise<Map<string, StarterDiff | { error: string }>> {
  const out = new Map<string, StarterDiff | { error: string }>();
  const starterCache = new Map<string, Awaited<ReturnType<typeof fetchRepoTree>>>();

  for (const row of rows) {
    if (!row.githubUrl || !row.starterRepoUrl) continue;

    let starter = starterCache.get(row.starterRepoUrl);
    if (!starter) {
      starter = await fetchRepoTree(row.starterRepoUrl);
      starterCache.set(row.starterRepoUrl, starter);
    }
    if (starter.error) {
      out.set(row.resultId, { error: `starter repo — ${starter.error}` });
      continue;
    }

    const submitted = await fetchRepoTree(row.githubUrl);
    if (submitted.error) {
      out.set(row.resultId, { error: submitted.error });
      continue;
    }

    out.set(row.resultId, diffAgainstStarter(starter.entries, submitted.entries));
  }

  return out;
}

// ─── Bits ────────────────────────────────────────────────────────────────────

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[12px] border border-border bg-surface p-4 shadow-sm">
      <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">{label}</p>
      <p className="mt-1.5 text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-ink-muted">{note}</p>
    </div>
  );
}

function Pill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "neutral";
}) {
  const cls =
    tone === "good"
      ? "bg-success-bg text-success"
      : tone === "bad"
        ? "bg-error-bg text-error"
        : "bg-surface-alt text-ink-muted";
  return (
    <span className={`rounded-[6px] px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
      {label}: {value}
    </span>
  );
}
