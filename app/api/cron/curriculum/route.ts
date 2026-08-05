import { NextResponse } from "next/server";
import { runCurrencyPass } from "@/lib/curriculum-currency";

export const maxDuration = 60;

/**
 * GET /api/cron/curriculum — the curriculum-currency pass.
 *
 * Runs at 20:15 UTC, 45 minutes after the newsroom drafting run at 19:30, so
 * the stories it reasons over are the ones drafted that same morning rather
 * than yesterday's. Both land before the desk is reviewed over coffee.
 *
 * Files findings only. Nothing here edits a lesson — accepting a finding on
 * /desk/curriculum records a decision, and the curriculum change itself stays a
 * separate deliberate act.
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
    const result = await runCurrencyPass({ timeBudgetMs: 45_000 });
    console.log("[cron/curriculum]", JSON.stringify(result));
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[cron/curriculum]", err);
    return NextResponse.json({ error: "Currency pass failed" }, { status: 500 });
  }
}
