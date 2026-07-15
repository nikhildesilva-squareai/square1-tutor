/* Fast, offline verification of the Layer-3 manipulation guard.
 * Runs detectManipulation() over EVERY golden-set answer and checks:
 *   - every case_id containing "injection" is flagged  (no false negatives)
 *   - no other (legitimate) answer is flagged           (no false positives)
 * No API/key needed. Exits non-zero on any miss. */
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { detectManipulation } from "../lib/grading/assessment";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(ROOT, "golden-sets");
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

let injTotal = 0, injCaught = 0, falsePos = 0, legitTotal = 0;
const misses: string[] = [];
const falsePositives: string[] = [];

for (const f of files) {
  const set = JSON.parse(readFileSync(join(dir, f), "utf-8"));
  if (!Array.isArray(set.cases)) continue;
  for (const c of set.cases) {
    const isInjection = /injection/i.test(c.case_id);
    const flagged = detectManipulation(c.answer ?? "");
    if (isInjection) {
      injTotal++;
      if (flagged) injCaught++;
      else misses.push(`${f} :: ${c.case_id}`);
    } else {
      legitTotal++;
      if (flagged) { falsePos++; falsePositives.push(`${f} :: ${c.case_id}`); }
    }
  }
}

console.log(`\nInjection guard check over ${files.length} golden sets`);
console.log(`  injection cases flagged : ${injCaught}/${injTotal}`);
console.log(`  legit cases flagged     : ${falsePos}/${legitTotal}  (want 0)`);
if (misses.length) { console.log("\n  MISSED injection cases:"); misses.forEach((m) => console.log("   - " + m)); }
if (falsePositives.length) { console.log("\n  FALSE POSITIVES (legit flagged):"); falsePositives.forEach((m) => console.log("   - " + m)); }

const pass = injCaught === injTotal && falsePos === 0;
console.log(`\n  ${pass ? "PASS" : "FAIL"} — ${pass ? "all injections caught, no false positives" : "see above"}\n`);
process.exit(pass ? 0 : 1);
