# Square 1 Bootcamps — Build Roadmap

**Date:** 2026-08-16
**Status:** Proposal / not started
**Scope:** Add 6-month, cohort-based, strictly-gated bootcamps with compulsory projects to square1ai.com, and the hiring machinery that makes the outcome real.

---

## 0. The honest starting position

A bootcamp is not a new product for you. It is a **wrapper** around the program you already shipped. Grounded in the current codebase:

| Bootcamp requirement | Status today | Where it lives |
|---|---|---|
| 24-week paced curriculum | ✅ Built | `lib/schedule.ts` — explicitly "authored against the 6-month (24-week) baseline" |
| Rolling per-learner deadlines | ✅ Built | `weekDueDate` / `projectStatus` / `countdownLabel` |
| Week-0 on-ramp | ✅ Built | Module 0 in all 10 core courses (`order_index` 0) |
| Placement assessment | ✅ Built | `/courses/[slug]/assess`, `assessment_level` on enrolment |
| Compulsory projects w/ objective pass bar | ✅ Built | `lib/grading/objective.ts` (withheld answer key), `lib/grading/ci.ts` (GitHub Actions contract tests) |
| Rubric-based project review | ✅ Built | `lib/grading/project-review.ts`, bars `RUBRIC_BAR=60` / `SOLO_BAR=70` |
| Portfolio of graded work | ✅ Built | `app/(app)/portfolio` |
| Credential + public verification | ✅ Built | `lib/certificates.ts`, `/verify` |
| Career agent grounded only in graded work | ✅ Built | `lib/career/verified-profile.ts` |
| Competency radar / role-readiness | ✅ Built | `lib/competency.ts`, `lib/readiness.ts` |
| Community + DMs + teams | ✅ Built | `lib/community/*`, `app/api/org/*` |
| **Cohort object (start date, roster, seats)** | ❌ Missing | — |
| **Hard gating (cannot skip ahead)** | ❌ Missing | everything is unlocked today |
| **Live ritual (sessions, attendance, demo day)** | ❌ Missing | — |
| **Squads / peer code review** | ❌ Missing | `org` tables are the closest primitive |
| **Human review + resubmission loop** | ❌ Missing | AI-only, single-shot |
| **Employer supply + hiring funnel** | ❌ Missing | — |
| **Outcomes reporting** | ❌ Missing | — |

**Implication for sequencing:** do not rebuild curriculum. Build the cohort spine, the gates, the ritual, then the hiring machine — in that order. Roughly 10–12 weeks of engineering to a pilot cohort start.

---

## 1. Product definition — what a Bootcamp *is* vs. the self-paced track

You must be able to say the difference in one line, or you will cannibalise your own $19.90/mo product.

> **Self-paced:** you learn on your schedule, and your work is graded.
> **Bootcamp:** you are in a cohort with a start date, a squad, deadlines you cannot move, a human who reviews your code, a defence you must pass, and a hiring sprint at the end. You either finish job-ready or you don't finish.

Non-negotiables that define the format:

1. **Fixed start and end date.** Everyone in Cohort 3 starts 2026-10-05 and ends 2027-03-22.
2. **Strict linear curriculum.** Week 7 content does not open until Gate 1 is passed.
3. **Compulsory projects.** 6 gate projects + 1 capstone. Not optional, not skippable, higher pass bar than self-paced (**75%**, vs 60/70).
4. **Human in the loop.** AI grades first; a human reviewer signs off every gate. This is what makes the credential worth more than the free one.
5. **A defence.** A recorded 20-minute viva on your own code. This is the answer to "did an AI write this?"
6. **A hiring sprint.** Weeks 23–24 are not curriculum. They are applications, intros and interviews.
7. **You can fail.** Standing: `good` → `at_risk` → `probation` → `deferred` / `withdrawn`. A bootcamp where nobody fails has a worthless certificate.

