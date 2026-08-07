// ═══════════════════════════════════════════════════════════════════════════════
// Nova's per-student memory — the distilled record of what the tutor should
// remember about a learner across sessions. Lives in students.memory (jsonb).
//
// Design rules (deliberate, cheap by construction):
//   - Derived from GRADED truth, not self-report: gaps and strengths come from
//     real scored exercises in /api/learn/submit. No AI calls anywhere here.
//   - Written only at event boundaries (an exercise batch graded, a lesson
//     completed) — never per chat message, never on a timer.
//   - Hard-capped: the prompt block this produces stays under ~400 tokens no
//     matter how long a student stays. Memory that grows unbounded becomes
//     noise the model skims and cost paid forever.
//   - Best-effort everywhere: a memory failure must never block grading,
//     completion, or a chat. Callers wrap in try/catch.
//   - Privacy: the column rides along with account export (select * on
//     students) and dies with the row on account deletion.
// ═══════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";

export type MemoryItem = {
  /** Short human-readable topic, e.g. "Explain: loc vs iloc (Pandas DataFrames)" */
  t: string;
  /** How many times this has recurred (gaps only). */
  n?: number;
  /** ISO date of the last time this was observed. */
  at: string;
};

export type StudentMemory = {
  v: 1;
  /** Topics the student has scored poorly on — most recent last. */
  gaps: MemoryItem[];
  /** Topics the student has aced (non-MCQ only) — most recent last. */
  strengths: MemoryItem[];
  /** Stated goals, distilled from conversations (phase 2 — empty until then). */
  goals: string[];
  /** Learning preferences, distilled from conversations (phase 2). */
  prefs: string[];
  /** One-line continuity hook: the last thing they did. */
  last_session: string | null;
  updated_at: string;
};

// Caps — the discipline that keeps the prompt block small forever.
const MAX_GAPS = 8;
const MAX_STRENGTHS = 5;
const MAX_LIST = 6; // goals / prefs (phase 2)
const MAX_ITEM_CHARS = 90;
export const MEMORY_PROMPT_CHAR_CAP = 1600; // ≈ 400 tokens

export function emptyMemory(): StudentMemory {
  return { v: 1, gaps: [], strengths: [], goals: [], prefs: [], last_session: null, updated_at: new Date().toISOString() };
}

/** Narrow whatever is in the jsonb column to a usable memory record. */
export function parseMemory(raw: unknown): StudentMemory {
  if (!raw || typeof raw !== "object") return emptyMemory();
  const m = raw as Partial<StudentMemory>;
  return {
    v: 1,
    gaps: Array.isArray(m.gaps) ? m.gaps.filter(isItem).slice(-MAX_GAPS) : [],
    strengths: Array.isArray(m.strengths) ? m.strengths.filter(isItem).slice(-MAX_STRENGTHS) : [],
    goals: Array.isArray(m.goals) ? m.goals.filter(isStr).slice(-MAX_LIST) : [],
    prefs: Array.isArray(m.prefs) ? m.prefs.filter(isStr).slice(-MAX_LIST) : [],
    last_session: typeof m.last_session === "string" ? m.last_session.slice(0, 160) : null,
    updated_at: typeof m.updated_at === "string" ? m.updated_at : new Date().toISOString(),
  };
}

const isStr = (x: unknown): x is string => typeof x === "string" && x.trim().length > 0;
const isItem = (x: unknown): x is MemoryItem =>
  !!x && typeof x === "object" && isStr((x as MemoryItem).t) && isStr((x as MemoryItem).at);

export type GradedOutcome = {
  /** Exercise title, e.g. "Explain: loc vs iloc". */
  title: string;
  /** "mcq" | "short_answer" | "code" — MCQs are excluded from memory (the
   *  completion gate forces them to 100% eventually, so they carry no signal). */
  type: string;
  score: number;
  maxScore: number;
  /** Lesson title for context, e.g. "Pandas DataFrames". */
  lessonTitle: string | null;
};

