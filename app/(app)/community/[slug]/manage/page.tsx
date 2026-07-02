import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { CommunityMemberManagement } from "@/components/CommunityMemberManagement";
import { CommunityModerationConsole } from "@/components/CommunityModerationConsole";

interface PageProps {
  params: { slug: string };
}

export default async function CommunityManagePage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch community
  const { data: community, error } = await supabase
    .from("communities")
    .select(
      `
      id,
      name,
      slug,
      creator_id,
      created_at
    `
    )
    .eq("slug", params.slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !community) {
    notFound();
  }

  // Get user's profile
  const { data: userProfile } = await supabase
    .from("community_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Get creator info to verify user is founder
  const { data: creatorProfile } = await supabase
    .from("community_profiles")
    .select("user_id")
    .eq("id", community.creator_id)
    .maybeSingle();

  const isFounder = creatorProfile?.user_id === user.id;

  // Get user's membership status
  let userRole = "member";
  if (userProfile) {
    const { data: membership } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", community.id)
      .eq("profile_id", userProfile.id)
      .maybeSingle();

    userRole = membership?.role || "member";
  }

  // Only founder or moderator can access
  if (!isFounder && userRole !== "moderator") {
    redirect(`/community/${community.slug}`);
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-ink mb-2">
          Manage {community.name}
        </h1>
        <p className="text-ink-muted">
          {isFounder
            ? "You can manage members, assign roles, and review moderation flags."
            : "As a moderator, you can manage members and review moderation flags."}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border mb-8">
        <a
          href="#members"
          className="px-4 py-3 font-semibold text-brand border-b-2 border-brand text-sm"
        >
          Members
        </a>
        <a
          href="#moderation"
          className="px-4 py-3 font-semibold text-ink-muted border-b-2 border-transparent hover:text-ink text-sm"
        >
          Moderation
        </a>
      </div>

      {/* Member Management Section */}
      <div id="members" className="mb-12">
        <h2 className="text-2xl font-bold text-ink mb-6">Member Management</h2>
        {userProfile && (
          <CommunityMemberManagement
            communityId={community.id}
            currentUserRole={userRole}
            isFounder={isFounder}
          />
        )}
      </div>

      {/* Moderation Section */}
      {isFounder && (
        <div id="moderation" className="mb-12">
          <h2 className="text-2xl font-bold text-ink mb-6">
            Moderation & Flags
          </h2>
          <CommunityModerationConsole communityId={community.id} />
        </div>
      )}

      {/* Settings Section (Future) */}
      <div className="mt-12 p-6 rounded-lg bg-surface border border-border text-center">
        <p className="text-ink-muted">
          Community settings coming soon (moderation rules, auto-flag settings, etc.)
        </p>
      </div>
    </div>
  );
}
