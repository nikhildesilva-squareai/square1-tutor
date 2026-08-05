/**
 * Capture REAL Nova grading output for the landing-page product tour.
 *
 * The tour needs to show what Nova actually says to a wrong answer. Nothing in
 * the DB stores that — feedback is generated per submission and returned to the
 * student, never persisted. Writing the copy by hand would put invented words in
 * the product's mouth on the highest-traffic page, so instead this script runs
 * real exercises through the REAL grading path and records the verbatim output.
 *
 * Same system prompt (GRADING_SYSTEM_PROMPT) and same user-message shape as
 * app/api/learn/submit/route.ts's gradeOneExercise. The only thing skipped is
 * per-student wallet accounting in lib/ai/budget, which is billing, not grading.
 *
 *   npx ts-node scripts/capture-nova-fixtures.ts
 *
 * Writes lib/tour-fixtures.json. Re-run to refresh; commit the result.
 */
import { readFileSync, writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { GRADING_SYSTEM_PROMPT } from "../lib/ai/prompts";

// .env.local isn't loaded outside Next, so parse it here.
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
}

const BASE = process.env.OSS_AI_BASE_URL!;
const KEY = process.env.OSS_AI_API_KEY!;
const MODEL = process.env.OSS_AI_MODEL!;

// NEAR-MISS answers, written per exercise. This matters more than it looks:
// a lazy answer just gets "you didn't answer the question", which demos nothing.
// A partially-right answer is what a real learner submits, and it's the only way
// to show the thing worth showing — Nova naming the SPECIFIC gap and awarding
// partial credit rather than a bare right/wrong.
const NEAR_MISS: Record<string, string> = {
  "Explain Hallucinations":
    "A hallucination is when the model makes up something that isn't true and states it confidently. It happens because the model is predicting the next token rather than looking anything up.",
  "Model Selection Framework":
    "I'd self-host an open-weights model on their own servers, because the patient data can't leave their infrastructure. That keeps everything private.",
  "Representation Bias Example":
    "Representation bias is when the training data doesn't reflect the population the model is used on, so some groups are underrepresented and the model performs worse for them.",
  "FPR Disparity Analysis":
    "The false positive rate is higher for one group than the other, which means the model is unfair and should be retrained.",
  default:
    "It makes the model better because it uses more data, so the accuracy goes up.",
};

async function grade(ex: {
  title: string; type: string; prompt_md: string; marks: number; correct_answer: string | null;
}, studentAnswer: string) {
  const userContent = `Exercise title: ${ex.title}
Exercise type: ${ex.type}
Exercise prompt: ${ex.prompt_md}
Max marks: ${ex.marks}
${ex.correct_answer ? `Reference answer: ${ex.correct_answer}` : ""}

Student's answer:
${studentAnswer}

Grade this submission. Respond in JSON format only:
{
  "score": <number from 0 to ${ex.marks}>,
  "correct": <true if full marks>,
  "feedback": "<1-2 sentences explaining the grade>"
}`;

  const res = await fetch(`${BASE.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      max_tokens: 600,
      messages: [
        { role: "system", content: GRADING_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

async function main() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Short-answer exercises grade through the model (MCQs are deterministic and
  // never reach Nova), so those are the only ones worth capturing.
  const { data: exercises, error } = await db
    .from("exercises")
    .select("id, title, type, prompt_md, marks, correct_answer, lesson_id")
    .eq("type", "short_answer")
    .not("prompt_md", "is", null)
    .limit(4);

  if (error) throw error;
  if (!exercises?.length) throw new Error("no short_answer exercises found");

  const fixtures = [];
  for (const ex of exercises) {
    const answer = NEAR_MISS[ex.title] ?? NEAR_MISS.default;
    process.stdout.write(`grading: ${ex.title.slice(0, 60)} … `);
    try {
      const raw = await grade(ex as never, answer);
      const parsed = JSON.parse(raw.replace(/^```(?:json)?|```$/g, "").trim());
      fixtures.push({
        exerciseTitle: ex.title,
        prompt: ex.prompt_md,
        maxMarks: ex.marks,
        studentAnswer: answer,
        score: parsed.score,
        correct: parsed.correct,
        feedback: parsed.feedback,
      });
      console.log(`ok (${parsed.score}/${ex.marks})`);
    } catch (e) {
      console.log(`FAILED: ${(e as Error).message.slice(0, 120)}`);
    }
  }

  writeFileSync("lib/tour-fixtures.json", JSON.stringify({ capturedWith: MODEL, fixtures }, null, 2));
  console.log(`\nwrote lib/tour-fixtures.json (${fixtures.length} fixtures)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
