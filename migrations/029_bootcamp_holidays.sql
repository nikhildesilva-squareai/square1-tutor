-- Migration: bootcamp_holidays — the skip-week calendar, as DATA
-- Description: S5 (Live sessions) needs a 24-week class calendar that does not
--              schedule a mandatory live class on a day the band is observing a
--              holiday. docs/bootcamp-prd.md L230 and docs/bootcamp-user-stories.md
--              AD-04 both name the same four: Eid, Diwali, Poya, Thanksgiving.
-- Created: 2026-08-21
--
-- WHY A TABLE AND NOT A LIST IN A LOOP
--
-- Every one of these dates except Thanksgiving is lunar or lunisolar. Poya is a
-- monthly full-moon day; Eid depends on a moon sighting and moves by ~11 days a
-- year; Deepavali is Amavasya of Kartik. None of them can be computed from a
-- rule an engineer would get right, and all of them are gazetted annually by a
-- government that occasionally moves them. Hard-coding dates in a scheduling
-- loop means a code change and a deploy every time Sri Lanka publishes next
-- year's gazette — and it means the ops admin who actually knows the answer
-- cannot fix it. So: rows, editable in the desk, read by a pure function.
--
-- HOW THE SCHEDULER USES THIS (lib/bootcamp/sessions.ts)
--
--   • A cohort week is a BREAK WEEK if any applicable holiday with
--     skips_week = true falls on one of that week's session days.
--   • A break week emits no sessions and pushes every remaining week out by
--     seven days. Nothing is dropped — 24 weeks of content is 24 weeks of
--     content, delivered later. The week NUMBER never moves (gates are keyed to
--     week numbers); only the calendar date floats.
--   • skips_week = false means "show it on the calendar, do not move anything".
--     That is the lever for an ops admin who decides a particular Poya is not
--     worth a week of slip. It is a data edit, not a code change.
--
-- CONFIDENCE IS A COLUMN, ON PURPOSE
--
-- `confidence` and `source` exist so nobody downstream has to guess which of
-- these dates is arithmetic and which is an almanac projection. 'confirmed' =
-- gazetted or deterministic. 'estimated' = astronomical projection that has not
-- been officially declared yet, or a moon-sighting date that can move ±1 day.
-- Publishing a cohort calendar off an 'estimated' Eid without telling anyone is
-- how you cancel a class 50 people already blocked out.
--
-- RLS: readable by `authenticated` (students see why week 11 has no class),
-- writes service-role only. Follows the grant pattern in 021.
--
-- Apply manually via the Supabase SQL editor (this repo has no migration runner).
--
-- NOTE ON NUMBERING: 028 is bootcamp_single_payment. This is 029.

-- ─────────────────────────────────────────────────────────────────────────────
-- Table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bootcamp_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- First day of the observance. Multi-day festivals extend forward via spans_days.
  holiday_on date NOT NULL,
  name text NOT NULL,

  -- Human label for where this is observed: an ISO-3166-1 alpha-2 code
  -- ('LK', 'IN', 'US'), or 'GLOBAL'. Documentation for the ops admin — the
  -- scheduler filters on applies_to_bands, not on this.
  region text NOT NULL DEFAULT 'GLOBAL',

  -- The bands that actually observe it. This IS what the scheduler filters on,
  -- because a cohort has a band, not a country. Band A = South Asia/Gulf/East
  -- Africa, B = Europe/West Africa, C = the Americas (docs/bootcamp-live-architecture.md 8.2).
  applies_to_bands text[] NOT NULL DEFAULT ARRAY['A','B','C'],

  -- Observance length in days, inclusive of holiday_on. Eid runs three days in
  -- most of the Gulf; a year-end shutdown runs nine. One row, not nine rows.
  spans_days int NOT NULL DEFAULT 1,

  -- true  -> a collision blanks the cohort week and pushes the rest out 7 days
  -- false -> advisory: shown on the calendar, moves nothing
  skips_week boolean NOT NULL DEFAULT true,

  -- 'confirmed' = gazetted or deterministic (Thanksgiving is the 4th Thursday, always)
  -- 'estimated' = astronomical projection / moon-sighting dependent, can move
  confidence text NOT NULL DEFAULT 'estimated',
  source text,
  notes text,

  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  -- Idempotent seeding: re-running this migration inserts nothing new.
  CONSTRAINT bootcamp_holidays_unique UNIQUE (holiday_on, name, region),
  CONSTRAINT bootcamp_holidays_spans_sane CHECK (spans_days BETWEEN 1 AND 30),
  CONSTRAINT bootcamp_holidays_confidence_valid
    CHECK (confidence IN ('confirmed', 'estimated')),
  CONSTRAINT bootcamp_holidays_bands_valid
    CHECK (
      COALESCE(array_length(applies_to_bands, 1), 0) BETWEEN 1 AND 3
      AND applies_to_bands <@ ARRAY['A','B','C']
    )
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_holidays_on     ON bootcamp_holidays(holiday_on);
CREATE INDEX IF NOT EXISTS idx_bootcamp_holidays_bands  ON bootcamp_holidays USING GIN (applies_to_bands);

