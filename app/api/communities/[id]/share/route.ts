import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createReferral, buildSocialShareUrl } from "@/lib/community/sharing";

/**
 * POST /api/communities/[id]/share
 * Create a referral and get share URLs
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { shareChannel, customMessage } = await req.json();
    const communityId = params.id;

    // Validate share channel
    const validChannels = ["whatsapp", "linkedin", "facebook", "twitter", "email", "direct_link"];
    if (!validChannels.includes(shareChannel)) {
      return NextResponse.json(
        { error: "Invalid share channel" },
        { status: 400 }
      );
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from("community_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 500 }
      );
    }

    // Get community
    const { data: community } = await supabase
      .from("communities")
      .select("id, name")
      .eq("id", communityId)
      .maybeSingle();

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    // Create referral
    const { referralId, referralCode, shareUrl } = await createReferral(
      communityId,
      profile.id,
      shareChannel,
      customMessage
    );

    // Build social URLs
    const socialUrl = buildSocialShareUrl(
      shareChannel,
      community.name,
      shareUrl,
      customMessage
    );

    return NextResponse.json({
      referralId,
      referralCode,
      shareUrl,
      socialUrl,
      channel: shareChannel,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
