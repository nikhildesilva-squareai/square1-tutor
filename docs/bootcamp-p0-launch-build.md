# P0-Launch — Engineering Breakdown

**Date:** 2026-08-16
**Source:** `bootcamp-prd.md` R1–R14
**Window:** 18 Aug → 5 Oct 2026 (7 weeks)
**Target:** Cohort 1 starts 5 Oct 2026

---

## 0. Blockers found in the repo — resolve before Sprint 1

### 0.1 "Bootcamp" already means something else in the live product

The word is currently used **three incompatible ways**, one of which shipped two days ago:

| Where | Current meaning |
|---|---|
| `components/LearningModes.tsx`, dashboard (commit `ecf3fea`, 14 Aug) | **"Bootcamp" = the committed self-paced mode** — `plan_months` + target date + weekly schedule. UI literally says *"Turn {courseTitle} into a bootcamp."* |
| `app/page.tsx:199`, `app/about/page.tsx:347` | **"Bootcamps" = the competitor we attack** — *"Bootcamps rush you through and hand you a certificate."* |
| `components/landing/ComparisonSection.tsx:28` | **"$15,000+ bootcamp tuition"** — the price anchor we position as cheaper than |
| `components/landing/FAQSection.tsx:44` | *"Is this a bootcamp or a video course?"* |

**This is a real conflict, not a cosmetic one.** You cannot sell a live bootcamp while the homepage says bootcamps rush people through, and you cannot have two different things called "Bootcamp" inside one app. It needs a decision before any user-facing string is written.

**Three options:**

| Option | What changes | Assessment |
|---|---|---|
| **A. Name the live product "Cohort"** | Nothing existing changes. Landing positioning stays intact — you're still *not* a bootcamp, you're the cohort alternative. | **Recommended.** Zero rework, keeps a positioning line you've already shipped, and "Cohort" is what the premium end of the market calls it. |
| **B. Keep "Bootcamp", rename the paced mode** | `LearningModes.tsx` "Bootcamp" → "Paced Track"; rewrite the landing/About attack lines and the FAQ. | Viable but costs a marketing rewrite and contradicts shipped copy. |
| **C. Keep both** | — | Not viable. Two "Bootcamps" in one product is a support nightmare. |

**Not blocking the schema.** Database names are internal and invisible to users, so tickets below keep the `bootcamp_*` prefix from the PRD regardless of what marketing calls it. Only the **user-facing strings** wait on this decision.

### 0.2 Migration numbering has already collided

```
019_create_social_core.sql
019_create_startup_school_venture_spine.sql   ← duplicate 019
020_create_competitions.sql
```

**Next free number is 021.** Two files share `019`, which means apply-order is ambiguous for anyone reconstructing the DB. Worth a one-line note in each header recording actual apply order; not worth renaming applied migrations.

### 0.3 The working tree has 124 uncommitted files

Including the community social core (per project notes, uncommitted since 16 Aug) and ~40 untracked root-level `.md` files. Starting a 7-week build on top of this means any rollback is entangled with unrelated work.

**Recommendation before Sprint 0:** commit or stash the current work, then branch. Not optional at this scale — it is the difference between "revert the bootcamp spine" and "revert five features at once."

---

### 0.4 Architecture change — link-based live classes (decided 2026-08-19)

**Cohort 1 does not embed video.** Zoom Pro hosts the meeting; students join via a per-student registration link surfaced in our app. Everything else — the cockpit, gates, attendance, recordings, study artifacts — stays in our product.

| | Before (embedded) | After (link-based) |
|---|---|---|
| Video platform | Daily / Zoom Meeting SDK embed | **Zoom Pro, 2–3 licences** |
| Cost per cycle | $1,300–6,400 | **~$300–400** |
| Engineering | B-030/032/033/034 | **Cut — ~9 days recovered** |
| Biggest risk | Tailwind preflight + COOP/COEP | **Eliminated** |
| Attendance | Webhook | Webhook **+ registration** (B-031b) |
| In-class AI | Live transcript in room | **Deferred to Cohort 2**; partly recovered by B-035 |
| Mobile on weak networks | Browser embed | **Better** — Zoom's native app |

**Revised effort:** 77–92 days → **~71–86**, then **~57–72 with concierge ops (§5.2 of the delivery plan)** against 67 available. This is what makes the October date real.

**The recording pipeline is unchanged and stays automatic (R6 / C1–C3):**

```
Zoom cloud-records the class
  └─ recording.completed webhook
       └─ download within the 24h token window   ← do NOT do this by hand
            └─ upload to Bunny Stream (HLS, adaptive)
                 └─ our player: resume position, watch tracking, attendance credit
                      └─ Zoom VTT transcript → search, chapters, flashcards, "you missed it"
```

