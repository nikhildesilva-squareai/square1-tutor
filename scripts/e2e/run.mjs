#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════
// `npm run test:e2e` — build the app with the bootcamp flag on, then drive it.
//
// WHY A SCRIPT AND NOT JUST `playwright test`
//
// BOOTCAMP_ENABLED in lib/flags.ts is a build-time constant, and proxy.ts turns
// every /bootcamp and /api/bootcamp URL into a bare 404 while it is false. So the
// product under test does not exist in a default build — there is nothing for a
// browser to visit. The flag has to be on when `next build` runs.
//
// lib/flags.ts is a PRODUCT decision file. Committing `BOOTCAMP_ENABLED = true`
// would put a $890 product in front of every visitor, so this script:
//
//   • refuses to run unless the file is in the exact expected state,
//   • changes exactly one line, in memory of the original BYTES,
//   • builds,
//   • restores those bytes immediately — before the tests even start, because
//     `next start` serves .next and never reads the source again,
//   • verifies the restore byte-for-byte and fails loudly if it does not match,
//   • and does all of that from a finally block plus signal handlers, so Ctrl-C
//     mid-build still puts the file back.
//
// The window in which the working tree is modified is the build, and nothing
// else. Pass `--skip-build` when the .next directory was already built this way.
// ═══════════════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const FLAGS = resolve(process.cwd(), "lib", "flags.ts");
const OFF = "export const BOOTCAMP_ENABLED = false;";
const ON = "export const BOOTCAMP_ENABLED = true;";

const args = process.argv.slice(2);
const skipBuild = args.includes("--skip-build");
const passthrough = args.filter((a) => a !== "--skip-build");

const original = readFileSync(FLAGS);
const originalHash = createHash("sha256").update(original).digest("hex");
let patched = false;

function restore() {
  if (!patched) return;
  writeFileSync(FLAGS, original);
  patched = false;
  const now = createHash("sha256").update(readFileSync(FLAGS)).digest("hex");
  if (now !== originalHash) {
    console.error(`\n[e2e] FATAL: lib/flags.ts was NOT restored (${originalHash} -> ${now}).`);
    console.error("[e2e] Restore it from git before doing anything else.");
    process.exit(2);
  }
  console.log("[e2e] lib/flags.ts restored (sha256 verified)");
}

for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => {
    restore();
    process.exit(130);
  });
}

function run(cmd, cmdArgs, env = {}) {
  const r = spawnSync(cmd, cmdArgs, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...env },
  });
  return r.status ?? 1;
}

let code = 1;
try {
  if (!skipBuild) {
    const text = original.toString("utf8");
    const hits = text.split(OFF).length - 1;
    if (hits !== 1) {
      console.error(
        `[e2e] lib/flags.ts does not contain exactly one "${OFF}" (found ${hits}).`,
      );
      console.error("[e2e] Refusing to patch a file I do not recognise.");
      process.exit(2);
    }
    writeFileSync(FLAGS, text.replace(OFF, ON), "utf8");
    patched = true;
    console.log("[e2e] BOOTCAMP_ENABLED flipped on for the build only");

    const buildCode = run("npx", ["next", "build"]);
    restore();
    if (buildCode !== 0) {
      console.error("[e2e] build failed");
      process.exit(buildCode);
    }
  } else {
    console.log("[e2e] --skip-build: reusing the existing .next build");
  }

  code = run("npx", ["playwright", "test", ...passthrough]);
} finally {
  restore();
}

process.exit(code);
