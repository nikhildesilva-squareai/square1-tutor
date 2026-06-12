import { NextResponse } from "next/server";
import { runWeeklyDigest } from "@/lib/email/jobs";

export const maxDuration = 60;

/**
 * GET /api/email/weekly-digest — manual trigger for the weekly-digest job.
 * The scheduled run lives in /api/cron/daily (Sundays); this stays for testing.
 * Requires CRON_SECRET.
 */
export async function GET(request: Request) {
  const cronSecret = process.env["CRON_SECRET"];
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runWeeklyDigest();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[email/weekly-digest]", err);
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}
