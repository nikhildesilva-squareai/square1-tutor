import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// ═══════════════════════════════════════════════════════════════════════════════
// /api/career/targets — the saved job-target list.
//   GET          → light list (no jd/analysis payloads)
//   GET ?id=     → one full target (jd + analysis) for reloading into the UI
//   DELETE ?id=  → remove a target
// All access is the student's own rows: RLS enforces it, and every query
// also filters by student_id explicitly — belt and braces.
// ═══════════════════════════════════════════════════════════════════════════════

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function studentFor(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, student: null };
  const { data: student } = await supabase
    .from("students").select("id").eq("user_id", user.id).maybeSingle();
  return { supabase, student };
}

export async function GET(request: Request) {
  const { supabase, student } = await studentFor(request);
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    if (!UUID_REGEX.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const { data: target } = await supabase
      .from("job_targets")
      .select("id, role, company, jd, analysis, readiness, history, updated_at")
      .eq("id", id)
      .eq("student_id", student.id)
      .maybeSingle();
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ target });
  }

  const { data: targets } = await supabase
    .from("job_targets")
    .select("id, role, company, readiness, history, updated_at")
    .eq("student_id", student.id)
    .order("updated_at", { ascending: false })
    .limit(20);
  return NextResponse.json({ targets: targets ?? [] });
}

export async function DELETE(request: Request) {
  const { supabase, student } = await studentFor(request);
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id || !UUID_REGEX.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { error } = await supabase
    .from("job_targets")
    .delete()
    .eq("id", id)
    .eq("student_id", student.id);
  if (error) return NextResponse.json({ error: "Could not delete" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
