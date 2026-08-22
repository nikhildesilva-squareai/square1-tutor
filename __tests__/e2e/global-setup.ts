import { loadEnv } from "./env";
import { seed, STUDENT_A_EMAIL, STUDENT_B_EMAIL, ADMIN_EMAIL } from "./data";
import { mintSessionCookies } from "./session";
import { writeState } from "./state";

export default async function globalSetup(): Promise<void> {
  loadEnv();
  console.log("[e2e] seeding fixture…");
  const fixture = await seed();
  console.log(`[e2e] test track ${fixture.bootcampId} · cohort ${fixture.cohortId}`);

  const [studentA, studentB, admin] = await Promise.all([
    mintSessionCookies(STUDENT_A_EMAIL),
    mintSessionCookies(STUDENT_B_EMAIL),
    mintSessionCookies(ADMIN_EMAIL),
  ]);
  console.log("[e2e] minted 3 sessions");

  writeState({ fixture, cookies: { studentA, studentB, admin } });
}
