import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

/**
 * Generate unique referral code
 */
export function generateReferralCode(): string {
  return crypto.randomBytes(6).toString("hex").toUpperCase().slice(0, 8);
}

/**
 * Create referral and return share URLs
 */
export async function createReferral(
  communityId: string,
  referrerId: string,
  shareChannel: "whatsapp" | "linkedin" | "facebook" | "twitter" | "email" | "direct_link",
  customMessage?: string
) {
  const supabase = await createClient();

  // Generate unique referral code
  let referralCode = generateReferralCode();
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 5) {
    const { data } = await supabase
      .from("community_referrals")
      .select("id")
      .eq("referral_code", referralCode)
      .maybeSingle();

    if (!data) {
      isUnique = true;
    } else {
      referralCode = generateReferralCode();
      attempts++;
    }
  }

  if (!isUnique) {
    throw new Error("Failed to generate unique referral code");
  }

  // Create referral record
  const { data: referral, error } = await supabase
    .from("community_referrals")
    .insert({
      community_id: communityId,
      referrer_id: referrerId,
      referral_code: referralCode,
      share_channel: shareChannel,
      share_message: customMessage,
    })
    .select()
    .maybeSingle();

  if (error || !referral) {
    throw new Error("Failed to create referral");
  }

  return {
    referralId: referral.id,
    referralCode: referral.referral_code,
    shareUrl: buildShareUrl(communityId, referralCode),
  };
}

/**
 * Build share URL for different channels
 */
export function buildShareUrl(communityId: string, referralCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://square1ai.com";
  return `${baseUrl}/community/join?ref=${referralCode}`;
}

/**
 * Build social share URLs
 */
export function buildSocialShareUrl(
  platform: "whatsapp" | "linkedin" | "facebook" | "twitter" | "email",
  communityName: string,
  shareUrl: string,
  customMessage?: string
): string {
  const message = customMessage
    ? `${customMessage}\n\nJoin: ${shareUrl}`
    : `Join ${communityName} on Square 1 AI: ${shareUrl}`;

  switch (platform) {
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(message)}`;

    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

    case "twitter":
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareUrl)}`;

    case "email":
      return `mailto:?subject=Join ${communityName} on Square 1 AI&body=${encodeURIComponent(message)}`;

    default:
      return shareUrl;
  }
}

/**
 * Track referral click
 */
export async function trackReferralClick(referralCode: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("community_referrals")
    .update({
      status: "clicked",
      clicked_at: new Date().toISOString(),
    })
    .eq("referral_code", referralCode)
    .eq("status", "pending");

  if (error) {
    console.error("Error tracking referral click:", error);
  }
}

/**
 * Track referral conversion (user joined)
 */
export async function trackReferralConversion(
  referralCode: string,
  userId: string,
  profileId: string
) {
  const supabase = await createClient();

  const { data: referral, error: fetchError } = await supabase
    .from("community_referrals")
    .select("id, community_id, share_channel")
    .eq("referral_code", referralCode)
    .maybeSingle();

  if (fetchError || !referral) {
    console.error("Referral not found:", fetchError);
    return;
  }

  // Update referral
  const { error: updateError } = await supabase
    .from("community_referrals")
    .update({
      status: "joined",
      referred_user_id: userId,
      referred_profile_id: profileId,
      joined_at: new Date().toISOString(),
    })
    .eq("referral_code", referralCode);

  if (updateError) {
    console.error("Error updating referral:", updateError);
    return;
  }

  // Update share analytics
  const { data: analytics } = await supabase
    .from("community_share_analytics")
    .select("id, total_shares, total_conversions, conversion_rate")
    .eq("community_id", referral.community_id)
    .eq("share_channel", referral.share_channel)
    .maybeSingle();

  if (analytics) {
    const newConversions = analytics.total_conversions + 1;
    const newRate =
      analytics.total_shares > 0
        ? (newConversions / analytics.total_shares) * 100
        : 0;

    await supabase
      .from("community_share_analytics")
      .update({
        total_conversions: newConversions,
        conversion_rate: newRate,
      })
      .eq("id", analytics.id);
  }
}

