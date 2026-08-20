// ═══════════════════════════════════════════════════════════════════════════════
// Placement assessment ↔ application (ST-03).
//
// DESIGN: the bootcamp side is SELF-HEALING and the assessment flow is untouched.
//
// /courses/[slug]/assess is shared with the self-paced product, works, and ends
// at its own report page. Teaching it about bootcamps would mean a `?next=`
// parameter threaded through a client component, a submit route and a report
// page — three files of shared, working code changed so one new feature can find
// its way home.
//
// Instead, the application status page asks a simpler question on every render:
// "is there a graded attempt for this course that I have not recorded yet?" If
// so, it records it. The student can take the assessment, wander off, and come
// back a week later; the link happens whenever they next look.
//
// Idempotent by construction — it only ever writes when the application has no
// attempt recorded and the attempt is graded, so re-rendering is free.
// ═══════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";

export interface LinkedAssessment {
  attemptId: string;
  /** 0–100. Written to bootcamp_applications.assessment_pct. */
  percentage: number;
  /** beginner | intermediate | advanced, as the grader determined it. */
  level: string | null;
  gradedAt: string | null;
}

/**
 * Find the student's most recent GRADED attempt for a course.
 *
 * Graded, not merely submitted: an attempt still being marked has no percentage,
 * and recording a null as though it were a score would show "0%" on an
 * admissions queue and get someone rejected for a race condition.
 */
export async function latestGradedAttempt(
  admin: SupabaseClient,
  studentId: string,
  courseId: string,
): Promise<LinkedAssessment | null> {
  const { data } = await admin
    .from("assessment_attempts")
    .select("id, percentage, level_determined, graded_at, status")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .not("percentage", "is", null)
    .order("graded_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const row = data as {
    id: string; percentage: number | null; level_determined: string | null; graded_at: string | null;
  };
  if (row.percentage === null) return null;

  return {
    attemptId: row.id,
    percentage: Number(row.percentage),
    level: row.level_determined,
    gradedAt: row.graded_at,
  };
}

/**
 * Record a graded attempt against an application, moving it to `assessed`.
 *
 * Returns the linked assessment when one is now recorded (whether it was already
 * there or has just been written), or null when the student has not taken it.
 *
 * Deliberately does NOT decide anything. It moves `submitted` → `assessed` and
 * stores the number; accept, waitlist and reject stay human calls made from the
 * desk, and every one of them writes bootcamp_audit_log. An automatic score
 * threshold would be a rejection nobody signed.
 */
export async function linkAssessmentToApplication(
  admin: SupabaseClient,
  application: {
    id: string;
    student_id: string;
    status: string;
    assessment_attempt_id: string | null;
    assessment_pct: number | null;
  },
  courseId: string,
): Promise<LinkedAssessment | null> {
  // Already recorded — nothing to do, and nothing to overwrite. A student who
  // retakes the assessment does not get their application silently re-scored.
  if (application.assessment_attempt_id) {
    return application.assessment_pct !== null
      ? {
          attemptId: application.assessment_attempt_id,
          percentage: Number(application.assessment_pct),
          level: null,
          gradedAt: null,
        }
      : null;
  }

  // Only ever promotes a fresh application. A decided one is left alone.
  if (application.status !== "submitted") return null;

  const attempt = await latestGradedAttempt(admin, application.student_id, courseId);
  if (!attempt) return null;

  await admin
    .from("bootcamp_applications")
    .update({
      assessment_attempt_id: attempt.attemptId,
      assessment_pct: attempt.percentage,
      status: "assessed",
    })
    .eq("id", application.id)
    .eq("status", "submitted"); // re-check in the write: two tabs must not both promote

  return attempt;
}
