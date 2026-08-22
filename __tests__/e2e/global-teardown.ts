import { loadEnv } from "./env";
import { teardown, verifyClean } from "./data";
import { clearState } from "./state";

// Playwright runs globalTeardown after the last worker exits, whether the run
// passed, failed, or was stopped by --max-failures. That is the property this
// whole file exists for: the fixture writes to the production project, so a
// failing test must not be able to leave rows behind.
export default async function globalTeardown(): Promise<void> {
  loadEnv();
  console.log("[e2e] teardown…");
  for (const line of await teardown()) console.log(`[e2e]   ${line}`);

  const { clean, leftovers } = await verifyClean();
  if (clean) {
    console.log("[e2e] verified clean: no e2e-marked rows remain");
  } else {
    // Loud, and non-zero, because the alternative is test data quietly living
    // in the production database.
    console.error(`[e2e] LEFTOVERS: ${leftovers.join(", ")}`);
    process.exitCode = 1;
  }
  clearState();
}
