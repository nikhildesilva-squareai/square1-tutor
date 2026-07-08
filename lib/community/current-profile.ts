import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve the logged-in user's community_profiles row id.
 *
 * Every community table keys off community_profiles.id (not auth.users.id), so
 * write routes need this bridge: getUser() -> community_profiles by user_id.
 * The app layout calls ensureCommunityProfile() on load, so an authed user
 * almost always has one; callers still handle the null case.
 */
export async function getCurrentProfile(
  supabase: SupabaseClient
): Promise<{ id: string; student_id: string } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("community_profiles")
    .select("id, student_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return profile ?? null;
}
