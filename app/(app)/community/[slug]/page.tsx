import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CommunityDetailClient } from "@/components/CommunityDetailClient";

export const revalidate = 10; // ISR: revalidate every 10 seconds

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = await createClient();
  const { slug } = await params;

  const { data: community } = await supabase
    .from("communities")
    .select("name, description")
    .eq("slug", slug)
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
  const { slug } = await params;
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
      icon_url,
      cover_url,
      created_at,
      updated_at,
      community_profiles!communities_creator_id_fkey(
        id,
        avatar_url,
        bio
      )
    `
    )
    .eq("slug", slug)
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

  // Supabase types this to-one `!fkey` embed as an array, but at runtime it is the
  // single creator profile. Normalise to one object (or undefined) so it matches
  // CommunityDetailClient's optional `creator` prop whichever shape comes back.
  const creatorRel = community.community_profiles as unknown;
  const creator = (Array.isArray(creatorRel) ? creatorRel[0] : creatorRel) as
    | { id: string; avatar_url?: string; bio?: string }
    | undefined;
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
