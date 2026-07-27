// Generate SQL that folds the "Programming from Zero" content into Module 0 of
// every technical course.
//
// Decision (2026-07-28): a beginner should learn to program INSIDE the course
// they picked, not by leaving it for a separate one. Module 0 therefore becomes
// programming-from-zero (18 lessons) followed by the existing domain refresher
// (5 lessons) = 23 lessons.
//
// Order of operations matters — lessons has UNIQUE(module_id, order_index):
//   1. shift the existing 5 refresher lessons from 1..5 to 19..23
//   2. insert the 18 programming lessons at 1..18
// Doing it the other way round collides on the unique index.
//
// Source of truth is content/programming-foundations/week*.json. Re-run this to
// regenerate; it is deterministic.
const fs = require("fs");
const path = require("path");

const CONTENT = path.join(__dirname, "..", "content", "programming-foundations");
const OUT = path.join(__dirname, "..", "content", "programming-foundations", "sql");

// The 10 technical courses, with their Module 0 id (order_index = 0).
// Fetched from the DB; regenerate this list if courses are added.
const TARGETS = JSON.parse(fs.readFileSync(path.join(CONTENT, "targets.json"), "utf8"));

const q = (s) => (s === null || s === undefined ? "NULL" : `'${String(s).replace(/'/g, "''")}'`);

// Load the 18 lessons in order.
const lessons = [];
for (let w = 1; w <= 6; w++) {
  const data = JSON.parse(fs.readFileSync(path.join(CONTENT, `week${w}.json`), "utf8").replace(/^﻿/, ""));
  data.lessons.forEach((l) => lessons.push(l));
}
lessons.sort((a, b) => a.order_index - b.order_index);
if (lessons.length !== 18) throw new Error(`expected 18 lessons, got ${lessons.length}`);

fs.mkdirSync(OUT, { recursive: true });

let fileCount = 0;
for (const t of TARGETS) {
  const stmts = [];

  // 1) Shift existing refresher lessons out of the way (idempotent: only touches
  //    rows still at 1..5, and only when 18 programming lessons are not present).
  stmts.push(
    `UPDATE lessons SET order_index = order_index + 18 WHERE module_id = '${t.module0_id}' AND order_index <= 5;`
  );

  // 2) Insert the programming lessons at 1..18.
  lessons.forEach((l) => {
    const objs = `ARRAY[${l.learning_objectives.map(q).join(", ")}]`;
    let s = `WITH nl AS (INSERT INTO lessons (module_id, course_id, order_index, title, theory_md, estimated_minutes, learning_objectives, reference_links, case_study) VALUES ('${t.module0_id}', '${t.course_id}', ${l.order_index}, ${q(l.title)}, ${q(l.theory_md)}, ${l.estimated_minutes}, ${objs}, '[]'::jsonb, ${q(l.case_study)}) RETURNING id)\n`;
    s += `INSERT INTO exercises (lesson_id, order_index, type, title, prompt_md, marks, language, options, correct_answer, starter_code, solution_code)\nSELECT nl.id, v.oi, v.ty, v.ti, v.pm, v.mk, v.lg, v.op::jsonb, v.ca, v.sc, v.sol FROM nl, (VALUES\n`;
    s += l.exercises
      .map((e) =>
        `  (${e.order_index}, ${q(e.type)}, ${q(e.title)}, ${q(e.prompt_md)}, ${e.marks}, ${e.language ? q(e.language) : "NULL"}, ${e.options ? q(JSON.stringify(e.options)) : "NULL"}, ${q(e.correct_answer)}, ${q(e.starter_code ?? null)}, ${q(e.solution_code ?? null)})`
      )
      .join(",\n");
    s += `\n) AS v(oi, ty, ti, pm, mk, lg, op, ca, sc, sol);`;
    stmts.push(s);
  });

  // 3) Keep the course totals honest.
  stmts.push(
    `UPDATE courses SET total_lessons = (SELECT count(*) FROM lessons WHERE course_id = '${t.course_id}') WHERE id = '${t.course_id}';`
  );

  fs.writeFileSync(path.join(OUT, `${t.slug}.sql`), stmts.join("\n\n") + "\n", "utf8");
  fileCount++;
}

console.log(`Wrote ${fileCount} SQL files (${lessons.length} lessons each + shift + totals) to content/programming-foundations/sql/`);
