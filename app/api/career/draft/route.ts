import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { callAI } from "@/lib/ai/budget";
import { rateLimitAI } from "@/lib/rate-limit";
import { buildVerifiedProfile, inventoryBlock } from "@/lib/career/verified-profile";

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/career/draft — CV or cover letter, grounded ONLY in verified work.
//
// The differentiator is honesty enforced by construction: the model receives
// nothing about the student except their graded record, and the rules require
// explicit [placeholders] for anything a learning platform cannot know
// (employment history, education, contact details). Every project claim
// carries its repo URL — the reader can open the evidence.
// ═══════════════════════════════════════════════════════════════════════════════

const schema = z.object({
  jd: z.string().trim().min(100).max(12000),
  kind: z.enum(["cv", "cover"]),
});

const SYSTEM = `You draft job-application documents for students of Square 1 AI. The platform's entire premise is verifiable proof, so:

HARD RULES:
- Claims may come ONLY from the verified record provided. Never invent employers, job titles, dates, degrees, certifications, or skills.
- Anything a CV normally has that the record cannot supply (work history, education, phone, city) becomes an explicit bracket placeholder like "[Add your work history]" — the student fills those in themselves.
- Every project mentioned must include its repo URL inline — the claim IS the link.
- Where the record shows a genuine gap relevant to the posting, do not paper over it; either omit or frame honestly as in progress.
- Tailor emphasis to the job posting: lead with the verified items the posting actually asks for.
- Output clean Markdown only. No preamble, no commentary — just the document.

For a CV: name as the heading, a 2-3 sentence profile summary, a "Verified skills" section (from tracks/topics/strengths), a "Projects — graded, with open repos" section (title, one-line outcome, tech, score, repo link), then placeholder sections for experience and education.
For a cover letter: ~250 words, specific to the role and company, professional but human, no clichés ("I am writing to express..."), grounded claims with the repo link for the strongest relevant project, closing with honest enthusiasm. Placeholders for name of hiring manager if unknown.`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const { data: student } = await supabase
      .from("students").select("id, name").eq("user_id", user.id).maybeSingle();
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const rl = rateLimitAI(student.id);
    if (!rl.success) return rl.response;

    const profile = await buildVerifiedProfile(
      supabase, student.id, student.name ?? user.email?.split("@")[0] ?? "Student",
    );

    if (profile.isEmpty) {
      return NextResponse.json({
        error: "No graded work yet — complete a lesson or submit a project first, so the draft has real evidence to stand on.",
      }, { status: 409 });
    }

    const ai = await callAI(student.id, {
      feature: "career",
      system: SYSTEM,
      messages: [{
        role: "user",
        content: `Draft a ${parsed.data.kind === "cv" ? "CV" : "cover letter"} for this posting.\n\nJOB POSTING:\n${parsed.data.jd}\n\n---\n\n${inventoryBlock(profile)}`,
      }],
      max_tokens: 1400,
      temperature: 0.4,
    });

    return NextResponse.json({ markdown: ai.text.trim() });
  } catch (err) {
    console.error("[career/draft]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
