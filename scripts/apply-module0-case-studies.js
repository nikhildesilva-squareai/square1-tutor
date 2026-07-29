/**
 * Backfill the missing Module 0 case studies on the technical courses.
 *
 * Every course carries a case study on each lesson except the Week-0 "Module 0"
 * on-ramps, which were added later and never got one. This writes them in.
 * Nothing else on the lessons is touched.
 *
 * Run:  node scripts/apply-module0-case-studies.js                    (dry run, all)
 *       node scripts/apply-module0-case-studies.js --apply            (writes all)
 *       node scripts/apply-module0-case-studies.js --apply --only cybersecurity
 *
 * Idempotent: a lesson that already has a non-empty case_study is skipped, so a
 * partial or interrupted run can be repeated safely.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content", "module0-case-studies");
const APPLY = process.argv.includes("--apply");
const onlyIdx = process.argv.indexOf("--only");
const ONLY = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;

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
  console.log(`${APPLY ? "APPLYING" : "DRY RUN"}${ONLY ? ` (only ${ONLY})` : ""} — Module 0 case studies\n`);

  const files = fs.readdirSync(CONTENT).filter((f) => f.endsWith(".json")).sort();
  let written = 0, skipped = 0, missing = 0;

  for (const file of files) {
    const slug = path.basename(file, ".json");
    if (ONLY && slug !== ONLY) continue;

    const src = JSON.parse(fs.readFileSync(path.join(CONTENT, file), "utf8").replace(/^﻿/, ""));

    const [course] = await rest("GET", `courses?slug=eq.${slug}&select=id,title`);
    if (!course) { console.log(`  MISS  ${slug}: course not found`); missing++; continue; }

    // Module 0 is the week-0 on-ramp; its lessons are numbered globally, so we
    // scope by module rather than trusting the lesson order_index alone.
    const [mod] = await rest("GET", `modules?course_id=eq.${course.id}&order_index=eq.0&select=id`);
    if (!mod) { console.log(`  MISS  ${slug}: no Module 0`); missing++; continue; }

    const lessons = await rest("GET", `lessons?module_id=eq.${mod.id}&select=id,order_index,title,case_study&order=order_index`);
    console.log(`${course.title}`);

    for (const s of src.studies) {
      const lesson = lessons.find((l) => l.order_index === s.order_index);
      if (!lesson) { console.log(`  MISS  order_index ${s.order_index} not in Module 0`); missing++; continue; }

      if (lesson.case_study && lesson.case_study.trim()) {
        console.log(`  SKIP  ${s.order_index} already has a case study`);
        skipped++;
        continue;
      }
      if (!APPLY) {
        console.log(`  would set ${s.order_index} "${lesson.title.slice(0, 42)}" <- ${s.brand} (${s.case_study.length} ch)`);
        written++;
        continue;
      }
      await rest("PATCH", `lessons?id=eq.${lesson.id}`, { case_study: s.case_study });
      console.log(`  OK    ${s.order_index} <- ${s.brand}`);
      written++;
    }
    console.log("");
  }

  console.log(`  ${APPLY ? "wrote" : "would write"} ${written}, skipped ${skipped}, unresolved ${missing}`);
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
