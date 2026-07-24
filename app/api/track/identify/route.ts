import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Server-side identify — links a browser's anonymous analytics id to the
 * logged-in student. Replaces the old fragile browser chain (client getUser →
 * RLS student select → client insert) which never successfully fired in
 * production: the server reads the auth cookie itself and writes with the
 * service role, so the link cannot be lost to client-side auth/RLS quirks.
 *
 * Called by FirstPartyAnalytics once per session when a session cookie is
 * present. Best-effort: analytics must never break the app, so every failure
 * path returns 2xx/4xx quietly and nothing throws.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const anonymous_id = body?.anonymous_id;
    const session_id = body?.session_id;
    const path = typeof body?.path === "string" ? body.path.slice(0, 200) : "/";
    if (typeof anonymous_id !== "string" || !UUID.test(anonymous_id)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    if (typeof session_id !== "string" || !UUID.test(session_id)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const admin = createAdminClient();
    const { data: student } = await admin
      .from("students")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    // No student row yet (fresh signup mid-provisioning) — fine, the client
    // retries next session; don't set the identified flag.
    if (!student?.id) return NextResponse.json({ ok: false });

    await admin.from("events").insert({
      anonymous_id,
      session_id,
      student_id: student.id,
      type: "identify",
      path,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
