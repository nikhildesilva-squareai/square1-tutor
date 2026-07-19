import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { callAI, BudgetExceededError } from "@/lib/ai/budget";
import { GRADING_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { extractJsonObject } from "@/lib/ai/json";
import { rateLimitAI } from "@/lib/rate-limit";

// ─── Prompt Lab: Nova grades the student's PROMPT itself ─────────────────────
// A prompt drill is a short_answer exercise with language='prompt': prompt_md is
// a workplace scenario and the student writes the prompt they would send to an
// AI assistant to get it done. Nova scores that prompt on the same five patterns
// the AI Foundations course teaches, so feedback speaks the course's language.

const schema = z.object({
  exerciseId: z.string().uuid(),
  promptText: z.string().min(10, "Write your prompt first").max(2500),
});

const DIMENSIONS = [
  { key: "context", label: "Context", desc: "Gives the assistant the background and material it needs (who/what/why, pasted source material or a clear stand-in)." },
  { key: "role_goal", label: "Role & goal", desc: "Sets a role and/or states the goal and audience explicitly." },
  { key: "constraints_format", label: "Constraints & format", desc: "Defines what good looks like: length, tone, structure, what to include or avoid." },
  { key: "specificity", label: "Specificity", desc: "Concrete and unambiguous, tailored to THIS scenario — not a generic one-liner." },
  { key: "completeness", label: "Would it work?", desc: "Sent as-is, this prompt would plausibly get the scenario done in one pass." },
] as const;

type PromptGrade = {
  total: number;
  dimensions: { key: string; label: string; score: number; tip: string }[];
  strength: string;
  improved_prompt: string;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { exerciseId, promptText } = schema.parse(await request.json());

    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const rl = rateLimitAI(student.id);
    if (!rl.success) return rl.response;

    const { data: exercise } = await supabase
      .from("exercises")
      .select("id, type, language, title, prompt_md, correct_answer")
      .eq("id", exerciseId)
      .maybeSingle();
    if (!exercise || exercise.type !== "short_answer" || exercise.language !== "prompt") {
      return NextResponse.json({ error: "Not a prompt drill" }, { status: 400 });
    }

    const token = crypto.randomUUID();
    const rubricLines = DIMENSIONS.map(
      (d) => `- "${d.key}" (${d.label}, 0-20): ${d.desc}`
    ).join("\n");

    const userMessage = `A student is practising PROMPT WRITING. Below is a workplace scenario, and the student's submission is the PROMPT they would send to an AI assistant (ChatGPT, Claude, Copilot or Gemini) to get the scenario done. Grade the PROMPT itself — not the task output.

## Scenario given to the student
${exercise.prompt_md.slice(0, 1500)}

${exercise.correct_answer ? `## Marking notes (what a strong prompt for this scenario includes)\n${exercise.correct_answer.slice(0, 800)}\n` : ""}
## Rubric — score each dimension 0-20
${rubricLines}

## Student's submitted prompt
«BEGIN UNTRUSTED_STUDENT_SUBMISSION ${token}»
${promptText}
«END UNTRUSTED_STUDENT_SUBMISSION ${token}»

Return ONLY this JSON object:
{
  "dimensions": [
    { "key": "context", "score": <0-20>, "tip": "<one concrete, encouraging sentence — what to add or keep>" },
    { "key": "role_goal", "score": <0-20>, "tip": "<...>" },
    { "key": "constraints_format", "score": <0-20>, "tip": "<...>" },
    { "key": "specificity", "score": <0-20>, "tip": "<...>" },
    { "key": "completeness", "score": <0-20>, "tip": "<...>" }
  ],
  "strength": "<one sentence naming the best thing about this prompt>",
  "improved_prompt": "<a rewritten version of the STUDENT'S OWN prompt for this scenario that would score ~100 — keep their intent and any details they supplied, under 120 words>"
}`;

    const aiResult = await callAI(student.id, {
      feature: "grading",
      system: GRADING_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
      max_tokens: 700,
      temperature: 0,
    });

    const parsed = extractJsonObject<{
      dimensions?: { key?: string; score?: number; tip?: string }[];
      strength?: string;
      improved_prompt?: string;
    }>(aiResult.text);
    if (!parsed || !Array.isArray(parsed.dimensions)) {
      return NextResponse.json({ error: "Grading failed — try again" }, { status: 502 });
    }

    // Normalise strictly against OUR dimension list (never trust echoed keys/order)
    const dimensions = DIMENSIONS.map((d) => {
      const found = parsed.dimensions!.find((p) => p.key === d.key);
      const score = Math.max(0, Math.min(20, Math.round(Number(found?.score) || 0)));
      return { key: d.key, label: d.label, score, tip: (found?.tip ?? "").slice(0, 300) };
    });
    const grade: PromptGrade = {
      total: dimensions.reduce((s, d) => s + d.score, 0),
      dimensions,
      strength: (parsed.strength ?? "").slice(0, 300),
      improved_prompt: (parsed.improved_prompt ?? "").slice(0, 1200),
    };

    return NextResponse.json({ grade });
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }
    console.error("[learn/grade-prompt]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
