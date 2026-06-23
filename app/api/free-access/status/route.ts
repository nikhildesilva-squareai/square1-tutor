import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { FREE_ACCESS_CAP, FREE_ACCESS_ENDS_AT, freeWindowOpen } from "@/lib/free-access";

export const dynamic = "force-dynamic";

/**
 * GET /api/free-access/status
 *
 * Tells the checkout/plan UI whether the free early-access trial is open and how
 * many seats remain. `canClaim` is the single signal the UI gates on: the window
 * is open AND (there's room OR this student already holds a seat).
 */
export async function GET() {
  const windowOpen = freeWindowOpen();

  // Count the cohort with the admin client so RLS doesn't hide other students'
  // claims from the tally.
  const admin = createAdminClient();
  const { count } = await admin
    .from("free_trial_claims")
    .select("student_id", { count: "exact", head: true });

  const claimed = count ?? 0;
  const remaining = Math.max(0, FREE_ACCESS_CAP - claimed);

  // Has the current user already claimed? (Best-effort; anonymous → false.)
  let claimedByMe = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: student } = await supabase
        .from("students").select("id").eq("user_id", user.id).maybeSingle();
      if (student) {
        const { data: mine } = await admin
          .from("free_trial_claims").select("student_id").eq("student_id", student.id).maybeSingle();
        claimedByMe = !!mine;
      }
    }
  } catch {
    // ignore — status is still useful without per-user info
  }

  const canClaim = windowOpen && (claimedByMe || remaining > 0);

  return NextResponse.json({
    open: windowOpen,
    full: claimed >= FREE_ACCESS_CAP,
    cap: FREE_ACCESS_CAP,
    claimed,
    remaining,
    claimedByMe,
    canClaim,
    endsAt: FREE_ACCESS_ENDS_AT,
  });
}
