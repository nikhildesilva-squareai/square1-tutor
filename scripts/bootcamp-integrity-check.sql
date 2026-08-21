-- ═══════════════════════════════════════════════════════════════════════════════
-- S12 / T1 — BOOTCAMP INTEGRITY CHECK (READ-ONLY)
--
-- Proves, against the LIVE database, that each of the eight forgery routes a
-- student might take is refused. Run it in the Supabase SQL editor for project
-- lqjlmaxcarvsqnqhbzdj after applying any migration that touches a bootcamp
-- table, and before any bootcamp cohort goes live.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- THIS SCRIPT IS SAFE TO RUN AGAINST PRODUCTION
-- ─────────────────────────────────────────────────────────────────────────────
--
-- It contains no INSERT, UPDATE, DELETE, ALTER, DROP or CREATE. Not one
-- statement, not inside a transaction that rolls back, not in a temp table. It
-- asks the catalog what privileges the `anon` and `authenticated` roles hold and
-- reports the answer. Nothing it does can change a row, a grant or a plan.
--
-- WHY INTROSPECTION RATHER THAN ATTEMPTING THE FORGERIES
--
-- The obvious test is to become a student and try to write a passing gate
-- result inside BEGIN ... ROLLBACK. That works — this project has used the
-- technique before — but it is strictly weaker here, for three reasons:
--
--   1. A rollback still WRITES. It takes row locks, fires triggers, burns
--      sequence values and leaves WAL. Against a table holding real students'
--      credentials, on the one database we have, that is a risk taken for
--      information we can get for free.
--   2. A failed forgery proves that ONE crafted statement was refused. Absence
--      of a privilege proves that EVERY possible statement is refused, including
--      the ones nobody thought to write. For an integrity control that is a
--      categorically stronger result.
--   3. A write probe needs a real enrolled student to impersonate. Before the
--      first cohort there are none, so the test would silently skip — and a
--      skipped integrity test reads green.
--
-- has_column_privilege() also accounts for table-level grants, column-level
-- grants, grants to PUBLIC, and grants inherited through role membership. It is
-- the same computation the executor performs when it refuses the statement.
--
-- WHAT THIS DELIBERATELY DOES NOT COVER
--
-- Privileges are one of the two layers. The other is RLS, which decides WHICH
-- ROWS a role may see, and which the catalog can only be inspected for shape,
-- not evaluated. Where a hole is closed by a policy rather than a grant — hole 5
-- is the only one — this script asserts the policy's predicate is
-- ownership-scoped and never `true`, and Appendix A gives the read-only
-- impersonation recipe that executes it for real.
--
-- The service_role bypasses all of this by design. Do not "fix" a FAIL by
-- granting to service_role; it already has everything.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- HOW TO READ THE OUTPUT
-- ─────────────────────────────────────────────────────────────────────────────
--
-- One row per assertion. `result` is PASS or `FAIL <<<`. Anything that is not
-- PASS is a hole that is open right now, in production. `detail` names exactly
-- what was found, so a FAIL tells you the column and the role without further
-- digging.
--
-- Expected: 27 rows, all PASS.
--
-- LAST RUN: 2026-08-21 against lqjlmaxcarvsqnqhbzdj (production) — 27/27 PASS.
-- Two findings worth knowing, neither a bootcamp defect:
--   • s1_is_venture_member is SECURITY DEFINER and executable by anon. It is on
--     the documented exclusion list under hole 6 (migration 022 audited it and
--     left it deliberately: it returns false without a session). It belongs to
--     Startup School, not the bootcamp.
--   • s1_student_id is likewise anon-executable and likewise harmless — NULL
--     without a session.
-- ═══════════════════════════════════════════════════════════════════════════════

WITH client_roles AS (
  SELECT unnest(ARRAY['anon', 'authenticated']) AS role
),

