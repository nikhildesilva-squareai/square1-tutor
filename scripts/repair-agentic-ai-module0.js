/**
 * One-off repair for agentic-ai, left half-migrated by the first (buggy) run of
 * apply-module0-programming.js.
 *
 * Its Module 0 was 0-indexed (0..4), so the blanket +18 shift put the refresher
 * lessons on 18..22 and the insert then collided at 18. Result: programming
 * lessons 1..17 present, lesson 18 missing, refreshers sitting at 18..22.
 *
 * Repair: push the five refreshers up by one (descending, so slots stay free),
 * giving 19..23, then insert the missing programming lesson 18.
 *
 * Run: node scripts/repair-agentic-ai-module0.js --apply
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content", "programming-foundations");
const APPLY = process.argv.includes("--apply");
const MODULE0 = "9ef48637-f743-48b6-82b9-e0cee8e26cfc";
const COURSE = "6b423e2a-19c7-4bd7-966a-00d3914b446f";

const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
const pick = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
};
const URL = pick("NEXT_PUBLIC_SUPABASE_URL");
const KEY = pick("SUPABASE_SERVICE_ROLE_KEY");

const rest = async (method, pathname, body) => {
  const res = await fetch(`${URL}/rest/v1/${pathname}`, {
    method,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${pathname} -> ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
};

const lessons = [];
for (let w = 1; w <= 6; w++) {
  const d = JSON.parse(fs.readFileSync(path.join(CONTENT, `week${w}.json`), "utf8").replace(/^﻿/, ""));
  d.lessons.forEach((l) => lessons.push(l));
}
lessons.sort((a, b) => a.order_index - b.order_index);
const missing = lessons.find((l) => l.order_index === 18);
const programmingTitles = new Set(lessons.map((l) => l.title));

(async () => {
  const rows = await rest("GET", `lessons?module_id=eq.${MODULE0}&select=id,order_index,title&order=order_index`);
  const refreshers = rows.filter((r) => !programmingTitles.has(r.title)).sort((a, b) => a.order_index - b.order_index);
  const haveProgramming = rows.filter((r) => programmingTitles.has(r.title));

  console.log(`Module 0 has ${rows.length} lessons: ${haveProgramming.length} programming, ${refreshers.length} refresher`);
  console.log(`Refreshers at: ${refreshers.map((r) => r.order_index).join(", ")}`);
  console.log(`Missing programming lesson: ${missing.order_index} "${missing.title}"`);

  if (haveProgramming.length !== 17 || refreshers.length !== 5) {
    console.log("State is not the expected half-migrated one — aborting so nothing is made worse.");
    return;
  }
  if (!APPLY) { console.log("\nDry run. Pass --apply to repair."); return; }

  // Push refreshers to 19..23, descending so each destination is free.
  for (let i = refreshers.length - 1; i >= 0; i--) {
    await rest("PATCH", `lessons?id=eq.${refreshers[i].id}`, { order_index: 19 + i });
  }
  console.log("Refreshers moved to 19..23");

  const [row] = await rest("POST", "lessons", {
    module_id: MODULE0,
    course_id: COURSE,
    order_index: missing.order_index,
    title: missing.title,
    theory_md: missing.theory_md,
    estimated_minutes: missing.estimated_minutes,
    learning_objectives: missing.learning_objectives,
    reference_links: [],
    case_study: missing.case_study,
  });
  await rest("POST", "exercises", missing.exercises.map((e) => ({
    lesson_id: row.id,
    order_index: e.order_index,
    type: e.type,
    title: e.title,
    prompt_md: e.prompt_md,
    marks: e.marks,
    language: e.language ?? null,
    options: e.options ?? null,
    correct_answer: e.correct_answer,
    starter_code: e.starter_code ?? null,
    solution_code: e.solution_code ?? null,
  })));
  console.log(`Inserted lesson 18 + ${missing.exercises.length} exercises`);

  const all = await rest("GET", `lessons?course_id=eq.${COURSE}&select=id`);
  await rest("PATCH", `courses?id=eq.${COURSE}`, { total_lessons: all.length });
  console.log(`agentic-ai repaired — course total_lessons = ${all.length}`);
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
