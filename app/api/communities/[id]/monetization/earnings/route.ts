import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/communities/[id]/monetization/earnings
 * Get community earnings analytics (creator only)
 * Query params: timeframe (month|quarter|year|all)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const communityId = (await params).id;
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "month";

    // Verify user is the creator
    const { data: community } = await supabase
      .from("communities")
      .select("creator_id")
      .eq("id", communityId)
      .maybeSingle();

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    const { data: profile } = await supabase
      .from("community_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || profile.id !== community.creator_id) {
      return NextResponse.json(
        { error: "Only community creator can view earnings" },
        { status: 403 }
      );
    }

    // Calculate date range
    const now = new Date();
    let dateFrom = new Date();

    switch (timeframe) {
      case "month":
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
      case "quarter":
        dateFrom.setMonth(dateFrom.getMonth() - 3);
        break;
      case "year":
        dateFrom.setFullYear(dateFrom.getFullYear() - 1);
        break;
      case "all":
        dateFrom = new Date(2000, 0, 1); // Far past
        break;
    }

    // Get transactions
    const { data: transactions, error: txError } = await supabase
      .from("community_transactions")
      .select("*")
      .eq("community_id", communityId)
      .eq("status", "completed")
      .gte("created_at", dateFrom.toISOString())
      .order("created_at", { ascending: false });

    if (txError) throw txError;

    // Get subscription summary
    const { data: subscriptions, error: subError } = await supabase
      .from("community_subscriptions")
      .select("subscription_type, status")
      .eq("community_id", communityId);

    if (subError) throw subError;

    // Calculate metrics
    const totalTransactions = transactions?.length || 0;
    const totalRevenue = transactions?.reduce(
      (sum, tx) => sum + parseFloat(tx.creator_earnings),
      0
    ) || 0;

    const activeMembers = subscriptions?.filter(
      (sub) => sub.status === "active"
    ).length || 0;

    const monthlyMembers = subscriptions?.filter(
      (sub) => sub.status === "active" && sub.subscription_type === "monthly"
    ).length || 0;

    const annualMembers = subscriptions?.filter(
      (sub) => sub.status === "active" && sub.subscription_type === "annual"
    ).length || 0;

    const freeMembers = subscriptions?.filter(
      (sub) => sub.status === "active" && sub.subscription_type === "free"
    ).length || 0;

    // Calculate churn
    const churnedMembers = subscriptions?.filter(
      (sub) => sub.status === "cancelled"
    ).length || 0;

    const churnRate = activeMembers + churnedMembers > 0
      ? (churnedMembers / (activeMembers + churnedMembers)) * 100
      : 0;

    // Calculate MRR (Monthly Recurring Revenue)
    const monthlySubscriptions = subscriptions?.filter(
      (sub) => sub.status === "active" && sub.subscription_type === "monthly"
    ) || [];

    const mrr = monthlySubscriptions.length > 0
      ? monthlySubscriptions.reduce(
          (sum, _sub, _idx) => {
            // Get average monthly price from transactions
            const avgPrice = transactions
              ?.filter((tx) => tx.subscription_type === "monthly")
              .reduce((sum, tx) => sum + tx.amount, 0) || 0;
            return sum + (avgPrice / Math.max(transactions?.length || 1, 1));
          },
          0
        )
      : 0;

    // Get monthly breakdown
    const { data: monthlyData, error: monthError } = await supabase
      .from("community_earnings_summary")
      .select("*")
      .eq("community_id", communityId)
      .gte("month_year", dateFrom.toISOString().split("T")[0])
      .order("month_year", { ascending: false });

    if (monthError) throw monthError;

    return NextResponse.json({
      timeframe,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTransactions,
        activeMembers,
        monthlyMembers,
        annualMembers,
        freeMembers,
        churnedMembers,
        churnRate: Math.round(churnRate * 100) / 100,
        mrr: Math.round(mrr * 100) / 100,
      },
      monthlyBreakdown: monthlyData || [],
      recentTransactions: (transactions || []).slice(0, 10),
    });
  } catch (error) {
    console.error("Earnings analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings analytics" },
      { status: 500 }
    );
  }
}
