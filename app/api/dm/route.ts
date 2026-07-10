import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// Resolve the current student row from the auth session.
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

// GET /api/dm            → { conversations: [...], unread: N }
// GET /api/dm?count=1    → { unread: N }   (lightweight nav badge)
export async function GET(request: Request) {
  const { supabase, student } = await getStudent();
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);

  // RLS scopes direct_messages to conversations I'm a participant of, so a plain
  // count of unread rows I didn't send is my total unread across all DMs.
  if (url.searchParams.get("count") === "1") {
    const { count } = await supabase
      .from("direct_messages")
      .select("id", { count: "exact", head: true })
      .is("read_at", null)
      .neq("sender_id", student.id);
    return NextResponse.json({ unread: count ?? 0 });
  }

  const { data: convos } = await supabase
    .from("direct_conversations")
    .select("id, student_a, student_b, last_message_at")
    .order("last_message_at", { ascending: false });

  const list = convos ?? [];
  if (list.length === 0) return NextResponse.json({ conversations: [], unread: 0 });

  const otherIds = Array.from(
    new Set(list.map((c) => (c.student_a === student.id ? c.student_b : c.student_a)))
  );

  const [{ data: others }, { data: profs }, { data: msgs }] = await Promise.all([
    supabase.from("students").select("id, name").in("id", otherIds),
    supabase.from("community_profiles").select("student_id, avatar_url").in("student_id", otherIds),
    supabase
      .from("direct_messages")
      .select("conversation_id, body, created_at, sender_id, read_at")
      .in("conversation_id", list.map((c) => c.id))
      .order("created_at", { ascending: false }),
  ]);

  const nameById = new Map((others ?? []).map((o) => [o.id, o.name as string | null]));
  const avatarById = new Map((profs ?? []).map((p) => [p.student_id, p.avatar_url as string | null]));

  const lastByConvo = new Map<string, { body: string; created_at: string }>();
  const unreadByConvo = new Map<string, number>();
  for (const m of msgs ?? []) {
    if (!lastByConvo.has(m.conversation_id)) {
      lastByConvo.set(m.conversation_id, { body: m.body, created_at: m.created_at });
    }
    if (m.sender_id !== student.id && m.read_at === null) {
      unreadByConvo.set(m.conversation_id, (unreadByConvo.get(m.conversation_id) ?? 0) + 1);
    }
  }

  let unread = 0;
  const conversations = list.map((c) => {
    const otherId = c.student_a === student.id ? c.student_b : c.student_a;
    const last = lastByConvo.get(c.id);
    const u = unreadByConvo.get(c.id) ?? 0;
    unread += u;
    return {
      id: c.id,
      otherStudentId: otherId,
      name: nameById.get(otherId) ?? "Student",
      avatarUrl: avatarById.get(otherId) ?? null,
      lastMessage: last?.body ?? null,
      lastMessageAt: last?.created_at ?? c.last_message_at,
      unread: u,
    };
  });

  return NextResponse.json({ conversations, unread });
}

// POST /api/dm  { recipientStudentId?, recipientProfileId? } → { conversationId }
// Find-or-create the 1:1 conversation with another student.
const createSchema = z
  .object({
    recipientStudentId: z.string().uuid().optional(),
    recipientProfileId: z.string().uuid().optional(),
  })
  .refine((d) => d.recipientStudentId || d.recipientProfileId, "recipient required");

export async function POST(request: Request) {
  const { supabase, student } = await getStudent();
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Recipient required" }, { status: 400 });

  // Accept either a student id directly, or a community profile id to resolve.
  let recipientId = parsed.data.recipientStudentId ?? null;
  if (!recipientId && parsed.data.recipientProfileId) {
    const { data: prof } = await supabase
      .from("community_profiles")
      .select("student_id")
      .eq("id", parsed.data.recipientProfileId)
      .maybeSingle();
    recipientId = (prof?.student_id as string | null) ?? null;
  }

  if (!recipientId) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  if (recipientId === student.id) {
    return NextResponse.json({ error: "You can't message yourself" }, { status: 400 });
  }

  const { data: rec } = await supabase.from("students").select("id").eq("id", recipientId).maybeSingle();
  if (!rec) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

  // Canonical ordered pair → one conversation per pair (matches the CHECK + UNIQUE).
  const [a, b] = [student.id, recipientId].sort();

  const { data: existing } = await supabase
    .from("direct_conversations")
    .select("id")
    .eq("student_a", a)
    .eq("student_b", b)
    .maybeSingle();
  if (existing) return NextResponse.json({ conversationId: existing.id });

  const { data: created, error } = await supabase
    .from("direct_conversations")
    .insert({ student_a: a, student_b: b })
    .select("id")
    .single();

  if (error) {
    // Lost a create race → the row now exists; re-select it.
    const { data: again } = await supabase
      .from("direct_conversations")
      .select("id")
      .eq("student_a", a)
      .eq("student_b", b)
      .maybeSingle();
    if (again) return NextResponse.json({ conversationId: again.id });
    return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 });
  }

  return NextResponse.json({ conversationId: created.id });
}
