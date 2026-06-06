import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET — List conversations or fetch messages for one
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const url = new URL(request.url);
  const convId = url.searchParams.get("id");
  const wantMessages = url.searchParams.get("messages");

  // If requesting messages for a specific conversation
  if (convId && wantMessages) {
    // Verify ownership
    const { data: conv } = await supabase.from("tutor_conversations").select("id").eq("id", convId).eq("student_id", student.id).maybeSingle();
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: messages } = await supabase
      .from("tutor_messages")
      .select("role, content, created_at")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    return NextResponse.json({ messages: messages ?? [] });
  }

  // Otherwise list all conversations
  const { data: conversations } = await supabase
    .from("tutor_conversations")
    .select("id, title, mode, message_count, last_message_at, created_at")
    .eq("student_id", student.id)
    .order("last_message_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ conversations: conversations ?? [] });
}

// POST — Create a new conversation
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const body = await request.json();
  const { title, mode, courseId } = body;

  const { data: conversation, error } = await supabase
    .from("tutor_conversations")
    .insert({
      student_id: student.id,
      title: title ?? "New conversation",
      mode: mode ?? "learn",
      course_id: courseId ?? null,
    })
    .select("id, title, mode, message_count, last_message_at, created_at")
    .single();

  if (error) return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });

  return NextResponse.json({ conversation });
}
