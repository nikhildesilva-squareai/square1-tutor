import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CommunityDetailClient } from "@/components/CommunityDetailClient";

export const revalidate = 10; // ISR: revalidate every 10 seconds

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = await createClient();

  const { data: community } = await supabase
    .from("communities")
    .select("name, description")
    .eq("slug", params.slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (!community) {
    return { title: "Community not found" };
  }

  return {
    title: `${community.name} · Community · Square 1 AI`,
    description: community.description || "Join this community to connect with peers and collaborate.",
  };
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch community by slug
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
    .eq("slug", params.slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !community) {
    notFound();
  }

  // Get member count
  const { count: memberCount } = await supabase
    .from("community_members")
    .select("id", { count: "exact", head: true })
    .eq("community_id", community.id);

  // Get current user's membership and profile
  let userMembership = null;
  let profile = null;
  let isFounder = false;

  if (user) {
    const { data: userProfile } = await supabase
      .from("community_profiles")
      .select("id, avatar_url, bio, student_id")
      .eq("user_id", user.id)
      .maybeSingle();

    profile = userProfile;

    if (profile) {
      const { data: membership } = await supabase
        .from("community_members")
        .select("id, role, is_muted")
        .eq("community_id", community.id)
        .eq("profile_id", profile.id)
        .maybeSingle();

      userMembership = membership;

      // Check if user is founder
      isFounder = community.creator_id === profile.id;
    }
  }

  // Get community rules
  const { data: rules } = await supabase
    .from("community_rules")
    .select("id, rule_text, order_index")
    .eq("community_id", community.id)
    .order("order_index", { ascending: true });

  // Get current user's profile
  let userProfile = null;
  if (user && profile) {
    userProfile = {
      id: profile.id,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      student_id: profile.student_id,
    };
  }

  const creator = community.community_profiles;
  const isMember = !!userMembership;

  return (
    <CommunityDetailClient
      community={{
        ...community,
        memberCount: memberCount ?? 0,
      }}
      creator={creator}
      rules={rules ?? []}
      isMember={isMember}
      userRole={userMembership?.role}
      isAuthorized={!!user}
      currentUserProfile={userProfile}
      isFounder={isFounder}
    />
  );
}