**Pick ONE track for the pilot.** Recommendation: **Data Science** or **Software Engineering with AI** — DS has the deepest exercise bank and gold-standard kits; SE-with-AI has 6 hosted kits with planted defects that must be *proven* fixed, which is the single best gate mechanic you own. Do not launch three tracks at once; employer supply is the bottleneck and it is per-domain.

---

## 2. The 24-week spine

Baseline for a 6-month bootcamp. `plan_months = 6` already maps 1:1 onto this, so `scaleWeek()` is a no-op and existing `schedule_week` values on projects are directly reusable.

| Weeks | Block | Output | Gate |
|---|---|---|---|
| 0 | **Orientation** | Setup, placement assessment, squad assignment, learning contract signed | — |
| 1–5 | **Foundations** (Module 0 + core modules 1–2) | Solo Project 1 | **Gate 1** — solo build, objective key + rubric ≥75 |
| 6–10 | **Core craft** | Solo Project 2 + first peer reviews | **Gate 2** — includes 2 reviewed peer PRs |
| 11–14 | **Squad build** | Squad project, rotating roles, one shared repo | **Gate 3** — squad demo + individual contribution audit |
| 15–18 | **Specialisation + employer brief** | Real brief from a hiring partner | **Gate 4** — partner-visible scored submission |
| 19–22 | **Capstone** | Real client or merged OSS contribution | **Gate 5** — capstone + recorded viva |
| 23–24 | **Hiring sprint** | CV, public portfolio, 10 targeted applications, mock loops, Demo Day | **Gate 6** — hiring-ready checklist |

**Gate mechanics** (all reusable from existing code):
- Objective completion check against withheld answer key → `scoreObjective()`
- CI contract tests on the student's repo → `verifyCiActions()`
- Rubric review by AI → `reviewProject()`
- **New:** human reviewer sign-off + resubmission loop (max 2 resubmits, 7-day window)
- **New:** viva (Gate 5) — Nova mock interview first (`/career` already does this), then a human panel, recorded

**Failing a gate** does not eject you. It puts you on `probation` with a remediation plan (adaptive remediation already exists in the curriculum design), and a second failure defers you to the next cohort at no extra cost. Deferral, not refund, is the humane and financially survivable answer.

---

## 3. Data model

New tables. Deliberately additive — nothing here changes `student_enrollments`, so the self-paced product is untouched and a bootcamp student is *also* a normal enrolled student (which means dashboard, streaks, Nova memory, portfolio, certificates all keep working for free).