/**
 * Get referral stats for a community
 */
export async function getReferralStats(communityId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("community_share_analytics")
    .select("*")
    .eq("community_id", communityId)
    .order("total_conversions", { ascending: false });

  if (error) {
    console.error("Error fetching referral stats:", error);
    return [];
  }

  return data || [];
}

/**
 * Get user's referrals
 */
export async function getUserReferrals(
  communityId: string,
  referrerId: string
) {
  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from("community_referrals")
    .select(
      `
      id,
      referral_code,
      share_channel,
      status,
      total_shares,
      created_at,
      clicked_at,
      joined_at,
      community_profiles!referred_profile_id(
        id,
        avatar_url,
        bio
      )
    `,
      { count: "exact" }
    )
    .eq("community_id", communityId)
    .eq("referrer_id", referrerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user referrals:", error);
    return { referrals: [], count: 0 };
  }

  return { referrals: data || [], count: count || 0 };
}

/**
 * Generate community recommendations for user
 */
export async function generateRecommendations(userId: string) {
  const supabase = await createClient();

  // Get user's profile
  const { data: profile } = await supabase
    .from("community_profiles")
    .select("id, student_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) return;

  // Get user's course enrollments
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select("course_id")
    .eq("student_id", profile.student_id);

  if (!enrollments || enrollments.length === 0) return;

  const enrolledCourses = enrollments.map((e: any) => e.course_id);

  // Find communities by matching enrolled courses in their categories
  const { data: communities } = await supabase
    .from("communities")
    .select("id, category")
    .eq("is_private", false)
    .is("deleted_at", null)
    .neq("creator_id", profile.id);

  if (!communities) return;

  // Create recommendations
  const recommendations = [];

  for (const community of communities) {
    // Check if already a member
    const { data: membership } = await supabase
      .from("community_members")
      .select("id")
      .eq("community_id", community.id)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (membership) continue; // Already a member

    // Check if recommendation already exists
    const { data: existing } = await supabase
      .from("community_recommendations")
      .select("id")
      .eq("user_id", userId)
      .eq("community_id", community.id)
      .maybeSingle();

    if (existing) continue; // Already recommended

    // Calculate relevance score
    let score = 0.5;
    let reason = "trending";

    // Boost for enrollment match
    if (enrolledCourses.includes(community.category)) {
      score = 0.9;
      reason = "enrollment_match";
    }

    // Slight boost for category match
    if (["AI/ML", "Data Science", "Tech"].includes(community.category)) {
      score = Math.min(1, score + 0.2);
      reason = "skill_match";
    }

    recommendations.push({
      user_id: userId,
      community_id: community.id,
      reason,
      relevance_score: Math.min(1, score),
    });
  }

  // Batch insert recommendations
  if (recommendations.length > 0) {
    const { error } = await supabase
      .from("community_recommendations")
      .insert(recommendations);

    if (error) {
      console.error("Error creating recommendations:", error);
    }
  }
}

/**
 * Get user recommendations
 */
export async function getUserRecommendations(userId: string, limit: number = 10) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("community_recommendations")
    .select(
      `
      id,
      community_id,
      reason,
      relevance_score,
      communities(
        id,
        name,
        slug,
        description,
        category,
        memberCount: community_members(id, count: exact)
      )
    `
    )
    .eq("user_id", userId)
    .is("dismissed_at", null)
    .order("relevance_score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }

  return data || [];
}

/**
 * Dismiss a recommendation
 */
export async function dismissRecommendation(recommendationId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("community_recommendations")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", recommendationId);

  if (error) {
    console.error("Error dismissing recommendation:", error);
    throw error;
  }
}
