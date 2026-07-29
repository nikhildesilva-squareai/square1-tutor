import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

// ═══════════════════════════════════════════════════════════════════════════════
// The learner's own community invitations.
//
// Creating a public community used to join 20–50 real people to it outright.
// It now writes pending invites instead, and this is where the invitee acts on
// them: GET lists what's waiting, POST accepts (which is the ONLY path that
// creates the membership) or declines.
// ═══════════════════════════════════════════════════════════════════════════════

const actionSchema = z.object({
  inviteId: z.string().uuid(),
  action: z.enum(["accept", "decline"]),
});

/** Resolve the caller's community profile, or null. Keyed on user_id, the same
 * column the community_invites RLS policy uses, so this route and the policy
 * agree on who the caller is. */
async function callerProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from("community_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return profile ?? null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await callerProfile(supabase, user.id);
    if (!profile) return NextResponse.json({ invites: [] });

    const { data, error } = await supabase
      .from("community_invites")
      .select("id, sent_at, communities(id, name, slug, description, icon_url)")
      .eq("profile_id", profile.id)
      .eq("invite_status", "pending")
      .order("sent_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[communities/invites] list:", error);
      return NextResponse.json({ error: "Could not load invitations" }, { status: 500 });
    }

    return NextResponse.json({ invites: data ?? [] });
  } catch (error) {
    console.error("[communities/invites] GET unexpected:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { inviteId, action } = actionSchema.parse(await request.json());

    const profile = await callerProfile(supabase, user.id);
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // Scoped to the caller's own profile: someone else's invitation is simply
    // not found, so one learner can't accept or decline on another's behalf.
    const { data: invite } = await supabase
      .from("community_invites")
      .select("id, community_id, invite_status")
      .eq("id", inviteId)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!invite) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    if (invite.invite_status !== "pending") {
      return NextResponse.json({ error: "This invitation has already been answered" }, { status: 409 });
    }

    const admin = createAdminClient();

    if (action === "accept") {
      // Membership is created HERE and nowhere else in the seeding path — this
      // is the whole point of the change.
      const { error: joinError } = await admin
        .from("community_members")
        .insert({ community_id: invite.community_id, profile_id: profile.id, role: "member" });

      // 23505 = already a member (they joined directly before answering).
      // That's a success from the learner's point of view, not an error.
      if (joinError && joinError.code !== "23505") {
        console.error("[communities/invites] join:", joinError);
        return NextResponse.json({ error: "Could not join this community" }, { status: 500 });
      }
    }

    const { error: updateError } = await admin
      .from("community_invites")
      .update({
        invite_status: action === "accept" ? "accepted" : "declined",
        responded_at: new Date().toISOString(),
      })
      .eq("id", inviteId)
      .eq("profile_id", profile.id);

    if (updateError) {
      console.error("[communities/invites] update:", updateError);
      return NextResponse.json({ error: "Could not save your response" }, { status: 500 });
    }

    return NextResponse.json({ status: action === "accept" ? "accepted" : "declined" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[communities/invites] POST unexpected:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
