// Loads .env.local for the E2E rig.
//
// The repo has no dotenv dependency and the rule for this task was "one new
// dependency, @playwright/test" — so this is a ~15-line parser rather than a
// package. It reads the same file `next start` reads, so the rig and the app
// under test are guaranteed to be pointed at the same Supabase project.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let loaded = false;

export function loadEnv(): void {
  if (loaded) return;
  loaded = true;
  let raw: string;
  try {
    raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  } catch {
    return; // CI may inject the vars directly.
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export function required(name: string): string {
  loadEnv();
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} — the E2E rig needs it in .env.local`);
  return v;
}
