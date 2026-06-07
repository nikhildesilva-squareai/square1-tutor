import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["highlight", "note", "code_snippet", "auto_summary", "flashcard", "nova_save"]),
  title: z.string().optional(),
  content: z.string().min(1),
  color: z.string().optional(),
  imageUrl: z.string().url().optional(),
  lessonId: z.string().optional(),
  lessonTitle: z.string().optional(),
  moduleTitle: z.string().optional(),
  courseId: z.string().optional(),
  courseTitle: z.string().optional(),
  sectionTitle: z.string().optional(),
  conversationId: z.string().optional(),
  flashcardAnswer: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// GET — List notes for the current student
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const lessonId = url.searchParams.get("lessonId");
  const limit = parseInt(url.searchParams.get("limit") ?? "50");

  let query = supabase
    .from("study_notes")
    .select("*")
    .eq("student_id", student.id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (type) query = query.eq("type", type);
  if (lessonId) query = query.eq("lesson_id", lessonId);

  const { data: notes, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });

  return NextResponse.json({ notes: notes ?? [] });
}

// POST — Create a note
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const body = await request.json();
  const parsed = createSchema.parse(body);

  const { data: note, error } = await supabase
    .from("study_notes")
    .insert({
      student_id: student.id,
      type: parsed.type,
      title: parsed.title ?? null,
      content: parsed.content,
      color: parsed.color ?? "blue",
      lesson_id: parsed.lessonId ?? null,
      lesson_title: parsed.lessonTitle ?? null,
      module_title: parsed.moduleTitle ?? null,
      course_id: parsed.courseId ?? null,
      course_title: parsed.courseTitle ?? null,
      section_title: parsed.sectionTitle ?? null,
      conversation_id: parsed.conversationId ?? null,
      flashcard_answer: parsed.flashcardAnswer ?? null,
      image_url: parsed.imageUrl ?? null,
      tags: parsed.tags ?? [],
      next_review_at: parsed.type === "flashcard" ? new Date(Date.now() + 86400000).toISOString() : null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "Failed to save note" }, { status: 500 });

  return NextResponse.json({ noteId: note.id });
}

// DELETE — Delete a note
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const url = new URL(request.url);
  const noteId = url.searchParams.get("id");
  if (!noteId) return NextResponse.json({ error: "Missing note ID" }, { status: 400 });

  await supabase.from("study_notes").delete().eq("id", noteId).eq("student_id", student.id);

  return NextResponse.json({ ok: true });
}
