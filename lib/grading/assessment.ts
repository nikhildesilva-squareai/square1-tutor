// ═══════════════════════════════════════════════════════════════════════════════
// Assessment grading core — the EXACT prompts, parsing, clamping and fallback
// used by /api/grade/[attemptId], extracted so the calibration harness
// (scripts/calibrate-grading.ts) exercises the identical code path. The LLM
// call itself is injected: the route passes budget-checked callAI, the harness
// passes lib/ai/providers.generate directly.
//
// Behaviour contract (do not change one without the other):
//  - One batched call grades ALL short answers, one grades ALL code.
//  - Marks are clamped to 0..max per question.
//  - A whole batch with no parseable JSON array throws GradeBatchError
//    (callers must not persist anything in that case).
//  - A single missing question inside a successful batch gets the disclosed
//    partial-credit fallback.
// ═══════════════════════════════════════════════════════════════════════════════

export interface GradableQuestion {
  id: string;
  number: number;
  type: "mcq" | "short_answer" | "code";
  stem_md: string;
  correct_answer: string | null;
  mark_scheme_md: string | null;
  marks: number;
  language: string | null;
}

export interface Grade {
  marks: number;
  feedback: string;
  breakdown: Array<{ criterion: string; awarded: number; reasoning: string }> | null;
  topicUnderstanding: string | null;
  improvedCode: string | null;
}

/** The injected LLM executor: system + user message in, raw text out. */
export type LlmExec = (params: {
  system: string;
  userContent: string;
  max_tokens: number;
}) => Promise<{ text: string }>;

/** A whole grading batch failed or came back unparseable — retryable, and the
 * caller must NOT persist anything (fallback scores would bake into the skill
 * report, learning plan and cohort percentiles permanently). */
export class GradeBatchError extends Error {}

/** Backstop input cap: no single answer may balloon a grading batch, even if a
 * legacy row predates the 15k-char submission validation. */
const MAX_ANSWER_CHARS = 15_000;
function clampAnswer(answer: string): string {
  if (answer.length <= MAX_ANSWER_CHARS) return answer;
  return `${answer.slice(0, MAX_ANSWER_CHARS)}\n[... answer truncated at ${MAX_ANSWER_CHARS.toLocaleString()} characters ...]`;
}

