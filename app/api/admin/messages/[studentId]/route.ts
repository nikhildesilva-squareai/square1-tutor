import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const replySchema = z.object({ body: z.string().trim().min(1).max(4000) });

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

// GET /api/admin/messages/[studentId] — the full thread. Marks the student's
// messages read-by-team (clears them from the triage unread count).
export async function GET(_req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { studentId } = await params;
  const admin = createAdminClient();

  const [{ data: student }, { data: messages }] = await Promise.all([
    admin.from("students").select("name, email").eq("id", studentId).maybeSingle(),
    admin.from("student_messages")
      .select("id, sender, body, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true }),
  ]);

  await admin.from("student_messages")
    .update({ read_by_team: true })
    .eq("student_id", studentId).eq("sender", "student").eq("read_by_team", false);

  return NextResponse.json({
    student: { name: student?.name ?? null, email: student?.email ?? null },
    messages: messages ?? [],
  });
}

// POST /api/admin/messages/[studentId] — the team replies. Inserts a
// sender:"team" row the student sees in their thread (and unread badge).
export async function POST(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { studentId } = await params;

  const parsed = replySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Reply can't be empty" }, { status: 400 });

  const admin = createAdminClient();
  const { data: message, error } = await admin
    .from("student_messages")
    .insert({
      student_id: studentId,
      sender: "team",
      body: parsed.data.body,
      read_by_student: false, // lights up the student's unread badge
      read_by_team: true,
    })
    .select("id, sender, body, created_at")
    .single();

  if (error) return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  return NextResponse.json({ message });
}
