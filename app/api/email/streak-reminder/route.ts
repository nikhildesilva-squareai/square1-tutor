import { NextResponse } from "next/server";
import { runStreakReminders } from "@/lib/email/jobs";

export const maxDuration = 60;

/**
 * GET /api/email/streak-reminder — manual trigger for the streak-reminder job.
 * The scheduled run lives in /api/cron/daily; this stays for ad-hoc testing.
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
    const result = await runStreakReminders();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[email/streak-reminder]", err);
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}
