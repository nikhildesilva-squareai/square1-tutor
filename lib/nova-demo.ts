/**
 * Scripted Nova tutor thread for the Teams page demo.
 *
 * This is an ILLUSTRATION, not a live model call, and the UI says so. A public
 * marketing page cannot call the grading model on every visitor click: it is a
 * metered dependency with no rate limit in front of it there, and an open text
 * box on an unauthenticated page is an obvious abuse surface. So the exchange is
 * fixed and the interaction is real — the visitor chooses which question to ask
 * and watches the answer arrive.
 *
 * The answers are written to match what Nova actually does (points at the
 * specific line, explains the why, never just hands over a fix). If you want
 * these replaced with captured real output, follow the pattern in
 * scripts/capture-nova-fixtures.ts, which is how the landing ProductTour gets
 * its genuinely-captured grading feedback, and swap this file for the fixture.
 */

export interface NovaTurn {
  /** The question chip the visitor clicks. */
  q: string;
  /** Nova's reply. Rendered with a typing effect, `code` spans in monospace. */
  a: string;
  /** Substrings of `a` to render as inline code. */
  code?: string[];
}

export const NOVA_TUTOR_THREAD: NovaTurn[] = [
  {
    q: "Why does my API call fail intermittently?",
    a: "Two things are missing, and the second is the one biting you. There's no timeout, so a slow response hangs until the platform kills it — that's the intermittent part. And you never check the status, so a 500 gets parsed as if it were data. Add timeout=5 and call raise_for_status() before you read the body.",
    code: ["timeout=5", "raise_for_status()"],
  },
  {
    q: "My tests pass but production breaks. Why?",
    a: "Almost always because the fixture is smaller than reality. A 50-row fixture won't show a query running once per row — that's fine at 50 and forty thousand round trips at 40,000. Ask what happens at 1,000x the test data, then write the test at that size.",
  },
  {
    q: "Is this code good enough to ship?",
    a: "It reads well, but reading well isn't the bar. Two questions decide it: what happens at 1,000x this input, and what happens if the input is hostile? Right now an unbounded read answers the first badly. Fix that and I'd ship it.",
  },
];
