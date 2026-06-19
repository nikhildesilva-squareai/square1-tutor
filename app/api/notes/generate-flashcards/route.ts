import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { callAI, BudgetExceededError } from "@/lib/ai/budget";
import { rateLimitAI } from "@/lib/rate-limit";

// POST /api/notes/generate-flashcards
// Turns an existing note (or raw text) into active-recall flashcards via Nova.
// Cards are created "due now" so the learner can review them immediately, and
// inherit the source note's course/lesson context.

const schema = z.object({
  sourceNoteId: z.string().uuid().optional(),
  text: z.string().min(1).max(8000).optional(),
  count: z.number().int().min(1).max(10).optional(),
});

interface Card { question: string; answer: string }

function parseCards(raw: string): Card[] {
  // Strip code fences if the model wrapped the JSON.
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Last resort: pull the first [...] block out of the text.
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) return [];
    try { parsed = JSON.parse(match[0]); } catch { return []; }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((c): c is Card =>
      !!c && typeof c === "object" &&
      typeof (c as Card).question === "string" &&
      typeof (c as Card).answer === "string" &&
      (c as Card).question.trim().length > 0 &&
      (c as Card).answer.trim().length > 0
    )
    .map((c) => ({ question: c.question.trim().slice(0, 500), answer: c.answer.trim().slice(0, 1500) }));
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const rl = rateLimitAI(student.id);
    if (!rl.success) return rl.response;

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const count = parsed.data.count ?? 5;

    // Resolve the source material + the context to attach to new cards.
    let sourceText = parsed.data.text?.trim() ?? "";
    let ctx: {
      lesson_id: string | null; lesson_title: string | null; module_title: string | null;
      course_id: string | null; course_title: string | null;
    } = { lesson_id: null, lesson_title: null, module_title: null, course_id: null, course_title: null };

    if (parsed.data.sourceNoteId) {
      const { data: src } = await supabase
        .from("study_notes")
        .select("title, content, flashcard_answer, lesson_id, lesson_title, module_title, course_id, course_title")
        .eq("id", parsed.data.sourceNoteId)
        .eq("student_id", student.id)
        .maybeSingle();
      if (!src) return NextResponse.json({ error: "Source note not found" }, { status: 404 });
      sourceText = [src.title, src.content, src.flashcard_answer].filter(Boolean).join("\n\n");
      ctx = {
        lesson_id: src.lesson_id, lesson_title: src.lesson_title, module_title: src.module_title,
        course_id: src.course_id, course_title: src.course_title,
      };
    }

    if (!sourceText) return NextResponse.json({ error: "Nothing to generate from" }, { status: 400 });

    const system =
      "You are Nova, a study coach. Turn the student's material into high-quality active-recall flashcards. " +
      "Each card tests ONE concept. Questions are specific and answerable from the material; answers are concise (1-3 sentences) and self-contained. " +
      "Avoid yes/no questions. Output ONLY a JSON array of objects with \"question\" and \"answer\" string fields — no prose, no markdown fences.";

    const result = await callAI(student.id, {
      system,
      messages: [{
        role: "user",
        content: `Create ${count} flashcards from this material:\n\n${sourceText.slice(0, 6000)}`,
      }],
      max_tokens: 1500,
    });

    const cards = parseCards(result.text).slice(0, count);
    if (cards.length === 0) {
      return NextResponse.json({ error: "Couldn't generate flashcards — try again or pick a richer note." }, { status: 422 });
    }

    const nowIso = new Date().toISOString();
    const rows = cards.map((c) => ({
      student_id: student.id,
      type: "flashcard",
      title: c.question,
      content: c.question,
      flashcard_answer: c.answer,
      color: "green",
      lesson_id: ctx.lesson_id,
      lesson_title: ctx.lesson_title,
      module_title: ctx.module_title,
      course_id: ctx.course_id,
      course_title: ctx.course_title,
      tags: ["ai-generated"],
      next_review_at: nowIso, // due immediately so they can review right away
      ease_factor: 2.5,
      interval_days: 0,
      review_count: 0,
    }));

    const { data: inserted, error } = await supabase.from("study_notes").insert(rows).select("*");
    if (error) return NextResponse.json({ error: "Failed to save flashcards" }, { status: 500 });

    return NextResponse.json({ created: inserted?.length ?? cards.length, notes: inserted ?? [], degraded: result.degraded });
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("[notes/generate-flashcards]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
