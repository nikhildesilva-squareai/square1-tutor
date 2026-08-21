import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { fmtDate, countdownLabel } from "@/lib/schedule";
import { MAX_ATTEMPTS } from "@/lib/bootcamp";
import { RichContent } from "@/components/ui/rich-content";
import { SubmissionForm } from "@/app/(app)/projects/[projectId]/SubmissionForm";
import { GateFeedbackThread } from "@/components/bootcamp/GateFeedbackThread";
import { loadEnrolmentContext, loadGateDetail } from "../../_lib/cockpit";

// ═══════════════════════════════════════════════════════════════════════════════
// S7 — one gate, from the student's side.
//
// The gate is the thing they are paying for, so this page has to answer four
// questions without them having to ask anyone:
//
//   • What am I being asked to build, and marked against?  (brief + rubric)
//   • Where do I stand?                                    (checks + status)
//   • How many goes do I have left, and until when?        (attempts + window)
//   • I failed — now what?                                 (reasons + remediation)
//
// The fourth is the one that matters. A fail that returns a number and nothing
// else is the failure mode of every automated grader; here the reviewer's
// written reasons and a named next step for every unmet requirement are the
// point of the screen.
//
// WHAT THIS PAGE NEVER SHOWS: the thresholds. `bootcamp_gates.requires` is a
// withheld answer key with no grant to `authenticated` (migration 021), and the
// loader turns it into met/unmet on the server. A student who can read "needs
// 70% attendance" knows exactly how much class they can skip.
//
// ROUTE NOTE: three segments deep, so it collides with nothing. The PRD's
// `/(app)/bootcamp` is impossible — a route group is not a URL segment and it
// would resolve to the same /bootcamp as the public marketing page.
// ═══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ gateId: string }>;
}

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  passed:    { label: "Passed",              cls: "bg-success-bg text-success" },
  waived:    { label: "Waived",              cls: "bg-success-bg text-success" },
  submitted: { label: "With your reviewer",  cls: "bg-surface-tint text-brand" },
  failed:    { label: "Needs another attempt", cls: "bg-error-bg text-error" },
  open:      { label: "Open now",            cls: "bg-brand text-white" },
  locked:    { label: "Locked",              cls: "bg-surface-alt text-ink-muted" },
};