```sql
-- The product
create table bootcamps (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id),
  slug text unique not null,
  title text not null,
  weeks int not null default 24,
  format text not null default 'part_time',        -- part_time | full_time
  hours_per_week int not null default 15,
  published boolean not null default false,
  created_at timestamptz default now()
);

-- The instance
create table bootcamp_cohorts (
  id uuid primary key default gen_random_uuid(),
  bootcamp_id uuid not null references bootcamps(id),
  name text not null,                               -- "Cohort 1"
  starts_on date not null,
  ends_on date not null,
  applications_close_on date not null,
  seats int not null,
  timezone text not null default 'Asia/Colombo',
  status text not null default 'draft',             -- draft|open|full|running|complete|cancelled
  community_id uuid references communities(id),     -- reuse the community you already ship
  unique (bootcamp_id, name)
);

-- Admissions
create table bootcamp_applications (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references bootcamp_cohorts(id),
  student_id uuid not null references students(id),
  status text not null default 'submitted',         -- submitted|assessed|accepted|waitlisted|rejected|withdrawn
  assessment_attempt_id uuid,                       -- existing placement assessment
  assessment_pct numeric,
  motivation text,
  hours_committed int,
  reviewed_by uuid,
  decided_at timestamptz,
  created_at timestamptz default now(),
  unique (cohort_id, student_id)
);

-- Membership (rides on top of a normal enrolment)
create table bootcamp_enrollments (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references bootcamp_cohorts(id),
  student_id uuid not null references students(id),
  enrollment_id uuid not null references student_enrollments(id),
  squad_id uuid references bootcamp_squads(id),
  status text not null default 'active',            -- active|deferred|withdrawn|graduated
  standing text not null default 'good',            -- good|at_risk|probation
  deferred_to_cohort_id uuid references bootcamp_cohorts(id),
  graduated_at timestamptz,
  unique (cohort_id, student_id)
);

create table bootcamp_squads (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references bootcamp_cohorts(id),
  name text not null,
  repo_url text,
  created_at timestamptz default now()
);

-- Gating
create table bootcamp_gates (
  id uuid primary key default gen_random_uuid(),
  bootcamp_id uuid not null references bootcamps(id),
  week int not null,
  order_index int not null,
  title text not null,
  unlocks_module_ids uuid[],                        -- what passing opens
  requires jsonb not null                           -- see shape below
);
-- requires: {
--   "lessons_pct": 90,
--   "project_ids": ["…"],
--   "min_score": 75,
--   "peer_reviews": 2,
--   "attendance_pct": 70,
--   "viva": false,
--   "human_signoff": true
-- }

create table bootcamp_gate_results (
  id uuid primary key default gen_random_uuid(),
  bootcamp_enrollment_id uuid not null references bootcamp_enrollments(id),
  gate_id uuid not null references bootcamp_gates(id),
  status text not null default 'locked',            -- locked|open|submitted|passed|failed|waived
  auto_score numeric,
  reviewer_id uuid,
  reviewer_notes text,
  attempts int not null default 0,
  viva_recording_url text,
  decided_at timestamptz,
  unique (bootcamp_enrollment_id, gate_id)
);

-- Ritual
create table bootcamp_sessions (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references bootcamp_cohorts(id),
  week int not null,
  kind text not null,                               -- kickoff|lecture|lab|standup|review|demo_day|hiring
  title text not null,
  starts_at timestamptz not null,
  duration_min int not null default 60,
  join_url text,
  recording_url text
);

create table bootcamp_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references bootcamp_sessions(id),
  bootcamp_enrollment_id uuid not null references bootcamp_enrollments(id),
  status text not null,                             -- present|late|absent|excused|watched_recording
  unique (session_id, bootcamp_enrollment_id)
);

-- Peer review (the creative + credible bit)
create table peer_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_enrollment_id uuid not null references bootcamp_enrollments(id),
  submission_id uuid not null references project_submissions(id),
  pr_url text,
  rubric_scores jsonb,
  comments_md text,
  quality_score numeric,                            -- the review itself is graded
  created_at timestamptz default now()
);

-- Hiring machine
create table employer_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  tier text not null default 'standard',            -- standard|hiring|founding
  contact_email text not null,
  verified_at timestamptz,
  created_at timestamptz default now()
);

create table employer_briefs (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references employer_partners(id),
  cohort_id uuid references bootcamp_cohorts(id),
  title text not null,
  brief_md text not null,
  rubric jsonb,
  open boolean not null default true
);

create table hiring_intros (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references employer_partners(id),
  bootcamp_enrollment_id uuid not null references bootcamp_enrollments(id),
  status text not null default 'requested',         -- requested|accepted|interviewing|offer|hired|passed
  requested_at timestamptz default now(),
  outcome_at timestamptz,
  notes text
);

create table graduate_outcomes (
  id uuid primary key default gen_random_uuid(),
  bootcamp_enrollment_id uuid not null references bootcamp_enrollments(id),
  status text not null,                             -- hired|freelancing|promoted|still_searching|not_seeking|unreachable
  employer text,
  role_title text,
  salary_band text,
  started_on date,
  source text not null,                             -- self_reported|verified_offer_letter|partner_confirmed
  verified_at timestamptz,
  recorded_at timestamptz default now()
);
```

