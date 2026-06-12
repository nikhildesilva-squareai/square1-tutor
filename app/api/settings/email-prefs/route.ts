import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  optOut: z.boolean(),
});

/**
 * POST /api/settings/email-prefs
 *
 * Toggles lifecycle emails (streak reminders, weekly digest, nudges).
 * This is the target of every email's "Unsubscribe" link, so it must work.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { error } = await supabase
    .from("students")
    .update({ email_opt_out: parsed.data.optOut })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Failed to update" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
