/**
 * Backfill the missing case studies on "AI Foundations".
 *
 * ai-foundations was the only course on the platform whose lessons had no
 * case_study - all 20 were NULL, while every other course carries one on every
 * lesson. This writes them in. Nothing else on the lessons is touched.
 *
 * Run:  node scripts/apply-foundations-case-studies.js            (dry run)
 *       node scripts/apply-foundations-case-studies.js --apply    (writes)
 *
 * Idempotent: a lesson that already has a non-empty case_study is skipped, so a
 * partial or interrupted run can be repeated safely.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content", "foundations-case-studies");
const APPLY = process.argv.includes("--apply");
const SLUG = "ai-foundations";

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
  console.log(`${APPLY ? "APPLYING" : "DRY RUN"} — ${SLUG} case studies\n`);

  const [course] = await rest("GET", `courses?slug=eq.${SLUG}&select=id,title`);
  if (!course) throw new Error("course not found");

  const modules = await rest("GET", `modules?course_id=eq.${course.id}&select=id,order_index&order=order_index`);
  let written = 0, skipped = 0;

  for (const w of [1, 2, 3, 4]) {
    const mod = modules.find((m) => m.order_index === w);
    if (!mod) { console.log(`  MISS  week ${w} module not found`); continue; }

    const src = JSON.parse(fs.readFileSync(path.join(CONTENT, `week${w}.json`), "utf8").replace(/^﻿/, ""));
    const lessons = await rest("GET", `lessons?module_id=eq.${mod.id}&select=id,order_index,title,case_study&order=order_index`);

    for (const s of src.studies) {
      const lesson = lessons.find((l) => l.order_index === s.order_index);
      if (!lesson) { console.log(`  MISS  w${w} lesson ${s.order_index} not found`); continue; }

      if (lesson.case_study && lesson.case_study.trim()) {
        console.log(`  SKIP  w${w}.${s.order_index} already has a case study`);
        skipped++;
        continue;
      }
      if (!APPLY) {
        console.log(`  would set w${w}.${s.order_index} "${lesson.title.slice(0, 44)}" <- ${s.brand} (${s.case_study.length} chars)`);
        written++;
        continue;
      }
      await rest("PATCH", `lessons?id=eq.${lesson.id}`, { case_study: s.case_study });
      console.log(`  OK    w${w}.${s.order_index} <- ${s.brand}`);
      written++;
    }
  }

  const remaining = await rest("GET", `lessons?course_id=eq.${course.id}&case_study=is.null&select=id`);
  console.log(`\n  ${APPLY ? "wrote" : "would write"} ${written}, skipped ${skipped}, still NULL after: ${APPLY ? remaining.length : "(dry run)"}`);
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