/**
 * Fold a batch of freshly graded exercises into memory.
 *   < 60%  → gap (repeat observations bump a counter instead of duplicating)
 *   ≥ 90%  → strength; and if the same topic was a gap, the gap is RESOLVED
 *            and removed — memory forgives, that's the point of practice.
 */
export function mergeGradedResults(memory: StudentMemory, outcomes: GradedOutcome[]): StudentMemory {
  const now = new Date().toISOString();
  const day = now.slice(0, 10);
  let gaps = [...memory.gaps];
  let strengths = [...memory.strengths];

  for (const o of outcomes) {
    if (o.type === "mcq" || o.maxScore <= 0) continue;
    const topic = clip(o.lessonTitle ? `${o.title} (${o.lessonTitle})` : o.title, MAX_ITEM_CHARS);
    const ratio = o.score / o.maxScore;

    if (ratio < 0.6) {
      const existing = gaps.find((g) => g.t === topic);
      if (existing) {
        existing.n = (existing.n ?? 1) + 1;
        existing.at = day;
        // Recency: move to the end.
        gaps = [...gaps.filter((g) => g !== existing), existing];
      } else {
        gaps.push({ t: topic, n: 1, at: day });
      }
      strengths = strengths.filter((s) => s.t !== topic);
    } else if (ratio >= 0.9) {
      gaps = gaps.filter((g) => g.t !== topic); // resolved
      if (!strengths.some((s) => s.t === topic)) strengths.push({ t: topic, at: day });
      else strengths = [...strengths.filter((s) => s.t !== topic), { t: topic, at: day }];
    }
  }

  return {
    ...memory,
    gaps: gaps.slice(-MAX_GAPS),
    strengths: strengths.slice(-MAX_STRENGTHS),
    updated_at: now,
  };
}

/** Record the one-line continuity hook ("Completed 'X' in Data Science"). */
export function noteSession(memory: StudentMemory, line: string): StudentMemory {
  return { ...memory, last_session: clip(line, 160), updated_at: new Date().toISOString() };
}

/**
 * Render memory as a system-prompt block. Returns "" when there is nothing
 * worth saying — an empty student gets no block, not boilerplate.
 */
export function memoryPromptBlock(memory: StudentMemory): string {
  const lines: string[] = [];
  if (memory.last_session) lines.push(`Last session: ${memory.last_session}.`);
  if (memory.gaps.length > 0) {
    const gaps = memory.gaps
      .map((g) => ((g.n ?? 1) > 1 ? `${g.t} (seen ${g.n}×)` : g.t))
      .join("; ");
    lines.push(`They have recently struggled with: ${gaps}. Weave targeted help for these into your answers when relevant — don't lecture about the list itself.`);
  }
  if (memory.strengths.length > 0) {
    lines.push(`They have shown solid command of: ${memory.strengths.map((s) => s.t).join("; ")}. Build on these rather than re-explaining them.`);
  }
  if (memory.goals.length > 0) lines.push(`Their stated goals: ${memory.goals.join("; ")}.`);
  if (memory.prefs.length > 0) lines.push(`Preferences: ${memory.prefs.join("; ")}.`);
  if (lines.length === 0) return "";

  const block = `\n\nWhat you remember about this student from previous sessions (grounded in their actual graded work — use it naturally, never recite it):\n${lines.join("\n")}`;
  return block.length > MEMORY_PROMPT_CHAR_CAP ? block.slice(0, MEMORY_PROMPT_CHAR_CAP) : block;
}

/** Read-modify-write helper. Best-effort by contract: callers try/catch. */
export async function updateStudentMemory(
  supabase: SupabaseClient,
  studentId: string,
  mutate: (memory: StudentMemory) => StudentMemory,
): Promise<void> {
  const { data: row } = await supabase
    .from("students")
    .select("memory")
    .eq("id", studentId)
    .maybeSingle();
  const next = mutate(parseMemory(row?.memory));
  const { error } = await supabase.from("students").update({ memory: next }).eq("id", studentId);
  if (error) throw error;
}

function clip(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
