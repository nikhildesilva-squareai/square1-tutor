import { NextResponse } from "next/server";
import { ingestNews } from "@/lib/newsroom-pipeline";

export const maxDuration = 60;

/**
 * GET /api/cron/newsroom — the MORNING drafting run (19:30 UTC ≈ 5:30am Sydney).
 *
 * The newsroom desk is reviewed daily over morning coffee, but the consolidated
 * daily cron fires at 07:00 UTC (5pm Sydney) — so the queue was filling in the
 * evening and "today's" news was always yesterday's by review time. This
 * dedicated run drafts the overnight (US/EU) cycle so the desk is full at 6am.
 * The 07:00 UTC run stays as an evening top-up — the pipeline dedupes against
 * DB history and enforces the shared 12-drafts/day cap, so double-running is
 * safe. Drafts only; publishing remains a human click on /desk/newsroom.
 *
 * Protected by CRON_SECRET, same as the other crons.
 */
export async function GET(request: Request) {
  const cronSecret = process.env["CRON_SECRET"];
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await ingestNews(45_000);
    console.log("[cron/newsroom]", JSON.stringify(result));
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[cron/newsroom]", err);
    return NextResponse.json({ error: "Ingest failed" }, { status: 500 });
  }
}
