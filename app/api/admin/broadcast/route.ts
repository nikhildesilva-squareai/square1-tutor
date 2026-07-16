import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ message: z.string().trim().min(1).max(4000) });

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

// POST /api/admin/broadcast — send a team message to EVERY student. Inserts one
// sender:"team" row per student into student_messages, so it lands in each
// student's Messages inbox and lights up their unread badge.
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });

  const admin = createAdminClient();
  const { data: students, error: fetchErr } = await admin.from("students").select("id");
  if (fetchErr) return NextResponse.json({ error: "Failed to load recipients" }, { status: 500 });

  const ids = (students ?? []).map((s) => s.id as string);
  if (ids.length === 0) return NextResponse.json({ sent: 0 });

  const rows = ids.map((id) => ({
    student_id: id,
    sender: "team",
    body: parsed.data.message,
    read_by_student: false, // lights up each student's unread badge
    read_by_team: true,
  }));

  // Insert in chunks so a large cohort doesn't blow past request limits.
  const CHUNK = 500;
  let sent = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await admin.from("student_messages").insert(slice);
    if (error) return NextResponse.json({ error: "Failed partway through send", sent }, { status: 500 });
    sent += slice.length;
  }

  return NextResponse.json({ sent });
}
