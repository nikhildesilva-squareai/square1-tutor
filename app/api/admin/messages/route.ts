import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Verify the caller is a team member (admin allow-list), by session — before
// any service-role read of other students' data.
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

// GET /api/admin/messages — every student thread, newest-activity first, with
// the last message preview and an unread (student→team) count for triage.
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("student_messages")
    .select("id, student_id, sender, body, created_at, read_by_team, students!inner(name, email)")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) return NextResponse.json({ error: "Failed to load" }, { status: 500 });

  type Row = {
    id: string; student_id: string; sender: "student" | "team";
    body: string; created_at: string; read_by_team: boolean;
    students: { name: string | null; email: string | null };
  };

  // Roll up to one entry per student (rows are newest-first, so the first time
  // we see a student is their latest message).
  const threads = new Map<string, {
    studentId: string; name: string; email: string;
    lastBody: string; lastSender: string; lastAt: string; unread: number;
  }>();
  for (const r of (rows ?? []) as unknown as Row[]) {
    let t = threads.get(r.student_id);
    if (!t) {
      t = {
        studentId: r.student_id,
        name: r.students?.name || r.students?.email || "Student",
        email: r.students?.email || "",
        lastBody: r.body,
        lastSender: r.sender,
        lastAt: r.created_at,
        unread: 0,
      };
      threads.set(r.student_id, t);
    }
    if (r.sender === "student" && !r.read_by_team) t.unread += 1;
  }

  const list = [...threads.values()];
  const totalUnread = list.reduce((s, t) => s + t.unread, 0);
  return NextResponse.json({ threads: list, totalUnread });
}
