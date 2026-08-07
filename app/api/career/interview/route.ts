import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { callAI } from "@/lib/ai/budget";
import { extractJsonObject } from "@/lib/ai/json";
import { rateLimitAI } from "@/lib/rate-limit";
import { buildVerifiedProfile, inventoryBlock } from "@/lib/career/verified-profile";

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/career/interview — mock interview for a specific job posting.
//
// action:"questions" → 5 role-specific questions derived from the posting,
//   biased toward the student's KNOWN gaps (that's where practice pays).
// action:"grade"     → one answer scored /10 with the gap named, same
//   philosophy as exercise grading: partial credit and the specific missing
//   thing, not vibes.
//
// Stateless; the client holds the question list. Each grade is one bounded
// call — a full 5-question session costs fractions of a cent on the OSS stack.
// ═══════════════════════════════════════════════════════════════════════════════

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("questions"), jd: z.string().trim().min(100).max(12000) }),
  z.object({
    action: z.literal("grade"),
    jd: z.string().trim().min(100).max(12000),
    question: z.string().trim().min(5).max(600),
    answer: z.string().trim().min(1).max(4000),
  }),
]);

const QUESTIONS_SYSTEM = `You are a technical interviewer preparing to interview a candidate for the role in the job posting. Using the posting and the candidate's verified learning record, write exactly 5 interview questions:
- 3 technical questions on the posting's core requirements (favour areas the record marks as gaps or partial — practice belongs where it pays),
- 1 question asking them to walk through one of their actual listed projects, naming it verbatim — or, when the record lists NO projects, asking them to walk through the most advanced topic their completed lessons cover (never invent a project name),
- 1 behavioural question relevant to the role.
Questions must be answerable in speech (no whiteboard-only tasks). Return ONLY JSON:
{ "questions": [ { "q": "<question>", "focus": "<one short phrase: what it probes>" } ] }`;

const GRADE_SYSTEM = `You are a fair, specific technical interviewer scoring one spoken-style interview answer. Score for correctness, depth, and communication — partial credit, and always name the specific thing missing from a full-marks answer. Judge only the answer given; the candidate's record is context for tailoring feedback, not a substitute for their answer. Return ONLY JSON:
{ "score": <0-10>, "feedback": "<2-3 sentences: what worked, what was missing>", "stronger": ["<point a strong answer would also cover>", "..."] }
Cap "stronger" at 3 points.`;

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

    if (parsed.data.action === "questions") {
      const ai = await callAI(student.id, {
        feature: "career",
        system: QUESTIONS_SYSTEM,
        messages: [{
          role: "user",
          content: `JOB POSTING:\n${parsed.data.jd}\n\n---\n\n${inventoryBlock(profile)}`,
        }],
        max_tokens: 900,
        temperature: 0.5,
      });
      const result = extractJsonObject<{ questions: { q: string; focus: string }[] }>(ai.text);
      if (!result || !Array.isArray(result.questions) || result.questions.length === 0) {
        return NextResponse.json({ error: "Could not generate questions — try again" }, { status: 502 });
      }
      return NextResponse.json({
        questions: result.questions.slice(0, 5).map((q) => ({
          q: String(q.q ?? "").slice(0, 500),
          focus: String(q.focus ?? "").slice(0, 80),
        })).filter((q) => q.q),
      });
    }

    // action === "grade"
    const ai = await callAI(student.id, {
      feature: "career",
      system: GRADE_SYSTEM,
      messages: [{
        role: "user",
        content: `JOB POSTING (context):\n${parsed.data.jd.slice(0, 4000)}\n\nQUESTION:\n${parsed.data.question}\n\nCANDIDATE'S ANSWER:\n${parsed.data.answer}\n\n---\n\n${inventoryBlock(profile)}`,
      }],
      max_tokens: 500,
      temperature: 0.2,
    });
    const result = extractJsonObject<{ score: number; feedback: string; stronger: string[] }>(ai.text);
    if (!result) return NextResponse.json({ error: "Could not grade this answer — try again" }, { status: 502 });

    return NextResponse.json({
      score: Math.max(0, Math.min(10, Math.round(Number(result.score) || 0))),
      feedback: String(result.feedback ?? "").slice(0, 600),
      stronger: (Array.isArray(result.stronger) ? result.stronger : []).slice(0, 3).map((s) => String(s).slice(0, 200)),
    });
  } catch (err) {
    console.error("[career/interview]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
