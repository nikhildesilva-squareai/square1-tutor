import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { callAI } from "@/lib/ai/budget";
import { GRADING_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { extractJsonObject, extractJsonArray } from "@/lib/ai/json";
import { rateLimitAI } from "@/lib/rate-limit";

const exerciseSchema = z.object({
  exerciseId: z.string(),
  type: z.enum(["mcq", "short_answer", "code"]),
  selectedOption: z.string().optional(),
  responseText: z.string().optional(),
  codeResponse: z.string().optional(),
});

const schema = z.object({
  lessonId: z.string(),
  exercises: z.array(exerciseSchema).min(1).max(20),
});

type Sub = z.infer<typeof exerciseSchema>;

type GradeResult = {
  exerciseId: string;
  correct: boolean;
  score: number;
  maxScore: number;
  feedback: string;
};

type DbExercise = {
  id: string;
  type: string;
  title: string;
  prompt_md: string;
  correct_answer: string | null;
  marks: number;
  language: string | null;
  options: unknown;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, exercises: submissions } = schema.parse(body);

    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Rate limit: 15 AI requests per minute
    const rl = rateLimitAI(student.id);
    if (!rl.success) return rl.response;

    const exerciseIds = submissions.map((s) => s.exerciseId);
    const { data: dbExercises } = await supabase
      .from("exercises")
      .select("id, type, title, prompt_md, correct_answer, marks, language, options")
      .eq("lesson_id", lessonId)
      .in("id", exerciseIds);

    if (!dbExercises || dbExercises.length === 0) {
      return NextResponse.json({ error: "No exercises found" }, { status: 404 });
    }

    const results: GradeResult[] = [];

    // ── 1. Auto-grade MCQs (free, no AI call) ───────────────────────────────
    for (const sub of submissions) {
      const exercise = dbExercises.find((e) => e.id === sub.exerciseId);
      if (!exercise || exercise.type !== "mcq") continue;
      const isCorrect = sub.selectedOption === exercise.correct_answer;
      results.push({
        exerciseId: exercise.id,
        correct: isCorrect,
        score: isCorrect ? exercise.marks : 0,
        maxScore: exercise.marks,
        feedback: isCorrect
          ? "Correct! Well done."
          : `The correct answer was: ${exercise.correct_answer}`,
      });
    }

    // ── 2. Collect non-MCQ submissions; push empty-answer results immediately ─
    const toGrade: { sub: Sub; exercise: DbExercise }[] = [];
    for (const sub of submissions) {
      const exercise = dbExercises.find((e) => e.id === sub.exerciseId);
      if (!exercise || exercise.type === "mcq") continue;
      const answer = exercise.type === "code" ? sub.codeResponse : sub.responseText;
      if (!answer?.trim()) {
        results.push({
          exerciseId: exercise.id,
          correct: false,
          score: 0,
          maxScore: exercise.marks,
          feedback: "No answer provided.",
        });
      } else {
        toGrade.push({ sub, exercise });
      }
    }

    // ── 3. Batch AI grade — 1 call for all non-MCQ exercises with answers ───
    if (toGrade.length > 0) {
      let batchSucceeded = false;

      try {
        const aiResult = await callAI(student.id, {
          feature: "grading",
          system: GRADING_SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildBatchPrompt(toGrade) }],
          max_tokens: Math.min(4096, 300 * toGrade.length),
          temperature: 0,
        });

        type BatchItem = {
          exercise_index: number;
          score: number;
          correct: boolean;
          feedback: string;
        };
        const parsed = extractJsonArray<BatchItem>(aiResult.text);

        if (parsed && parsed.length === toGrade.length) {
          for (let i = 0; i < toGrade.length; i++) {
            const { exercise } = toGrade[i];
            const item = parsed[i];
            results.push({
              exerciseId: exercise.id,
              correct: item.correct ?? false,
              score: Math.min(Number(item.score) || 0, exercise.marks),
              maxScore: exercise.marks,
              feedback: item.feedback ?? "Graded.",
            });
          }
          batchSucceeded = true;
        }
      } catch {
        // fall through to per-exercise fallback
      }

      // ── 4. Per-exercise fallback (batch failed or count mismatch) ──────────
      if (!batchSucceeded) {
        for (const { sub, exercise } of toGrade) {
          const answer = exercise.type === "code" ? (sub.codeResponse ?? "") : (sub.responseText ?? "");
          results.push(await gradeOneExercise(student.id, exercise, answer));
        }
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: err.issues }, { status: 400 });
    }
    console.error("[learn/submit]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Batch grading prompt ─────────────────────────────────────────────────────

function buildBatchPrompt(items: { sub: Sub; exercise: DbExercise }[]): string {
  const blocks = items
    .map(({ sub, exercise }, i) => {
      const answer =
        exercise.type === "code" ? (sub.codeResponse ?? "") : (sub.responseText ?? "");
      return [
        `### Exercise ${i} — ${exercise.type} (max ${exercise.marks} marks)`,
        `Title: ${exercise.title}`,
        `Prompt: ${exercise.prompt_md.slice(0, 800)}`,
        exercise.correct_answer
          ? `Reference answer: ${exercise.correct_answer.slice(0, 400)}`
          : "",
        `Student answer:\n${answer.slice(0, 1500)}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");

  return `Grade the following ${items.length} student exercise submission${items.length > 1 ? "s" : ""}.

${blocks}

Return ONLY a JSON array of exactly ${items.length} objects (index 0 = Exercise 0, etc.):
[
  { "exercise_index": 0, "score": <0..maxMarks>, "correct": <true if full marks>, "feedback": "<1-2 sentences>" }
]`;
}

// ─── Per-exercise fallback ────────────────────────────────────────────────────

async function gradeOneExercise(
  studentId: string,
  exercise: DbExercise,
  studentAnswer: string
): Promise<GradeResult> {
  try {
    const gradingPrompt = `Exercise title: ${exercise.title}
Exercise type: ${exercise.type}
Exercise prompt: ${exercise.prompt_md}
Max marks: ${exercise.marks}
${exercise.correct_answer ? `Reference answer: ${exercise.correct_answer}` : ""}

Student's answer:
${studentAnswer}

Grade this submission. Respond in JSON format only:
{
  "score": <number from 0 to ${exercise.marks}>,
  "correct": <true if score equals max marks>,
  "feedback": "<1-2 sentences explaining the grade>"
}`;

    const aiResult = await callAI(studentId, {
      feature: "grading",
      system: GRADING_SYSTEM_PROMPT,
      messages: [{ role: "user", content: gradingPrompt }],
      max_tokens: 256,
      temperature: 0,
    });

    const parsed = extractJsonObject<{ score?: number; correct?: boolean; feedback?: string }>(
      aiResult.text
    );
    if (!parsed) throw new Error("unparseable");
    return {
      exerciseId: exercise.id,
      correct: parsed.correct ?? false,
      score: Math.min(parsed.score ?? 0, exercise.marks),
      maxScore: exercise.marks,
      feedback: parsed.feedback ?? "Graded.",
    };
  } catch {
    return {
      exerciseId: exercise.id,
      correct: false,
      score: 0,
      maxScore: exercise.marks,
      feedback: "Could not grade this answer automatically. Your teacher will review it.",
    };
  }
}
