-- Migration: Seed the six gates for every bootcamp track
-- Description: The sales page promises "six gates you cannot skip" and
--              bootcamp_gates was empty. This fills it for all six tracks.
-- Created: 2026-08-21
--
-- ADAPTIVE, NOT HARDCODED. Five tracks have 10 projects; Software Engineering
-- with AI has 6. Projects are bucketed by their order_index as a PROPORTION of
-- however many the course has, so the same seed produces a sane spine for both
-- and for any track added later. No project ids are hardcoded.
--
-- WEEKS come from the gate, not from projects.schedule_week: that column is NULL
-- for five of the six courses, so leaning on it would silently produce gates with
-- no dates. Weeks 5/10/14/18/22/24 are the 24-week spine in docs/bootcamp-prd.md.
--
-- `requires` IS AN ANSWER KEY. It holds the pass thresholds and is excluded from
-- the authenticated SELECT grant in migration 021 — a student who can read it
-- knows exactly how little to do. It is written here under the service role and
-- never leaves the server.
--
-- min_score is 75 everywhere: the bootcamp bar, deliberately above the
-- self-paced bars (60 with an objective gate, 70 solo). People are paying for a
-- harder standard.
--
-- Apply manually via the Supabase SQL editor (this repo has no migration runner).

WITH ranked AS (
  SELECT b.id AS bootcamp_id,
         p.id  AS project_id,
         row_number() OVER (PARTITION BY b.id ORDER BY p.order_index) AS rn,
         count(*)     OVER (PARTITION BY b.id)                        AS total
  FROM bootcamps b
  JOIN projects p ON p.course_id = b.course_id
),
assigned AS (
  SELECT bootcamp_id, project_id,
         CASE
           WHEN rn <= ceil(total * 0.20) THEN 1   -- foundations
           WHEN rn <= ceil(total * 0.40) THEN 2   -- core craft
           WHEN rn <= ceil(total * 0.60) THEN 3   -- squad build
           WHEN rn <= ceil(total * 0.70) THEN 4   -- employer brief
           ELSE 5                                  -- capstone
         END AS gate_order
  FROM ranked
),
buckets AS (
  SELECT bootcamp_id, gate_order, jsonb_agg(project_id ORDER BY project_id) AS project_ids
  FROM assigned GROUP BY bootcamp_id, gate_order
),
spec AS (
  SELECT * FROM (VALUES
    (1,  5, 'Foundations',
     'Your first solo build, graded against a withheld answer key. Passing opens the core block.'),
    (2, 10, 'Core craft',
     'A harder solo build plus two peer reviews you write yourself — reading code is the skill nobody teaches.'),
    (3, 14, 'Squad build',
     'One repo, four people, pull requests only. Your individual contribution is audited from GitHub, so nobody passes on a teammate''s work.'),
    (4, 18, 'Employer brief',
     'A real problem submitted by a hiring partner. They see a ranked, evidence-backed shortlist.'),
    (5, 22, 'Capstone and viva',
     'Your own project, then twenty recorded minutes defending the code you wrote. The recording is attached to your credential.'),
    (6, 24, 'Hiring sprint',
     'CV from your graded work, a public portfolio, ten tracked applications and a human mock interview.')
  ) AS s(order_index, week, title, summary_md)
)
INSERT INTO bootcamp_gates (bootcamp_id, order_index, week, title, summary_md, requires)
SELECT
  b.id,
  s.order_index,
  s.week,
  s.title,
  s.summary_md,
  jsonb_strip_nulls(
    jsonb_build_object(
      'lessons_pct',      CASE WHEN s.order_index = 6 THEN NULL ELSE 90 END,
      'project_ids',      bk.project_ids,
      'min_score',        CASE WHEN s.order_index = 6 THEN NULL ELSE 75 END,
      'peer_reviews',     CASE WHEN s.order_index IN (2, 3) THEN 2 ELSE NULL END,
      'min_authored_prs', CASE WHEN s.order_index = 3 THEN 1 ELSE NULL END,
      'attendance_pct',   70,
      'viva',             CASE WHEN s.order_index = 5 THEN true ELSE NULL END,
      'human_signoff',    true
    )
  )
FROM bootcamps b
CROSS JOIN spec s
LEFT JOIN buckets bk ON bk.bootcamp_id = b.id AND bk.gate_order = s.order_index
ON CONFLICT (bootcamp_id, order_index) DO NOTHING;