-- Every bootcamp table, resolved through the catalog so a table that does not
-- exist yet is visible as missing rather than silently passing.
expected_tables AS (
  SELECT unnest(ARRAY[
    'bootcamps', 'bootcamp_cohorts', 'bootcamp_squads', 'bootcamp_applications',
    'bootcamp_enrollments', 'bootcamp_gates', 'bootcamp_gate_results',
    'bootcamp_sessions', 'bootcamp_session_registrants', 'bootcamp_attendance',
    'bootcamp_payments', 'bootcamp_waitlist', 'bootcamp_audit_log',
    'submission_comments'
  ]) AS tbl
),
resolved AS (
  SELECT e.tbl, to_regclass('public.' || e.tbl) AS oid FROM expected_tables e
),

-- ─────────────────────────────────────────────────────────────────────────────
-- Sweep: every (role, table, column) where a client role can WRITE.
-- On the tables below this set must be empty.
-- ─────────────────────────────────────────────────────────────────────────────
writable AS (
  SELECT r.tbl, cr.role, a.attname AS col
  FROM resolved r
  JOIN pg_attribute a ON a.attrelid = r.oid AND a.attnum > 0 AND NOT a.attisdropped
  CROSS JOIN client_roles cr
  WHERE r.oid IS NOT NULL
    AND has_column_privilege(cr.role, r.oid, a.attnum, 'INSERT, UPDATE')
),

-- Sweep: every (role, table) where a client role can read ANY column.
readable AS (
  SELECT r.tbl, cr.role
  FROM resolved r
  CROSS JOIN client_roles cr
  WHERE r.oid IS NOT NULL
    AND has_any_column_privilege(cr.role, r.oid, 'SELECT, REFERENCES')
),

policies AS (
  SELECT tablename, policyname, cmd, roles, qual, with_check
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (SELECT tbl FROM expected_tables)
),

