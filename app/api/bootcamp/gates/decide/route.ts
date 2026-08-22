import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { loadGateSpine, postThreadMessage } from "@/lib/bootcamp-gate-service";

// POST /api/bootcamp/gates/decide
//
// THE HUMAN SIGN-OFF. The one place in the product where a gate can pass.
//
// Three rules, in the order they matter:
//
//   1. NO GATE PASSES WITHOUT A HUMAN. The AI scores; a person decides. Nothing
//      in the submission path can write 'passed' — see lib/bootcamp/gates.ts,
//      whose evaluateGate returns `autoEligible` ("a human MAY now sign off")
//      and deliberately has no concept of passing.
//   2. A FAIL NEEDS WRITTEN REASONS, and they go straight into the student's
//      feedback thread. A number with no explanation is the failure mode of
//      every automated grader; on a paid programme it is also the thing the
//      student is owed. Refused at the API, not just discouraged in the UI.
//   3. EVERY DECISION IS AUDITED. Overrides are allowed; silent ones are not.
//
// Auth is session-based (getUser + isAdminEmail), matching /desk/bootcamp and
// /desk/newsroom. Nothing about the caller is read from the request body.
//
// PASSING UNLOCKS THE NEXT MODULES, and it does so WITHOUT a second write:
// module access is derived from gate outcomes (gateLockingModule in
// lib/bootcamp/review.ts), so the row this handler writes IS the unlock. There
// is no entitlement table to fall out of sync with the decision.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  enrolmentId: z.string().regex(UUID),
  gateId: z.string().regex(UUID),
  decision: z.enum(["passed", "failed", "waived"]),
  /** Written reasons. Mandatory on a fail or a waive. */
  notes: z.string().max(20000).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { enrolmentId, gateId, decision, notes } = parsed.data;
    const reasons = notes?.trim() ?? "";

    if (decision === "failed" && !reasons) {
      return NextResponse.json(
        {
          error:
            "A fail needs written reasons — the student sees them, and a score with no explanation is not feedback.",
        },
        { status: 400 },
      );
    }
    if (decision === "waived" && !reasons) {
      return NextResponse.json(
        { error: "A waiver needs a reason. It goes in the permanent record." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    const { data: enrolRow } = await admin
      .from("bootcamp_enrollments")
      // Named FK: bootcamp_enrollments references bootcamp_cohorts twice
      // (cohort_id and deferred_to_cohort_id), and the bare embed is rejected
      // with PGRST201 rather than resolved.
      .select("id, student_id, cohort:bootcamp_cohorts!bootcamp_enrollments_cohort_id_fkey(bootcamp_id)")
      .eq("id", enrolmentId)
      .maybeSingle();
    if (!enrolRow) {
      return NextResponse.json({ error: "Enrolment not found" }, { status: 404 });
    }
    const bootcampId = (enrolRow as unknown as {
      cohort: { bootcamp_id: string } | null;
    }).cohort?.bootcamp_id;
    if (!bootcampId) {
      return NextResponse.json({ error: "Enrolment has no bootcamp" }, { status: 409 });
    }

    const spine = await loadGateSpine(admin, bootcampId, enrolmentId);
    const gate = spine.gates.find((g) => g.id === gateId);
    if (!gate) return NextResponse.json({ error: "Gate not found" }, { status: 404 });

    const existing = spine.results.get(gateId) ?? null;
    // Deciding a gate nobody has submitted to is a waiver, not a pass: there is
    // no work to have reviewed. Refuse the pass rather than mint a credential
    // against an empty row.
    if (!existing && decision === "passed") {
      return NextResponse.json(
        { error: "Nothing has been submitted to this gate yet. Waive it if that is what you mean." },
        { status: 409 },
      );
    }

    const nowIso = new Date().toISOString();
    const payload = {
      bootcamp_enrollment_id: enrolmentId,
      gate_id: gateId,
      status: decision,
      // Both required together: the DB CHECK bootcamp_gate_results_decision_attributed
      // refuses a decided row that does not name who decided it. There is no
      // `reviewed_at` column — `decided_at` is the one timestamp.
      decided_at: nowIso,
      reviewer_id: user.id,
      reviewer_notes_md: reasons || null,
    };

    const { error: writeErr } = existing
      ? await admin
          .from("bootcamp_gate_results")
          .update(payload)
          .eq("bootcamp_enrollment_id", enrolmentId)
          .eq("gate_id", gateId)
      : await admin
          .from("bootcamp_gate_results")
          .insert({ ...payload, attempts: 0, opened_at: nowIso });

    if (writeErr) {
      console.error("[bootcamp/gates/decide]", writeErr);
      return NextResponse.json({ error: "Could not save the decision." }, { status: 500 });
    }

    // The reasons go where the student will actually read them: their thread,
    // beneath the AI review they are responding to. Only possible when there is
    // a submission to hang the thread off.
    const submissionId = existing?.submission_id ?? null;
    if (submissionId && reasons) {
      await postThreadMessage(admin, {
        submissionId,
        authorKind: "instructor",
        authorId: null,
        bodyMd: renderDecisionMessage(gate.title, decision, reasons),
      });
    }

    // Written AFTER the update: an audit row for a decision that failed to save
    // would be worse than no row at all.
    await admin.from("bootcamp_audit_log").insert({
      actor_id: user.id,
      actor_email: user.email,
      action: `gate.${decision}`,
      subject_table: "bootcamp_gate_results",
      subject_id: existing?.id ?? enrolmentId,
      reason: reasons || null,
      before_state: existing
        ? { status: existing.status, attempts: existing.attempts, rubric_pct: existing.rubric_pct }
        : { status: null },
      after_state: { status: decision, decided_at: nowIso, reviewer_id: user.id },
    });

    return NextResponse.json({
      ok: true,
      status: decision,
      decidedAt: nowIso,
      // Derived, not written: clearing this gate opens the modules it names.
      unlockedModules: decision === "passed" || decision === "waived"
        ? gate.unlocks_module_ids.length
        : 0,
    });
  } catch (err) {
    console.error("[bootcamp/gates/decide]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** The decision as the student reads it, in their own thread. */
function renderDecisionMessage(
  gateTitle: string,
  decision: "passed" | "failed" | "waived",
  reasons: string,
): string {
  const head =
    decision === "passed"
      ? `**Gate signed off — ${gateTitle}**`
      : decision === "waived"
        ? `**Gate waived — ${gateTitle}**`
        : `**Not through yet — ${gateTitle}**`;

  const tail =
    decision === "failed"
      ? "\n\n_You have a resubmission within the 7-day window. Work the points above, push, and submit again from your gate page._"
      : "";

  return `${head}\n\n${reasons}${tail}`;
}
