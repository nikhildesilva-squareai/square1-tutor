// ═══════════════════════════════════════════════════════════════════════════════
// E2E fixture: what the suite creates in the database, and how it is removed.
//
// .env.local points at the PRODUCTION Supabase project, so this file is written
// to two rules:
//
//   1. NOTHING REAL IS TOUCHED. Every row created here is new. The only existing
//      rows referenced are `courses` (read, for a foreign key) — never updated.
//      In particular the fixture does NOT hang a cohort off a real bootcamp:
//      getBootcamp() picks the soonest open cohort per track, so doing that
//      would change what the live catalogue shows for a real product.
//
//   2. EVERYTHING IS MARKED AND REMOVABLE. Test humans are `@e2e.square1ai.test`
//      (RFC 2606 reserved TLD — the domain cannot be registered, so a stray
//      email can never reach a real person). The test track is `e2e-test-track`.
//      teardown() is idempotent and runs from Playwright's globalTeardown, which
//      executes whether the run passed, failed or was interrupted.
//
// ROWS CREATED (all of them):
//   auth.users              3   e2e-student-a / e2e-student-b / e2e-admin
//   students                3   the profile rows app/api/auth/callback would make
//   community_profiles    0-3   created by (app)/layout.tsx on first signed-in hit
//   bootcamps               1   slug e2e-test-track
//   bootcamp_cohorts        1   under that bootcamp
//   bootcamp_gates          3   under that bootcamp
//   bootcamp_sessions       1   under that cohort
//   bootcamp_applications   2   created BY THE APP during the run
//   bootcamp_enrollments    1   created BY THE APP (s1_bootcamp_enrol)
//   student_enrollments     1   created BY THE APP (same RPC)
//   bootcamp_payments       1   created BY THE APP
//   bootcamp_audit_log     ~2   created BY THE APP, actor_email = the test admin
// ═══════════════════════════════════════════════════════════════════════════════

import { adminClient, ensureAuthUser, findAuthUserByEmail } from "./session";

export const E2E_DOMAIN = "e2e.square1ai.test";
export const STUDENT_A_EMAIL = `e2e-student-a@${E2E_DOMAIN}`;
export const STUDENT_B_EMAIL = `e2e-student-b@${E2E_DOMAIN}`;
export const ADMIN_EMAIL = `e2e-admin@${E2E_DOMAIN}`;
export const E2E_EMAILS = [STUDENT_A_EMAIL, STUDENT_B_EMAIL, ADMIN_EMAIL];

export const BOOTCAMP_SLUG = "e2e-test-track";
export const BOOTCAMP_TITLE = "E2E Verification Track";
export const COHORT_NAME = "E2E Cohort";
export const SESSION_TITLE = "E2E Kickoff Class";
export const GATE_TITLES = ["E2E Gate One", "E2E Gate Two", "E2E Gate Three"];

/** Student A is US -> the `global` price table. Asserted against BOOTCAMP_PRICING. */
export const STUDENT_A_COUNTRY = "US";
export const HOURS_COMMITTED = 12;
export const MOTIVATION = "E2E fixture motivation - automated verification run.";

const DAY_MS = 86_400_000;

export interface Fixture {
  bootcampId: string;
  cohortId: string;
  courseSlug: string;
  gateIds: string[];
  sessionId: string;
  studentAId: string;
  studentBId: string;
  adminStudentId: string;
  /** YYYY-MM-DD */
  startsOn: string;
  weeks: number;
}

