import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { runCurrencyPass } from "@/lib/curriculum-currency";

// ═══════════════════════════════════════════════════════════════════════════════
// Curriculum review desk API — read findings, accept or dismiss them, or kick a
// pass off by hand.
//
// Same gate as the newsroom desk: full session auth plus an admin allowlist.
// Nothing is taken from the query string, and the service-role client is only
// reached AFTER that check passes.
// ═══════════════════════════════════════════════════════════════════════════════

export const maxDuration = 60;

const transitionSchema = z.object({
  action: z.enum(["accept", "dismiss", "reopen"]),
  id: z.string().uuid(),
});
const runSchema = z.object({ action: z.literal("run") });
const bodySchema = z.discriminatedUnion("action", [transitionSchema, runSchema]);

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Service role: findings carry no public read policy by design.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("curriculum_findings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ error: "Could not load findings" }, { status: 500 });
  return NextResponse.json({ findings: data ?? [] });
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try { raw = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const body = parsed.data;

  const admin = createAdminClient();

  if (body.action === "run") {
    try {
      const result = await runCurrencyPass({ timeBudgetMs: 45_000 });
      return NextResponse.json({ ok: true, result });
    } catch (err) {
      console.error("[curriculum/desk] run", err);
      return NextResponse.json({ error: "Currency pass failed" }, { status: 500 });
    }
  }

  // accept / dismiss / reopen — the human gate. Accepting records a decision
  // about the curriculum; it does not touch the lesson, which stays a separate
  // deliberate edit.
  const status =
    body.action === "accept" ? "accepted"
    : body.action === "dismiss" ? "dismissed"
    : "open";

  const { error } = await admin
    .from("curriculum_findings")
    .update({
      status,
      reviewed_by: status === "open" ? null : (user.email ?? null),
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id);

  if (error) {
    console.error("[curriculum/desk] transition", error);
    return NextResponse.json({ error: "Could not update the finding" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
