import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { DIAG_SUBJECTS } from "@/lib/diagnostic";
import { rateLimit } from "@/lib/rate-limit";

// Public, unauthenticated funnel logging for the (pre-signup) diagnostic. Writes
// to diagnostic_events via the service-role client so the table stays RLS-locked.
// "started" fires when a subject skill-check PAGE opens (a page view);
// "quiz_started" when the visitor actually begins answering; "finished" when
// the results page loads. Session-scoped (anonymous id) so we can count started vs finished.
// Best-effort — analytics must never break the visitor's flow.

const SUBJECT_SLUGS = new Set(DIAG_SUBJECTS.map((s) => s.slug));
const schema = z.object({
  event: z.enum(["started", "quiz_started", "finished"]),
  subject: z.string().max(60).optional(),
  session_id: z.string().max(80).optional(),
  score: z.number().int().min(0).max(100).optional(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const rl = rateLimit(`diagevent:${ip}`, 60, 60_000);
  if (!rl.success) return rl.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  const { event, subject, session_id, score } = parsed.data;
  if (subject && !SUBJECT_SLUGS.has(subject)) {
    return NextResponse.json({ error: "Unknown subject" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    await admin.from("diagnostic_events").insert({
      event,
      subject: subject ?? null,
      session_id: session_id ?? null,
      score: score ?? null,
    });
  } catch {
    /* never break the funnel over analytics */
  }
  return NextResponse.json({ ok: true });
}
