import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { getSubject } from "@/lib/diagnostic";
import { COUNTRIES } from "@/lib/countries";

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/diagnostic/lead — the pre-test soft opt-in.
//
// Captured BEFORE question 1, so there is no score yet: this writes email +
// country and leaves score/results_url null. The post-results capture
// (/api/diagnostic/report-email) upserts the SAME (email, subject) row later and
// fills those in, so one person is one row through the whole funnel and
// `score is null` cleanly means "opted in, never finished the check".
//
// Deliberately does NOT create an account. The check stays free and
// account-free; this is a mailing-list opt-in the visitor can skip.
// ═══════════════════════════════════════════════════════════════════════════════

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

  const { email, subject: slug } = parsed.data;
  if (!getSubject(slug)) return NextResponse.json({ error: "Unknown subject" }, { status: 400 });

  const country = parsed.data.country ?? countryFromGeoHeader(request);

  // Only include country when we actually know it — an upsert with an explicit
  // null would wipe a value an earlier submission already stored.
  const row: Record<string, string> = { email: email.toLowerCase(), subject: slug };
  if (country) row.country = country;

  try {
    const { error } = await createAdminClient()
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
