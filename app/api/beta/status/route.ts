import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BETA_CAP } from "@/lib/beta";

// GET /api/beta/status — public. How many founding spots are left.
// Uses the service-role client to count beta students across the platform.
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("is_beta", true);
    const taken = count ?? 0;
    const spotsLeft = Math.max(0, BETA_CAP - taken);
    return NextResponse.json({ taken, total: BETA_CAP, spotsLeft, full: spotsLeft <= 0 });
  } catch {
    // If the service key isn't configured (e.g. local), fail open so the page still works
    return NextResponse.json({ taken: 0, total: BETA_CAP, spotsLeft: BETA_CAP, full: false });
  }
}
