/**
 * Fold the programming-from-zero content into Module 0 of every technical course.
 *
 * Run:  node scripts/apply-module0-programming.js            (dry run — reports only)
 *       node scripts/apply-module0-programming.js --apply    (writes)
 *
 * Idempotent: a course whose Module 0 already contains the programming lessons
 * is skipped, so a partial run can be repeated safely.
 *
 * Uses the service-role key from .env.local because this is a bulk content
 * migration (10 courses x 18 lessons x 12 exercises); it is not reachable
 * through the normal RLS-scoped client.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content", "programming-foundations");
const APPLY = process.argv.includes("--apply");

// ── env ───────────────────────────────────────────────────────────────────────
const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
const pick = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
};
const URL = pick("NEXT_PUBLIC_SUPABASE_URL");
const KEY = pick("SUPABASE_SERVICE_ROLE_KEY");
if (!URL || !KEY) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");

const rest = async (method, pathname, body, extraHeaders = {}) => {
  const res = await fetch(`${URL}/rest/v1/${pathname}`, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${pathname} -> ${res.status} ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : null;
};

// ── source content ────────────────────────────────────────────────────────────
const targets = JSON.parse(fs.readFileSync(path.join(CONTENT, "targets.json"), "utf8"));
const lessons = [];
for (let w = 1; w <= 6; w++) {
  const d = JSON.parse(fs.readFileSync(path.join(CONTENT, `week${w}.json`), "utf8").replace(/^﻿/, ""));
  d.lessons.forEach((l) => lessons.push(l));
}
lessons.sort((a, b) => a.order_index - b.order_index);
if (lessons.length !== 18) throw new Error(`expected 18 lessons, got ${lessons.length}`);
const FIRST_TITLE = lessons[0].title;

(async () => {
  console.log(`${APPLY ? "APPLYING" : "DRY RUN"} — ${targets.length} courses, ${lessons.length} lessons each\n`);
  let done = 0, skipped = 0;

  for (const t of targets) {
    // Already folded in? (idempotency guard)
    const existing = await rest("GET", `lessons?module_id=eq.${t.module0_id}&select=id,order_index,title&order=order_index`);
    if (existing.some((l) => l.title === FIRST_TITLE)) {
      console.log(`  SKIP  ${t.slug} — programming lessons already present (${existing.length} in Module 0)`);
      skipped++;
      continue;
    }
    if (existing.length !== 5) {
      console.log(`  WARN  ${t.slug} — Module 0 has ${existing.length} lessons, expected 5. Skipping to be safe.`);
      skipped++;
      continue;
    }

    if (!APPLY) {
      console.log(`  would fold ${t.slug}: shift ${existing.length} refresher lessons to 19..23, insert 18 at 1..18`);
      done++;
      continue;
    }

    // 1) Move the refresher lessons to 19, 20, 21… by RANK, not by a fixed
    //    offset. Module 0 is 1-indexed in most courses but 0-indexed in at least
    //    one (agentic-ai), where a blanket +18 lands the first lesson on 18 and
    //    collides with the last programming lesson. Ranking is numbering-agnostic.
    //    Descending order so each target slot is free as we go.
    const ordered = [...existing].sort((a, b) => a.order_index - b.order_index);
    for (let i = ordered.length - 1; i >= 0; i--) {
      await rest("PATCH", `lessons?id=eq.${ordered[i].id}`, { order_index: lessons.length + 1 + i });
    }

    // 2) Insert the programming lessons + their exercises.
    for (const l of lessons) {
      const [row] = await rest("POST", "lessons", {
        module_id: t.module0_id,
        course_id: t.course_id,
        order_index: l.order_index,
        title: l.title,
        theory_md: l.theory_md,
        estimated_minutes: l.estimated_minutes,
        learning_objectives: l.learning_objectives,
        reference_links: [],
        case_study: l.case_study,
      });
      await rest(
        "POST",
        "exercises",
        l.exercises.map((e) => ({
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
        })),
      );
    }

    // 3) Keep the course total honest.
    const all = await rest("GET", `lessons?course_id=eq.${t.course_id}&select=id`);
    await rest("PATCH", `courses?id=eq.${t.course_id}`, { total_lessons: all.length });

    console.log(`  OK    ${t.slug} — Module 0 now 23 lessons, course total ${all.length}`);
    done++;
  }

  console.log(`\n${APPLY ? "Applied" : "Would apply"} to ${done} course(s); skipped ${skipped}.`);
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