Automate the ingest rather than uploading manually: the Zoom `download_token` expires in ~24h, and Zoom's retention policy deletes cloud recordings on a schedule. A week-3 recording vanishing in month 5 is a support incident, and for viva recordings it is a credential-integrity problem.

**Visibility default is `cohort`, never public.** These are recordings of 50 identifiable people under the consent captured at enrolment (R14 / AD-21). Public sharing must stay opt-in and revocable per person.

---

## 1. Ticket breakdown

**Sizes:** S = <½ day · M = 1–2 days · L = 3–5 days
**Convention notes:** migrations are applied **manually via the Supabase SQL editor** (no migration runner in this repo — see the header of `018_create_community_posts.sql`). Per `AGENTS.md`, **read the relevant guide in `node_modules/next/dist/docs/` before writing route-handler or caching code** — this Next.js diverges from common knowledge.

### R1 — Cohort & gate data model

| ID | Ticket | Size | Depends on | Touches |
|---|---|---|---|---|
| B-001 | Migration `021_create_bootcamp_spine.sql` — bootcamps, cohorts, applications, enrollments, squads, gates, gate_results, sessions, attendance, submission_comments | L | — | `migrations/` |
| B-002 | Migration `022_bootcamp_rls.sql` — RLS policies + **service-role-only writes** on gate_results / attendance; `gates.requires` service-role read only | M | B-001 | `migrations/` |
| B-003 | Regenerate `types/database.ts`; add bootcamp TS types | S | B-001 | `types/` |
| B-004 | `lib/bootcamp/` — pure functions: cohort resolution, gate evaluation, standing computation. No DB, testable | M | B-003 | `lib/bootcamp/` |

> **B-002 is the single highest-risk ticket for integrity.** A student who can write `bootcamp_gate_results.status='passed'` can forge graduation — the same class of bug as the July grade-write issue. Revoke at the DB level, not just in application code.

### R2 — Admissions funnel

| ID | Ticket | Size | Depends on | Touches |
|---|---|---|---|---|
| B-010 | Public `/bootcamps/[slug]` — spine, gates, next cohort, **real seat count** (`seats` − accepted) | M | B-001 | `app/bootcamps/` |
| B-011 | Timezone component: render session times in visitor's tz via `S1_REGION_COOKIE`, with picker override + **local-time-in-words confirmation** | M | — | `components/bootcamp/` |
| B-012 | Application form + `POST /api/bootcamp/apply` (zod, rate limit) | M | B-001 | `app/api/bootcamp/` |
| B-013 | Wire existing placement assessment into the application; store `assessment_pct` | S | B-012 | reuse `/courses/[slug]/assess` |
| B-014 | `/desk/bootcamp/applications` — queue with score, hours, timezone; accept/waitlist/reject/defer; bulk actions | L | B-012 | `app/desk/bootcamp/` |
| B-015 | Decision emails via Resend (`lib/email/jobs.ts` pattern) | M | B-014 | `lib/email/` |
| B-016 | Deposit → checkout → creates `student_enrollments` (plan_months=6) **and** `bootcamp_enrollments` atomically | L | B-014 | `app/api/bootcamp/` |
| B-017 | Consent capture at enrolment (recording + viva) — **must ship with B-016**, not later | S | B-016 | `app/api/bootcamp/` |

### R3 — Cohort command centre

| ID | Ticket | Size | Depends on | Touches |
|---|---|---|---|---|
| B-020 | `/(app)/bootcamp` — this week, next deadline, gate rail, next session, squad, standing | L | B-004 | `app/(app)/bootcamp/` |
| B-021 | Learning contract page — one page, what graduating requires | S | B-020 | `app/(app)/bootcamp/` |

### R4 — Live class access ⚠️ REVISED 2026-08-19: link-based, not embedded

**Decision:** Cohort 1 runs on **published per-student Zoom links**, not an embedded classroom. Zoom Pro (2–3 licences, ~$50/month) hosts the meeting; our app owns everything around it. See §0.4.

| ID | Ticket | Size | Depends on | Touches |
|---|---|---|---|---|
| ~~B-030~~ | ~~L0 Zoom embed spike~~ — **CUT.** Removes the Tailwind-preflight and COOP/COEP risk entirely | — | — | — |
| B-031 | Zoom S2S OAuth — create meetings from `bootcamp_sessions`, **enable registration**, store `join_url` | M | B-001 | `lib/zoom/` |
| **B-031b** | **Per-student registrant links** via the registration API. **Non-negotiable** — one shared link makes attendance unattributable and the gate model collapses | M | B-031 | `lib/zoom/` |
| ~~B-032~~ | ~~Signature endpoint~~ — **CUT**, no embed to authorise | — | — | — |
| ~~B-033~~ | ~~Embedded classroom~~ — **CUT** | — | — | — |
| ~~B-034~~ | ~~Host start flow~~ — **CUT.** `start_url` still never leaves the server | — | — | — |
| **B-035** | **In-app question rail** — students type questions on the session page while Zoom runs in another window; AI clusters duplicates; instructor watches our screen. Recovers most of the Tier-1 in-class value with zero video engineering | M | B-001 | `app/(app)/bootcamp/sessions/` |

