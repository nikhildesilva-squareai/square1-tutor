// ═══════════════════════════════════════════════════════════════════════════════
// Project review core — the EXACT prompt, parsing and fallback used by
// /api/projects/submit, extracted so the project calibration harness
// (scripts/calibrate-project-review.ts) exercises the identical code path.
// The LLM call is injected: the route passes budget-checked callAI, the
// harness passes lib/ai/providers.generate directly.
// ═══════════════════════════════════════════════════════════════════════════════

// Relative imports (not "@/" aliases) so the calibration harness can load this
// module with tsx outside the Next.js toolchain.
import { formatRepoForReview, type RepoAnalysis } from "../github/fetch-repo";
import type { ObjectiveResult } from "./objective";

export interface RubricCriterion { criterion: string; weight: number; description?: string }

export interface ReviewResult {
  score: number;
  max_score: number;
  breakdown: { criterion: string; score: number; max: number; feedback: string }[];
  overall_feedback: string;
  strengths: string[];
  improvements: string[];
  code_comments: { file: string; line?: number; comment: string; severity: "info" | "warning" | "error" }[];
}

export interface ProjectMeta {
  title: string;
  description_md?: string | null;
  difficulty: string;
  tech_stack: string[];
}

export const GENERIC_RUBRIC: RubricCriterion[] = [
  { criterion: "Completeness", weight: 25 },
  { criterion: "Code Quality", weight: 25 },
  { criterion: "Error Handling", weight: 15 },
  { criterion: "Testing", weight: 10 },
  { criterion: "Documentation", weight: 15 },
  { criterion: "Best Practices", weight: 10 },
];

export function fallbackReview(rubric: RubricCriterion[]): ReviewResult {
  const r = rubric.length ? rubric : GENERIC_RUBRIC;
  const breakdown = r.map((c) => ({
    criterion: c.criterion,
    score: Math.round((c.weight ?? 0) * 0.5),
    max: c.weight ?? 0,
    feedback: "Unable to fully evaluate — the AI reviewer couldn't parse this submission. Please re-submit.",
  }));
  return {
    score: breakdown.reduce((s, b) => s + b.score, 0),
    max_score: breakdown.reduce((s, b) => s + b.max, 0) || 100,
    breakdown,
    overall_feedback: "Submission received. The AI reviewer hit a parsing issue — please re-submit.",
    strengths: ["Project submitted successfully"],
    improvements: ["Re-submit so the reviewer can fully evaluate your code"],
    code_comments: [],
  };
}

export const PROJECT_REVIEW_SYSTEM_PROMPT = `You are a senior engineer reviewing a student's project submission. You have their actual source code from GitHub.

Your review must be:
- HONEST: if the code is weak, say so — don't inflate scores.
- SPECIFIC: reference actual files and code patterns you see.
- ACTIONABLE: every criticism includes what to do instead.
- ENCOURAGING: acknowledge genuine strengths.

You grade against the project's OWN rubric (provided). Score each criterion from 0 to its max. A correctness/detection criterion should reward code that actually implements the required behaviour — not just code that looks plausible.

Always respond with valid JSON only — no markdown fences, no extra text.`;

// ─── Build the review prompt: real brief + this project's rubric ──────────────

export function buildReviewPrompt(
  project: ProjectMeta,
  rubric: RubricCriterion[],
  githubUrl: string,
  repo: RepoAnalysis,
  description: string | undefined,
  objective: ObjectiveResult | null,
): string {
  const r = rubric.length ? rubric : GENERIC_RUBRIC;
  const total = r.reduce((s, c) => s + (Number(c.weight) || 0), 0) || 100;
  const repoContext = formatRepoForReview(repo);
  const codeAvailable = !repo.error && repo.files.length > 0;
  const brief = (project.description_md ?? "").slice(0, 4000);

  const rubricLines = r.map((c, i) => `${i + 1}. ${c.criterion} (0–${c.weight})${c.description ? ` — ${c.description}` : ""}`).join("\n");
  const breakdownTemplate = r
    .map((c) => `    { "criterion": ${JSON.stringify(c.criterion)}, "score": <0..${c.weight}>, "max": ${c.weight}, "feedback": "Specific feedback referencing actual code" }`)
    .join(",\n");

  const objectiveNote = objective
    ? `\n## Objective check (already computed, do NOT re-score it)
An automated check compared the student's submitted output to the hidden answer key: metric=${objective.metric}, score=${Math.round(objective.score * 100)}%, passed=${objective.passed}${objective.error ? `, note="${objective.error}"` : ""}. Use this as a strong signal of whether their tool actually works when scoring the correctness/detection criterion, but still score code quality, docs, etc. on their own merits.\n`
    : "";

  return `# Project Review Request

## Project Brief
**Title:** ${project.title}
**Difficulty:** ${project.difficulty}
**Tech stack:** ${(project.tech_stack ?? []).join(", ") || "n/a"}

${brief ? `### Full brief\n${brief}\n` : ""}
## Student Submission
**GitHub:** ${githubUrl}
${description ? `**Student notes:** ${description}` : ""}
${objectiveNote}
${repoContext}

---

## Your Task
${codeAvailable
    ? "You have the student's actual source code above. Review it thoroughly and reference SPECIFIC files in your feedback and code_comments."
    : `The repo could not be fetched (${repo.error}). Be transparent that you couldn't read the code and score conservatively.`}

Grade STRICTLY against THIS project's rubric (total ${total}). Score each criterion from 0 to its max:
${rubricLines}

Return EXACTLY this JSON (no markdown fences):
{
  "score": <sum of criterion scores>,
  "max_score": ${total},
  "breakdown": [
${breakdownTemplate}
  ],
  "overall_feedback": "3-4 sentences of specific, actionable feedback referencing files by name.",
  "strengths": ["Specific strength referencing code", "..."],
  "improvements": ["Specific improvement with what to change", "..."],
  "code_comments": [
    { "file": "path/to/file", "line": 42, "comment": "Actionable note", "severity": "error" }
  ]
}`;
}

/** The injected LLM executor (same shape as lib/grading/assessment.ts). */
export type LlmExec = (params: {
  system: string;
  userContent: string;
  max_tokens: number;
}) => Promise<{ text: string }>;

/** Run one project review end-to-end via the injected LLM, with the same
 * parse-or-fallback behaviour as the route. */
export async function reviewProject(
  project: ProjectMeta,
  rubric: RubricCriterion[],
  githubUrl: string,
  repo: RepoAnalysis,
  description: string | undefined,
  objective: ObjectiveResult | null,
  llm: LlmExec,
  gradingSystemPrompt: string,
): Promise<ReviewResult> {
  const prompt = buildReviewPrompt(project, rubric, githubUrl, repo, description, objective);
  const result = await llm({
    system: `${gradingSystemPrompt}\n\n${PROJECT_REVIEW_SYSTEM_PROMPT}`,
    userContent: prompt,
    max_tokens: 2048,
  });
  let review: ReviewResult;
  try {
    review = JSON.parse(result.text || "{}");
  } catch {
    review = fallbackReview(rubric);
  }
  if (!Array.isArray(review.breakdown) || review.breakdown.length === 0) review = fallbackReview(rubric);
  return review;
}
