import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/community/current-profile";

/** POST /api/posts/[id]/like — like a post (idempotent). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const me = await getCurrentProfile(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const postId = (await params).id;
    const { error } = await supabase
      .from("post_likes")
      .insert({ post_id: postId, profile_id: me.id });

    // 23505 = unique violation → already liked, treat as success.
    if (error && error.code !== "23505") {
      console.error("Error liking post:", error);
      return NextResponse.json({ error: "Failed to like post" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE /api/posts/[id]/like — remove the caller's like. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const me = await getCurrentProfile(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const postId = (await params).id;
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", me.id);

    if (error) {
      console.error("Error unliking post:", error);
      return NextResponse.json({ error: "Failed to unlike post" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
