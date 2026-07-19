import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { DIAG_SUBJECTS } from "@/lib/diagnostic";
import { rateLimit } from "@/lib/rate-limit";

// Attach the subject a visitor chose on the diagnostic to their profile, after
// they've authenticated. Mirrors how signup_country is handled: store it on the
// auth user's metadata so lazy student creation (on first enrolment) picks it up,
// AND backfill an existing student row that has no interest yet. Never creates a
// student and never sends email — that stays with the enrolment flow.

const VALID_SUBJECTS = new Set(DIAG_SUBJECTS.map((s) => s.title));
const schema = z.object({ subject: z.string().min(1).max(100) });

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = rateLimit(`interest:${user.id}`, 10, 60_000);
    if (!rl.success) return rl.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const parsed = schema.safeParse(body);
    // Whitelist to the known tracks so this can't write arbitrary strings.
    if (!parsed.success || !VALID_SUBJECTS.has(parsed.data.subject)) {
      return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
    }
    const subject = parsed.data.subject;

    // First-choice wins — don't overwrite a subject already recorded.
    if (!user.user_metadata?.signup_subject) {
      await supabase.auth.updateUser({ data: { signup_subject: subject } });
    }
    // Backfill an existing student row that hasn't got an interest yet.
    await supabase
      .from("students")
      .update({ subject_interest: subject })
      .eq("user_id", user.id)
      .is("subject_interest", null);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
