import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { callAI } from "@/lib/ai/budget";
import { extractJsonObject } from "@/lib/ai/json";
import { rateLimitAI } from "@/lib/rate-limit";
import { buildVerifiedProfile, inventoryBlock, curriculumBlock } from "@/lib/career/verified-profile";

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/career/analyze — the job-target gap map.
//
// Takes a pasted job posting, judges each concrete requirement against the
// student's VERIFIED record (graded projects, completions, assessment topics,
// Nova memory), and says which requirements are met, partially met, or missing
// — with evidence drawn only from that record, and gap-closing pointers drawn
// only from the modules of courses the student is enrolled in.
//
// Stateless by design: nothing is stored, the client keeps the result. One
// bounded AI call per analysis, wallet-charged like everything else.
// ═══════════════════════════════════════════════════════════════════════════════

const schema = z.object({
  jd: z.string().trim().min(100, "Paste the full job posting").max(12000),
});

const SYSTEM = `You are the career agent on Square 1 AI, a learning platform whose entire promise is PROOF: students' skills are demonstrated through graded work, never asserted.

You will receive a job posting and a student's verified record. Produce a requirement-by-requirement gap map as JSON.

Hard rules — these are the product, not suggestions:
- Evidence may reference ONLY the verified record. If the record doesn't support a requirement, it is "missing" — never stretch.
- "partial" means the record shows real but incomplete coverage; name exactly what's covered and what isn't.
- Gap-closing suggestions must name ONLY modules from the provided curriculum list, verbatim. If no listed module helps, set "closes" to null.
- Nice-to-have requirements (visa, location, salary, years-of-experience counts, degrees) go in with status "not_assessable" — a learning record cannot speak to them.
- readiness is your honest 0-100 judgement of how much of the ASSESSABLE technical bar the record clears. Do not flatter.

Return ONLY a JSON object:
{
  "role": "<job title from the posting>",
  "company": "<company name or null>",
  "readiness": <0-100>,
  "summary": "<2-3 sentences, direct and honest, addressed to the student>",
  "requirements": [
    { "req": "<the requirement, short>", "status": "met" | "partial" | "missing" | "not_assessable",
      "evidence": "<which verified item(s) support it, or null>",
      "closes": "<verbatim module name that closes the gap, or null>" }
  ]
}
Cap requirements at 10, most important first.`;

type Analysis = {
  role: string;
  company: string | null;
  readiness: number;
  summary: string;
  requirements: { req: string; status: string; evidence: string | null; closes: string | null }[];
};

const STATUSES = new Set(["met", "partial", "missing", "not_assessable"]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const { data: student } = await supabase
      .from("students").select("id, name").eq("user_id", user.id).maybeSingle();
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const rl = rateLimitAI(student.id);
    if (!rl.success) return rl.response;

    const profile = await buildVerifiedProfile(
      supabase, student.id, student.name ?? user.email?.split("@")[0] ?? "Student",
    );

    const userContent = [
      `JOB POSTING:\n${parsed.data.jd}`,
      inventoryBlock(profile),
      curriculumBlock(profile),
    ].filter(Boolean).join("\n\n---\n\n");

    const ai = await callAI(student.id, {
      feature: "career",
      system: SYSTEM,
      messages: [{ role: "user", content: userContent }],
      max_tokens: 1600,
      temperature: 0.2,
    });

    const result = extractJsonObject<Analysis>(ai.text);
    if (!result || !Array.isArray(result.requirements)) {
      return NextResponse.json({ error: "Could not analyse this posting — try again" }, { status: 502 });
    }

    // Clamp / sanitise before it reaches the client.
    const analysis: Analysis = {
      role: String(result.role ?? "This role").slice(0, 120),
      company: result.company ? String(result.company).slice(0, 120) : null,
      readiness: Math.max(0, Math.min(100, Math.round(Number(result.readiness) || 0))),
      summary: String(result.summary ?? "").slice(0, 600),
      requirements: result.requirements.slice(0, 10).map((r) => ({
        req: String(r.req ?? "").slice(0, 200),
        status: STATUSES.has(r.status) ? r.status : "not_assessable",
        evidence: r.evidence ? String(r.evidence).slice(0, 300) : null,
        closes: r.closes ? String(r.closes).slice(0, 120) : null,
      })).filter((r) => r.req),
    };

    return NextResponse.json({ analysis, emptyRecord: profile.isEmpty });
  } catch (err) {
    console.error("[career/analyze]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
