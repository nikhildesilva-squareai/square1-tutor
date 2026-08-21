// Runnable with the repo's built-in runner: `npm run test:bootcamp`
// (node --test + node:assert/strict, no test framework dependency — matches the
// rest of __tests__/bootcamp/).
//
// ═════════════════════════════════════════════════════════════════════════════
// S12 / T1 — INTEGRITY AND FORGERY TESTS
// ═════════════════════════════════════════════════════════════════════════════
//
// WHAT THIS GUARDS, AND WHY IT IS THE HIGHEST-VALUE TEST IN THE PRODUCT.
//
// The threat model for a bootcamp is INTEGRITY, not confidentiality. Nobody is
// trying to steal the curriculum; a student is trying to forge their own
// progress. The 2026-07-29 audit found exactly this on the self-paced side —
// students could write their own grades and mint their own certificates — and
// the bootcamp raises the stakes, because we sell the credential to employers as
// evidence and we take $441 for it. A forged pass is a lie told to a hiring
// manager with our name on it.
//
// Migration 021 answers that with TWO independent layers on every table:
//
//   1. RLS policies decide WHICH ROWS a role may see.
//   2. GRANTs decide WHICH VERBS AND COLUMNS a role may use at all.
//
// The second layer is the load-bearing one for forgery. A policy is a predicate
// somebody has to get right; a missing INSERT privilege is not something RLS can
// talk its way past. If `authenticated` holds no INSERT or UPDATE privilege on a
// single column of bootcamp_gate_results, then no policy, no PostgREST call and
// no crafted JWT can produce a write there. That is why the assertions below
// interrogate the GRANTS as the primary proof and treat the policies as
// corroboration.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THESE TESTS READ SQL TEXT INSTEAD OF TALKING TO A DATABASE
// ─────────────────────────────────────────────────────────────────────────────
//
// The only bootcamp database that exists is production (lqjlmaxcarvsqnqhbzdj),
// holding real student data, and this repo has no migration runner, no local
// Postgres and no DB credentials on the machine. A test suite that tried to
// forge a row would either have to write to production or be skipped in
// practice — and a skipped integrity test is worse than none, because it reads
// green.
//
// So the split is:
//
//   • HERE (offline, runs in CI, no credentials): the migrations are the
//     source of truth for the grants, and these tests assert that the source of
//     truth closes every hole. This catches the realistic regression — somebody
//     adds `GRANT UPDATE ON bootcamp_gate_results TO authenticated` in migration
//     029, or extends the bootcamp_gates column grant and sweeps `requires` in
//     with it. That is how these holes get reopened; not by Postgres changing
//     its mind.
//
//   • scripts/bootcamp-integrity-check.sql (online, READ-ONLY): proves the same
//     eight holes against the LIVE database using has_table_privilege /
//     has_column_privilege / has_function_privilege plus pg_policies. It writes
//     nothing, so it is safe to run against production. Run it after applying
//     any migration. It is the answer to "the migration file says X, but was it
//     actually applied?", which this file cannot know.
//
// Neither half is sufficient alone. This one runs on every commit; that one runs
// against reality.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE EIGHT HOLES
// ─────────────────────────────────────────────────────────────────────────────
//   1. Student writes their own bootcamp_gate_results row / status / rubric_pct
//   2. Student writes bootcamp_attendance
//   3. Student reads bootcamp_gates.requires (the withheld thresholds)
//   4. Student reads bootcamp_sessions.zoom_start_url (the host link)
//   5. Student reads another student's submission_comments
//   6. Student executes s1_bootcamp_enrol() directly (SECURITY DEFINER)
//   7. Student updates bootcamp_enrollments.standing / amount_paid_cents
//   8. anon reads or writes anything at all
//
// TODO(S8): a ninth hole — a student writing their own `watched_seconds` to
// claim recording credit toward the attendance gate — cannot be tested yet.
// That column does not exist; S8 (recording ingest) creates it. When it lands,
// add it to WITHHELD/NO_WRITE below and to scripts/bootcamp-integrity-check.sql.
// Weighted attendance is a gate input (live 1.0, watched 0.5), so a
// student-writable watched_seconds is a forged graduation by a slower route.
//
// Expected values here are hand-typed from migrations 021/022/024/025/026/027
// and from docs/bootcamp-prd.md. Nothing is read back out of the module or the
// file under test and asserted against itself — a test that asserts whatever the
// code currently says proves nothing.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  evaluateGate,
  canResubmit,
  deriveGateStatuses,
  BOOTCAMP_PASS_BAR,
  MAX_ATTEMPTS,
  RESUBMIT_WINDOW_DAYS,
  type GateRequirements,
  type GateEvidence,
  type GateStatus,
} from "../../lib/bootcamp/gates.ts";

// ═════════════════════════════════════════════════════════════════════════════
// Loading and parsing the migrations
// ═════════════════════════════════════════════════════════════════════════════

const MIGRATIONS_DIR = path.join(import.meta.dirname, "..", "..", "migrations");

/** Every migration, comment-stripped and whitespace-collapsed.
 *
 *  Comments MUST go first: these migrations explain themselves at length and
 *  half the prose contains the words GRANT, REVOKE and `requires`. Matching on
 *  commentary rather than statements is how this kind of test quietly stops
 *  testing anything. */
function loadSql(): string {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const raw = files
    .map((f) => fs.readFileSync(path.join(MIGRATIONS_DIR, f), "utf8"))
    .join("\n");
  return raw
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();
}

const SQL = loadSql();

/** Every table the bootcamp product owns. Hole 8 sweeps all of them. */
const BOOTCAMP_TABLES = [
  "bootcamps",
  "bootcamp_cohorts",
  "bootcamp_squads",
  "bootcamp_applications",
  "bootcamp_enrollments",
  "bootcamp_gates",
  "bootcamp_gate_results",
  "bootcamp_sessions",
  "bootcamp_session_registrants",
  "bootcamp_attendance",
  "bootcamp_payments",
  "bootcamp_waitlist",
  "bootcamp_audit_log",
  "submission_comments",
] as const;

type Priv = "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "ALL";

interface TableGrant {
  priv: Priv;
  /** null = whole table (every column, including ones added later). */
  columns: string[] | null;
  table: string;
  roles: string[];
}

