import { NextResponse } from "next/server";
import { sweepMonth } from "@/lib/ai/budget";

/**
 * GET /api/cron/sweep-wallets
 *
 * Monthly cron: sweeps all unspent AI wallet balances from the previous month
 * back to the Square 1 AI pool.
 *
 * Protected by CRON_SECRET — only Vercel cron can call this.
 */
export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env["CRON_SECRET"];

  // Fail closed: if CRON_SECRET is unset, deny (never let a money route be world-callable).
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Calculate previous month key
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;

    const { swept, count } = await sweepMonth(monthKey);

    console.log(`[sweep-wallets] Month ${monthKey}: swept $${swept.toFixed(2)} from ${count} wallets`);

    return NextResponse.json({
      ok: true,
      monthKey,
      walletsSwept: count,
      totalRecovered: `$${swept.toFixed(2)}`,
    });
  } catch (err) {
    console.error("[sweep-wallets]", err);
    return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
  }
}
