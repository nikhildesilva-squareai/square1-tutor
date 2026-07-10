import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const sendSchema = z.object({ body: z.string().trim().min(1).max(4000) });

async function getStudent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, student: null as null | { id: string } };
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  return { supabase, student: (student as { id: string } | null) ?? null };
}

// GET /api/dm/[id] → thread messages (+ the other participant); marks incoming read.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, student } = await getStudent();
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversationId = (await params).id;

  // RLS only returns the conversation if I'm a participant.
  const { data: convo } = await supabase
    .from("direct_conversations")
    .select("id, student_a, student_b")
    .eq("id", conversationId)
    .maybeSingle();
  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: messages } = await supabase
    .from("direct_messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  // Opening the thread clears unread for messages the other person sent me.
  await supabase
    .from("direct_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", student.id)
    .is("read_at", null);

  const otherId = convo.student_a === student.id ? convo.student_b : convo.student_a;
  const [{ data: other }, { data: prof }] = await Promise.all([
    supabase.from("students").select("id, name").eq("id", otherId).maybeSingle(),
    supabase.from("community_profiles").select("avatar_url").eq("student_id", otherId).maybeSingle(),
  ]);

  return NextResponse.json({
    messages: (messages ?? []).map((m) => ({
      id: m.id,
      body: m.body,
      created_at: m.created_at,
      mine: m.sender_id === student.id,
    })),
    other: {
      id: otherId,
      name: (other?.name as string | null) ?? "Student",
      avatarUrl: (prof?.avatar_url as string | null) ?? null,
    },
  });
}

// POST /api/dm/[id]  { body } → send a message.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, student } = await getStudent();
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversationId = (await params).id;

  const parsed = sendSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });

  // Membership enforced by RLS — the convo is only visible if I'm in it.
  const { data: convo } = await supabase
    .from("direct_conversations")
    .select("id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: message, error } = await supabase
    .from("direct_messages")
    .insert({ conversation_id: conversationId, sender_id: student.id, body: parsed.data.body })
    .select("id, body, created_at")
    .single();
  if (error) return NextResponse.json({ error: "Failed to send" }, { status: 500 });

  await supabase
    .from("direct_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  return NextResponse.json({
    message: { id: message.id, body: message.body, created_at: message.created_at, mine: true },
  });
}
