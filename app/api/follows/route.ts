import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/community/current-profile";

/** POST /api/follows — follow a member. Body: { followingProfileId }. */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const me = await getCurrentProfile(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { followingProfileId } = await req.json();
    if (!followingProfileId || typeof followingProfileId !== "string") {
      return NextResponse.json({ error: "followingProfileId is required" }, { status: 400 });
    }
    if (followingProfileId === me.id) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    const { error } = await supabase
      .from("community_follows")
      .insert({ follower_profile_id: me.id, following_profile_id: followingProfileId });

    if (error && error.code !== "23505") {
      console.error("Error following member:", error);
      return NextResponse.json({ error: "Failed to follow" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, following: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE /api/follows — unfollow a member. Body: { followingProfileId }. */
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const me = await getCurrentProfile(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { followingProfileId } = await req.json();
    if (!followingProfileId || typeof followingProfileId !== "string") {
      return NextResponse.json({ error: "followingProfileId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("community_follows")
      .delete()
      .eq("follower_profile_id", me.id)
      .eq("following_profile_id", followingProfileId);

    if (error) {
      console.error("Error unfollowing member:", error);
      return NextResponse.json({ error: "Failed to unfollow" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, following: false });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
