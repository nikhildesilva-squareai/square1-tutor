import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/community/current-profile";

/** POST /api/posts/[id]/collaborate — request to collaborate on a repo post (idempotent). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const me = await getCurrentProfile(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const postId = (await params).id;
    const { error } = await supabase
      .from("post_collaborations")
      .insert({ post_id: postId, profile_id: me.id });

    if (error && error.code !== "23505") {
      console.error("Error requesting collaboration:", error);
      return NextResponse.json({ error: "Failed to request collaboration" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE /api/posts/[id]/collaborate — withdraw the caller's collaboration request. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const me = await getCurrentProfile(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const postId = (await params).id;
    const { error } = await supabase
      .from("post_collaborations")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", me.id);

    if (error) {
      console.error("Error withdrawing collaboration:", error);
      return NextResponse.json({ error: "Failed to withdraw collaboration" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
