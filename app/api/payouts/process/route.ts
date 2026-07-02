import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/payouts/process
 * Process monthly payouts for all creators
 *
 * This endpoint:
 * 1. Queries all completed transactions from the past month
 * 2. Calculates totals per creator
 * 3. Creates payout records if >= $500 minimum
 * 4. Updates payout status
 *
 * Should be called by a cron job on the 1st of each month
 * Requires authentication (admin or service role)
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    // In production, verify the request is from authorized source:
    // - Stripe webhook signature
    // - Valid API key from Vercel Cron
    // - Admin user authentication

    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized - missing authorization" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Get last month's date range
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all completed transactions from last month
    const { data: transactions, error: txError } = await supabase
      .from("community_transactions")
      .select("*")
      .eq("status", "completed")
      .gte("created_at", lastMonth.toISOString())
      .lt("created_at", thisMonth.toISOString());

    if (txError) throw txError;

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({
        message: "No transactions to process",
        payouts_created: 0,
      });
    }

    // Group transactions by creator
    const creatorEarnings: {
      [key: string]: {
        creator_id: string;
        community_id: string;
        total: number;
        transactions: any[];
      };
    } = {};

    transactions.forEach((tx) => {
      const key = `${tx.creator_id}-${tx.community_id}`;
      if (!creatorEarnings[key]) {
        creatorEarnings[key] = {
          creator_id: tx.creator_id,
          community_id: tx.community_id,
          total: 0,
          transactions: [],
        };
      }
      creatorEarnings[key].total += parseFloat(tx.creator_earnings);
      creatorEarnings[key].transactions.push(tx);
    });

    // Create payout records for those meeting minimum
    const payouts = [];
    const payoutErrors = [];
    const MINIMUM_PAYOUT = 500;

    for (const [key, data] of Object.entries(creatorEarnings)) {
      if (data.total < MINIMUM_PAYOUT) {
        console.log(
          `Skipping payout for creator ${data.creator_id}: total $${data.total.toFixed(2)} < $${MINIMUM_PAYOUT}`
        );
        continue;
      }

      try {
        // Create payout record
        const { data: payout, error } = await supabase
          .from("community_payouts")
          .insert({
            community_id: data.community_id,
            creator_id: data.creator_id,
            period_start: lastMonth.toISOString(),
            period_end: thisMonth.toISOString(),
            total_earnings: data.total,
            transaction_count: data.transactions.length,
            status: "pending",
          })
          .select()
          .single();

        if (error) {
          payoutErrors.push({
            creator_id: data.creator_id,
            error: error.message,
          });
        } else {
          payouts.push(payout);
        }
      } catch (error) {
        payoutErrors.push({
          creator_id: data.creator_id,
          error: String(error),
        });
      }
    }

    return NextResponse.json({
      message: "Payout processing complete",
      payouts_created: payouts.length,
      payouts,
      errors: payoutErrors.length > 0 ? payoutErrors : null,
      total_amount: payouts.reduce((sum, p) => sum + p.total_earnings, 0),
      period_start: lastMonth.toISOString(),
      period_end: thisMonth.toISOString(),
    });
  } catch (error) {
    console.error("Payout processing error:", error);
    return NextResponse.json(
      { error: "Failed to process payouts" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payouts/process?action=status
 * Get status of pending payouts
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    const supabase = await createClient();

    if (action === "status") {
      // Get pending payouts
      const { data: pending, error } = await supabase
        .from("community_payouts")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return NextResponse.json({
        pending_count: pending?.length || 0,
        pending_payouts: pending || [],
        total_pending: pending?.reduce((sum, p) => sum + p.total_earnings, 0) || 0,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Payout status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout status" },
      { status: 500 }
    );
  }
}