**RLS notes (learn from the 2026-07-29 audit):** students may read only their own `bootcamp_enrollments`, `bootcamp_gate_results` and `graduate_outcomes`. `bootcamp_gates.requires` and `employer_briefs.rubric` must be **service-role only** — same rule as `projects.grading`, since gate thresholds are effectively answer keys. Gate *writes* must be revoked at the DB level for the student role: a student who can write `bootcamp_gate_results.status='passed'` can forge a graduation, which is exactly the integrity class of bug you fixed last month.

---

## 4. Surfaces to build

**Public / marketing**
- `/bootcamps` — index of tracks
- `/bootcamps/[slug]` — the sales page: spine, gates, squad model, hiring sprint, next cohort + seats left (real count from `bootcamp_cohorts.seats` minus accepted apps — never a fake counter)
- `/bootcamps/[slug]/apply` — application: placement assessment + hours commitment + motivation
- `/bootcamps/[slug]/outcomes` — the honest outcomes page (§6.7)
- `/hire` — employer landing
- `/hire/talent` — gated verified-graduate directory
- `/hire/brief` — submit an employer brief

**Student app** (`app/(app)/bootcamp/…`)
- `/bootcamp` — cohort command centre: this week, next deadline countdown, gate status rail, next live session, squad, standing
- `/bootcamp/gates/[gateId]` — requirements checklist, submit, reviewer feedback, resubmit
- `/bootcamp/squad` — squad repo, roles this sprint, teammates' PRs awaiting your review
- `/bootcamp/sessions` — calendar + recordings
- `/bootcamp/reviews` — peer reviews owed and received
- `/bootcamp/demo-day` — your slot, your build
- Extend `/portfolio` → add a **public** `/p/[handle]` shareable version

**Desk / ops** (`app/desk/…` — extends the existing desk)
- `/desk/bootcamp` — cohort roster, standing, at-risk list, this week's ungraded gates
- `/desk/bootcamp/gates/[id]` — human review queue: AI score + repo diff + rubric, sign off or fail with notes
- `/desk/bootcamp/attendance`
- `/desk/applications` — admissions queue
- `/desk/hiring` — partners, briefs, intro pipeline, outcomes ledger

**Jobs / cron** (`app/api/cron` already exists)
- Nightly: recompute standing (`at_risk` if behind schedule ≥ 7 days or attendance < 60%)
- Weekly: cohort digest email; reviewer "you have N gates waiting" email
- On gate pass: unlock next modules, email, community announcement
- Weeks 22/26/39/52 post-graduation: outcome survey → `graduate_outcomes`

---

## 5. Being creative in *how* they build

This is where a bootcamp either produces engineers or produces tutorial-followers. Nine mechanics, ordered by how much I'd fight to keep them:

**1. Squads with rotating roles (weeks 11–14, then permanently).**
Squads of 4. Each sprint one person is Lead, one Reviewer, one QA, one Docs — roles rotate weekly so nobody hides. One shared repo, PR-only workflow, no direct pushes to main. You already have `lib/github/fetch-repo.ts`; extend it to read PR authorship and review counts so **individual contribution inside a team build is auditable**. That solves the classic bootcamp problem where one strong student carries the group and the certificate lies about the other three.

**2. Peer code review as a graded artifact.**
Every student must review 2 teammates' PRs per gate, and *the review itself is scored* (`peer_reviews.quality_score`) by the same AI reviewer that grades projects. Reviewing code badly is the single most common junior-hire failure mode, and nobody else teaches it. It also costs you nothing in human hours.

**3. Employer-authored briefs (weeks 15–18).**
A hiring partner submits a real, scoped problem. The whole cohort builds against it. The partner receives a ranked, evidence-backed shortlist. This is simultaneously: the most motivating build of the program, free curriculum, and your **entire top-of-funnel for employer supply**. It is the highest-leverage single feature in this document.

**4. Break-fix / incident weeks.**
You already ship hosted kits with **planted defects that must be proven fixed by a withheld `verify_*.py`** (the Software Engineering with AI kits). Turn that into a scheduled event: on a Monday, a squad's repo receives a failing production scenario they didn't write. They diagnose, fix, write a regression test, and file a postmortem. Grade the postmortem, not just the fix. Nothing else on the market simulates on-call.

