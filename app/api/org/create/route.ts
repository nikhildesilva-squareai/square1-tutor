import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { MAX_SELF_SERVE_SEATS } from "@/lib/org";

const schema = z.object({
  name: z.string().min(1).max(120),
  seats: z.number().int().min(1).max(MAX_SELF_SERVE_SEATS),
});

function makeJoinCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

/**
 * POST /api/org/create — authed. The buyer creates a team (org) and becomes its
 * manager. FREE during early access (no payment). Returns the org id + join code.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, seats } = schema.parse(await request.json());

    // Ensure a student record for the manager
    let { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
    if (!student) {
      const { data: created, error } = await supabase
        .from("students").insert({ user_id: user.id, email: user.email ?? "" }).select("id").single();
      if (error || !created) return NextResponse.json({ error: "Could not create your account" }, { status: 500 });
      student = created;
    }

    const admin = createAdminClient();

    // One manager → one org for now (idempotent-ish: return existing if they have one)
    const { data: existing } = await admin
      .from("org_members").select("org_id").eq("student_id", student.id).eq("role", "manager").maybeSingle();
    if (existing) {
      const { data: org } = await admin.from("organizations").select("id, join_code").eq("id", existing.org_id).maybeSingle();
      return NextResponse.json({ orgId: existing.org_id, joinCode: org?.join_code, existing: true });
    }

    const joinCode = makeJoinCode();
    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .insert({ name, seats, join_code: joinCode, created_by: student.id, plan: "free_beta" })
      .select("id, join_code")
      .single();
    if (orgErr || !org) {
      console.error("[org/create]", orgErr);
      return NextResponse.json({ error: "Could not create your team" }, { status: 500 });
    }

    const { error: memErr } = await admin
      .from("org_members").insert({ org_id: org.id, student_id: student.id, role: "manager" });
    if (memErr) {
      console.error("[org/create] member", memErr);
      return NextResponse.json({ error: "Could not set you as manager" }, { status: 500 });
    }

    return NextResponse.json({ orgId: org.id, joinCode: org.join_code });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    console.error("[org/create]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