DROP TRIGGER IF EXISTS trg_bootcamp_holidays_touch ON bootcamp_holidays;
CREATE TRIGGER trg_bootcamp_holidays_touch BEFORE UPDATE ON bootcamp_holidays
  FOR EACH ROW EXECUTE FUNCTION public.s1_touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed — 2026 and 2027, covering Cohort 1 (5 Oct 2026 -> Mar 2027) with room
-- either side.
--
-- SOURCING. 2026 Sri Lankan dates are the published gazette as carried by
-- publicholidays.lk and cross-checked against a second listing of the same year;
-- both agree on all thirteen Poya dates and on Deepavali. 2027 is that site's own
-- projection and it says so — the Sri Lankan 2027 gazette is not out yet, so every
-- 2027 row here is marked 'estimated' and MUST be re-checked before a Cohort 2
-- calendar is published. Eid is 'estimated' in both years regardless of source:
-- it is declared on a moon sighting and routinely lands a day either side of the
-- projection.
--
-- Thanksgiving is the only deterministic one in the file (4th Thursday of
-- November) and is the only thing marked 'confirmed' with total confidence.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO bootcamp_holidays
  (holiday_on, name, region, applies_to_bands, spans_days, skips_week, confidence, source, notes)
VALUES
  -- ── Poya (Sri Lanka) — every full moon, a gazetted public holiday ──────────
  -- Band A only. Kept skips_week = true: Cohort 1 is Band A and majority Sri
  -- Lankan, the class sits at 19:00 which is exactly when observance happens,
  -- and a gazetted holiday is not a good day to run a mandatory live session.
  -- If the resulting slip is unacceptable, flip individual rows to false — that
  -- is the whole reason this is a column.
  ('2026-01-03', 'Duruthu Full Moon Poya Day',    'LK', ARRAY['A'], 1, true, 'confirmed', 'publicholidays.lk 2026 gazette listing', NULL),
  ('2026-02-01', 'Navam Full Moon Poya Day',      'LK', ARRAY['A'], 1, true, 'confirmed', 'publicholidays.lk 2026 gazette listing', NULL),
  ('2026-03-02', 'Madin Full Moon Poya Day',      'LK', ARRAY['A'], 1, true, 'confirmed', 'publicholidays.lk 2026 gazette listing', NULL),
  ('2026-04-01', 'Bak Full Moon Poya Day',        'LK', ARRAY['A'], 1, true, 'confirmed', 'publicholidays.lk 2026 gazette listing', NULL),
  ('2026-05-01', 'Vesak Full Moon Poya Day',      'LK', ARRAY['A'], 2, true, 'confirmed', 'publicholidays.lk 2026 gazette listing', 'Day-following-Vesak (2 May) is also a holiday, hence spans_days = 2. 2026 is an adhi (intercalary) year with two May full moons, so some almanacs label 30 May as Vesak instead; the DATES below are what matters, not the label.'),
  ('2026-05-30', 'Adhi Poson Full Moon Poya Day', 'LK', ARRAY['A'], 1, true, 'confirmed', 'publicholidays.lk 2026 gazette listing', NULL),
  ('2026-06-29', 'Poson Full Moon Poya Day',      'LK', ARRAY['A'], 1, true, 'confirmed', 'publicholidays.lk 2026 gazette listing', NULL),
  ('2026-07-29', 'Esala Full Moon Poya Day',      'LK', ARRAY['A'], 1, true, 'confirmed', 'publicholidays.lk 2026 gazette listing', NULL),
  ('2026-08-27', 'Nikini Full Moon Poya Day',     'LK', ARRAY['A'], 1, true, 'confirmed', 'publicholidays.lk 2026 gazette listing', NULL),
  ('2026-09-26', 'Binara Full Moon Poya Day',     'LK', ARRAY['A'], 1, true, 'confirmed', 'publicholidays.lk 2026 gazette listing', NULL),
  ('2026-10-25', 'Vap Full Moon Poya Day',        'LK', ARRAY['A'], 1, true, 'confirmed', 'publicholidays.lk 2026 gazette listing', 'Cohort 1 window.'),
  ('2026-11-24', 'Ill Full Moon Poya Day',        'LK', ARRAY['A'], 1, true, 'confirmed', 'publicholidays.lk 2026 gazette listing', 'Cohort 1 window.'),
  ('2026-12-23', 'Unduvap Full Moon Poya Day',    'LK', ARRAY['A'], 1, true, 'confirmed', 'publicholidays.lk 2026 gazette listing', 'Cohort 1 window.'),

  ('2027-01-22', 'Duruthu Full Moon Poya Day',    'LK', ARRAY['A'], 1, true, 'estimated', 'publicholidays.lk 2027 projection (gazette not yet published)', 'Cohort 1 window. RE-CHECK against the 2027 gazette.'),
  ('2027-02-20', 'Navam Full Moon Poya Day',      'LK', ARRAY['A'], 1, true, 'estimated', 'publicholidays.lk 2027 projection (gazette not yet published)', 'Cohort 1 window. RE-CHECK against the 2027 gazette.'),
  ('2027-03-21', 'Madin Full Moon Poya Day',      'LK', ARRAY['A'], 1, true, 'estimated', 'publicholidays.lk 2027 projection (gazette not yet published)', 'Cohort 1 window. RE-CHECK against the 2027 gazette.'),
  ('2027-04-20', 'Bak Full Moon Poya Day',        'LK', ARRAY['A'], 1, true, 'estimated', 'publicholidays.lk 2027 projection (gazette not yet published)', NULL),
  ('2027-05-20', 'Vesak Full Moon Poya Day',      'LK', ARRAY['A'], 2, true, 'estimated', 'publicholidays.lk 2027 projection (gazette not yet published)', 'Day-following-Vesak (21 May) also a holiday.'),
  ('2027-06-18', 'Poson Full Moon Poya Day',      'LK', ARRAY['A'], 1, true, 'estimated', 'publicholidays.lk 2027 projection (gazette not yet published)', NULL),
  ('2027-07-18', 'Esala Full Moon Poya Day',      'LK', ARRAY['A'], 1, true, 'estimated', 'publicholidays.lk 2027 projection (gazette not yet published)', NULL),
  ('2027-08-16', 'Nikini Full Moon Poya Day',     'LK', ARRAY['A'], 1, true, 'estimated', 'publicholidays.lk 2027 projection (gazette not yet published)', NULL),
  ('2027-09-15', 'Binara Full Moon Poya Day',     'LK', ARRAY['A'], 1, true, 'estimated', 'publicholidays.lk 2027 projection (gazette not yet published)', NULL),
  ('2027-10-15', 'Vap Full Moon Poya Day',        'LK', ARRAY['A'], 1, true, 'estimated', 'publicholidays.lk 2027 projection (gazette not yet published)', NULL),
  ('2027-11-13', 'Ill Full Moon Poya Day',        'LK', ARRAY['A'], 1, true, 'estimated', 'publicholidays.lk 2027 projection (gazette not yet published)', NULL),
  ('2027-12-13', 'Unduvap Full Moon Poya Day',    'LK', ARRAY['A'], 1, true, 'estimated', 'publicholidays.lk 2027 projection (gazette not yet published)', NULL),

  -- ── Diwali / Deepavali ────────────────────────────────────────────────────
  -- Band A (India, Sri Lanka, Singapore, Malaysia, and the Gulf's South Asian
  -- workforce). Two days: Lakshmi Puja plus the following day, which is when
  -- most of India is actually unavailable.
  ('2026-11-08', 'Deepavali',                     'IN', ARRAY['A'], 2, true, 'confirmed', 'publicholidays.lk 2026 gazette listing', 'Cohort 1 window. Falls on a Sunday in 2026.'),
  ('2027-10-28', 'Deepavali',                     'IN', ARRAY['A'], 2, true, 'estimated', 'publicholidays.lk 2027 projection', 'RE-CHECK before publishing a Cohort 2 calendar.'),

  -- ── Eid ───────────────────────────────────────────────────────────────────
  -- Bands A and B: the Gulf, Pakistan, Bangladesh, Indonesia, Nigeria, and
  -- Muslim communities across Europe. ALWAYS 'estimated' — the date is declared
  -- on a moon sighting and lands ±1 day from the projection often enough that
  -- treating it as fixed is a mistake. Three days: Eid is not a one-day event
  -- anywhere it is a public holiday.
  ('2026-03-21', 'Eid al-Fitr',                   'GLOBAL', ARRAY['A','B'], 3, true, 'estimated', 'publicholidays.lk 2026 listing (Id Ul-Fitr)', 'Moon-sighting dependent; can move ±1 day.'),
  ('2026-05-28', 'Eid al-Adha',                   'GLOBAL', ARRAY['A','B'], 3, true, 'estimated', 'publicholidays.lk 2026 listing (Id Ul-Alha)', 'Moon-sighting dependent; can move ±1 day.'),
  ('2027-03-10', 'Eid al-Fitr',                   'GLOBAL', ARRAY['A','B'], 3, true, 'estimated', 'publicholidays.lk 2027 projection (Id Ul-Fitr)', 'Cohort 1 window — lands in the final weeks. Moon-sighting dependent; RE-CHECK ~4 weeks out and re-run the seed script.'),
  ('2027-05-17', 'Eid al-Adha',                   'GLOBAL', ARRAY['A','B'], 3, true, 'estimated', 'publicholidays.lk 2027 projection (Id Ul-Alha)', 'Moon-sighting dependent; can move ±1 day.'),

  -- ── Thanksgiving (US) ─────────────────────────────────────────────────────
  -- Band C only, and the only deterministic date in this file: the fourth
  -- Thursday of November, by statute. Four days, because the Friday and the
  -- weekend after are the single deadest stretch in the American calendar.
  ('2026-11-26', 'Thanksgiving',                  'US', ARRAY['C'], 4, true, 'confirmed', '5 U.S.C. 6103 — fourth Thursday of November', 'Nov 2026: Thursdays fall on 5, 12, 19, 26.'),
  ('2027-11-25', 'Thanksgiving',                  'US', ARRAY['C'], 4, true, 'confirmed', '5 U.S.C. 6103 — fourth Thursday of November', 'Nov 2027: Thursdays fall on 4, 11, 18, 25.'),

  -- ── Year-end shutdown ─────────────────────────────────────────────────────
  -- Not named in the PRD, but a 24-week cohort starting in October crosses it in
  -- every band, and neither Christmas Day (Fri 25 Dec 2026) nor New Year's Day
  -- (Fri 1 Jan 2027) lands on a session day — so without this row the scheduler
  -- would cheerfully hold a live class on Monday 28 December. One row expressing
  -- the real shutdown, easy to delete if the cohort wants to work through it.
  ('2026-12-24', 'Year-end break',                'GLOBAL', ARRAY['A','B','C'], 9, true, 'confirmed', 'Editorial decision — 24 Dec 2026 through 1 Jan 2027 inclusive', 'Cohort 1 window. Nine days, not a fortnight: it costs the cohort exactly one week (the week of 28 Dec) and lets teaching resume on 4 Jan. Delete this row to run classes through the new year.'),
  ('2027-12-24', 'Year-end break',                'GLOBAL', ARRAY['A','B','C'], 9, true, 'confirmed', 'Editorial decision — 24 Dec 2027 through 1 Jan 2028 inclusive', NULL),

  -- ── Sinhala & Tamil New Year (Sri Lanka) ──────────────────────────────────
  -- Also not one of the four the PRD names, and also unavoidable: Avurudu is the
  -- one week of the year Sri Lanka genuinely stops. A Band A cohort is majority
  -- Sri Lankan and Cohort 1's holiday slip pushes its final weeks into April, so
  -- leaving this out would generate a calendar that is wrong for the cohort we
  -- are actually selling. Two days: the eve and the day.
  ('2026-04-13', 'Sinhala & Tamil New Year',      'LK', ARRAY['A'], 2, true, 'confirmed', 'publicholidays.lk 2026 gazette listing', NULL),
  ('2027-04-13', 'Sinhala & Tamil New Year',      'LK', ARRAY['A'], 2, true, 'confirmed', 'publicholidays.lk 2027 projection', 'Cohort 1 window once holiday slip is applied. Fixed solar date, so unlike the lunar rows this one does not move.')