export default async function GatePage({ params }: PageProps) {
  const { gateId } = await params;

  const ctx = await loadEnrolmentContext();
  // Someone mid-application has no enrolment; that is normal, not an error.
  if (!ctx) redirect("/bootcamp");

  const now = new Date();
  const gate = await loadGateDetail(ctx, gateId, now);
  // A gate id from another bootcamp lands here too. Same 404 either way — the
  // response must not tell an attacker that the id exists somewhere else.
  if (!gate) notFound();

  const chip = STATUS_CHIP[gate.status] ?? STATUS_CHIP.locked;
  const cleared = gate.status === "passed" || gate.status === "waived";
  const suspended = ctx.enrolment.status !== "active";

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 max-w-3xl mx-auto text-ink">
      <Link href="/bootcamp/home" className="text-sm text-brand hover:underline">
        ← Cohort home
      </Link>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
            Gate {gate.orderIndex} · Week {gate.week}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">{gate.title}</h1>
          <p className="text-sm text-ink-secondary mt-1">
            {cleared
              ? `Cleared ${gate.decidedAt ? fmtDate(gate.decidedAt) : ""}`
              : `Due ${fmtDate(gate.dueAt)} · ${countdownLabel(gate.dueAt, now)}`}
          </p>
        </div>
        <span className={`rounded-[8px] px-3 py-1.5 text-sm font-semibold ${chip.cls}`}>
          {chip.label}
        </span>
      </div>

      {/* ── The decision, when there is one ──────────────────────────────── */}
      {gate.reviewerNotesMd && (
        <section
          className={`mt-6 rounded-[12px] border border-border p-5 shadow-sm ${
            cleared ? "bg-success-bg" : "bg-error-bg"
          }`}
        >
          <p className={`text-[11px] font-semibold uppercase tracking-widest ${
            cleared ? "text-success" : "text-error"
          }`}>
            {cleared ? "Reviewer sign-off" : "Why this did not pass"}
          </p>
          <p className="mt-2 text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap">
            {gate.reviewerNotesMd}
          </p>
          {gate.decidedAt && (
            <p className="mt-3 text-xs text-ink-muted">
              Decided {fmtDate(gate.decidedAt)} by a human reviewer. Automated scores
              inform that decision; they never make it.
            </p>
          )}
        </section>
      )}

      {/* ── Brief ────────────────────────────────────────────────────────── */}
      <section className="mt-6 rounded-[12px] border border-border bg-surface p-5 shadow-sm">
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
          The brief
        </p>
        <div className="mt-2 text-sm text-ink-secondary leading-relaxed">
          <RichContent content={gate.summaryMd} />
        </div>
        {gate.unlocksModules > 0 && !cleared && (
          <p className="mt-3 text-xs text-ink-muted">
            Clearing this gate opens {gate.unlocksModules}{" "}
            {gate.unlocksModules === 1 ? "module" : "modules"} of the programme.
          </p>
        )}
      </section>

      {/* ── Attempts ─────────────────────────────────────────────────────── */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Attempts used"
          value={`${gate.attempts} of ${MAX_ATTEMPTS}`}
          note={
            gate.attemptsRemaining > 0
              ? `${gate.attemptsRemaining} left`
              : "No attempts left"
          }
        />
        <Stat
          label="Resubmission window"
          value={gate.resubmitDeadline ? countdownLabel(gate.resubmitDeadline, now) : "—"}
          note={
            gate.resubmitDeadline
              ? `Closes ${fmtDate(gate.resubmitDeadline)}`
              : "Starts when a decision lands"
          }
        />
        <Stat
          label="Review score"
          value={gate.rubricPct === null ? "—" : `${Math.round(gate.rubricPct)}%`}
          note={
            gate.rubricPct === null
              ? "Nothing submitted yet"
              : "Automated first pass, not a decision"
          }
        />
      </section>

      {/* ── Where you stand ──────────────────────────────────────────────── */}
      <section className="mt-6 rounded-[12px] border border-border bg-surface p-5 shadow-sm">
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
          What this gate requires of you
        </p>
        {gate.checks.length === 0 ? (
          <p className="mt-2 text-sm text-ink-secondary">
            This gate has no automated requirements — it is signed off entirely by a
            human on the work you submit.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {gate.checks.map((c) => (
              <li key={c.key} className="flex items-start gap-2.5 text-sm">
                <span
                  aria-hidden
                  className={`mt-0.5 h-4 w-4 shrink-0 rounded-full grid place-items-center text-[10px] font-bold ${
                    c.met ? "bg-success-bg text-success" : "bg-surface-alt text-ink-muted"
                  }`}
                >
                  {c.met ? "✓" : "·"}
                </span>
                <span className={c.met ? "text-ink-secondary" : "text-ink"}>{c.label}</span>
              </li>
            ))}
          </ul>
        )}

        {gate.unmeasurable.length > 0 && (
          <p className="mt-4 text-xs text-ink-muted leading-relaxed border-t border-border pt-3">
            Some requirements on this gate are not yet measured automatically
            {gate.unmeasurable.includes("peer_reviews") && " (peer reviews)"}
            {gate.unmeasurable.includes("authored_prs") && " (pull requests you authored)"}
            . They will read as outstanding above until that is wired up — your reviewer
            accounts for them by hand and it will not cost you the gate.
          </p>
        )}
      </section>

      {/* ── Remediation: the answer to "now what" ────────────────────────── */}
      {!cleared && gate.remediation.length > 0 && (
        <section className="mt-6 rounded-[12px] border border-border bg-surface p-5 shadow-sm">
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
            What to do next
          </p>
          <ol className="mt-3 space-y-3">
            {gate.remediation.map((step, i) => (
              <li key={step.key} className="flex gap-3">
                <span className="mt-0.5 h-5 w-5 shrink-0 rounded-[6px] bg-surface-tint text-brand grid place-items-center text-[11px] font-bold">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-sm text-ink-secondary leading-relaxed mt-0.5">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ── Rubric + submit ──────────────────────────────────────────────── */}
      {gate.projects.map((project) => (
        <section
          key={project.id}
          className="mt-6 rounded-[12px] border border-border bg-surface p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
              Gate project
            </p>
            <Link
              href={`/projects/${project.id}`}
              className="text-xs font-medium text-brand hover:underline"
            >
              Full brief →
            </Link>
          </div>
          <p className="mt-1 font-semibold">{project.title}</p>
          {project.scorePct !== null && (
            <p className="mt-1 text-xs text-ink-muted">
              Your last submission scored {Math.round(project.scorePct)}%
            </p>
          )}

          {project.rubric.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
                Marked against
              </p>
              <ul className="mt-2 space-y-1.5">
                {project.rubric.map((r, i) => (
                  <li key={`${r.criterion}-${i}`} className="text-sm text-ink-secondary">
                    <span className="font-medium text-ink">{r.criterion}</span>
                    {typeof r.weight === "number" && (
                      <span className="text-ink-muted"> · {r.weight}%</span>
                    )}
                    {r.description && <span className="block text-xs mt-0.5">{r.description}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {project.starterRepoUrl && (
            <a
              href={project.starterRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
            >
              Starter repository ↗
            </a>
          )}

          <div className="mt-5 pt-4 border-t border-border">
            {suspended ? (
              <p className="text-sm text-error">
                Gate submissions are paused while your enrolment is on hold. Settle the
                payment from{" "}
                <Link href="/settings" className="underline font-medium">billing settings</Link>{" "}
                and this opens again — your completed work is untouched.
              </p>
            ) : gate.canSubmitNow ? (
              <>
                <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">
                  Submit for gate {gate.orderIndex}
                </p>
                {/* The same form the self-paced side uses. `gateId` is what makes
                    this submission bind to the gate: the bootcamp bar applies,
                    the attempt budget is enforced server-side, and the review
                    opens the thread below. */}
                <SubmissionForm
                  projectId={project.id}
                  submitFormat={project.submitFormat}
                  ciMode={project.ciMode}
                  gateId={gate.id}
                />
                <p className="mt-3 text-xs text-ink-muted leading-relaxed">
                  This counts as one of your two attempts. It is scored automatically the
                  moment you submit, and then read by a person — the automated score is
                  never the decision.
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-secondary">{gate.blockedReason}</p>
            )}
          </div>
        </section>
      ))}

      {gate.projects.length === 0 && (
        <section className="mt-6 rounded-[12px] border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm text-ink-secondary">
            This gate is not anchored to a project you submit here. Your reviewer signs it
            off from your attendance, your reviews and your 1-1s.
          </p>
        </section>
      )}

      {/* ── Thread ───────────────────────────────────────────────────────── */}
      <GateFeedbackThread
        submissionId={gate.submissionId}
        canReply={!suspended}
        messages={gate.thread.map((m) => ({
          id: m.id,
          authorKind: m.authorKind,
          bodyMd: m.bodyMd,
          createdAt: m.createdAt.toISOString(),
        }))}
      />

      <p className="mt-8 text-xs text-ink-muted leading-relaxed">
        No gate passes on an automated score. Every decision on this page is made by a
        person, is recorded with who made it, and comes with reasons you can read.{" "}
        <Link href="/bootcamp/contract" className="text-brand hover:underline">
          What graduating requires
        </Link>
      </p>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[12px] border border-border bg-surface p-4 shadow-sm">
      <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
        {label}
      </p>
      <p className="mt-1.5 text-lg font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-ink-muted">{note}</p>
    </div>
  );
}
