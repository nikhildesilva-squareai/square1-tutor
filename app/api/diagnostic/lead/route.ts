import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { getSubject } from "@/lib/diagnostic";
import { COUNTRIES } from "@/lib/countries";

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/diagnostic/lead — the pre-test opt-in.
//
// Captured BEFORE question 1, so there is no score yet: this writes email +
// country and leaves score/results_url null. The post-results capture
// (/api/diagnostic/report-email) upserts the SAME (email, subject) row later and
// fills those in, so one person is one row through the whole funnel and
// `score is null` cleanly means "opted in, never finished the check".
//
// Two callers, two shapes:
//   • /diagnostic/[subject] — the track is already known, posts a real slug.
//   • /skill-check          — the gate runs BEFORE the track step (2026-08-11),
//                             so it posts PENDING_SUBJECT, then re-posts with
//                             the real slug + promoteFrom once a track is
//                             picked. The promote path MOVES that row instead
//                             of inserting a second one, which is what keeps
//                             "one person is one row" true.
//
// Deliberately does NOT create an account: no password, no auth session. This
// is an email opt-in, and every surface that leads here must say so.
// ═══════════════════════════════════════════════════════════════════════════════

/** Placeholder slug for a lead captured before the track step. Never a real
 *  subject, so `subject = 'skill-check'` in diagnostic_leads reads as
 *  "gated in, never got as far as choosing a track". */
export const PENDING_SUBJECT = "skill-check";

const schema = z.object({
  email: z.string().trim().email().max(200),
  // Optional since 2026-08-06: the opt-in form is email-only now. When absent,
  // country is derived from Vercel's geo header below. Still validated against
  // the canonical list when a (cached old) client does send it, so the column
  // stays joinable with students.country (same display-name values).
  country: z.string().trim().max(60).refine((c) => COUNTRIES.includes(c), {
    message: "Unknown country",
  }).optional(),
  subject: z.string().min(1).max(60),
  // When set, an existing row for (email, promoteFrom) is retargeted onto
  // `subject` rather than a new row being inserted.
  promoteFrom: z.string().min(1).max(60).optional(),
});

/** ISO-3166 alpha-2 (x-vercel-ip-country) → the same English display names the
 *  COUNTRIES list uses. Unknown or unmappable codes return null — better no
 *  country than a value the rest of the funnel can't join on. */
function countryFromGeoHeader(request: Request): string | null {
  const iso = request.headers.get("x-vercel-ip-country");
  if (!iso) return null;
  try {
    const name = new Intl.DisplayNames(["en"], { type: "region" }).of(iso.toUpperCase());
    return name && COUNTRIES.includes(name) ? name : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const rl = rateLimit(`diaglead:${ip}`, 5, 60_000);
  if (!rl.success) return rl.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { email, subject: slug, promoteFrom } = parsed.data;
  // PENDING_SUBJECT is the one non-subject value allowed through.
  if (slug !== PENDING_SUBJECT && !getSubject(slug)) {
    return NextResponse.json({ error: "Unknown subject" }, { status: 400 });
  }
  if (promoteFrom && promoteFrom !== PENDING_SUBJECT && !getSubject(promoteFrom)) {
    return NextResponse.json({ error: "Unknown subject" }, { status: 400 });
  }

  const address = email.toLowerCase();
  const country = parsed.data.country ?? countryFromGeoHeader(request);
  const admin = createAdminClient();

  // ── Promote: the gate already stored this person under a placeholder and we
  // now know their track. Move that row rather than adding a second one. If a
  // real row for (email, slug) already exists — they retook the same track —
  // the update hits the unique constraint, so we drop the placeholder instead.
  if (promoteFrom && promoteFrom !== slug) {
    try {
      const patch: Record<string, string> = { subject: slug };
      if (country) patch.country = country;
      const { error } = await admin
        .from("diagnostic_leads")
        .update(patch)
        .eq("email", address)
        .eq("subject", promoteFrom);
      if (error) {
        await admin.from("diagnostic_leads").delete().eq("email", address).eq("subject", promoteFrom);
      }
    } catch (e) {
      console.error("[diagnostic-lead] promote", e);
      // Non-fatal: the placeholder row still exists, so the lead is not lost.
    }
    return NextResponse.json({ ok: true });
  }

  // Only include country when we actually know it — an upsert with an explicit
  // null would wipe a value an earlier submission already stored.
  const row: Record<string, string> = { email: address, subject: slug };
  if (country) row.country = country;

  try {
    const { error } = await admin
      .from("diagnostic_leads")
      .upsert(row, { onConflict: "email,subject" });
    if (error) {
      console.error("[diagnostic-lead]", error);
      return NextResponse.json({ error: "Could not save" }, { status: 500 });
    }
  } catch (e) {
    console.error("[diagnostic-lead]", e);
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