checks AS (

-- ═════════════════════════════════════════════════════════════════════════════
-- PRE-FLIGHT — a PASS below means nothing if the objects are not there
-- ═════════════════════════════════════════════════════════════════════════════

  SELECT 0 AS hole,
         'every bootcamp table exists (migrations 021-028 applied)' AS assertion,
         NOT EXISTS (SELECT 1 FROM resolved WHERE oid IS NULL) AS closed,
         COALESCE((SELECT string_agg(tbl, ', ') FROM resolved WHERE oid IS NULL),
                  'all 14 present') AS detail

  UNION ALL
  SELECT 0,
         'row level security is enabled on every bootcamp table',
         NOT EXISTS (
           SELECT 1 FROM resolved r JOIN pg_class c ON c.oid = r.oid
           WHERE r.oid IS NOT NULL AND NOT c.relrowsecurity
         ),
         COALESCE((SELECT string_agg(r.tbl, ', ')
                   FROM resolved r JOIN pg_class c ON c.oid = r.oid
                   WHERE r.oid IS NOT NULL AND NOT c.relrowsecurity),
                  'all enabled')

-- ═════════════════════════════════════════════════════════════════════════════
-- HOLE 1 — a student writing their own gate result
--
-- bootcamp_gate_results IS the credential. status='passed' here is what the
-- certificate, the portfolio and the employer shortlist are derived from.
-- ═════════════════════════════════════════════════════════════════════════════

  UNION ALL
  SELECT 1,
         'bootcamp_gate_results: no client role can INSERT or UPDATE ANY column',
         NOT EXISTS (SELECT 1 FROM writable WHERE tbl = 'bootcamp_gate_results'),
         COALESCE((SELECT string_agg(role || '.' || col, ', ')
                   FROM writable WHERE tbl = 'bootcamp_gate_results'),
                  'no writable column')

  UNION ALL
  SELECT 1,
         'bootcamp_gate_results: status / rubric_pct / decided_at specifically unwritable',
         -- Named individually because these are the three a forger actually
         -- wants. decided_at is the schema name for the story's passed_at.
         NOT EXISTS (
           SELECT 1 FROM writable
           WHERE tbl = 'bootcamp_gate_results'
             AND col IN ('status', 'rubric_pct', 'decided_at', 'attempts', 'reviewer_id')
         ),
         'checked: status, rubric_pct, decided_at, attempts, reviewer_id'

  UNION ALL
  SELECT 1,
         'bootcamp_gate_results: no client role can DELETE (a fail cannot vanish)',
         NOT (has_table_privilege('anon', 'public.bootcamp_gate_results', 'DELETE')
           OR has_table_privilege('authenticated', 'public.bootcamp_gate_results', 'DELETE')),
         'anon and authenticated'

  UNION ALL
  SELECT 1,
         'bootcamp_gate_results: no INSERT/UPDATE/ALL policy exists',
         NOT EXISTS (
           SELECT 1 FROM policies
           WHERE tablename = 'bootcamp_gate_results' AND cmd <> 'SELECT'
         ),
         COALESCE((SELECT string_agg(policyname || ' (' || cmd || ')', ', ')
                   FROM policies WHERE tablename = 'bootcamp_gate_results'),
                  'none')

-- ═════════════════════════════════════════════════════════════════════════════
-- HOLE 2 — a student writing attendance
--
-- Weighted attendance is a gate input and one gate requires 70%. A writable
-- attendance row is a forged graduation by a quieter route.
-- ═════════════════════════════════════════════════════════════════════════════

  UNION ALL
  SELECT 2,
         'bootcamp_attendance: no client role can INSERT or UPDATE ANY column',
         NOT EXISTS (SELECT 1 FROM writable WHERE tbl = 'bootcamp_attendance'),
         COALESCE((SELECT string_agg(role || '.' || col, ', ')
                   FROM writable WHERE tbl = 'bootcamp_attendance'),
                  'no writable column')

  UNION ALL
  SELECT 2,
         'bootcamp_attendance: no write policy exists either',
         NOT EXISTS (
           SELECT 1 FROM policies WHERE tablename = 'bootcamp_attendance' AND cmd <> 'SELECT'
         ),
         'attendance is webhook-written under the service role'

-- ═════════════════════════════════════════════════════════════════════════════
-- HOLE 3 — a student reading bootcamp_gates.requires
--
-- The thresholds are an answer key. RLS cannot close this: the SELECT policy on
-- bootcamp_gates is USING (true) on purpose, because titles and weeks are meant
-- to be visible. The column grant is the only control.
-- ═════════════════════════════════════════════════════════════════════════════

  UNION ALL
  SELECT 3,
         'bootcamp_gates.requires: not readable by anon or authenticated',
         NOT (has_column_privilege('anon', 'public.bootcamp_gates', 'requires', 'SELECT')
           OR has_column_privilege('authenticated', 'public.bootcamp_gates', 'requires', 'SELECT')),
         'a student who reads this knows exactly how little to do'

  UNION ALL
  SELECT 3,
         'bootcamp_gates: the harmless columns ARE readable (the app still works)',
         -- A positive check. Withholding everything would also "pass" the test
         -- above while breaking the gate list the student is supposed to see.
         has_column_privilege('authenticated', 'public.bootcamp_gates', 'title', 'SELECT')
         AND has_column_privilege('authenticated', 'public.bootcamp_gates', 'week', 'SELECT'),
         'title and week readable by authenticated'

-- ═════════════════════════════════════════════════════════════════════════════
-- HOLE 4 — a student reading bootcamp_sessions.zoom_start_url
--
-- That is the HOST url. Whoever holds it can start the meeting, admit people,
-- and run a class that is not ours.
-- ═════════════════════════════════════════════════════════════════════════════

  UNION ALL
  SELECT 4,
         'bootcamp_sessions.zoom_start_url: not readable by anon or authenticated',
         NOT (has_column_privilege('anon', 'public.bootcamp_sessions', 'zoom_start_url', 'SELECT')
           OR has_column_privilege('authenticated', 'public.bootcamp_sessions', 'zoom_start_url', 'SELECT')),
         'the host link hijacks the class'

  UNION ALL
  SELECT 4,
         'bootcamp_sessions.zoom_join_url IS readable (the attendee link, correctly)',
         has_column_privilege('authenticated', 'public.bootcamp_sessions', 'zoom_join_url', 'SELECT'),
         'students must be able to join'

  UNION ALL
  SELECT 4,
         'bootcamp_session_registrants: read-only, and scoped to the owner by policy',
         NOT EXISTS (SELECT 1 FROM writable WHERE tbl = 'bootcamp_session_registrants')
         AND EXISTS (
           SELECT 1 FROM policies
           WHERE tablename = 'bootcamp_session_registrants'
             AND cmd = 'SELECT' AND qual LIKE '%s1_student_id%'
         ),
         'another student''s personal join link is attendance fraud'

-- ═════════════════════════════════════════════════════════════════════════════
-- HOLE 5 — a student reading another student's submission_comments
--
-- The ONE hole closed by a policy rather than a grant: every signed-in user
-- holds SELECT on this table, so s1_owns_submission() is what stands between
-- threads. Appendix A executes this one for real.
-- ═════════════════════════════════════════════════════════════════════════════

  UNION ALL
  SELECT 5,
         'submission_comments: the SELECT policy is ownership-scoped, never USING (true)',
         EXISTS (
           SELECT 1 FROM policies
           WHERE tablename = 'submission_comments' AND cmd = 'SELECT'
             AND qual LIKE '%s1_owns_submission%'
         )
         AND NOT EXISTS (
           SELECT 1 FROM policies
           WHERE tablename = 'submission_comments' AND cmd = 'SELECT'
             AND btrim(qual) = 'true'
         ),
         COALESCE((SELECT string_agg(policyname || ': ' || qual, ' | ')
                   FROM policies WHERE tablename = 'submission_comments' AND cmd = 'SELECT'),
                  'NO SELECT POLICY — with RLS on that denies everyone')

  UNION ALL
  SELECT 5,
         'submission_comments: author_kind / author_id are not client-writable',
         -- Otherwise a student manufactures an instructor sign-off in their own
         -- thread. The BEFORE INSERT guard trigger is the second layer.
         NOT EXISTS (
           SELECT 1 FROM writable
           WHERE tbl = 'submission_comments' AND col IN ('author_kind', 'author_id')
         ),
         'provenance is trigger-stamped, not client-supplied'

  UNION ALL
  SELECT 5,
         'submission_comments: the provenance guard trigger is installed and enabled',
         EXISTS (
           SELECT 1 FROM pg_trigger t
           WHERE t.tgrelid = to_regclass('public.submission_comments')
             AND t.tgname = 'trg_submission_comments_guard'
             AND NOT t.tgisinternal
             AND t.tgenabled <> 'D'
         ),
         'a disabled trigger is the same as no trigger'

  UNION ALL
  SELECT 5,
         'submission_comments: no client role can UPDATE or DELETE a posted comment',
         -- submission_id and body_md are legitimately writable — but by INSERT
         -- only. Any UPDATE privilege at all, on any column, is the hole.
         NOT EXISTS (
           SELECT 1 FROM writable
           WHERE tbl = 'submission_comments' AND col NOT IN ('submission_id', 'body_md')
         )
         AND NOT has_any_column_privilege('authenticated', 'public.submission_comments', 'UPDATE')
         AND NOT has_any_column_privilege('anon', 'public.submission_comments', 'UPDATE')
         AND NOT has_table_privilege('authenticated', 'public.submission_comments', 'DELETE'),
         'an editable feedback thread is not evidence'

-- ═════════════════════════════════════════════════════════════════════════════
-- HOLE 6 — a student calling s1_bootcamp_enrol() directly
--
-- SECURITY DEFINER, and it writes bootcamp_enrollments, student_enrollments and
-- bootcamp_payments. A student who could call it would hand themselves a seat
-- AND a ledger row saying they paid, with no money moving. Postgres grants
-- EXECUTE to PUBLIC on every new function by default, and PostgREST publishes
-- every function at /rest/v1/rpc/ — so the REVOKE is the whole control.
-- ═════════════════════════════════════════════════════════════════════════════

  UNION ALL
  SELECT 6,
         's1_bootcamp_enrol: not executable by anon or authenticated',
         CASE
           WHEN to_regprocedure(
                  'public.s1_bootcamp_enrol(uuid,text,integer,text,text,text,text,text)'
                ) IS NULL THEN false
           ELSE NOT (
             has_function_privilege('anon',
               'public.s1_bootcamp_enrol(uuid,text,integer,text,text,text,text,text)', 'EXECUTE')
             OR has_function_privilege('authenticated',
               'public.s1_bootcamp_enrol(uuid,text,integer,text,text,text,text,text)', 'EXECUTE')
           )
         END,
         CASE
           WHEN to_regprocedure(
                  'public.s1_bootcamp_enrol(uuid,text,integer,text,text,text,text,text)'
                ) IS NULL
           THEN 'FUNCTION NOT FOUND — migration 027 may not be applied'
           ELSE 'revoked from both client roles'
         END

  UNION ALL
  SELECT 6,
         'no UNDOCUMENTED SECURITY DEFINER s1_* / bootcamp function is executable by anon',
         -- The general form of the same mistake. This is what migration 022 was
         -- written to clean up, and it recurs every time somebody adds a helper,
         -- because Postgres grants EXECUTE to PUBLIC on creation and PostgREST
         -- publishes the result at /rest/v1/rpc/.
         --
         -- THE EXCLUSION LIST IS A LIST OF DECISIONS, NOT A LIST OF EXCUSES.
         -- Every name below was audited in migration 022 and deliberately left
         -- callable by anon because it is a predicate that returns NULL or false
         -- without a session — it discloses nothing and changes nothing:
         --
         --   s1_student_id            NULL without a session
         --   s1_bootcamp_cohort_ids   empty without a session
         --   s1_owns_submission       false without a session (022 revokes anon
         --                            anyway; listed for stability)
         --   s1_touch_updated_at      trigger function, no caller-visible effect
         --   s1_is_venture_member     false without a session — Startup School
         --                            membership predicate, 022 "DELIBERATELY
         --                            NOT TOUCHED"
         --
         -- Do NOT add a name here to make a FAIL go away. A new anon-executable
         -- SECURITY DEFINER function is the exact defect 022 exists to prevent;
         -- revoke it instead, and only add it here once someone has written down
         -- why anon calling it is harmless.
         NOT EXISTS (
           SELECT 1 FROM pg_proc p
           JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
           WHERE p.prosecdef
             AND (p.proname LIKE 's1\_%' OR p.proname LIKE '%bootcamp%')
             AND p.proname NOT IN ('s1_student_id', 's1_bootcamp_cohort_ids',
                                   's1_owns_submission', 's1_touch_updated_at',
                                   's1_is_venture_member')
             AND has_function_privilege('anon', p.oid, 'EXECUTE')
         ),
         COALESCE((SELECT string_agg(p.proname, ', ')
                   FROM pg_proc p
                   JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
                   WHERE p.prosecdef
                     AND (p.proname LIKE 's1\_%' OR p.proname LIKE '%bootcamp%')
                     AND p.proname NOT IN ('s1_student_id', 's1_bootcamp_cohort_ids',
                                           's1_owns_submission', 's1_touch_updated_at',
                                           's1_is_venture_member')
                     AND has_function_privilege('anon', p.oid, 'EXECUTE')),
                  'none beyond the five documented predicates')

-- ═════════════════════════════════════════════════════════════════════════════
-- HOLE 7 — a student editing their standing or their balance
--
-- The RLS policy on bootcamp_enrollments permits UPDATE on your own row, on
-- purpose (ST-49: viva_public is the student's own face, their own choice). So
-- the policy alone would let a student write ANY column of their own enrolment.
-- The column grant is the only thing narrowing it — which makes this the hole
-- most likely to be reopened by someone "simplifying" a grant.
-- ═════════════════════════════════════════════════════════════════════════════

  UNION ALL
  SELECT 7,
         'bootcamp_enrollments: standing / amount_paid_cents / status / graduated_at unwritable',
         NOT EXISTS (
           SELECT 1 FROM writable
           WHERE tbl = 'bootcamp_enrollments'
             AND col IN ('standing', 'amount_paid_cents', 'status', 'graduated_at',
                         'student_id', 'cohort_id', 'paid_in_full_at')
         ),
         COALESCE((SELECT string_agg(role || '.' || col, ', ')
                   FROM writable WHERE tbl = 'bootcamp_enrollments'
                     AND col <> 'viva_public'),
                  'only viva_public is writable')

  UNION ALL
  SELECT 7,
         'bootcamp_enrollments: viva_public IS writable by authenticated (ST-49 still works)',
         has_column_privilege('authenticated', 'public.bootcamp_enrollments', 'viva_public', 'UPDATE'),
         'their face, their choice, revocable'

  UNION ALL
  SELECT 7,
         'bootcamp_payments: no client role can write the ledger',
         NOT EXISTS (SELECT 1 FROM writable WHERE tbl = 'bootcamp_payments'),
         '"what have I paid" is a fair question; "I have paid" is not theirs to write'

  UNION ALL
  SELECT 7,
         'bootcamp_applications: a student cannot decide their own application',
         NOT EXISTS (
           SELECT 1 FROM writable
           WHERE tbl = 'bootcamp_applications'
             AND col IN ('status', 'reviewed_by', 'decided_at', 'decision_note',
                         'offer_expires_at')
         ),
         'accepting yourself is the same forgery one table over'

-- ═════════════════════════════════════════════════════════════════════════════
-- HOLE 8 — anon reading or writing anything
--
-- anon is the role a browser gets with only the publishable key, which ships in
-- the client bundle of every page on square1ai.com. Anything granted to anon is
-- public.
-- ═════════════════════════════════════════════════════════════════════════════

  UNION ALL
  SELECT 8,
         'anon holds no read privilege on any bootcamp table',
         NOT EXISTS (SELECT 1 FROM readable WHERE role = 'anon'),
         COALESCE((SELECT string_agg(tbl, ', ') FROM readable WHERE role = 'anon'),
                  'none of 14 tables readable by anon')

  UNION ALL
  SELECT 8,
         'anon holds no write privilege on any bootcamp table',
         NOT EXISTS (SELECT 1 FROM writable WHERE role = 'anon'),
         COALESCE((SELECT string_agg(tbl || '.' || col, ', ')
                   FROM writable WHERE role = 'anon'),
                  'none of 14 tables writable by anon')

  UNION ALL
  SELECT 8,
         'no RLS policy targets anon or PUBLIC',
         NOT EXISTS (
           SELECT 1 FROM policies
           WHERE roles && ARRAY['anon', 'public']::name[]
         ),
         COALESCE((SELECT string_agg(tablename || '.' || policyname, ', ')
                   FROM policies WHERE roles && ARRAY['anon', 'public']::name[]),
                  'every policy names authenticated only')

  UNION ALL
  SELECT 8,
         'bootcamp_audit_log and bootcamp_waitlist are unreachable by BOTH client roles',
         -- The audit log: if a client could write it, every other control here
         -- becomes deniable after the fact. The waitlist: it is a list of the
         -- email address of everyone interested in the product.
         NOT EXISTS (
           SELECT 1 FROM readable
           WHERE tbl IN ('bootcamp_audit_log', 'bootcamp_waitlist')
         )
         AND NOT EXISTS (
           SELECT 1 FROM writable
           WHERE tbl IN ('bootcamp_audit_log', 'bootcamp_waitlist')
         )
         AND NOT EXISTS (
           SELECT 1 FROM policies
           WHERE tablename IN ('bootcamp_audit_log', 'bootcamp_waitlist')
         ),
         'service role only, at both layers'
)

SELECT
  hole,
  CASE WHEN closed THEN 'PASS' ELSE 'FAIL <<<' END AS result,
  assertion,
  detail
FROM checks
ORDER BY hole, assertion;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TODO(S8) — THE NINTH HOLE, NOT YET TESTABLE
--
-- A student writing their own `watched_seconds` to claim recording credit toward
-- the attendance gate. The column does not exist; S8 (recording ingest) creates
-- it. When it lands, add it to the HOLE 2 sweep — weighted attendance counts a
-- watched recording at 0.5, so a client-writable watched_seconds is a forged
-- graduation by a slower route than writing bootcamp_attendance directly.
-- Mirror the change in __tests__/bootcamp/integrity.test.ts.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════════
-- APPENDIX A — OPTIONAL: execute the refusals, still without writing
--
-- The query above proves the privileges. These snippets prove the BEHAVIOUR, by
-- becoming `authenticated` and attempting the reads. They are still read-only:
-- every statement is a SELECT. Run each on its own; each is expected to FAIL.
--
-- Holes 1, 2 and 7 need no snippet — a role that holds no INSERT or UPDATE
-- privilege on any column cannot write, and there is no statement to try.
--
-- ── A1. Hole 3 — reading the withheld thresholds ─────────────────────────────
--
--   BEGIN;
--     SET LOCAL ROLE authenticated;
--     SELECT requires FROM bootcamp_gates LIMIT 1;
--   ROLLBACK;
--
--   EXPECTED: ERROR: permission denied for table bootcamp_gates
--   A result set here is a live leak of the answer key.
--
-- ── A2. Hole 4 — reading the Zoom host link ──────────────────────────────────
--
--   BEGIN;
--     SET LOCAL ROLE authenticated;
--     SELECT zoom_start_url FROM bootcamp_sessions LIMIT 1;
--   ROLLBACK;
--
--   EXPECTED: ERROR: permission denied for table bootcamp_sessions
--
-- ── A3. Hole 5 — reading someone else's feedback thread ──────────────────────
--
-- This one needs an identity, because the policy is per-row rather than
-- per-column. Substitute the auth uid of a real student (students.auth_user_id);
-- the correct result is ZERO ROWS for every comment that is not theirs, NOT an
-- error. Run it with a student who has no submissions at all and it must return
-- 0 even though the table is not empty.
--
--   BEGIN;
--     SELECT count(*) AS total_comments_as_superuser FROM submission_comments;
--     SET LOCAL ROLE authenticated;
--     SET LOCAL request.jwt.claims = '{"sub":"<AUTH-UID-OF-A-TEST-STUDENT>","role":"authenticated"}';
--     SELECT count(*) AS visible_to_this_student FROM submission_comments;
--   ROLLBACK;
--
--   EXPECTED: the second count is only that student's own thread, and 0 for a
--   student with no submissions. If the two counts match, the policy is not
--   filtering and hole 5 is open.
--
-- ── A4. Hole 6 — calling the enrolment RPC ───────────────────────────────────
--
-- Do NOT run this one as a live probe. Unlike the others it is a WRITE path: if
-- the grant were wrong, the call would succeed and create an enrolment and a
-- payment row, and a ROLLBACK afterwards is not a control you want to be relying
-- on to undo that. The privilege check in the main query is the answer. If you
-- want behavioural confirmation, do it from the client side against a preview
-- deployment: POST to /rest/v1/rpc/s1_bootcamp_enrol with a student's access
-- token and expect HTTP 404 (PostgREST reports a function it cannot execute as
-- not found).
-- ═══════════════════════════════════════════════════════════════════════════════
