import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Ensures a community profile exists for the current user.
 * If not, creates one automatically.
 *
 * This should be called on first access to any protected route.
 * Returns the profile or null if user is not authenticated.
 */
export async function ensureCommunityProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from("community_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingProfile) {
    return existingProfile;
  }

  // Profile doesn't exist, create one.
  // First, get the student record.
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (studentError || !student) {
    console.error("Could not find student record for user", user.id);
    return null;
  }

  // Insert via the service role — the community_profiles INSERT policy is
  // service-role-only (with_check=false for public), so the regular client
  // is blocked by RLS and the profile would silently never be created.
  const admin = createAdminClient();
  const { data: newProfile, error: profileError } = await admin
    .from("community_profiles")
    .insert({
      user_id: user.id,
      student_id: student.id,
    })
    .select("id")
    .single();

  if (profileError) {
    console.error("Error creating community profile:", profileError);
    return null;
  }

  return newProfile;
}
