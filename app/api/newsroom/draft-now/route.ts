import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/supabase/admin";
import { ingestNews } from "@/lib/newsroom-pipeline";

export const maxDuration = 60;

/**
 * /api/newsroom/draft-now — on-demand drafting for the newsroom desk.
 *
 * Lets the team pull a fresh batch of drafts at any time instead of waiting
 * for the scheduled runs (5:30am + 5pm Sydney). Signed-in ADMIN_EMAILS only;
 * safe to run repeatedly — the pipeline dedupes against 14 days of history
 * and enforces the 12-drafts/day cap. Drafts only — nothing publishes.
 *
 * GET is deliberate: it makes this a bookmarkable "run it now" URL for the
 * desk. The admin gate + idempotent pipeline make that safe.
 */
async function run() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await ingestNews(45_000);
    return NextResponse.json({
      ok: true,
      result,
      next: "Review and publish at /desk/newsroom",
    });
  } catch (err) {
    console.error("[newsroom/draft-now]", err);
    return NextResponse.json({ error: "Ingest failed" }, { status: 500 });
  }
}

export async function GET() {
  return run();
}

export async function POST() {
  return run();
}