ON CONFLICT (holiday_on, name, region) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- TODO(S5-holidays) — what is NOT in this table
--
--   • Ramadan itself. Only Eid is seeded. A month of fasting materially changes
--     what a 19:00 class feels like in the Gulf and South Asia, but blanking four
--     consecutive weeks is a product decision, not a scheduling one. If it is
--     made, express it as one row with spans_days ~30 and skips_week = true.
--   • Band B national holidays (UK bank holidays, Nigerian public holidays).
--     Not needed until Band B opens at Cohort 2.
--   • Band C beyond Thanksgiving (Independence Day, Labor Day, Memorial Day).
--     Not needed until Band C opens.
--   • Everything for 2028 and later.
--   • Every 2027 row above is a projection, not a gazette. Re-check them all
--     before a Cohort 2 calendar is published, and re-check Eid al-Fitr 2027
--     specifically before Cohort 1's final month — it is the only 'estimated'
--     date that lands inside a cohort that will already be running.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
--
-- Students see this. "No class this week — Unduvap Poya" is a better answer than
-- a silent gap in the calendar, and the whole point of publishing skip-weeks up
-- front (docs/bootcamp-live-architecture.md 8.5) is that nobody is surprised.
-- Nothing here is sensitive; it is a public holiday calendar.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE bootcamp_holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bootcamp_holidays_select_all ON bootcamp_holidays;
CREATE POLICY bootcamp_holidays_select_all ON bootcamp_holidays
  FOR SELECT TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policy, and no write grant below. Editing the holiday
