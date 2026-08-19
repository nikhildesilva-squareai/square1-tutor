-- Migration: Seed the six bootcamp tracks + Cohort 1
-- Description: Data seed for S2 (docs/bootcamp-prd.md). Six tracks exist from day
--              one because a track is a `bootcamps` row, not a code path — but
--              only AI and Cybersecurity are sellable, because each 50-seat cohort
--              needs one FTE instructor and we have two to hire, not six.
-- Created: 2026-08-19
--
-- No generated IDs are hardcoded: course_id is resolved by slug so this is safe to
-- re-run and safe to apply to any environment.
--
-- TRACK -> COURSE MAPPING. Five are exact. The sixth is a judgement call:
-- "Forward Deployed Engineer" has no course of its own, and LLM Agent Architect
-- (109 lessons, 10 projects) is the closest real curriculum — an FDE builds and
-- deploys agent systems in front of customers. Change the slug below if the
-- intent is different; nothing else depends on the choice.
--
-- STATUS. draft = unlisted, waitlist = listed and collecting interest with no
-- cohort to join, open = has a sellable cohort. Nothing here is reachable by a
-- user until BOOTCAMP_ENABLED is flipped in lib/flags.ts.
--
-- PRICING is in cents and is the FOUNDING rate for Cohort 1 ($890 / $490), not
-- the list rate ($1,490 / $790). It lives on the cohort, not the bootcamp, so a
-- later cohort can price differently without touching the track.
--
-- Apply manually via the Supabase SQL editor (this repo has no migration runner).

INSERT INTO bootcamps (course_id, slug, title, tagline, status, weeks, hours_per_week, default_cohort_size)
SELECT c.id, v.slug, v.title, v.tagline, v.status, 24, 15, 50
FROM (VALUES
  ('ai-engineering',      'artificial-intelligence', 'AI Engineering Bootcamp',
   'Six months, live, with a weekly 1-1. Ship graded AI systems and defend them on camera.', 'open'),
  ('cybersecurity',       'cybersecurity',           'Cybersecurity Bootcamp',
   'Six months, live. Prove you found the vulnerability — against a withheld answer key.', 'open'),
  ('machine-learning',    'machine-learning',        'Machine Learning Bootcamp',
   'Six months, live. Models that pass contract tests, not notebooks that run once.', 'waitlist'),
  ('computer-vision',     'computer-vision',         'Computer Vision Bootcamp',
   'Six months, live. From pixels to a deployed pipeline you can explain line by line.', 'waitlist'),
  ('software-engineering','coding-with-ai',          'Software Engineering Bootcamp',
   'Six months, live. Build with AI, then prove the defect is actually fixed.', 'waitlist'),
  ('forward-deployed',    'llm-agent-architect',     'Forward Deployed Engineer Bootcamp',
   'Six months, live. Deploy agent systems in front of real users and own the outcome.', 'waitlist')
) AS v(slug, course_slug, title, tagline, status)
JOIN courses c ON c.slug = v.course_slug
ON CONFLICT (slug) DO NOTHING;

-- Cohort 1 — Band A (Asia/Colombo 19:00), the two open tracks only.
-- 24 weeks: 5 Oct 2026 -> 22 Mar 2027. Applications 15 Sep -> 1 Oct.
INSERT INTO bootcamp_cohorts (
  bootcamp_id, name, band, timezone, starts_on, ends_on,
  applications_open_on, applications_close_on, seats,
  price_cents_global, price_cents_regional, status
)
SELECT b.id, 'Cohort 1', 'A', 'Asia/Colombo',
       DATE '2026-10-05', DATE '2027-03-22',
       DATE '2026-09-15', DATE '2026-10-01',
       50, 89000, 49000, 'open'
FROM bootcamps b
WHERE b.slug IN ('ai-engineering', 'cybersecurity')
ON CONFLICT (bootcamp_id, name) DO NOTHING;
