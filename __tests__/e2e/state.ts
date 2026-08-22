// The handoff between globalSetup, the specs and globalTeardown.
//
// Playwright runs those three in separate processes, so the fixture ids and the
// minted session cookies travel through a file rather than module state. It
// lives under .e2e/ (gitignored) and is rewritten on every run.

import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Fixture } from "./data";
import type { SessionCookie } from "./session";

export interface E2EState {
  fixture: Fixture;
  cookies: {
    studentA: SessionCookie[];
    studentB: SessionCookie[];
    admin: SessionCookie[];
  };
}

const STATE_PATH = resolve(process.cwd(), ".e2e", "state.json");

export function writeState(state: E2EState): void {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

export function readState(): E2EState {
  if (!existsSync(STATE_PATH)) {
    throw new Error(`No E2E state at ${STATE_PATH} — globalSetup did not run`);
  }
  return JSON.parse(readFileSync(STATE_PATH, "utf8")) as E2EState;
}

export function clearState(): void {
  rmSync(dirname(STATE_PATH), { recursive: true, force: true });
}