function day(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Create the test humans and the test track.
 *
 * The application, the enrolment and the payment are deliberately NOT seeded —
 * the point of the suite is that the app creates them through its own routes.
 */
export async function seed(): Promise<Fixture> {
  const admin = adminClient();
  await teardown(); // a previous interrupted run must not poison this one

  // ── a real course to hang the track off (READ ONLY) ───────────────────────
  const { data: courseRow, error: courseErr } = await admin
    .from("courses")
    .select("id, slug")
    .eq("status", "active")
    .order("slug")
    .limit(1)
    .maybeSingle();
  if (courseErr || !courseRow) throw new Error("no active course to attach the test track to");
  const course = courseRow as { id: string; slug: string };

  // ── humans ────────────────────────────────────────────────────────────────
  const studentAId = await ensureStudent(STUDENT_A_EMAIL, "E2E Student A", STUDENT_A_COUNTRY);
  const studentBId = await ensureStudent(STUDENT_B_EMAIL, "E2E Student B", STUDENT_A_COUNTRY);
  const adminStudentId = await ensureStudent(ADMIN_EMAIL, "E2E Desk Admin", STUDENT_A_COUNTRY);

  // ── the track ─────────────────────────────────────────────────────────────
  const weeks = 24;
  const { data: bootcampRow, error: bcErr } = await admin
    .from("bootcamps")
    .insert({
      course_id: course.id,
      slug: BOOTCAMP_SLUG,
      title: BOOTCAMP_TITLE,
      tagline: "Automated end-to-end verification track. Not a real product.",
      overview_md: "",
      weeks,
      hours_per_week: 15,
      default_cohort_size: 50,
      status: "open",
    })
    .select("id")
    .single();
  if (bcErr || !bootcampRow) throw new Error(`seed bootcamp failed: ${bcErr?.message}`);
  const bootcampId = (bootcampRow as { id: string }).id;

  // Window chosen so the offer maths is deterministic: offerExpiry() is
  // min(now + 7d, applications_close, cohort start), and both hard dates are
  // further out than seven days — so an acceptance made during the run always
  // reads "7 days left" and the assertion is not date-flaky.
  const startsOn = day(30);
  const endsOn = day(30 + weeks * 7);
  const { data: cohortRow, error: coErr } = await admin
    .from("bootcamp_cohorts")
    .insert({
      bootcamp_id: bootcampId,
      name: COHORT_NAME,
      band: "A",
      timezone: "Asia/Colombo",
      starts_on: startsOn,
      ends_on: endsOn,
      applications_open_on: day(-5),
      applications_close_on: day(20),
      seats: 50,
      price_cents_global: 89000,
      price_cents_regional: 49000,
      skip_weeks: [],
      status: "open",
    })
    .select("id")
    .single();
  if (coErr || !cohortRow) throw new Error(`seed cohort failed: ${coErr?.message}`);
  const cohortId = (cohortRow as { id: string }).id;

  const { data: gateRows, error: gErr } = await admin
    .from("bootcamp_gates")
    .insert(
      GATE_TITLES.map((title, i) => ({
        bootcamp_id: bootcampId,
        order_index: i + 1,
        week: 5 + i * 5,
        title,
        summary_md: `Gate ${i + 1} of the automated verification track.`,
        // project_ids empty on purpose: the gate detail page must not depend on
        // a real project's rubric, and no real row may be referenced.
        requires: {
          min_score: 75,
          lessons_pct: 90,
          project_ids: [],
          human_signoff: true,
          attendance_pct: 70,
        },
        unlocks_module_ids: [],
      })),
    )
    .select("id, order_index");
  if (gErr || !gateRows) throw new Error(`seed gates failed: ${gErr?.message}`);
  const gateIds = (gateRows as { id: string; order_index: number }[])
    .sort((a, b) => a.order_index - b.order_index)
    .map((g) => g.id);

  // One future class, so the cockpit's live bar has something real to render.
  const { data: sessionRow, error: sErr } = await admin
    .from("bootcamp_sessions")
    .insert({
      cohort_id: cohortId,
      week: 1,
      kind: "class",
      title: SESSION_TITLE,
      starts_at: new Date(Date.now() + 31 * DAY_MS).toISOString(),
      duration_min: 90,
      status: "scheduled",
    })
    .select("id")
    .single();
  if (sErr || !sessionRow) throw new Error(`seed session failed: ${sErr?.message}`);

  return {
    bootcampId,
    cohortId,
    courseSlug: course.slug,
    gateIds,
    sessionId: (sessionRow as { id: string }).id,
    studentAId,
    studentBId,
    adminStudentId,
    startsOn,
    weeks,
  };
}

/** The auth user + the `students` row app/api/auth/callback would have created. */
async function ensureStudent(email: string, name: string, country: string): Promise<string> {
  const admin = adminClient();
  const userId = await ensureAuthUser(email);

  const { data: existing } = await admin
    .from("students").select("id").eq("user_id", userId).maybeSingle();
  if (existing) return (existing as { id: string }).id;

  const { data, error } = await admin
    .from("students")
    .insert({ user_id: userId, email, name, country })
    .select("id")
    .single();
  if (error || !data) throw new Error(`seed student ${email} failed: ${error?.message}`);
  return (data as { id: string }).id;
}

/**
 * Remove every row the suite could have created. Idempotent; safe to run twice
 * and safe to run when seed() never completed.
 *
 * Order is dictated by the ON DELETE rules in migrations 021/026:
 * bootcamp_payments RESTRICTs on both the application and the student, and
 * bootcamp_enrollments RESTRICTs on student_enrollments — so payments go first,
 * the bootcamp cascade takes the cohort/applications/enrolments/gates/sessions,
 * and only then can the base enrolment and the student rows go.
 */
export async function teardown(): Promise<string[]> {
  const admin = adminClient();
  const log: string[] = [];

  const { data: studentRows } = await admin
    .from("students").select("id, user_id, email").in("email", E2E_EMAILS);
  const students = (studentRows ?? []) as { id: string; user_id: string; email: string }[];
  const studentIds = students.map((s) => s.id);

  const { data: bcRows } = await admin
    .from("bootcamps").select("id").eq("slug", BOOTCAMP_SLUG);
  const bootcampIds = ((bcRows ?? []) as { id: string }[]).map((b) => b.id);

  if (studentIds.length) {
    await del(log, "bootcamp_payments", admin.from("bootcamp_payments").delete().in("student_id", studentIds));
  }
  await del(log, "bootcamp_audit_log", admin.from("bootcamp_audit_log").delete().eq("actor_email", ADMIN_EMAIL));

  if (bootcampIds.length) {
    // Cascades: cohorts → applications, enrolments, squads, sessions,
    // registrants, attendance, gate_results; and gates directly.
    await del(log, "bootcamps (cascade)", admin.from("bootcamps").delete().in("id", bootcampIds));
  }

  if (studentIds.length) {
    // Belt and braces: an enrolment against a REAL cohort would survive the
    // cascade above. The suite never creates one, but a half-finished manual
    // run might have.
    await del(log, "bootcamp_enrollments", admin.from("bootcamp_enrollments").delete().in("student_id", studentIds));
    await del(log, "student_enrollments", admin.from("student_enrollments").delete().in("student_id", studentIds));
    await del(log, "community_profiles", admin.from("community_profiles").delete().in("student_id", studentIds));
    await del(log, "students", admin.from("students").delete().in("id", studentIds));
  }

  for (const email of E2E_EMAILS) {
    const userId = await findAuthUserByEmail(admin, email);
    if (!userId) continue;
    const { error } = await admin.auth.admin.deleteUser(userId);
    log.push(error ? `auth.users ${email}: ERROR ${error.message}` : `auth.users ${email}: deleted`);
  }

  return log;
}

async function del(
  log: string[],
  label: string,
  query: PromiseLike<{ error: { message: string } | null }>,
): Promise<void> {
  const { error } = await query;
  log.push(error ? `${label}: ERROR ${error.message}` : `${label}: cleared`);
}

/** Proof for the run report: nothing marked `e2e` is left behind. */
export async function verifyClean(): Promise<{ clean: boolean; leftovers: string[] }> {
  const admin = adminClient();
  const leftovers: string[] = [];

  const { data: s } = await admin.from("students").select("id").in("email", E2E_EMAILS);
  if ((s ?? []).length) leftovers.push(`students: ${(s ?? []).length}`);

  const { data: b } = await admin.from("bootcamps").select("id").eq("slug", BOOTCAMP_SLUG);
  if ((b ?? []).length) leftovers.push(`bootcamps: ${(b ?? []).length}`);

  const { data: a } = await admin
    .from("bootcamp_audit_log").select("id").eq("actor_email", ADMIN_EMAIL);
  if ((a ?? []).length) leftovers.push(`bootcamp_audit_log: ${(a ?? []).length}`);

  for (const email of E2E_EMAILS) {
    if (await findAuthUserByEmail(adminClient(), email)) leftovers.push(`auth.users: ${email}`);
  }

  return { clean: leftovers.length === 0, leftovers };
}
