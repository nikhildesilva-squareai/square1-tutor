/**
 * Backfill the missing case studies on the advanced-tier courses.
 *
 * The six advanced courses shipped with no case study on any lesson, while
 * every beginner course carries one on every lesson. This writes them in, one
 * week-file at a time. Nothing else on the lessons is touched.
 *
 * Content lives in content/advanced-case-studies/<course-slug>-w<week>.json.
 *
 * Run:  node scripts/apply-advanced-case-studies.js                          (dry run, all)
 *       node scripts/apply-advanced-case-studies.js --apply                  (writes all)
 *       node scripts/apply-advanced-case-studies.js --apply --only computer-vision-advanced
 *       node scripts/apply-advanced-case-studies.js --apply --file computer-vision-advanced-w1
 *
 * Idempotent: a lesson that already has a non-empty case_study is skipped, so a
 * partial or interrupted run can be repeated safely.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content", "advanced-case-studies");
const APPLY = process.argv.includes("--apply");
const arg = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const ONLY = arg("--only");
const FILE = arg("--file");

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

// Cache course + module lookups; a full run touches 31 week-files across 6 courses.
const courseCache = new Map();
const modCache = new Map();

async function getCourse(slug) {
  if (!courseCache.has(slug)) {
    const [c] = await rest("GET", `courses?slug=eq.${slug}&select=id,title`);
    courseCache.set(slug, c ?? null);
  }
  return courseCache.get(slug);
}
async function getModule(courseId, week) {
  const key = `${courseId}:${week}`;
  if (!modCache.has(key)) {
    const [m] = await rest("GET", `modules?course_id=eq.${courseId}&order_index=eq.${week}&select=id`);
    modCache.set(key, m ?? null);
  }
  return modCache.get(key);
}

(async () => {
  console.log(`${APPLY ? "APPLYING" : "DRY RUN"}${ONLY ? ` (only ${ONLY})` : ""}${FILE ? ` (file ${FILE})` : ""} — advanced case studies\n`);

  if (!fs.existsSync(CONTENT)) throw new Error(`missing ${CONTENT}`);
  // <slug>-w<week>.json, optionally -p<part> where one week was split across
  // agents (agentic-ai runs 15/10/15/15 lessons per module).
  const files = fs.readdirSync(CONTENT)
    .filter((f) => /^[a-z-]+-w\d+(?:-p\d+)?\.json$/.test(f))
    .sort();

  let written = 0, skipped = 0, missing = 0;

  for (const file of files) {
    const base = path.basename(file, ".json");
    if (FILE && base !== FILE) continue;

    const src = JSON.parse(fs.readFileSync(path.join(CONTENT, file), "utf8").replace(/^﻿/, ""));
    const slug = src.slug;
    const week = src.week;
    if (!slug || week === undefined) { console.log(`  MISS  ${file}: no slug/week in payload`); missing++; continue; }
    if (ONLY && slug !== ONLY) continue;

    const course = await getCourse(slug);
    if (!course) { console.log(`  MISS  ${file}: course '${slug}' not found`); missing++; continue; }

    const mod = await getModule(course.id, week);
    if (!mod) { console.log(`  MISS  ${file}: ${slug} has no module at order_index ${week}`); missing++; continue; }

    const lessons = await rest("GET", `lessons?module_id=eq.${mod.id}&select=id,order_index,title,case_study&order=order_index`);
    console.log(`${course.title} — week ${week}`);

    for (const s of src.studies) {
      const lesson = lessons.find((l) => l.order_index === s.order_index);
      if (!lesson) { console.log(`  MISS  order_index ${s.order_index} not in week ${week}`); missing++; continue; }

      if (lesson.case_study && lesson.case_study.trim()) {
        console.log(`  SKIP  ${s.order_index} already has a case study`);
        skipped++;
        continue;
      }
      if (!APPLY) {
        console.log(`  would set ${s.order_index} "${lesson.title.slice(0, 40)}" <- ${s.brand} (${s.case_study.length} ch)`);
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