const PRIV = "SELECT|INSERT|UPDATE|DELETE|ALL(?:\\s+PRIVILEGES)?";
const IDENT = "[a-z_][a-z0-9_]*";

function parseTableStatements(keyword: "GRANT" | "REVOKE"): TableGrant[] {
  // `ON FUNCTION public.f(...)` deliberately does not match: the identifier
  // group would capture FUNCTION and then fail on `public.`.
  const re = new RegExp(
    `${keyword}\\s+(${PRIV})\\s*(?:\\(([^)]*)\\))?\\s+ON\\s+(?:TABLE\\s+)?(?:public\\.)?(${IDENT})\\s+(?:TO|FROM)\\s+([^;]+);`,
    "gi",
  );
  const out: TableGrant[] = [];
  for (const m of SQL.matchAll(re)) {
    out.push({
      priv: m[1].toUpperCase().startsWith("ALL") ? "ALL" : (m[1].toUpperCase() as Priv),
      columns: m[2] ? m[2].split(",").map((c) => c.trim()).filter(Boolean) : null,
      table: m[3].toLowerCase(),
      roles: m[4].split(",").map((r) => r.trim().toLowerCase()),
    });
  }
  return out;
}

const GRANTS = parseTableStatements("GRANT");
const REVOKES = parseTableStatements("REVOKE");

/** Raw statements, for the parser self-check below. Splitting on ";" is safe for
 *  GRANT/REVOKE specifically: no fragment inside a $fn$ ... $fn$ body starts
 *  with either keyword. */
const STATEMENTS = SQL.split(";").map((s) => s.trim()).filter(Boolean);

function grantsOn(table: string): TableGrant[] {
  return GRANTS.filter((g) => g.table === table);
}

function grantsTo(table: string, role: string): TableGrant[] {
  return grantsOn(table).filter((g) => g.roles.includes(role));
}

/** Whole text of a CREATE FUNCTION, body included.
 *
 *  NOT taken from STATEMENTS: a plpgsql body is full of semicolons, so splitting
 *  on ";" truncates every function at its first statement — which would make
 *  "the guard forces author_id" pass or fail for reasons having nothing to do
 *  with the guard. Sliced on the dollar-quote tag instead. */
function functionSource(name: string): string | null {
  const head = SQL.match(new RegExp(`CREATE OR REPLACE FUNCTION (?:public\\.)?${name}\\s*\\(`, "i"));
  if (!head || head.index === undefined) return null;
  const start = head.index;
  const tail = SQL.slice(start);
  const tagged = tail.match(/AS\s+(\$[a-z_]*\$)/i);
  if (!tagged || tagged.index === undefined) return null;
  const tag = tagged[1];
  const bodyStart = tagged.index + tagged[0].length;
  const end = tail.indexOf(tag, bodyStart);
  return end === -1 ? tail : tail.slice(0, end + tag.length);
}

/** Text of every CREATE POLICY statement on a table. */
function policiesOn(table: string): string[] {
  const re = new RegExp(`^CREATE POLICY ${IDENT} ON (?:public\\.)?${table}(?![_a-z0-9])`, "i");
  return STATEMENTS.filter((s) => re.test(s));
}

/** The column-definition block of a CREATE TABLE, bounded by the next CREATE.
 *  Used only to prove a withheld column really EXISTS — so that "not in the
 *  grant" means "withheld" rather than "misspelled". */
function tableBody(table: string): string {
  const start = SQL.indexOf(`CREATE TABLE IF NOT EXISTS ${table} (`);
  assert.notEqual(start, -1, `no CREATE TABLE for ${table}`);
  const rest = SQL.slice(start + 20);
  const end = rest.indexOf(" CREATE ");
  return end === -1 ? rest : rest.slice(0, end);
}

function tableHasColumn(table: string, column: string): boolean {
  return new RegExp(`[(,]\\s*${column}\\s+[a-z]`, "i").test(tableBody(table));
}

// ═════════════════════════════════════════════════════════════════════════════
// Parser self-check — an integrity test whose parser silently matches nothing
// is the most dangerous file in the repo.
// ═════════════════════════════════════════════════════════════════════════════

