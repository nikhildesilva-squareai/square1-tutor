import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/communities/[id]
 * Get community details including creator, rules, and member count
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const communityId = (await params).id;

    // Get community details
    const { data: community, error } = await supabase
      .from("communities")
      .select(
        `
        id,
        name,
        slug,
        description,
        template_type,
        category,
        is_private,
        creator_id,
        created_at,
        updated_at,
        community_profiles!communities_creator_id_fkey(
          id,
          avatar_url,
          bio
        )
      `
      )
      .eq("id", communityId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !community) {
      console.error("Error fetching community:", error);
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    // Get member count
    const { count: memberCount } = await supabase
      .from("community_members")
      .select("id", { count: "exact", head: true })
      .eq("community_id", communityId);

    // Get current user's membership status
    const { data: { user } } = await supabase.auth.getUser();
    let userMembership = null;

    if (user) {
      const { data: profile } = await supabase
        .from("community_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        const { data: membership } = await supabase
          .from("community_members")
          .select("id, role, is_muted")
          .eq("community_id", communityId)
          .eq("profile_id", profile.id)
          .maybeSingle();

        userMembership = membership;
      }
    }

    // Get community rules (if any)
    const { data: rules } = await supabase
      .from("community_rules")
      .select("id, rule_text, order_index")
      .eq("community_id", communityId)
      .order("order_index", { ascending: true });

    return NextResponse.json({
      community: {
        ...community,
        memberCount: memberCount ?? 0,
        creator: community.community_profiles,
      },
      userMembership,
      rules: rules ?? [],
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