/** Pull the first JSON array out of an LLM response. */
export function extractJsonArray(text: string): unknown[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Heuristic fallback when the AI grade for a question is missing/unparseable. */
export function fallbackGrade(q: GradableQuestion, answer: string, isCode: boolean): Grade {
  const hasContent = isCode ? answer.trim().length > 20 : answer.trim().split(/\s+/).length > 10;
  return {
    marks: hasContent ? Math.floor(q.marks * 0.5) : 0,
    feedback: "Could not automatically grade this answer — partial credit awarded where a response was provided.",
    breakdown: null,
    topicUnderstanding: "partial",
    improvedCode: null,
  };
}

/** Build the user message that batch-grades all short-answer questions. */
export function buildShortAnswerPrompt(
  questions: GradableQuestion[],
  answerFor: (q: GradableQuestion) => string,
  subject: string,
): string {
  const block = questions.map((q) => {
    const ans = clampAnswer(answerFor(q));
    return `[#${q.number}] (${q.marks} marks)
Question: ${q.stem_md}
${q.mark_scheme_md ? `Mark scheme: ${q.mark_scheme_md}` : "Mark scheme: (use expert judgement)"}
Student's answer: ${ans || "(no answer provided)"}`;
  }).join("\n\n---\n\n");

  return `You are an expert examiner for ${subject}. Grade each answer strictly against its mark scheme. Award marks only for points in the mark scheme; be fair but rigorous.

Return ONLY a JSON array — one object per question, in the same order — and nothing else:
[
  {
    "number": <the #number>,
    "marks_awarded": <integer, 0..max>,
    "max_marks": <max for that question>,
    "breakdown": [{ "criterion": "...", "awarded": 0 or 1, "reasoning": "..." }],
    "feedback": "1-2 sentences: what was right, what was missing, how to improve",
    "topic_understanding": "strong" | "partial" | "weak"
  }
]

Questions:
${block}`;
}

/** Build the user message that batch-grades all code questions. */
export function buildCodePrompt(
  questions: GradableQuestion[],
  answerFor: (q: GradableQuestion) => string,
  subject: string,
): string {
  const block = questions.map((q) => {
    const code = clampAnswer(answerFor(q));
    const lang = q.language ?? "Python";
    return `[#${q.number}] (${q.marks} marks, ${lang})
Question: ${q.stem_md}
${q.mark_scheme_md ? `Mark scheme: ${q.mark_scheme_md}` : ""}
Student's code:
\`\`\`
${code || "// No code submitted"}
\`\`\``;
  }).join("\n\n---\n\n");

  return `You are a senior engineer grading code submissions for ${subject}. For each, judge correctness, code quality, edge cases, and best practices.

Return ONLY a JSON array — one object per question, in the same order — and nothing else:
[
  {
    "number": <the #number>,
    "marks_awarded": <integer, 0..max>,
    "max_marks": <max for that question>,
    "breakdown": [{ "criterion": "Correctness|Code quality|Edge cases|Best practices", "awarded": <int>, "reasoning": "..." }],
    "feedback": "what's good, what needs fixing, and how",
    "improved_code": "a concise corrected version (key fix only, <= 25 lines)"
  }
]

Questions:
${block}`;
}

/** Parse a batch response into per-question grades (clamped), applying the
 * per-question fallback for missing items. Throws GradeBatchError when the
 * whole response is unparseable. */
export function parseBatchGrades(
  kind: "short_answer" | "code",
  responseText: string,
  questions: GradableQuestion[],
  answerFor: (q: GradableQuestion) => string,
): Map<string, Grade> {
  const out = new Map<string, Grade>();
  const parsed = extractJsonArray(responseText);
  if (!parsed || parsed.length === 0) {
    throw new GradeBatchError(`${kind} batch returned no parseable grades`);
  }
  const byNumber = new Map<number, Record<string, unknown>>();
  for (const item of parsed) {
    if (item && typeof item === "object" && "number" in item) {
      byNumber.set(Number((item as { number: unknown }).number), item as Record<string, unknown>);
    }
  }

  for (const q of questions) {
    const r = byNumber.get(q.number);
    if (!r) {
      // Per-question miss inside an otherwise-successful batch: partial credit,
      // disclosed in the feedback text.
      out.set(q.id, fallbackGrade(q, answerFor(q), kind === "code"));
      continue;
    }
    const marks = Math.min(Math.max(0, Math.round(Number(r.marks_awarded ?? 0))), q.marks);
    if (kind === "short_answer") {
      out.set(q.id, {
        marks,
        feedback: typeof r.feedback === "string" ? r.feedback : "No feedback available.",
        breakdown: Array.isArray(r.breakdown) ? (r.breakdown as Grade["breakdown"]) : [],
        topicUnderstanding: typeof r.topic_understanding === "string" ? r.topic_understanding : "partial",
        improvedCode: null,
      });
    } else {
      out.set(q.id, {
        marks,
        feedback: typeof r.feedback === "string" ? r.feedback : "No feedback available.",
        breakdown: Array.isArray(r.breakdown) ? (r.breakdown as Grade["breakdown"]) : [],
        topicUnderstanding: marks >= q.marks * 0.7 ? "strong" : marks >= q.marks * 0.4 ? "partial" : "weak",
        improvedCode: typeof r.improved_code === "string" ? r.improved_code : null,
      });
    }
  }
  return out;
}

/** Grade one batch end-to-end via the injected LLM. */
export async function gradeBatch(
  kind: "short_answer" | "code",
  questions: GradableQuestion[],
  answerFor: (q: GradableQuestion) => string,
  subject: string,
  llm: LlmExec,
  systemPrompt: string,
): Promise<Map<string, Grade>> {
  if (questions.length === 0) return new Map();
  const userContent = kind === "short_answer"
    ? buildShortAnswerPrompt(questions, answerFor, subject)
    : buildCodePrompt(questions, answerFor, subject);
  const result = await llm({
    system: systemPrompt,
    userContent,
    max_tokens: kind === "short_answer" ? 6000 : 8000,
  });
  return parseBatchGrades(kind, result.text, questions, answerFor);
}
