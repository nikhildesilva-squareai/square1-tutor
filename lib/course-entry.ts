/**
 * Where a course actually starts.
 *
 * Three kinds of module can sit at the top of a course, and only one of them is
 * ever the right place to drop a student:
 *
 *   order_index -1  AI Foundations — the free basics block copied into 23
 *                   courses. ALWAYS optional. Never an entry point.
 *   order_index  0  the course's own tailored readiness Module 0 ("are you
 *                   ready for this course"). The default entry point.
 *   order_index  1  Week 1 — the course proper.
 *
 * Because Foundations sorts at -1 it silently becomes `modules[0]`, so any code
 * that reaches for "the first module" gets the optional block instead of the
 * course. That is the bug this module exists to make un-writable: go through
 * `pickEntryModule` rather than indexing a sorted list.
 */

/**
 * Courses that skip their readiness Module 0 and open on Week 1.
 *
 * Software Engineering with AI states its own prerequisites inside Module 0 and
 * is pitched at people who already code, so sending them to a readiness check
 * first is friction. Every other course keeps Module 0 as the on-ramp.
 *
 * Add a slug here to move that course's entry point to Week 1.
 */
export const STARTS_AT_WEEK_1: ReadonlySet<string> = new Set(["coding-with-ai"]);

/**
 * Pick the module a student should land in, given the course slug and its
 * modules. Optional on-ramps at a negative order_index are excluded outright.
 *
 * Returns undefined only if the course has no non-optional module at all, which
 * no live course does — callers should still fall back rather than assume.
 */
export function pickEntryModule<T extends { order_index: number }>(
  slug: string,
  modules: readonly T[] | null | undefined,
): T | undefined {
  const ordered = (modules ?? [])
    .filter((m) => m.order_index >= 0)
    .slice()
    .sort((a, b) => a.order_index - b.order_index);

  if (ordered.length === 0) return undefined;

  if (STARTS_AT_WEEK_1.has(slug)) {
    return ordered.find((m) => m.order_index === 1) ?? ordered[0];
  }
  return ordered[0];
}