### R5 — Objective attendance

| ID | Ticket | Size | Depends on | Touches |
|---|---|---|---|---|
| B-040 | `POST /api/zoom/webhook` — raw-body HMAC verify, `endpoint.url_validation` challenge, idempotency table, 200 fast | M | B-001 | `app/api/zoom/` |
| B-041 | Participant → student matching (`customer_key` primary, email fallback) | M | B-040 | `lib/zoom/` |
| B-042 | `finaliseAttendance` on `meeting.ended` — presence % → present/late/absent | M | B-041 | `lib/zoom/` |

### R6 — Recording library *(due by week 2, 12 Oct — post-start is acceptable)*

| ID | Ticket | Size | Depends on | Touches |
|---|---|---|---|---|
| B-050 | Cloudflare Stream account + upload service | M | — | `lib/video/` |
| B-051 | `recording.completed` → enqueue → download within 24h token → upload to Stream | L | B-040, B-050 | `app/api/cron/` |
| B-052 | Player page with resume position | M | B-051 | `app/(app)/bootcamp/sessions/` |
| B-053 | `recording_views` tracking, **server-clamped** `watched_seconds`, attendance credit at ≥80% + async artifact | M | B-052 | `app/api/bootcamp/` |

### R7 — Gate submission & review

| ID | Ticket | Size | Depends on | Touches |
|---|---|---|---|---|
| B-060 | Extend `/api/projects/submit` — bootcamp bar (75), bind submission to a gate | M | B-001 | `app/api/projects/submit/route.ts` |
| B-061 | `/(app)/bootcamp/gates/[gateId]` — requirements checklist, submit, status, feedback | M | B-060 | `app/(app)/bootcamp/` |
| B-062 | `/desk/bootcamp/gates` review queue — AI score, objective/CI result, repo, diff vs starter | L | B-060 | `app/desk/bootcamp/` |
| B-063 | Sign-off / fail-with-reasons → unlock next modules on pass | M | B-062 | `app/api/bootcamp/` |
| B-064 | Resubmission — 2 attempts, 7-day window | S | B-063 | `app/api/projects/submit/` |

### R8 — Threaded submission feedback

| ID | Ticket | Size | Depends on | Touches |
|---|---|---|---|---|
| B-070 | Thread UI on submission (student) + desk (instructor); AI review as message #1 | M | B-001, B-062 | `components/bootcamp/` |
| B-071 | Reply notification email | S | B-070 | `lib/email/` |

### R9 — Standing, at-risk & intervention

| ID | Ticket | Size | Depends on | Touches |
|---|---|---|---|---|
| B-080 | Nightly cron — compute standing from schedule lag + attendance | M | B-004, B-042 | `app/api/cron/` |
| B-081 | Student-facing standing in plain language ("9 days behind on Gate 2") | S | B-080 | `app/(app)/bootcamp/` |
| B-082 | Desk at-risk list + intervention flag + 72h contact SLA | M | B-080 | `app/desk/bootcamp/` |

### R10 — Deferral & withdrawal

| ID | Ticket | Size | Depends on | Touches |
|---|---|---|---|---|
| B-090 | Defer / withdraw flow + desk action + entitlement rules (what access survives) | M | B-016 | `app/desk/bootcamp/` |

### R11 — Integrity controls

| ID | Ticket | Size | Depends on | Touches |
|---|---|---|---|---|
| B-100 | RLS test suite — assert every forgery path fails | M | B-002 | `__tests__/` |
| B-101 | Audit table + override logging (actor, timestamp, reason) | M | B-001 | `migrations/`, `app/desk/` |
| B-102 | Go-live forgery penetration checklist | S | B-100 | `docs/` |

### R12 — Instructor console

| ID | Ticket | Size | Depends on | Touches |
|---|---|---|---|---|
| B-110 | `/desk/bootcamp` roster + standing | M | B-004 | `app/desk/bootcamp/` |
| B-111 | Gradebook grid (students × gates × attendance × standing) + CSV export | L | B-110 | `app/desk/bootcamp/` |
| B-112 | `cohort_announcements` + notify | M | B-001 | `app/desk/bootcamp/` |

### R13 — Cohort calendar

| ID | Ticket | Size | Depends on | Touches |
|---|---|---|---|---|
| B-120 | Session CRUD in desk + holiday skip-weeks for the band | M | B-031 | `app/desk/bootcamp/` |
| B-121 | ICS feed in the student's timezone | S | B-120 | `app/api/bootcamp/` |
| B-122 | Cancel / reschedule + automatic notification | M | B-120 | `app/desk/bootcamp/` |