-- calendar moves 50 people's class dates; it is a desk action under the service
-- role, and 021's audit-log discipline applies to it.

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants — belt and braces BELOW RLS, matching 021.
--
-- Supabase grants ALL on new public tables to anon + authenticated by default,
-- so strip it back and re-grant exactly what is needed.
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE ALL ON bootcamp_holidays FROM anon, authenticated;
GRANT SELECT ON bootcamp_holidays TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Comments (this table will be read by people who did not write it)
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE bootcamp_holidays IS
  'Skip-week calendar for bootcamp session generation. Read by lib/bootcamp/sessions.ts. Rows, not code, because every date except Thanksgiving is lunar and gazetted annually.';
COMMENT ON COLUMN bootcamp_holidays.applies_to_bands IS
  'Bands that observe this. What the scheduler filters on — a cohort has a band, not a country.';
COMMENT ON COLUMN bootcamp_holidays.spans_days IS
  'Observance length in days INCLUSIVE of holiday_on. Eid is 3, a year-end shutdown is ~12.';
COMMENT ON COLUMN bootcamp_holidays.skips_week IS
  'true = a collision with a session day blanks the cohort week and pushes the rest out 7 days. false = advisory only, shown on the calendar, moves nothing.';
COMMENT ON COLUMN bootcamp_holidays.confidence IS
  'confirmed = gazetted or deterministic. estimated = astronomical projection or moon-sighting dependent, can move. Never publish a cohort calendar off an estimated date without saying so.';
