// ═══════════════════════════════════════════════════════════════════════════════
// Shared prompt-injection primitives for every AI grader (assessment answers,
// project repos). Student-supplied text is DATA, never instruction — but an LLM
// judge has no structural way to tell the two apart, so we impose one:
//
//   Layer 1 (delimiting)   — wrap untrusted text in per-request markers.
//   Layer 2 (sanitisation) — strip any marker text from the content first, so a
//                            submission can't forge the closing delimiter and
//                            "escape" into instruction space.
//
// The token is generated per request and the student never sees it, so it can't
// be guessed and reproduced inside a submission.
//
// Layer 3 (deterministic detection) lives in assessment.ts (detectManipulation)
// and Layer 4 (never trusting the returned numbers) lives in each grader's
// clamp step. Delimiting alone is not a control — the clamp is.
// ═══════════════════════════════════════════════════════════════════════════════

export const SUBMISSION_MARK = "UNTRUSTED_STUDENT_SUBMISSION";

/** A per-request delimiter token the student can't predict (they never see the
 * request), so they cannot forge the closing marker. */
export function submissionToken(): string {
  return (Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)).toUpperCase();
}

/** Strip any marker text (anti-forgery), then wrap in unforgeable per-request
 * markers so the grader treats the content strictly as untrusted data. */
export function wrapUntrusted(content: string, token: string, emptyLabel = "(nothing provided)"): string {
  const clean = (content ?? "").replace(new RegExp(SUBMISSION_MARK, "gi"), "[removed]");
  return `«BEGIN ${SUBMISSION_MARK} ${token}»\n${clean.trim() || emptyLabel}\n«END ${SUBMISSION_MARK} ${token}»`;
}
