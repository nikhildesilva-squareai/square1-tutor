import { createClient } from "@/lib/supabase/server";
import { CommunityTabs } from "@/components/community/CommunityTabs";
import { PostFeedClient } from "@/components/community/PostFeedClient";

export const metadata = {
  title: "Post · Square 1 AI",
  description: "Share projects, start threads, and connect with members.",
};

export default async function CommunityFeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The app layout guarantees a session + community profile; resolve display bits.
  let me: { name?: string; avatarUrl?: string | null } = {};
  if (user) {
    const { data: profile } = await supabase
      .from("community_profiles")
      .select("avatar_url, student_id")
      .eq("user_id", user.id)
      .maybeSingle();
    let name: string | undefined;
    if (profile?.student_id) {
      const { data: student } = await supabase
        .from("students")
        .select("name")
        .eq("id", profile.student_id)
        .maybeSingle();
      name = student?.name ?? undefined;
    }
    me = { name: name ?? user.email?.split("@")[0], avatarUrl: profile?.avatar_url ?? null };
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <h1 className="text-2xl font-bold text-ink">Community</h1>
          <CommunityTabs />
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <PostFeedClient me={me} />
      </div>
    </div>
  );
}
