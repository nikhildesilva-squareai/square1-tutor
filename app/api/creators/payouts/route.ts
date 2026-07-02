import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/creators/payouts
 * Get creator's payout history
 * Query params: status (pending|processing|completed|failed), limit (default 25)
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    // Get creator profile
    const { data: profile } = await supabase
      .from("community_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from("community_payouts")
      .select("*, communities(id, name)")
      .eq("creator_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: payouts, error } = await query;

    if (error) throw error;

    // Calculate totals by status
    const { data: allPayouts } = await supabase
      .from("community_payouts")
      .select("status, total_earnings")
      .eq("creator_id", profile.id);

    const totals = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    allPayouts?.forEach((p) => {
      totals[p.status as keyof typeof totals] += p.total_earnings;
    });

    return NextResponse.json({
      payouts: payouts || [],
      totals,
      summary: {
        total_paid: totals.completed,
        total_pending: totals.pending,
        total_processing: totals.processing,
        lifetime_earnings: Object.values(totals).reduce((sum, v) => sum + v, 0),
      },
    });
  } catch (error) {
    console.error("Payout history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout history" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/creators/payouts/[payoutId]
 * Get details of a specific payout
 */
export async function GET_SINGLE(
  req: Request,
  { params }: { params: { payoutId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payoutId = params.payoutId;

    // Get creator profile
    const { data: profile } = await supabase
      .from("community_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // Get payout (verify creator ownership)
    const { data: payout, error: payoutError } = await supabase
      .from("community_payouts")
      .select("*, communities(id, name)")
      .eq("id", payoutId)
      .eq("creator_id", profile.id)
      .maybeSingle();

    if (payoutError) throw payoutError;

    if (!payout) {
      return NextResponse.json(
        { error: "Payout not found" },
        { status: 404 }
      );
    }

    // Get transactions included in this payout
    const { data: transactions, error: txError } = await supabase
      .from("community_transactions")
      .select("*")
      .eq("community_id", payout.community_id)
      .eq("creator_id", profile.id)
      .gte("created_at", payout.period_start)
      .lt("created_at", payout.period_end)
      .eq("status", "completed");

    if (txError) throw txError;

    return NextResponse.json({
      payout,
      transactions,
      breakdown: {
        gross_amount: transactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0,
        platform_fees: transactions?.reduce((sum, tx) => sum + tx.platform_fee, 0) || 0,
        creator_earnings: transactions?.reduce((sum, tx) => sum + tx.creator_earnings, 0) || 0,
        transaction_count: transactions?.length || 0,
      },
    });
  } catch (error) {
    console.error("Payout details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout details" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/creators/payouts/[payoutId]
 * Update payout (admin only - mark as processing, completed, or failed)
 */
export async function PATCH(
  req: Request,
  { params }: { params: { payoutId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payoutId = params.payoutId;
    const { status, stripe_transfer_id, payout_date } = await req.json();

    // Validate status
    if (!["pending", "processing", "completed", "failed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (stripe_transfer_id) {
      updateData.stripe_transfer_id = stripe_transfer_id;
    }

    if (payout_date) {
      updateData.payout_date = payout_date;
    }

    const { data: payout, error } = await supabase
      .from("community_payouts")
      .update(updateData)
      .eq("id", payoutId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(payout);
  } catch (error) {
    console.error("Payout update error:", error);
    return NextResponse.json(
      { error: "Failed to update payout" },
      { status: 500 }
    );
  }
}
