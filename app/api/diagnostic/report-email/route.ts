import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import {
  getSubject,
  getDiagnostic,
  decodeAnswers,
  encodeAnswers,
  scoreDiagnostic,
  readinessBand,
} from "@/lib/diagnostic";
import { sendDiagnosticReport } from "@/lib/email/resend";

// Public "Email me my full report" capture on the diagnostic results page.
// The report itself is URL-encoded (?a=), so the emailed link reproduces it
// exactly — no account needed. The address is also stored as a lead
// (diagnostic_leads, service-role only) so completers who aren't ready to
// sign up stop vanishing forever. Score/band are recomputed SERVER-SIDE from
// the answers — the client never supplies them.

const schema = z.object({
  email: z.string().trim().email().max(200),
  subject: z.string().min(1).max(60),
  a: z.string().min(1).max(300),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const rl = rateLimit(`diagreport:${ip}`, 5, 60_000);
  if (!rl.success) return rl.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { email, subject: slug, a } = parsed.data;
  const subject = getSubject(slug);
  if (!subject) return NextResponse.json({ error: "Unknown subject" }, { status: 400 });

  const answers = decodeAnswers(a);
  if (!answers) return NextResponse.json({ error: "Invalid results" }, { status: 400 });

  const questions = getDiagnostic(slug);
  const result = scoreDiagnostic(questions, answers);
  const band = readinessBand(result.score);
  // Canonical re-encode (never echo raw client input into the link).
  const canonicalA = encodeAnswers(answers);
  const resultsUrl = `https://www.square1ai.com/diagnostic/${slug}/results?a=${canonicalA}`;
  const lessonUrl = `https://www.square1ai.com/try/${slug}`;

  // Store the lead — best-effort; the email must still send if this fails.
  try {
    await createAdminClient()
      .from("diagnostic_leads")
      .upsert(
        { email: email.toLowerCase(), subject: slug, score: result.score, results_url: resultsUrl },
        { onConflict: "email,subject" },
      );
  } catch {
    /* non-fatal */
  }

  try {
    await sendDiagnosticReport(email, {
      subjectTitle: subject.title,
      score: result.score,
      total: result.total,
      band,
      weakTopics: result.weakTopics,
      resultsUrl,
      lessonUrl,
    });
  } catch {
    return NextResponse.json({ error: "Could not send the email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