### R14 — Consent & data rights

| ID | Ticket | Size | Depends on | Touches |
|---|---|---|---|---|
| B-130 | Deletion request flow — genuinely deletes from Cloudflare Stream, not a flag | M | B-051 | `app/api/account/` |
| B-131 | Viva visibility opt-in controls, revocable | S | B-053 | `app/(app)/settings/` |

*(B-017, consent capture, sits in R2 because it must ship with checkout.)*

**Total: 45 tickets** — 9 L, 26 M, 10 S ≈ **62–75 engineer-days**. Across a 7-week window that is roughly **2 engineers**, or 1 engineer with the P1 tier deferred and R6 slipping to week 2 as planned.

---

## 2. Critical path

```
B-001 schema ──┬─► B-002 RLS ──► B-100 RLS tests ──► B-102 pen checklist
               ├─► B-012 apply ──► B-014 desk queue ──► B-016 checkout ──► B-017 consent
               ├─► B-020 command centre
               ├─► B-031 meetings ──► B-032 signature ──┐
               ├─► B-040 webhook ──► B-041 match ──► B-042 finalise
               └─► B-060 gate submit ──► B-062 review queue ──► B-063 sign-off

B-030 SPIKE ───────────────────────────────────────────┴─► B-033 classroom
```

**Two items gate everything else:**

1. **B-001** — nothing starts until the schema lands. Do it first, in one sitting, reviewed carefully. A schema change in week 5 is expensive across 45 tickets.
2. **B-030 (the spike)** — the highest-risk ticket in the program. If Tailwind v4 preflight and cross-origin isolation can't be tamed, the Daily.co pivot costs ~a week. **This decision must be made by early September, before applications open**, because it changes what you promise buyers.

---

## 3. Sprint plan

| Sprint | Dates | Tickets | Exit criteria |
|---|---|---|---|
| **S0** | 18–22 Aug | Git hygiene · B-001, B-002, B-003, B-004 · **B-030 spike** | Schema applied. Two browsers in one embedded meeting inside the real app shell, on Vercel preview **and Safari**. Go/no-go on Zoom vs Daily. |
| **S1** | 25 Aug – 5 Sep | B-010…B-017, B-020, B-021 | A test user can apply → be assessed → be accepted → pay → land on a working command centre. Waitlist page public. **Employer partner recruitment starts.** |
| **S2** | 8–19 Sep | B-031…B-034, B-040…B-042, B-120…B-122, B-100…B-102 | A scheduled session creates a Zoom meeting, a student joins in-app, the fallback works, and attendance rows land from the webhook. RLS forgery tests pass. |
| **S3** | 22 Sep – 3 Oct | B-060…B-064, B-070, B-071, B-110…B-112, B-080…B-082, B-090 | Gate 1 can be submitted, AI-scored, human-reviewed, failed with reasons, resubmitted, and passed — unlocking the next module. Gradebook renders. |
| **🚀** | **5 Oct** | **Cohort 1 starts** | — |
| **S4** | 6–16 Oct | B-050…B-053, B-130, B-131 | Week-1 recording watchable with resume and attendance credit, before week 2. |

**Applications open mid-Sep and close 26 Sep** — so S1 must land, and the B-030 decision must be made, before that.

---

## 4. Unblocked vs blocked by open questions

Good news: **almost all of S0 and S2 is unblocked** by the six blocking questions in the PRD.

| Work | Status |
|---|---|
| B-001…B-004 (schema, RLS, types, lib) | ✅ Unblocked — track and price don't change the spine |
| B-030 spike | ✅ Unblocked — needs a Zoom dev account only |
| B-040…B-042 attendance | ✅ Unblocked |
| B-060…B-064 gates | ✅ Unblocked — gate *content* needs the track; the *machinery* doesn't |
| B-010, B-011 public pages | ⚠️ Needs **track** + **price** + user-facing **name decision** (§0.1) |
| B-016 checkout | ⚠️ Needs **price** and **Stripe country coverage** |
| B-120 sessions | ⚠️ Needs **band** and **instructor** (who hosts, at what hour) |
| B-050…B-053 recordings | ⚠️ Needs the **video host** decision (non-blocking until S4) |

**So Sprint 0 can start immediately** while the six questions get answered in parallel.

---

## 5. Recommended first action

**B-001 — migration `021_create_bootcamp_spine.sql`.** It is:

- the hard dependency for 40 of the 45 tickets
- unblocked by every open question
- internal-only, so the §0.1 naming decision doesn't gate it
- the one thing that is genuinely expensive to change later

Prerequisite: resolve §0.3 (commit or stash the 124 modified files, then branch), so this lands cleanly and can be reverted independently.
