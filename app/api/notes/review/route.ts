import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schedule, type Grade } from "@/lib/srs";

// POST /api/notes/review — record a flashcard self-grade and reschedule it.
// This is what makes spaced repetition actually work: each grade updates the
// card's ease, interval, streak, and next_review_at on the study_notes row.

const schema = z.object({
  id: z.string().uuid(),
  grade: z.enum(["hard", "good", "easy"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // Load current SRS state — scoped to this student (ownership check).
  const { data: card } = await supabase
    .from("study_notes")
    .select("id, type, ease_factor, interval_days, review_count")
    .eq("id", parsed.data.id)
    .eq("student_id", student.id)
    .maybeSingle();

  if (!card || card.type !== "flashcard") {
    return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
  }

  const next = schedule(
    {
      easeFactor: Number(card.ease_factor ?? 2.5),
      intervalDays: card.interval_days ?? 0,
      reviewCount: card.review_count ?? 0,
    },
    parsed.data.grade as Grade,
  );

  const { error } = await supabase
    .from("study_notes")
    .update({
      ease_factor: next.easeFactor,
      interval_days: next.intervalDays,
      review_count: next.reviewCount,
      next_review_at: next.nextReviewAt,
      last_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", card.id)
    .eq("student_id", student.id);

  if (error) return NextResponse.json({ error: "Failed to record review" }, { status: 500 });

  return NextResponse.json({
    ok: true,
    nextReviewAt: next.nextReviewAt,
    intervalDays: next.intervalDays,
    reviewCount: next.reviewCount,
  });
}