**5. Red team / blue team crossover.**
Squad A attacks Squad B's deliverable (auth, prompt injection, data leakage); B patches and documents. Natural fit for Cybersecurity and your LLM-Security module, and it turns security from a lesson into a lived event.

**6. One merged open-source PR (capstone requirement).**
Not "contribute to open source" — *merged*, verified via the GitHub API (`merged_at` + author login matching the student's linked account). A merged PR to a stranger's repo is the most credible single line on a junior CV, and it is objectively verifiable, which fits your honesty constraint perfectly.

**7. The defence (viva).**
20 minutes, recorded, on your own capstone code: why this design, what would break at 100× traffic, walk me through this function you wrote in week 14. Nova runs the practice loop (already built at `/career`); a human runs the real one. **Attach the recording to the credential.** This is your answer to the AI-cheating objection that is currently eating every bootcamp's credibility, and it turns your certificate into something an employer can actually check in 20 minutes.

**8. Public build log.**
Weekly public post — what I shipped, what broke, what I learned. Feeds the community and creates a 24-week visible track record hiring managers can scroll. Reuse the community post feed you already built.

**9. Constraint weeks.**
Occasional forcing functions: a 48-hour hackathon; "no frameworks" week; a legacy-code rescue (inherit a deliberately awful repo and refactor it under test). Cheap to author, wildly memorable, and legacy-rescue is what juniors actually do in month one of a real job.

---

## 6. "Make sure you get hired" — the machine

Say what is true. **You cannot guarantee a job.** You can guarantee interviews, and you can make the proof so good that interviews convert. Seven layers, in build order:

**6.1 Proof, not claims (already 80% built).**
The credential must show the *evidence*, not a badge: repo links, contract tests passed, objective score vs withheld key, rubric breakdown, viva recording, peer-review quality, merged OSS PR. Extend `/verify` so an employer pasting a credential ID sees all of it on one page. This is your genuine differentiator and it is nearly free — it's `lib/career/verified-profile.ts` rendered publicly.

**6.2 Public portfolio.**
`/p/[handle]` — shareable, indexable, auto-built from graded work. Every graduate leaves with a URL that outperforms a CV.

**6.3 Verified talent directory (`/hire/talent`).**
Employers filter by *proven competency* using the existing `lib/competency.ts` radar — "show me people who scored ≥80 on data pipelines and have shipped a squad project." Each profile links to evidence. **Never surface unverified self-reported skills here**; the whole value is that everything on the page was graded.

**6.4 Employer briefs as the acquisition channel.**
Partners come for cheap real work on a live brief; they stay because they watched 20 candidates solve their actual problem before hiring one. Convert brief participation → directory access → intro requests.

**6.5 The hiring sprint (weeks 23–24) — treat it as curriculum, with gates.**
- CV + cover letters from the career agent (built, grounded, cannot lie)
- Gap map against 3 target JDs (built)
- 5 mock interviews (Nova, built) + 1 human panel
- **10 targeted applications, tracked in-app** — an application tracker is a small table and the single biggest determinant of outcome
- Demo Day: partners invited, recorded, each grad gets a 5-minute slot and a permalink

**6.6 The guarantee — the defensible version.**
Do **not** promise employment. Promise, contractually:
> Complete every gate, meet the attendance bar, and submit 40 tracked applications within 90 days of graduating — and if you have not had **3 first-round interviews**, we refund 50% and you keep lifetime access plus a free seat in the next cohort's hiring sprint.

This is honest, cheap to honour if your product works, conditioned on *student* behaviour you can measure in-app, and it forces you to build employer supply — which is the actual product. Do not offer it publicly until you have ≥15 hiring partners in the pilot's domain. Sell Cohort 1 on the proof, not the guarantee.

**6.7 Outcomes reporting.**
Publish a CIRR-style page: cohort size, graduation rate, employed-in-field within 180 days, median time to hire, salary band, **and the response rate**. Right now the honest page reads "Cohort 1 is in progress; no outcomes to report yet" — publish that anyway. It is consistent with the "honest numbers everywhere" principle already shipped, and it is the strongest possible trust signal in a market where every competitor is inflating.

---

## 7. Admissions and pricing

**Admissions** — a bar is a marketing asset, not a growth tax. Existing pieces do 90%:
1. Free diagnostic (built) → 2. Application + hours commitment → 3. Placement assessment (built, `assessment_level`) → 4. 15-min human call for accepted candidates → 5. Deposit to hold the seat.

Reject or defer anyone below the bar into the self-paced track — that's a revenue path, not a lost lead. Target ~40–60% acceptance for the pilot.

**Pricing.** This is a different SKU. Founding self-paced rates are promised for life and **must not be touched** (`lib/pricing.ts` — bootcamp adds a new product, never edits `REGIONS`).

Human review + live sessions + hiring support means the marginal cost per student is dominated by human hours, not tokens. Indicative:

| | Global | South Asia (PPP, ~⅓, consistent with existing policy) |
|---|---|---|
| 6-month bootcamp | $1,490 (or 6 × $279) | $490 (or 6 × $92) |
| Deposit at acceptance | $150 | $50 |
| Pilot Cohort 1 (founding) | $749 | $249 |

Sanity check the unit economics before committing: 1 reviewer per ~25 students at ~8h/week for 24 weeks ≈ 192 hours per cohort. At 25 × $1,490 = $37k revenue, that is comfortable — *if* you keep AI as the first pass on every gate and humans only sign off. If a human grades from scratch, the model breaks.

---

## 8. Ops — who does what

| Work | Who |
|---|---|
| Objective + CI gate check | Automated (built) |
| Rubric first-pass review | AI (built) |
| Gate sign-off, fail decisions | **Human reviewer** |
| Weekly live session | **Human instructor** (1–2h) |
| Standups | Squad-led, async in community |
| At-risk detection | Automated (nightly cron) |
| At-risk intervention call | **Human** (this is the retention lever) |
| Mock interviews | Nova (built) + 1 human panel |
| Viva | **Human** |
| Employer relationships | **Human — you, initially** |

Realistically Cohort 1 needs: you (employer + admissions + product), one instructor/reviewer, and the AI stack. Cap the pilot at **20–25 seats** so one reviewer can carry it, and so you can fix in week 4 what you got wrong in week 2.

---

## 9. Build phases

Sequenced so each phase is independently shippable and the pilot can start before the hiring machine is finished.

### P0 — Decide & pre-sell (week 1–2, minimal engineering)
- Pick the pilot track; author the 6 gates against its existing projects (`schedule_week` values are already there)
- Publish `/bootcamps/[slug]` as a **waitlist page** — a static page + email capture (both patterns already built)
- Recruit 10 employer partners for briefs. Start now; it has the longest lead time of anything in this document
- **Exit:** 50+ waitlist signups and ≥5 partners verbally committed, or reconsider the whole thing

### P1 — Cohort spine (weeks 3–6)
- Schema: `bootcamps`, `bootcamp_cohorts`, `bootcamp_applications`, `bootcamp_enrollments`, `bootcamp_gates`, `bootcamp_gate_results` (+ RLS, + DB-level revoke on gate writes)
- Application flow reusing the placement assessment; `/desk/applications`
- `/bootcamp` command centre; gate-gated module unlocking; deadline countdowns (reuse `lib/schedule.ts` verbatim)
- Extend `/api/projects/submit` with a bootcamp bar (75) + resubmission loop
- `/desk/bootcamp` roster + human gate review queue
- **Exit:** a test student can apply, be accepted, be blocked by Gate 1, submit, be reviewed by a human, and be unlocked

### P2 — Ritual & squads (weeks 7–9)
- `bootcamp_squads`, `bootcamp_sessions`, `bootcamp_attendance`, `peer_reviews`
- Squad assignment + squad repo; per-squad channel (reuse communities)
- GitHub PR-authorship audit extending `lib/github/fetch-repo.ts`
- Peer review UI + AI-scored review quality
- Nightly standing cron + at-risk alerts + weekly digest email
- **Exit:** attendance recorded, peer reviews flowing, at-risk list populating correctly

### P3 — Hiring machine (weeks 10–13, can overlap the running cohort)
- Public `/p/[handle]`; extend `/verify` to show full evidence incl. viva
- `employer_partners`, `employer_briefs`, `hiring_intros`, `graduate_outcomes`
- `/hire`, `/hire/talent` (competency-filtered, evidence-linked), `/hire/brief`
- Application tracker + hiring-sprint gate
- `/bootcamps/[slug]/outcomes` — honest, publishes "no data yet"
- **Exit:** an employer can search, view evidence, and request an intro

### P4 — Run, measure, expand (ongoing)
- Run pilot cohort; weekly retro; fix live
- Post-graduation outcome surveys at 90/180/365 days
- Publish real outcomes; only then turn on the interview guarantee
- Second track only after one cohort has graduated

**Indicative calendar from today (2026-08-16):**
- Waitlist live: early Sept 2026
- Applications open: mid-Sept
- Applications close: ~26 Sept
- **Cohort 1 starts: 5 Oct 2026 → graduates ~22 Mar 2027**
- First outcomes published: ~Jun 2027

---

## 10. Metrics that decide whether this works

| Metric | Target (pilot) |
|---|---|
| Application → acceptance | 40–60% |
| Acceptance → paid enrolment | ≥60% |
| Week-4 retention | ≥85% |
| Gate 1 first-attempt pass | 50–70% (higher = bar too low) |
| Graduation rate | ≥65% |
| Median gate turnaround (submit → reviewed) | <72h |
| Employer partners per track | ≥15 before any guarantee |
| Employed in field ≤180 days | ≥50% of job-seeking grads |
| Reviewer hours per student per week | <0.4 |

If gate-1 first-attempt pass is above ~85%, the bar is decorative and the certificate is worthless. Watch that number harder than any other.

---

## 11. Risks

1. **Employer supply is the real product, and it is the slowest.** Everything else is software you can build. Start partner recruitment in week 1, not week 10.
2. **Human review capacity collapses under scale.** Enforce the AI-first-pass rule; cap seats; measure reviewer hours per student weekly.
3. **A guarantee you can't fund.** Never publish it before employer supply exists. Condition it on measurable student behaviour.
4. **Cannibalising the self-paced product.** Keep them clearly different (deadlines/squad/human/hiring), and route rejected applicants into self-paced.
5. **Grade forging.** The bootcamp adds high-value credentials, which raises the incentive to cheat. Gate results must be service-role-write only from day one — same class of issue as the July integrity fixes.
6. **"An AI wrote it."** Answered by the viva, PR-authorship audits, and objective withheld-key gates. Make this loud in marketing; it is a genuine competitive edge.
7. **Timezone spread.** Fix the cohort timezone up front, record everything, allow `watched_recording` to count for attendance. Do not pretend a global live cohort works without this.
8. **One cohort's failure is public.** Small pilot, honest outcomes page, deferral rather than refund.

---

## 12. Decisions needed before P1

1. **Which track for the pilot?** (Recommend Data Science or Software Engineering with AI)
2. **Part-time 15h/week or full-time?** (Recommend part-time — matches your working-adult audience)
3. **Price point and whether Cohort 1 is discounted-founding.**
4. **Who is the human reviewer/instructor?** This is the hard constraint on seat count.
5. **Guarantee: interviews-based, deferral-only, or none for Cohort 1?** (Recommend none publicly for Cohort 1; sell on proof.)