describe("parser self-check", () => {
  test("the migrations actually loaded", () => {
    assert.ok(SQL.length > 20_000, `only ${SQL.length} chars of SQL loaded`);
    assert.ok(SQL.includes("CREATE TABLE IF NOT EXISTS bootcamp_gate_results ("));
  });

  test("comment prose is stripped, so matches come from statements only", () => {
    // This sentence is a COMMENT in 021. If it survives, every assertion below
    // that looks for an absence is worthless.
    assert.ok(
      !SQL.includes("THE FORGERY TARGET. A student who can write"),
      "comments were not stripped",
    );
  });

  test("every GRANT statement touching a bootcamp table was parsed", () => {
    for (const s of STATEMENTS) {
      if (!/^GRANT\b/i.test(s)) continue;
      if (/\bON\s+FUNCTION\b/i.test(s)) continue;
      const table = BOOTCAMP_TABLES.find((t) =>
        new RegExp(`\\bON\\s+(?:TABLE\\s+)?(?:public\\.)?${t}(?![_a-z0-9])`, "i").test(s),
      );
      if (!table) continue;
      const parsed = GRANTS.some((g) => g.table === table);
      assert.ok(parsed, `unparsed GRANT — this test is blind to it: "${s}"`);
    }
  });

  test("the tables under test are the ones the migrations create", () => {
    for (const t of BOOTCAMP_TABLES) {
      assert.ok(
        SQL.includes(`CREATE TABLE IF NOT EXISTS ${t} (`),
        `${t} is in the watch list but no migration creates it`,
      );
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// HOLE 1 — a student cannot write their own gate result
//
// bootcamp_gate_results IS the credential. status='passed' here is what a
// certificate, a portfolio and an employer shortlist are all derived from.
// ═════════════════════════════════════════════════════════════════════════════

describe("HOLE 1 — forging a gate result is REFUSED", () => {
  test("authenticated holds exactly one privilege on bootcamp_gate_results: SELECT", () => {
    const g = grantsTo("bootcamp_gate_results", "authenticated");
    assert.deepEqual(
      g.map((x) => x.priv),
      ["SELECT"],
      "the only grant on the forgery target must be SELECT",
    );
    assert.equal(g[0].columns, null, "and it is the plain table-wide read");
  });

  test("no INSERT grant exists — a student cannot create a gate result row", () => {
    const writes = grantsOn("bootcamp_gate_results").filter((g) => g.priv === "INSERT");
    assert.deepEqual(writes, [], "an INSERT grant on gate results forges a pass");
  });

  test("no UPDATE grant exists — status, rubric_pct and decided_at are unreachable", () => {
    // Named per the PRD's forgery list. `passed_at` in the story is `decided_at`
    // in the schema; the constraint bootcamp_gate_results_decision_attributed
    // makes decided_at inseparable from reviewer_id, so a decided row always
    // names a human.
    const writes = grantsOn("bootcamp_gate_results").filter((g) => g.priv === "UPDATE");
    assert.deepEqual(writes, [], "any UPDATE grant here rewrites a credential");
    for (const col of ["status", "rubric_pct", "decided_at", "attempts", "reviewer_id"]) {
      assert.ok(tableHasColumn("bootcamp_gate_results", col), `${col} should exist`);
    }
  });

  test("no DELETE grant — a failed gate cannot be made to disappear", () => {
    const del = grantsOn("bootcamp_gate_results").filter((g) => g.priv === "DELETE");
    assert.deepEqual(del, []);
  });

  test("no column-scoped grant sneaks a writable column in", () => {
    for (const g of grantsOn("bootcamp_gate_results")) {
      assert.equal(g.priv, "SELECT", `column grant of ${g.priv} on the forgery target`);
    }
  });

  test("the second layer: only a SELECT policy exists, no INSERT/UPDATE/ALL", () => {
    const policies = policiesOn("bootcamp_gate_results");
    assert.equal(policies.length, 1, "exactly one policy is expected");
    assert.ok(/FOR SELECT TO authenticated/i.test(policies[0]));
    for (const p of policies) {
      assert.ok(!/FOR (INSERT|UPDATE|DELETE|ALL)\b/i.test(p), `write policy: ${p}`);
    }
  });

  test("the SELECT policy is scoped to the student's OWN enrolment", () => {
    const p = policiesOn("bootcamp_gate_results")[0];
    assert.ok(
      /student_id = public\.s1_student_id\(\)/i.test(p),
      "reading another student's gate results must be impossible too",
    );
    assert.ok(!/USING\s*\(\s*true\s*\)/i.test(p), "gate results must never be world-readable");
  });

  test("RLS is enabled, and privileges were revoked before anything was granted", () => {
    assert.ok(SQL.includes("ALTER TABLE bootcamp_gate_results ENABLE ROW LEVEL SECURITY"));
    const revoked = REVOKES.find(
      (r) => r.table === "bootcamp_gate_results" && r.priv === "ALL",
    );
    assert.ok(revoked, "Supabase grants ALL by default; it must be stripped first");
    assert.deepEqual(revoked!.roles, ["anon", "authenticated"]);
    // Order matters: a REVOKE after the GRANT would undo the read the app needs.
    assert.ok(
      SQL.indexOf("REVOKE ALL ON bootcamp_gate_results") <
        SQL.indexOf("GRANT SELECT ON bootcamp_gate_results"),
      "the REVOKE must precede the GRANT",
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// HOLE 2 — a student cannot write attendance
//
// Weighted attendance is a gate input (live 1.0, watched recording 0.5, and one
// gate requires 70%). A writable attendance row is a forged graduation by a
// quieter route than writing the gate result itself.
// ═════════════════════════════════════════════════════════════════════════════

describe("HOLE 2 — forging attendance is REFUSED", () => {
  test("authenticated holds exactly one privilege on bootcamp_attendance: SELECT", () => {
    const g = grantsTo("bootcamp_attendance", "authenticated");
    assert.deepEqual(g.map((x) => x.priv), ["SELECT"]);
    assert.equal(g[0].columns, null);
  });

  test("no INSERT / UPDATE / DELETE grant on attendance, for any role", () => {
    const writes = grantsOn("bootcamp_attendance").filter((g) => g.priv !== "SELECT");
    assert.deepEqual(writes, [], "attendance is webhook-written under the service role");
  });

  test("the columns a forger would want all exist and are all unwritable", () => {
    for (const col of ["status", "minutes_present", "weight", "source"]) {
      assert.ok(tableHasColumn("bootcamp_attendance", col));
    }
    assert.equal(grantsOn("bootcamp_attendance").filter((g) => g.columns !== null).length, 0);
  });

  test("only a SELECT policy exists, scoped to the student's own enrolment", () => {
    const policies = policiesOn("bootcamp_attendance");
    assert.equal(policies.length, 1);
    assert.ok(/FOR SELECT TO authenticated/i.test(policies[0]));
    assert.ok(/student_id = public\.s1_student_id\(\)/i.test(policies[0]));
  });

  test("RLS is enabled and privileges were revoked first", () => {
    assert.ok(SQL.includes("ALTER TABLE bootcamp_attendance ENABLE ROW LEVEL SECURITY"));
    const r = REVOKES.find((x) => x.table === "bootcamp_attendance" && x.priv === "ALL");
    assert.deepEqual(r?.roles, ["anon", "authenticated"]);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// HOLE 3 — bootcamp_gates.requires is unreadable by a student
//
// `requires` holds the pass thresholds. It is an answer key: a student who can
// read `{"attendance_pct": 70}` knows exactly how much class they can skip, and
// the whole "gates you cannot game" claim collapses. Note that RLS CANNOT close
// this one — the SELECT policy on bootcamp_gates is USING (true), because the
// titles and weeks are meant to be visible. Only the column grant withholds it.
// ═════════════════════════════════════════════════════════════════════════════

describe("HOLE 3 — reading the withheld gate thresholds is REFUSED", () => {
  // Hand-typed from migration 021. If somebody adds a column to bootcamp_gates
  // and re-lists this grant, this list is what makes them think about it.
  const READABLE_GATE_COLUMNS = [
    "id",
    "bootcamp_id",
    "order_index",
    "week",
    "title",
    "summary_md",
    "unlocks_module_ids",
    "created_at",
    "updated_at",
  ];

  test("`requires` is a real column of bootcamp_gates", () => {
    // Otherwise "absent from the grant" would mean nothing at all.
    assert.ok(tableHasColumn("bootcamp_gates", "requires"));
  });

  test("the grant enumerates columns — a table-wide SELECT would sweep requires in", () => {
    const g = grantsTo("bootcamp_gates", "authenticated");
    assert.equal(g.length, 1);
    assert.equal(g[0].priv, "SELECT");
    assert.notEqual(g[0].columns, null, "a bare GRANT SELECT ON bootcamp_gates leaks the answer key");
  });

  test("the readable column list is exactly the nine harmless ones", () => {
    const g = grantsTo("bootcamp_gates", "authenticated")[0];
    assert.deepEqual(g.columns, READABLE_GATE_COLUMNS);
    assert.ok(!g.columns!.includes("requires"));
  });

  test("no other grant on bootcamp_gates exists for any client role", () => {
    const others = grantsOn("bootcamp_gates").filter((g) => g.priv !== "SELECT");
    assert.deepEqual(others, [], "gates are authored under the service role");
  });

  test("`requires` is never granted anywhere in any migration", () => {
    // Belt and braces: catches a later migration doing GRANT SELECT (requires).
    const leak = GRANTS.find(
      (g) => g.table === "bootcamp_gates" && (g.columns ?? []).includes("requires"),
    );
    assert.equal(leak, undefined, "a migration grants the answer key");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// HOLE 4 — bootcamp_sessions.zoom_start_url is unreadable by a student
//
// That is the HOST url. Whoever holds it can start the meeting, admit people,
// mute the instructor, or run a class that is not ours. Like `requires`, RLS
// cannot help: the sessions policy is cohort-wide by design, because students
// need the schedule.
// ═════════════════════════════════════════════════════════════════════════════

describe("HOLE 4 — reading the Zoom host link is REFUSED", () => {
  // Hand-typed from migration 021. zoom_join_url IS present and that is correct:
  // it is the ordinary attendee link. zoom_start_url is the host link.
  const READABLE_SESSION_COLUMNS = [
    "id",
    "cohort_id",
    "week",
    "kind",
    "title",
    "starts_at",
    "duration_min",
    "host_id",
    "zoom_meeting_id",
    "zoom_join_url",
    "status",
    "created_at",
    "updated_at",
  ];

  test("zoom_start_url is a real column, distinct from zoom_join_url", () => {
    assert.ok(tableHasColumn("bootcamp_sessions", "zoom_start_url"));
    assert.ok(tableHasColumn("bootcamp_sessions", "zoom_join_url"));
  });

  test("the grant enumerates columns and omits the host link", () => {
    const g = grantsTo("bootcamp_sessions", "authenticated");
    assert.equal(g.length, 1);
    assert.equal(g[0].priv, "SELECT");
    assert.deepEqual(g[0].columns, READABLE_SESSION_COLUMNS);
    assert.ok(!g[0].columns!.includes("zoom_start_url"), "the host link is granted");
  });

  test("no write grant on sessions — a student cannot reschedule a class", () => {
    const writes = grantsOn("bootcamp_sessions").filter((g) => g.priv !== "SELECT");
    assert.deepEqual(writes, []);
  });

  test("zoom_start_url is never granted anywhere in any migration", () => {
    const leak = GRANTS.find(
      (g) => g.table === "bootcamp_sessions" && (g.columns ?? []).includes("zoom_start_url"),
    );
    assert.equal(leak, undefined);
  });

  test("per-student join links are readable only by their owner", () => {
    // The sibling hole: one shared class link makes attendance unattributable,
    // and another student's personal link is attendance fraud.
    const p = policiesOn("bootcamp_session_registrants");
    assert.equal(p.length, 1);
    assert.ok(/FOR SELECT TO authenticated/i.test(p[0]));
    assert.ok(/student_id = public\.s1_student_id\(\)/i.test(p[0]));
    const writes = grantsOn("bootcamp_session_registrants").filter((g) => g.priv !== "SELECT");
    assert.deepEqual(writes, []);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// HOLE 5 — a student cannot read another student's feedback thread
//
// submission_comments is the private student↔instructor conversation and, for a
// paid programme, it IS the product. It carries the instructor's candid
// assessment of someone's work. This one genuinely is confidentiality, and it is
// the ONE hole where the row-level answer comes from a policy rather than a
// grant — everybody holds SELECT on the table, so s1_owns_submission() is what
// stands between threads.
// ═════════════════════════════════════════════════════════════════════════════

describe("HOLE 5 — reading someone else's feedback thread is REFUSED", () => {
  test("the SELECT policy is ownership-scoped, never USING (true)", () => {
    const p = policiesOn("submission_comments").find((s) => /FOR SELECT/i.test(s));
    assert.ok(p, "a SELECT policy must exist");
    assert.ok(
      /public\.s1_owns_submission\(submission_id\)/i.test(p!),
      "ownership must be checked against the submission, not the comment",
    );
    assert.ok(!/USING\s*\(\s*true\s*\)/i.test(p!), "a world-readable feedback thread");
    assert.ok(/deleted_at IS NULL/i.test(p!), "a deleted comment stays deleted");
  });

  test("s1_owns_submission is SECURITY DEFINER with a pinned search_path", () => {
    // SECURITY DEFINER so the predicate can read project_submissions, which the
    // student cannot query directly; the pinned search_path is what stops a
    // caller shadowing a table name and changing what the predicate means.
    const fn = functionSource("s1_owns_submission");
    assert.ok(fn, "s1_owns_submission must exist");
    assert.ok(/SECURITY DEFINER/i.test(fn!));
    assert.ok(/SET search_path = public/i.test(fn!));
  });

  test("s1_owns_submission is revoked from PUBLIC and anon", () => {
    assert.ok(
      SQL.includes("REVOKE ALL ON FUNCTION public.s1_owns_submission(uuid) FROM PUBLIC, anon"),
    );
    assert.ok(
      SQL.includes("GRANT EXECUTE ON FUNCTION public.s1_owns_submission(uuid) TO authenticated"),
    );
  });

  test("a student may add to their own thread but cannot author as the instructor", () => {
    // The INSERT grant is column-scoped to the two columns a student legitimately
    // supplies. author_kind / author_id have NO grant, so a crafted insert naming
    // author_kind='instructor' is refused at the privilege layer before the
    // trigger is even reached.
    const ins = grantsOn("submission_comments").filter((g) => g.priv === "INSERT");
    assert.equal(ins.length, 1);
    assert.deepEqual(ins[0].columns, ["submission_id", "body_md"]);
    assert.deepEqual(ins[0].roles, ["authenticated"]);
    assert.ok(tableHasColumn("submission_comments", "author_kind"));
    assert.ok(tableHasColumn("submission_comments", "author_id"));
  });

  test("the guard trigger stamps provenance on every client insert", () => {
    const guard = functionSource("s1_submission_comment_guard");
    assert.ok(guard, "the guard function must exist");
    assert.ok(/NEW\.author_kind := 'student'/i.test(guard!), "author_kind must be forced");
    assert.ok(/NEW\.author_id := public\.s1_student_id\(\)/i.test(guard!));
    assert.ok(
      SQL.includes(
        "CREATE TRIGGER trg_submission_comments_guard BEFORE INSERT ON submission_comments",
      ),
      "the guard must be wired as a BEFORE INSERT trigger",
    );
  });

  test("the guard function itself is not callable by any client role", () => {
    assert.ok(
      SQL.includes(
        "REVOKE ALL ON FUNCTION public.s1_submission_comment_guard() FROM PUBLIC, anon, authenticated",
      ),
    );
  });

  test("a student cannot edit or delete a comment once posted", () => {
    const mutations = grantsOn("submission_comments").filter(
      (g) => g.priv === "UPDATE" || g.priv === "DELETE" || g.priv === "ALL",
    );
    assert.deepEqual(mutations, [], "an editable feedback thread is not evidence");
  });

  test("the INSERT policy checks ownership of the submission, not of the comment", () => {
    const p = policiesOn("submission_comments").find((s) => /FOR INSERT/i.test(s));
    assert.ok(p);
    assert.ok(/WITH CHECK\s*\(\s*public\.s1_owns_submission\(submission_id\)\s*\)/i.test(p!));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// HOLE 6 — s1_bootcamp_enrol() cannot be called by a student
//
// It is SECURITY DEFINER and it writes bootcamp_enrollments, student_enrollments
// and bootcamp_payments — three tables no client role may touch. A student who
// could call it directly would hand themselves a paid seat and a payment row
// saying they paid, without any money moving. Postgres grants EXECUTE to PUBLIC
// on every new function by default (which is what migration 022 exists to clean
// up), so the REVOKE is not optional tidying — it is the whole control.
// ═════════════════════════════════════════════════════════════════════════════

describe("HOLE 6 — calling s1_bootcamp_enrol directly is REFUSED", () => {
  const SIGNATURE = "s1_bootcamp_enrol(uuid,text,integer,text,text,text,text,text)";

  test("the function is SECURITY DEFINER with a pinned search_path", () => {
    const fn = functionSource("s1_bootcamp_enrol");
    assert.ok(fn, "s1_bootcamp_enrol must exist");
    assert.ok(/SECURITY DEFINER/i.test(fn!));
    assert.ok(/SET search_path = public/i.test(fn!));
  });

  test("EXECUTE is revoked from PUBLIC — the default grant is removed", () => {
    assert.ok(
      SQL.includes(`REVOKE ALL ON FUNCTION ${SIGNATURE} FROM PUBLIC`),
      "without this, anon can call it: PUBLIC includes anon",
    );
  });

  test("EXECUTE is revoked from anon AND authenticated by name", () => {
    assert.ok(SQL.includes(`REVOKE ALL ON FUNCTION ${SIGNATURE} FROM anon, authenticated`));
  });

  test("no migration ever grants EXECUTE on it to a client role", () => {
    const granted = new RegExp(
      `GRANT EXECUTE ON FUNCTION (?:public\\.)?s1_bootcamp_enrol[^;]*TO[^;]*(?:anon|authenticated)`,
      "i",
    ).test(SQL);
    assert.equal(granted, false, "a client role can call the enrolment RPC");
  });

  test("its only callers use the admin client, not a user session", () => {
    // If a route called it with createClient() the revoke would break enrolment
    // in production rather than in this test — so the call sites are asserted
    // here, in the same place as the grant they depend on.
    const routes = [
      path.join(import.meta.dirname, "..", "..", "app", "api", "bootcamp", "enrol", "route.ts"),
      path.join(import.meta.dirname, "..", "..", "app", "api", "bootcamp", "webhook", "stripe", "route.ts"),
    ];
    for (const file of routes) {
      const src = fs.readFileSync(file, "utf8");
      assert.ok(src.includes('s1_bootcamp_enrol'), `${file} should call the RPC`);
      assert.ok(
        /admin\.rpc\(\s*"s1_bootcamp_enrol"/.test(src),
        `${file} must call it through the service-role client`,
      );
    }
  });

  test("the other SECURITY DEFINER helpers are closed to anon too (migration 022)", () => {
    // 022 exists because PostgREST publishes every function at /rest/v1/rpc/.
    assert.ok(
      SQL.includes(
        "REVOKE ALL ON FUNCTION public.claim_free_trial_seat(uuid, integer, text, text) FROM PUBLIC, anon, authenticated",
      ),
    );
    assert.ok(SQL.includes("REVOKE ALL ON FUNCTION public.s1_bootcamp_cohort_ids() FROM PUBLIC, anon"));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// HOLE 7 — a student cannot edit their standing or their balance
//
// `standing` (good / at_risk / probation) is a judgement about the student, and
// amount_paid_cents is money. The RLS policy on this table permits UPDATE on
// your own row — deliberately, for ST-49 — so the policy alone would let a
// student write any column of their own enrolment. The COLUMN GRANT is the only
// thing that narrows it to viva_public. That makes this the hole most likely to
// be reopened by accident, by someone "simplifying" the grant.
// ═════════════════════════════════════════════════════════════════════════════

describe("HOLE 7 — editing standing or amount_paid_cents is REFUSED", () => {
  test("both columns exist and are exactly what a forger would target", () => {
    assert.ok(tableHasColumn("bootcamp_enrollments", "standing"));
    assert.ok(tableHasColumn("bootcamp_enrollments", "amount_paid_cents"));
    assert.ok(tableHasColumn("bootcamp_enrollments", "status"));
    assert.ok(tableHasColumn("bootcamp_enrollments", "graduated_at"));
  });

  test("the ONLY writable column is viva_public", () => {
    const upd = grantsOn("bootcamp_enrollments").filter((g) => g.priv === "UPDATE");
    assert.equal(upd.length, 1, "exactly one UPDATE grant is expected");
    assert.deepEqual(upd[0].columns, ["viva_public"]);
    assert.deepEqual(upd[0].roles, ["authenticated"]);
  });

  test("there is no table-wide UPDATE — that would sweep in every column", () => {
    const wide = grantsOn("bootcamp_enrollments").filter(
      (g) => (g.priv === "UPDATE" || g.priv === "ALL") && g.columns === null,
    );
    assert.deepEqual(wide, [], "a bare GRANT UPDATE lets a student mark themselves graduated");
  });

  test("no INSERT grant — enrolment is created by the webhook, never by the payer", () => {
    const ins = grantsOn("bootcamp_enrollments").filter((g) => g.priv === "INSERT");
    assert.deepEqual(ins, []);
    const insPolicy = policiesOn("bootcamp_enrollments").filter((p) => /FOR INSERT/i.test(p));
    assert.deepEqual(insPolicy, [], "no INSERT policy either");
  });

  test("no DELETE grant — a withdrawal is a status, not an erasure", () => {
    assert.deepEqual(grantsOn("bootcamp_enrollments").filter((g) => g.priv === "DELETE"), []);
  });

  test("the UPDATE policy still pins the row to the student themselves", () => {
    // Corroboration, not the control: without WITH CHECK, a student could move
    // their own row onto another student_id.
    const p = policiesOn("bootcamp_enrollments").find((s) => /FOR UPDATE/i.test(s));
    assert.ok(p);
    assert.ok(/USING\s*\(\s*student_id = public\.s1_student_id\(\)\s*\)/i.test(p!));
    assert.ok(/WITH CHECK\s*\(\s*student_id = public\.s1_student_id\(\)\s*\)/i.test(p!));
  });

  test("the payment ledger is read-only to the payer", () => {
    // "What have I paid" is a fair question; "I have paid" is not the payer's
    // sentence to write.
    const g = grantsTo("bootcamp_payments", "authenticated");
    assert.deepEqual(g.map((x) => x.priv), ["SELECT"]);
    const writes = grantsOn("bootcamp_payments").filter((x) => x.priv !== "SELECT");
    assert.deepEqual(writes, []);
  });

  test("a student cannot decide their own application either", () => {
    // The same shape one table over: you may create an application, never accept
    // one. status / reviewed_by / decided_at / offer_expires_at have no grant.
    const ins = grantsOn("bootcamp_applications").filter((g) => g.priv === "INSERT");
    assert.equal(ins.length, 1);
    assert.deepEqual(ins[0].columns, [
      "cohort_id",
      "student_id",
      "assessment_attempt_id",
      "hours_committed",
      "timezone",
      "motivation",
      "local_time_confirmed",
    ]);
    for (const forbidden of ["status", "reviewed_by", "decided_at", "offer_expires_at"]) {
      assert.ok(
        !ins[0].columns!.includes(forbidden),
        `${forbidden} is client-writable — a student can accept themselves`,
      );
    }
    const upd = grantsOn("bootcamp_applications").filter((g) => g.priv === "UPDATE");
    assert.deepEqual(upd, [], "an application cannot be edited after submission");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// HOLE 8 — anon can neither read nor write anything
//
// anon is the role a browser gets with nothing but the publishable key, which is
// in the client bundle of every page on square1ai.com. Anything granted to anon
// is, in practice, public.
// ═════════════════════════════════════════════════════════════════════════════

describe("HOLE 8 — anon is refused everywhere", () => {
  test("no bootcamp table grants anything to anon", () => {
    const leaks = GRANTS.filter(
      (g) => (BOOTCAMP_TABLES as readonly string[]).includes(g.table) && g.roles.includes("anon"),
    );
    assert.deepEqual(
      leaks.map((l) => `${l.priv} ON ${l.table}`),
      [],
      "anon is the publishable key in every page's bundle",
    );
  });

  test("no bootcamp table grants anything to PUBLIC (which contains anon)", () => {
    const leaks = GRANTS.filter(
      (g) =>
        (BOOTCAMP_TABLES as readonly string[]).includes(g.table) &&
        (g.roles.includes("public") || g.roles.includes("PUBLIC")),
    );
    assert.deepEqual(leaks, []);
  });

  test("every bootcamp table strips Supabase's default ALL from anon first", () => {
    // Supabase grants ALL on new public tables to anon + authenticated. Creating
    // a table and writing a policy is NOT enough; without this REVOKE the table
    // is wide open to the publishable key the moment a permissive policy exists.
    for (const t of BOOTCAMP_TABLES) {
      const r = REVOKES.find((x) => x.table === t && x.priv === "ALL" && x.roles.includes("anon"));
      assert.ok(r, `${t} never revokes the default ALL from anon`);
      assert.ok(r!.roles.includes("authenticated"), `${t} revokes from anon but not authenticated`);
    }
  });

  test("every bootcamp table has row level security enabled", () => {
    for (const t of BOOTCAMP_TABLES) {
      assert.ok(
        SQL.includes(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`),
        `${t} has RLS disabled`,
      );
    }
  });

  test("no policy anywhere in the bootcamp schema targets anon or PUBLIC", () => {
    for (const t of BOOTCAMP_TABLES) {
      for (const p of policiesOn(t)) {
        assert.ok(!/\bTO (anon|public)\b/i.test(p), `policy exposes ${t} to anon: ${p}`);
        assert.ok(/TO authenticated/i.test(p), `policy on ${t} names no role: ${p}`);
      }
    }
  });

  test("the audit log is unreachable by BOTH client roles — no grants, no policies", () => {
    // Overrides are allowed; silent overrides are not. If the log were writable
    // by a client, every other control here becomes deniable after the fact.
    assert.deepEqual(grantsOn("bootcamp_audit_log"), []);
    assert.deepEqual(policiesOn("bootcamp_audit_log"), []);
    assert.ok(SQL.includes("ALTER TABLE bootcamp_audit_log ENABLE ROW LEVEL SECURITY"));
  });

  test("the waitlist is unreachable too — it is a list of email addresses", () => {
    assert.deepEqual(grantsOn("bootcamp_waitlist"), []);
    assert.deepEqual(policiesOn("bootcamp_waitlist"), []);
    assert.ok(SQL.includes("ALTER TABLE bootcamp_waitlist ENABLE ROW LEVEL SECURITY"));
  });

  test("the only privileges any client role holds are the ones enumerated here", () => {
    // A closed list, hand-typed. Adding a grant to any bootcamp table now fails
    // this test until somebody writes down why it is safe.
    const held = GRANTS.filter((g) => (BOOTCAMP_TABLES as readonly string[]).includes(g.table))
      .map((g) => `${g.roles.join("+")}: ${g.priv}${g.columns ? "(cols)" : ""} ON ${g.table}`)
      .sort();
    assert.deepEqual(held, [
      "authenticated: INSERT(cols) ON bootcamp_applications",
      "authenticated: INSERT(cols) ON submission_comments",
      "authenticated: SELECT ON bootcamp_applications",
      "authenticated: SELECT ON bootcamp_attendance",
      "authenticated: SELECT ON bootcamp_cohorts",
      "authenticated: SELECT ON bootcamp_enrollments",
      "authenticated: SELECT ON bootcamp_gate_results",
      "authenticated: SELECT ON bootcamp_payments",
      "authenticated: SELECT ON bootcamp_session_registrants",
      "authenticated: SELECT ON bootcamp_squads",
      "authenticated: SELECT ON bootcamps",
      "authenticated: SELECT ON submission_comments",
      "authenticated: SELECT(cols) ON bootcamp_gates",
      "authenticated: SELECT(cols) ON bootcamp_sessions",
      "authenticated: UPDATE(cols) ON bootcamp_enrollments",
    ]);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PURE LOGIC — the pass bar cannot be talked down
//
// The database stops a student writing a pass. This half stops the SERVER
// computing one it should not. evaluateGate is the only thing that says "a human
// may now sign off", and everything it consumes must come from graded artifacts.
// ═════════════════════════════════════════════════════════════════════════════

const FULL: GateRequirements = {
  lessons_pct: 90,
  project_ids: ["p1"],
  min_score: 75,
  peer_reviews: 2,
  attendance_pct: 70,
  min_authored_prs: 1,
  viva: false,
  human_signoff: true,
};

const PASSING: GateEvidence = {
  lessonsCompletePct: 95,
  passedProjectIds: ["p1"],
  rubricPct: 88,
  objectivePassed: true,
  ciPassed: true,
  peerReviewsGiven: 2,
  attendancePct: 80,
  authoredPrCount: 3,
  vivaRecorded: false,
};

describe("pure logic — evaluateGate cannot pass anything below the bar", () => {
  test("no rubric score from 0 to 74 is ever auto-eligible under the default bar", () => {
    // Exhaustive rather than sampled: 75 is the number, and an off-by-one here
    // is a credential handed to somebody who did not earn it.
    const requires: GateRequirements = { human_signoff: true };
    for (let pct = 0; pct < BOOTCAMP_PASS_BAR; pct++) {
      const r = evaluateGate(requires, { ...PASSING, rubricPct: pct });
      assert.equal(r.autoEligible, false, `rubric ${pct} was auto-eligible`);
      assert.ok(r.unmet.includes("rubric"));
    }
  });

  test("75 to 100 clears the rubric check, and nothing above 100 is needed", () => {
    const requires: GateRequirements = { human_signoff: true };
    for (let pct = BOOTCAMP_PASS_BAR; pct <= 100; pct++) {
      const r = evaluateGate(requires, { ...PASSING, rubricPct: pct });
      assert.ok(!r.unmet.includes("rubric"), `rubric ${pct} failed`);
    }
  });

  test("omitting min_score does NOT relax the bar — it falls back to 75", () => {
    // The forgery route this closes: a gate authored with `requires` missing
    // min_score would otherwise have no bar at all.
    const noBar = evaluateGate({ human_signoff: true }, { ...PASSING, rubricPct: 74 });
    assert.equal(noBar.autoEligible, false);
    assert.ok(noBar.unmet.includes("rubric"));
  });

  test("evaluateGate never emits a pass verdict, whatever the evidence", () => {
    // Passing is a human decision written under the service role with an audit
    // row. If this function ever grew a `passed` field, some caller would
    // eventually write it straight to bootcamp_gate_results.status.
    const r = evaluateGate(FULL, PASSING);
    assert.deepEqual(Object.keys(r).sort(), ["autoEligible", "canSubmit", "checks", "unmet"]);
    assert.ok(!("passed" in r));
    assert.ok(!("status" in r));
  });

  test("a single unmet requirement is enough to withhold auto-eligibility", () => {
    // No partial credit, no "close enough": each of these alone blocks the gate.
    const solo: Array<[string, Partial<GateEvidence>]> = [
      ["lessons", { lessonsCompletePct: 89 }],
      ["projects", { passedProjectIds: [] }],
      ["rubric", { rubricPct: 74 }],
      ["objective", { objectivePassed: false }],
      ["ci", { ciPassed: false }],
      ["peer_reviews", { peerReviewsGiven: 1 }],
      ["attendance", { attendancePct: 69 }],
      ["authored_prs", { authoredPrCount: 0 }],
    ];
    for (const [key, patch] of solo) {
      const r = evaluateGate(FULL, { ...PASSING, ...patch });
      assert.equal(r.autoEligible, false, `${key} alone did not block the gate`);
      assert.deepEqual(r.unmet, [key], `expected only ${key} unmet`);
    }
  });

  test("an empty passedProjectIds list can never satisfy a project requirement", () => {
    const r = evaluateGate({ project_ids: ["p1", "p2"] }, { ...PASSING, passedProjectIds: [] });
    assert.ok(r.unmet.includes("projects"));
  });

  test("unrelated passed projects do not satisfy THIS gate's projects", () => {
    // Submitting an easy project from week 2 must not clear the capstone gate.
    const r = evaluateGate(
      { project_ids: ["capstone"] },
      { ...PASSING, passedProjectIds: ["week2", "week3", "week4"] },
    );
    assert.ok(r.unmet.includes("projects"));
  });
});

describe("pure logic — resubmission is bounded", () => {
  const decided = "2026-10-01T00:00:00Z";
  const inWindow = new Date("2026-10-02T00:00:00Z");

  test("no attempt count at or above the cap is ever allowed", () => {
    for (let attempts = MAX_ATTEMPTS; attempts <= 10; attempts++) {
      const r = canResubmit(attempts, decided, inWindow);
      assert.equal(r.allowed, false, `${attempts} attempts was allowed`);
      assert.equal(r.reason, "No attempts remaining");
    }
  });

  test("the cap is 2 and the window is 7 days — the values, not just the shape", () => {
    assert.equal(MAX_ATTEMPTS, 2);
    assert.equal(RESUBMIT_WINDOW_DAYS, 7);
    assert.equal(BOOTCAMP_PASS_BAR, 75);
  });

  test("every day inside the window is allowed and every day past it is refused", () => {
    for (let day = 0; day <= 7; day++) {
      const now = new Date(Date.parse(decided) + day * 86_400_000);
      assert.equal(canResubmit(1, decided, now).allowed, true, `day ${day} refused`);
    }
    for (let day = 8; day <= 30; day++) {
      const now = new Date(Date.parse(decided) + day * 86_400_000);
      const r = canResubmit(1, decided, now);
      assert.equal(r.allowed, false, `day ${day} allowed`);
      assert.equal(r.reason, "Resubmission window has closed");
    }
  });

  test("a decision date in the future does not extend the attempt cap", () => {
    // Clock skew, or a desk row edited by hand, must not buy an extra attempt.
    const r = canResubmit(MAX_ATTEMPTS, "2030-01-01T00:00:00Z", inWindow);
    assert.equal(r.allowed, false);
  });
});

describe("pure logic — a fabricated status cannot unlock the chain", () => {
  const GATES = ["g1", "g2", "g3", "g4", "g5", "g6"];

  test("only 'passed' and 'waived' open the next gate", () => {
    const cleared: GateStatus[] = ["passed", "waived"];
    const notCleared: GateStatus[] = ["locked", "open", "submitted", "failed"];
    for (const s of cleared) {
      assert.equal(deriveGateStatuses(GATES, { g1: s }).g2, "open", `${s} should open g2`);
    }
    for (const s of notCleared) {
      assert.equal(deriveGateStatuses(GATES, { g1: s }).g2, "locked", `${s} opened g2`);
    }
  });

  test("a status string that is not in the vocabulary does NOT clear a gate", () => {
    // If a status ever reaches this function from somewhere other than the
    // service role (a cached response, a hand-edited row, a future desk tool
    // typo), an unrecognised value must fail closed. The comparison is exact and
    // case-sensitive, so none of these count as cleared.
    for (const forged of ["PASSED", "Passed", "pass", "passed ", "waived!", "true"]) {
      const s = deriveGateStatuses(GATES, { g1: forged as GateStatus });
      assert.equal(s.g2, "locked", `"${forged}" unlocked the next gate`);
      assert.equal(s.g3, "locked");
    }
  });

  test("an unrecognised status is echoed back verbatim, never normalised upward", () => {
    // DOCUMENTING DELIBERATE BEHAVIOUR, not endorsing it. deriveGateStatuses
    // passes an existing non-"locked" status through untouched rather than
    // validating it, because a gate already decided must never be silently
    // re-locked. The safety comes from the comparison being exact — the value is
    // carried, but it is not treated as cleared — plus the CHECK constraint
    // bootcamp_gate_results_status_valid, which is what stops such a value being
    // storable in the first place. If a UI ever renders this string as a verdict,
    // the constraint is the only thing standing behind it.
    const s = deriveGateStatuses(GATES, { g1: "PASSED" as GateStatus });
    assert.equal(s.g1, "PASSED");
    assert.equal(s.g2, "locked");
    assert.ok(
      SQL.includes(
        "CONSTRAINT bootcamp_gate_results_status_valid CHECK (status IN ('locked', 'open', 'submitted', 'passed', 'failed', 'waived'))",
      ),
      "the status vocabulary must be enforced by the database",
    );
  });

  test("clearing the last gate does not retroactively clear the earlier ones", () => {
    const s = deriveGateStatuses(GATES, { g6: "passed" });
    assert.equal(s.g1, "open");
    for (const g of ["g2", "g3", "g4", "g5"]) {
      assert.equal(s[g], "locked", `${g} was unlocked by a later pass`);
    }
  });

  test("six gates means six gates — the seeded spine is not shortenable", () => {
    const s = deriveGateStatuses(GATES, { g1: "passed", g2: "passed", g3: "passed" });
    assert.equal(s.g4, "open");
    assert.equal(s.g5, "locked");
    assert.equal(s.g6, "locked");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// The seeded thresholds themselves
//
// evaluateGate honours whatever `requires` says. That makes the SEED an
// integrity surface in its own right: a gate seeded with min_score 60 lowers the
// bar without a line of application code changing.
// ═════════════════════════════════════════════════════════════════════════════

describe("the seeded gates hold the bar", () => {
  const SEED = fs.readFileSync(
    path.join(MIGRATIONS_DIR, "024_seed_bootcamp_gates.sql"),
    "utf8",
  );

  test("every min_score written by the seed is exactly the bootcamp bar", () => {
    // The seed writes min_score as a CASE expression, so only the values on the
    // THEN/ELSE branches are thresholds — the bare integers elsewhere in the
    // expression are order_index comparisons, not scores.
    const exprs = [...SEED.matchAll(/'min_score',\s*([^\n]+)/g)].map((m) => m[1]);
    assert.ok(exprs.length > 0, "the seed no longer sets min_score at all");
    const thresholds: number[] = [];
    for (const expr of exprs) {
      for (const m of expr.matchAll(/(?:THEN|ELSE)\s+(\d+)/gi)) thresholds.push(Number(m[1]));
    }
    assert.deepEqual(thresholds, [75], "the seeded bar must be 75 and nothing else");
    for (const n of thresholds) {
      assert.ok(n >= BOOTCAMP_PASS_BAR, `seed writes min_score ${n}, below the bar`);
    }
  });

  test("the seed writes six gates, and human sign-off is on all of them", () => {
    assert.ok(/'human_signoff',\s*true/.test(SEED));
    assert.ok(SEED.includes("(6, 24, 'Hiring sprint'"), "gate 6 must exist");
    assert.ok(SEED.includes("(1,  5, 'Foundations'"), "gate 1 must exist");
  });

  test("the seed sets attendance and lesson thresholds, so gates are not free", () => {
    assert.ok(/'attendance_pct',\s*70/.test(SEED));
    assert.ok(/'lessons_pct',[^)]*90/.test(SEED));
  });

  test("the squad gate requires individually authored PRs (ST-30)", () => {
    assert.ok(/'min_authored_prs',[^)]*1/.test(SEED));
  });
});
