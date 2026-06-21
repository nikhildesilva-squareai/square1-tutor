import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const sendSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

const WELCOME =
  "Hi! 👋 This is the Square 1 team. Use this thread to ask us anything — a question about a lesson, a bug, or just feedback on how the platform's working for you. We read every message and reply here.";

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

// GET — full thread (marks team messages read), or ?count=1 for the unread badge.
export async function GET(request: Request) {
  const { supabase, student } = await getStudent();
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);

  // Lightweight unread count for the nav badge — never mutates, never seeds.
  if (url.searchParams.get("count") === "1") {
    const { count } = await supabase
      .from("student_messages")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student.id)
      .eq("sender", "team")
      .eq("read_by_student", false);
    return NextResponse.json({ unread: count ?? 0 });
  }

  let { data: messages } = await supabase
    .from("student_messages")
    .select("id, sender, body, created_at")
    .eq("student_id", student.id)
    .order("created_at", { ascending: true });

  // First visit: seed a welcome from the team so the thread is never empty and
  // the two-way nature is obvious. Service role — students can't write team rows.
  if ((messages?.length ?? 0) === 0) {
    try {
      const admin = createAdminClient();
      await admin.from("student_messages").insert({
        student_id: student.id,
        sender: "team",
        body: WELCOME,
        read_by_student: true, // welcome shouldn't trigger an unread badge
      });
      const reload = await supabase
        .from("student_messages")
        .select("id, sender, body, created_at")
        .eq("student_id", student.id)
        .order("created_at", { ascending: true });
      messages = reload.data;
    } catch {
      // Service key missing in this env — fall back to an empty thread.
    }
  }

  // Opening the thread clears the unread badge.
  await supabase
    .from("student_messages")
    .update({ read_by_student: true })
    .eq("student_id", student.id)
    .eq("sender", "team")
    .eq("read_by_student", false);

  return NextResponse.json({ messages: messages ?? [] });
}

// POST — student sends a message to the team.
export async function POST(request: Request) {
  const { supabase, student } = await getStudent();
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = sendSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
  }

  const { data: message, error } = await supabase
    .from("student_messages")
    .insert({
      student_id: student.id,
      sender: "student",
      body: parsed.data.body,
      read_by_student: true,
      read_by_team: false,
    })
    .select("id, sender, body, created_at")
    .single();

  if (error) return NextResponse.json({ error: "Failed to send" }, { status: 500 });

  return NextResponse.json({ message });
}
