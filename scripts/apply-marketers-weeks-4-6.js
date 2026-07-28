/**
 * Extend "AI for Marketers" from 3 weeks to 6.
 *
 * Adds modules 4-6 (three lessons each, 12 exercises per lesson) and reframes
 * week 3's lesson 5 from the course capstone to a mid-course milestone, since
 * week 6 is now the finale. Content of that lesson is untouched - title only.
 *
 * Run:  node scripts/apply-marketers-weeks-4-6.js            (dry run)
 *       node scripts/apply-marketers-weeks-4-6.js --apply    (writes)
 *
 * Idempotent: modules that already exist are skipped, so a partial run can be
 * repeated safely.
 *
 * NOTE this course numbers lessons PER MODULE (1..n inside each week), unlike
 * the newer 6-week courses which number globally. The source JSON follows the
 * per-module convention and is inserted as-is.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content", "marketers-weeks-4-6");
const APPLY = process.argv.includes("--apply");
const SLUG = "ai-for-marketers";

const NEW_MODULES = [
  { order_index: 4, title: "Week 4 — The Marketing Automation Layer",
    description: "Stop retyping. Turn repeated campaign work into prompt chains and saved templates the whole team can reuse." },
  { order_index: 5, title: "Week 5 — Your Brand's AI Assistant",
    description: "Build a no-code assistant that holds your brand voice, positioning and claim rules - then test it before anyone relies on it." },
  { order_index: 6, title: "Week 6 — Capstone: The Marketing AI Operating System",
    description: "Combine your briefs, chains, templates and assistant into one documented, handover-ready system. Graded capstone." },
];

const OLD_CAPSTONE_TITLE = "Capstone: the full campaign pack (graded) → certificate";
const NEW_MILESTONE_TITLE = "Milestone: the full campaign pack (graded)";

const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
const pick = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
};
const URL = pick("NEXT_PUBLIC_SUPABASE_URL");
const KEY = pick("SUPABASE_SERVICE_ROLE_KEY");
if (!URL || !KEY) throw new Error("Missing Supabase env in .env.local");

const rest = async (method, p, body) => {
  const res = await fetch(`${URL}/rest/v1/${p}`, {
    method,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`${method} ${p} -> ${res.status} ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
};

const weeks = {};
for (const w of [4, 5, 6]) {
  weeks[w] = JSON.parse(fs.readFileSync(path.join(CONTENT, `week${w}.json`), "utf8").replace(/^﻿/, ""));
}

(async () => {
  const [course] = await rest("GET", `courses?slug=eq.${SLUG}&select=id,title,total_modules,total_lessons`);
  if (!course) throw new Error("course not found");
  console.log(`${APPLY ? "APPLYING" : "DRY RUN"} — ${course.title} (currently ${course.total_modules} modules / ${course.total_lessons} lessons)\n`);

  const existing = await rest("GET", `modules?course_id=eq.${course.id}&select=id,order_index,title&order=order_index`);
  console.log(`  existing modules: ${existing.map((m) => m.order_index).join(", ")}`);

  for (const spec of NEW_MODULES) {
    if (existing.some((m) => m.order_index === spec.order_index)) {
      console.log(`  SKIP  module ${spec.order_index} already exists`);
      continue;
    }
    const lessons = weeks[spec.order_index].lessons;
    if (!APPLY) {
      console.log(`  would add module ${spec.order_index} "${spec.title}" + ${lessons.length} lessons, ${lessons.reduce((n, l) => n + l.exercises.length, 0)} exercises`);
      continue;
    }
    const [mod] = await rest("POST", "modules", {
      course_id: course.id,
      order_index: spec.order_index,
      week_number: spec.order_index,
      title: spec.title,
      description: spec.description,
    });
    for (const l of lessons) {
      const [row] = await rest("POST", "lessons", {
        module_id: mod.id,
        course_id: course.id,
        order_index: l.order_index,
        title: l.title,
        theory_md: l.theory_md,
        estimated_minutes: l.estimated_minutes,
        learning_objectives: l.learning_objectives,
        reference_links: [],
        case_study: l.case_study,
      });
      await rest("POST", "exercises", l.exercises.map((e) => ({
        lesson_id: row.id,
        order_index: e.order_index,
        type: e.type,
        title: e.title,
        prompt_md: e.prompt_md,
        marks: e.marks,
        language: e.language ?? null,
        options: e.options ?? null,
        correct_answer: e.correct_answer,
      })));
    }
    console.log(`  OK    module ${spec.order_index} + ${lessons.length} lessons`);
  }

  // Reframe the old capstone: week 6 is the finale now.
  const oldCapstone = await rest("GET", `lessons?course_id=eq.${course.id}&title=eq.${encodeURIComponent(OLD_CAPSTONE_TITLE)}&select=id,title`);
  if (oldCapstone.length === 0) {
    console.log("  note: week-3 capstone lesson not found by title (already renamed?)");
  } else if (!APPLY) {
    console.log(`  would rename "${OLD_CAPSTONE_TITLE}" -> "${NEW_MILESTONE_TITLE}"`);
  } else {
    await rest("PATCH", `lessons?id=eq.${oldCapstone[0].id}`, { title: NEW_MILESTONE_TITLE });
    console.log(`  OK    renamed week-3 capstone to milestone`);
  }

  if (APPLY) {
    const mods = await rest("GET", `modules?course_id=eq.${course.id}&select=id`);
    const les = await rest("GET", `lessons?course_id=eq.${course.id}&select=id`);
    await rest("PATCH", `courses?id=eq.${course.id}`, { total_modules: mods.length, total_lessons: les.length });
    console.log(`\n  course now ${mods.length} modules / ${les.length} lessons`);
  }
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
