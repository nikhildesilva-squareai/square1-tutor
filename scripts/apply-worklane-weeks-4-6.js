/**
 * Extend the remaining five work-lane courses from 3 weeks to 6.
 *
 * Sales, Finance, Founders, Teachers, Creators. Same shape as the Marketers
 * extension (scripts/apply-marketers-weeks-4-6.js): adds modules 4-6 with three
 * lessons each, and reframes the week-3 capstone as a mid-course milestone now
 * that week 6 is the finale.
 *
 * Run:  node scripts/apply-worklane-weeks-4-6.js            (dry run)
 *       node scripts/apply-worklane-weeks-4-6.js --apply    (writes)
 *       node scripts/apply-worklane-weeks-4-6.js --apply --only ai-for-sales
 *
 * Idempotent: modules that already exist are skipped, so a partial or
 * interrupted run can be repeated safely.
 *
 * These courses number lessons PER MODULE (1..n inside each week), not globally.
 * The source JSON follows that convention and is inserted as-is.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content", "worklane-weeks-4-6");
const APPLY = process.argv.includes("--apply");
const onlyIdx = process.argv.indexOf("--only");
const ONLY = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;

// Per-course module titles/descriptions for weeks 4-6.
const COURSES = {
  "ai-for-sales": [
    ["The Sales Automation Layer", "Turn the repeated parts of selling into prompt chains and saved templates, so the admin stops eating the week."],
    ["Your Sales AI Assistant", "Build a no-code assistant holding your product facts, pricing and battlecards - then test it before it faces a buyer."],
    ["Capstone: The Seller's AI Operating System", "Combine your briefs, chains, templates and assistant into one documented system a new rep could pick up. Graded capstone."],
  ],
  "ai-for-finance": [
    ["The Finance Automation Layer", "Prompt chains for the reporting cycle with the numbers verified between every step, plus templates for recurring work."],
    ["Your Finance AI Assistant", "A no-code assistant that speaks your organisation's reporting language - and the testing that earns it a place in the close."],
    ["Capstone: The Finance AI Operating System", "One documented, auditable system: system cards, sign-off, versioning and handover. Graded capstone."],
  ],
  "ai-for-founders": [
    ["The Founder Automation Layer", "Chains for the work that returns every week, built off one business context file that stays current."],
    ["Your Company's AI Assistant", "Turn the context file into an assistant your first hires can brief - tested so it never invents traction."],
    ["Capstone: The Founder's AI Operating System", "A documented system that survives your first hires, with the never-outsource zones held. Graded capstone."],
  ],
  "ai-for-teachers": [
    ["The Teaching Automation Layer", "Chains from scheme of work to assessment, and templates a department can share - with accuracy checked at every link."],
    ["Your Classroom AI Assistant", "A no-code assistant loaded with your specification and marking criteria, tested before it touches your teaching."],
    ["Capstone: The Teacher's AI Operating System", "One documented system with safeguarding and verification built in, ready to hand to a colleague. Graded capstone."],
  ],
  "ai-for-creators": [
    ["The Content Automation Layer", "One idea through research, outline, script and cut-downs as a chain - with your voice checked between links."],
    ["Your Voice-Trained AI Assistant", "An assistant that already knows how you sound, tested until it stays in voice and invents nothing."],
    ["Capstone: The Creator's AI Operating System", "A documented system you can delegate parts of while the voice and judgement stay yours. Graded capstone."],
  ],
};

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

(async () => {
  console.log(`${APPLY ? "APPLYING" : "DRY RUN"}${ONLY ? ` (only ${ONLY})` : ""}\n`);

  for (const [slug, mods] of Object.entries(COURSES)) {
    if (ONLY && slug !== ONLY) continue;

    const [course] = await rest("GET", `courses?slug=eq.${slug}&select=id,title,total_modules,total_lessons`);
    if (!course) { console.log(`  MISS  ${slug} not found`); continue; }
    console.log(`${course.title} — ${course.total_modules} modules / ${course.total_lessons} lessons`);

    const existing = await rest("GET", `modules?course_id=eq.${course.id}&select=id,order_index&order=order_index`);

    for (let i = 0; i < 3; i++) {
      const weekNo = i + 4;
      if (existing.some((m) => m.order_index === weekNo)) { console.log(`  SKIP  week ${weekNo} exists`); continue; }

      const src = JSON.parse(fs.readFileSync(path.join(CONTENT, slug, `week${weekNo}.json`), "utf8").replace(/^﻿/, ""));
      const [title, description] = mods[i];

      if (!APPLY) {
        console.log(`  would add week ${weekNo} "${title}" + ${src.lessons.length} lessons / ${src.lessons.reduce((n, l) => n + l.exercises.length, 0)} exercises`);
        continue;
      }

      const [mod] = await rest("POST", "modules", {
        course_id: course.id,
        order_index: weekNo,
        week_number: weekNo,
        title: `Week ${weekNo} — ${title}`,
        description,
      });
      for (const l of src.lessons) {
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
      console.log(`  OK    week ${weekNo} + ${src.lessons.length} lessons`);
    }

    // Reframe the old week-3 capstone: week 6 is the finale now. Matched on the
    // "Capstone:" prefix rather than an exact title, since each course words it
    // differently ("the deal pack", "the month-end pack", ...).
    const les = await rest("GET", `lessons?course_id=eq.${course.id}&select=id,title,module_id&order=order_index`);
    const oldCapstones = les.filter((l) => /^Capstone:/i.test(l.title) && !/operating system/i.test(l.title));
    for (const c of oldCapstones) {
      const newTitle = c.title.replace(/^Capstone:/i, "Milestone:").replace(/\s*(→|->)\s*certificate\s*$/i, "");
      if (!APPLY) { console.log(`  would rename "${c.title}" -> "${newTitle}"`); continue; }
      await rest("PATCH", `lessons?id=eq.${c.id}`, { title: newTitle });
      console.log(`  OK    renamed week-3 capstone -> milestone`);
    }

    if (APPLY) {
      const m = await rest("GET", `modules?course_id=eq.${course.id}&select=id`);
      const l = await rest("GET", `lessons?course_id=eq.${course.id}&select=id`);
      await rest("PATCH", `courses?id=eq.${course.id}`, { total_modules: m.length, total_lessons: l.length });
      console.log(`  ->    now ${m.length} modules / ${l.length} lessons\n`);
    } else console.log("");
  }
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
