// ═══════════════════════════════════════════════════════════════════════════════
// "Passing unlocks the next modules" — the enforcement half.
//
// A gate that does not actually stop anyone is a progress bar. The bootcamp is
// sold as strictly gated, and this is the check that makes that true: a lesson
// in a module named by an uncleared gate is not reachable, full stop.
//
// DERIVED, NEVER STORED. There is no entitlement table and no unlock row. Access
// is computed from bootcamp_gates.unlocks_module_ids and the student's own gate
// outcomes, which means the reviewer's sign-off IS the unlock — there is nothing
// to fall out of sync with the decision, and nothing a student could write to
// grant themselves access. Same reasoning as bootcamp_gate_results being
// service-role only.
//
// COSTS NOTHING FOR EVERYBODY ELSE. /learn/[lessonId] is the hottest page in the
// product and the overwhelming majority of its traffic is self-paced students
// with no bootcamp enrolment at all. The flag check short-circuits before any
// query, and the first query is a single indexed lookup that returns zero rows
// for them.
// ═══════════════════════════════════════════════════════════════════════════════

import { createAdminClient } from "@/lib/supabase/admin";
import { BOOTCAMP_ENABLED } from "@/lib/flags";
import { deriveGateStatuses, gateLockingModule } from "@/lib/bootcamp";

export interface ModuleLock {
  gateId: string;
  gateTitle: string;
}

/**
 * Is this module shut behind a gate this student has not cleared?
 *
 * Returns the gate to send them to, or null when the module is open — which is
 * the answer for every self-paced student, for every bootcamp student whose
 * gates name no modules, and for any module no gate claims.
 *
 * Never throws: a missing service-role key or a transient DB error must not make
 * a lesson unreachable. Failing OPEN is the right direction here — the integrity
 * risk this guards is a student reading ahead, not a student forging a
 * credential, and the credential itself is protected by the grants in
 * migration 021 regardless of what this function returns.
 */
export async function moduleLockedForStudent(
  studentId: string,
  courseId: string,
  moduleId: string,
): Promise<ModuleLock | null> {
  if (!BOOTCAMP_ENABLED) return null;

  try {
    const admin = createAdminClient();

    // Bootcamps run ON a course. If this course is not a bootcamp track, or the
    // student is not live in a cohort of it, there is nothing to gate.
    const { data: bootcampRow } = await admin
      .from("bootcamps")
      .select("id")
      .eq("course_id", courseId)
      .maybeSingle();
    if (!bootcampRow) return null;
    const bootcampId = (bootcampRow as { id: string }).id;

    const { data: enrolRows } = await admin
      .from("bootcamp_enrollments")
      .select("id, cohort:bootcamp_cohorts(bootcamp_id)")
      .eq("student_id", studentId)
      .in("status", ["active", "suspended"]);

    const enrolment = ((enrolRows ?? []) as unknown as {
      id: string; cohort: { bootcamp_id: string } | null;
    }[]).find((e) => e.cohort?.bootcamp_id === bootcampId);
    if (!enrolment) return null;

    const [{ data: gateRows }, { data: resultRows }] = await Promise.all([
      admin
        .from("bootcamp_gates")
        .select("id, title, order_index, unlocks_module_ids")
        .eq("bootcamp_id", bootcampId)
        .order("order_index", { ascending: true }),
      admin
        .from("bootcamp_gate_results")
        .select("gate_id, status")
        .eq("bootcamp_enrollment_id", enrolment.id),
    ]);

    const gates = (gateRows ?? []) as {
      id: string; title: string; unlocks_module_ids: string[] | null;
    }[];
    if (gates.length === 0) return null;

    // deriveGateStatuses, not the raw status column: a gate with no result row
    // is 'open' or 'locked' depending on what came before it, and only that
    // function knows the strictly-linear rule.
    const statuses = deriveGateStatuses(
      gates.map((g) => g.id),
      Object.fromEntries(
        ((resultRows ?? []) as { gate_id: string; status: string }[]).map((r) => [
          r.gate_id,
          r.status as "passed",
        ]),
      ),
    );

    const locking = gateLockingModule(
      gates.map((g) => ({
        id: g.id,
        title: g.title,
        cleared: statuses[g.id] === "passed" || statuses[g.id] === "waived",
        moduleIds: g.unlocks_module_ids ?? [],
      })),
      moduleId,
    );

    return locking ? { gateId: locking.id, gateTitle: locking.title } : null;
  } catch {
    return null;
  }
}
