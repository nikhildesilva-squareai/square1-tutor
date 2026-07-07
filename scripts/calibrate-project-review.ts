/* ═══════════════════════════════════════════════════════════════════════════
 * Project-review calibration harness — runs fixture repos at known quality
 * tiers through the EXACT production review path (lib/grading/project-review.ts:
 * same system prompt, review prompt, parsing, fallback) and checks the scores
 * land in their expected bands.
 *
 * Usage:
 *   npx tsx scripts/calibrate-project-review.ts                 # Claude, prod model, 2 runs
 *   npx tsx scripts/calibrate-project-review.ts --runs 3
 *   npx tsx scripts/calibrate-project-review.ts --provider oss --model google/gemma-3-27b-it
 *
 * Fixtures live in golden-sets/projects/*.json: a REAL project + rubric with
 * synthetic repos (full / partial-with-leakage / broken-with-injection).
 *
 * Gates (non-zero exit if any fail):
 *   - every case's mean score inside its expected band
 *   - tier ordering preserved (full > partial > broken) per fixture file
 *   - run-to-run spread <= 15 points per case
 * ═══════════════════════════════════════════════════════════════════════════ */

import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { reviewProject, type RubricCriterion, type ProjectMeta } from "../lib/grading/project-review";
import type { RepoAnalysis } from "../lib/github/fetch-repo";
import { GRADING_SYSTEM_PROMPT } from "../lib/ai/prompts";
import { generate, type Provider } from "../lib/ai/providers";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROD_MODEL = "claude-sonnet-4-6"; // keep in sync with MODEL_SONNET in lib/ai/budget.ts
const CALL_SPACING_MS = 13_000;

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(ROOT, ".env.local"), "utf-8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* rely on ambient env */ }
}

interface ProjectFixtureCase {
  case_id: string;
  note: string;
  expected_band: [number, number];
  repo: RepoAnalysis;
}
interface ProjectFixtureFile {
  project_id: string;
  course: string;
  project: ProjectMeta;
  rubric: RubricCriterion[];
  cases: ProjectFixtureCase[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  loadEnvLocal();
  const args = process.argv.slice(2);
  const argVal = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const provider = (argVal("--provider") ?? "anthropic") as Provider;
  const model = argVal("--model") ?? (provider === "oss" ? (process.env.OSS_AI_MODEL ?? "") : PROD_MODEL);
  const runs = Number(argVal("--runs") ?? 2);
  if (provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not found."); process.exit(2);
  }

  const dir = join(ROOT, "golden-sets", "projects");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  if (!files.length) { console.error("No project fixtures in golden-sets/projects/."); process.exit(2); }

  console.log(`\nProject-review calibration — provider=${provider} model=${model} runs=${runs}`);

  let callCount = 0;
  const llm = async (p: { system: string; userContent: string; max_tokens: number }) => {
    if (callCount > 0) await sleep(CALL_SPACING_MS);
    callCount++;
    return generate(provider, {
      model, system: p.system, max_tokens: p.max_tokens, temperature: 0,
      messages: [{ role: "user", content: p.userContent }],
    });
  };

  interface CaseOut {
    fixture: string; case_id: string; band: [number, number];
    scores: number[]; mean: number; inBand: boolean; spread: number;
  }
  const out: CaseOut[] = [];
  const orderingOk: { fixture: string; ok: boolean }[] = [];

  for (const file of files) {
    const fx = JSON.parse(readFileSync(join(dir, file), "utf-8")) as ProjectFixtureFile;
    const perCase = new Map<string, number[]>();
    for (let run = 0; run < runs; run++) {
      for (const c of fx.cases) {
        const review = await reviewProject(
          fx.project, fx.rubric, `https://github.com/golden/${c.repo.repo}`, c.repo,
          undefined, null, llm, GRADING_SYSTEM_PROMPT,
        );
        const pct = review.max_score ? (review.score / review.max_score) * 100 : 0;
        const arr = perCase.get(c.case_id) ?? [];
        arr.push(Math.round(pct));
        perCase.set(c.case_id, arr);
        console.log(`  ${fx.course}/${c.case_id} run ${run + 1}/${runs}: ${Math.round(pct)}/100`);
      }
    }
    const means = new Map<string, number>();
    for (const c of fx.cases) {
      const scores = perCase.get(c.case_id) ?? [];
      const mean = scores.reduce((s, v) => s + v, 0) / (scores.length || 1);
      means.set(c.case_id, mean);
      out.push({
        fixture: file, case_id: c.case_id, band: c.expected_band, scores, mean,
        inBand: mean >= c.expected_band[0] && mean <= c.expected_band[1],
        spread: Math.max(...scores) - Math.min(...scores),
      });
    }
    // ordering: cases are authored best → worst in the fixture file
    const ordered = fx.cases.map((c) => means.get(c.case_id) ?? 0);
    orderingOk.push({ fixture: file, ok: ordered.every((v, i) => i === 0 || v < ordered[i - 1]) });
  }

  console.log("\ncase                        band        scores        mean   in-band  spread");
  console.log("─".repeat(80));
  for (const r of out) {
    console.log(`${r.case_id.padEnd(28)}${`[${r.band[0]},${r.band[1]}]`.padEnd(12)}${JSON.stringify(r.scores).padEnd(14)}${r.mean.toFixed(0).padEnd(7)}${(r.inBand ? "✓" : "✗").padEnd(9)}${r.spread}`);
  }
  const gates = [
    { name: "all cases within expected band", pass: out.every((r) => r.inBand) },
    { name: "tier ordering preserved (full > partial > broken)", pass: orderingOk.every((o) => o.ok) },
    { name: "run-to-run spread <= 15 points", pass: out.every((r) => r.spread <= 15) },
  ];
  console.log("");
  for (const g of gates) console.log(`  ${g.pass ? "PASS" : "FAIL"}  ${g.name}`);

  const reportDir = join(ROOT, "golden-sets", "reports");
  mkdirSync(reportDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const reportPath = join(reportDir, `${stamp}-projects-${provider}-${model.replace(/[^a-z0-9.-]/gi, "_")}.json`);
  writeFileSync(reportPath, JSON.stringify({ provider, model, runs, timestamp: new Date().toISOString(), gates, results: out }, null, 2));
  console.log(`\nreport: ${reportPath.replace(ROOT + "\\", "")}`);
  process.exit(gates.every((g) => g.pass) ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
