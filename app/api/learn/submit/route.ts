import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { callAI } from "@/lib/ai/budget";

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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, exercises: submissions } = schema.parse(body);

    // Get student
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get exercise data from DB
    const exerciseIds = submissions.map((s) => s.exerciseId);
    const { data: dbExercises } = await supabase
      .from("exercises")
      .select("id, type, title, prompt_md, correct_answer, marks, language, options")
      .eq("lesson_id", lessonId)
      .in("id", exerciseIds);

    if (!dbExercises || dbExercises.length === 0) {
      return NextResponse.json({ error: "No exercises found" }, { status: 404 });
    }

    const results: Array<{
      exerciseId: string;
      correct: boolean;
      score: number;
      maxScore: number;
      feedback: string;
    }> = [];

    for (const sub of submissions) {
      const exercise = dbExercises.find((e) => e.id === sub.exerciseId);
      if (!exercise) continue;

      if (exercise.type === "mcq") {
        // Auto-grade MCQ
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
      } else {
        // AI grading for short_answer and code
        const studentAnswer = exercise.type === "code"
          ? (sub.codeResponse ?? "")
          : (sub.responseText ?? "");

        if (!studentAnswer.trim()) {
          results.push({
            exerciseId: exercise.id,
            correct: false,
            score: 0,
            maxScore: exercise.marks,
            feedback: "No answer provided.",
          });
          continue;
        }

        const gradingPrompt = `You are grading a student's exercise submission.

Exercise title: ${exercise.title}
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

        try {
          const aiResult = await callAI(student.id, {
            system: "You are an expert educator grading student work. Be fair but encouraging. Always respond in valid JSON only.",
            messages: [{ role: "user", content: gradingPrompt }],
            max_tokens: 256,
            temperature: 0,
          });

          const parsed = JSON.parse(aiResult.text);
          results.push({
            exerciseId: exercise.id,
            correct: parsed.correct ?? false,
            score: Math.min(parsed.score ?? 0, exercise.marks),
            maxScore: exercise.marks,
            feedback: parsed.feedback ?? "Graded.",
          });
        } catch {
          // Fallback if AI fails
          results.push({
            exerciseId: exercise.id,
            correct: false,
            score: 0,
            maxScore: exercise.marks,
            feedback: "Could not grade this answer automatically. Your teacher will review it.",
          });
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
