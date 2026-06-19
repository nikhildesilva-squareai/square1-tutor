import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// GDPR Art. 17 — right to erasure ("right to be forgotten").
// Permanently deletes the learner's account and all personal data.
//
// FK behaviour (verified against the live schema):
//   • 14 student-owned tables CASCADE on delete of the students row.
//   • org_invites.invited_by  → SET NULL automatically.
//   • organizations.created_by → NO ACTION, so we must null it first or the
//     delete is blocked. (Any org they created keeps existing, ownerless —
//     transferring team ownership is out of scope for self-serve deletion.)

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const admin = createAdminClient();

  if (student) {
    // 1. Release any organizations this user created (NO ACTION FK would block).
    const { error: orgErr } = await admin
      .from("organizations")
      .update({ created_by: null })
      .eq("created_by", student.id);
    if (orgErr) {
      return NextResponse.json({ error: "Failed to release organizations" }, { status: 500 });
    }

    // 2. Delete the student row — cascades all owned child tables.
    const { error: delErr } = await admin.from("students").delete().eq("id", student.id);
    if (delErr) {
      return NextResponse.json({ error: "Failed to delete account data" }, { status: 500 });
    }
  }

  // 3. Delete the auth user itself. This is the irreversible final step.
  const { error: authErr } = await admin.auth.admin.deleteUser(user.id);
  if (authErr) {
    return NextResponse.json({ error: "Failed to delete login" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
