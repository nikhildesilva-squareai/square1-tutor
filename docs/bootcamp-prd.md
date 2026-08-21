# PRD: Square 1 Bootcamps

**Version 2.0** · 19 Aug 2026 · supersedes v1 (backed up at `.bootcamp-prd-v1.bak`)
**Status:** Approved — all launch decisions locked
**Owner:** Program owner (A1)
**Target:** applications open ~15 Sep · Cohort 1 starts **~5 Oct 2026** · graduates **~22 Mar 2027**

**Companions:** [`bootcamp-user-stories.md`](bootcamp-user-stories.md) (124 stories) · [`bootcamp-delivery-plan.md`](bootcamp-delivery-plan.md) · [`bootcamp-brainstorm.md`](bootcamp-brainstorm.md) · [`mockups/bootcamp-ui.html`](mockups/bootcamp-ui.html)

---

# PART A — PRODUCT

## A1. Problem

Square 1 has world-class self-paced curriculum — 20 courses, 736 lessons, objectively graded projects, evidence-backed credentials — but self-paced learning has a completion problem, and a $19.90/month product cannot deliver what a career switcher actually needs: **a job**.

The people most willing to pay for that outcome all say the same thing: *they want to learn from people*, on a schedule, with someone who notices when they fall behind.

**Cost of not solving it.** Commercially, the highest-intent segment has nothing to buy. Strategically, the credential's value is capped: an employer has no reason to trust a self-paced certificate from an unknown platform, and without live human assessment there is no answer to *"did an AI write this?"* — the objection currently eroding trust across the entire bootcamp market.

## A2. Solution

A **6-month, cohort-based, strictly-gated live bootcamp** across 6 tracks, built as a layer on the existing platform.

**~70% already exists.** `lib/schedule.ts` is authored against a 24-week baseline. `projects.schedule_week` produces rolling per-learner deadlines. `app/api/projects/submit/route.ts` already runs objective withheld-key gating and CI contract tests. What's missing is the **cohort**, the **compulsion**, the **live ritual**, and the **hiring machine**.

Four things define the format and justify the price:

1. **A weekly 30-minute 1-1 with your instructor** — the hardest thing here for a competitor to copy, and the reason the price works.
2. **Live classes of 50** — code review of real student submissions and unrehearsed debugging. Never lecture; the async curriculum does that better.
3. **Six gates you cannot skip** — 75% bar, human sign-off, plus a recorded viva defending your own code.
4. **The class compounds** — every session becomes transcript, notes, flashcards, mind map and Q&A, with the best moments promoted permanently into the async curriculum.

## A3. Locked decisions

| Decision | Value |
|---|---|
| Product name | **Bootcamp** (existing paced mode renames to "Paced Track") |
| Tracks | 6 built; **AI + Cybersecurity open first**, other 4 waitlisted |
| Cohort size | **50** |
| Duration | 24 weeks |
| 1-1 | **Weekly, 30 min, human instructor** |
| Live video | **Zoom Pro, per-student registration links — not embedded** |
| Recordings | Auto-ingest → **Bunny Stream** → our player |
| Price (founding) | **$890 global / $490 South Asia** |
| Payment | **Pay-in-full −10% (default)** or 3-part. No monthly. |
| Team | 2 engineers + design |
| Feature flag | `BOOTCAMP_ENABLED` (mirrors `STARTUP_SCHOOL_ENABLED`) |

## A4. Goals

| # | Goal | Target |
|---|---|---|
| G1 | Students complete | **≥65%** graduate all 6 gates |
| G2 | Graduates get hired | **≥50%** of job-seekers employed in field ≤180 days |
| G3 | The bar is real | Gate-1 first-attempt pass **50–70%** |
| G4 | Retention holds | **≥85%** at week 4 |
| G5 | 1-1s actually happen | **≥90%** of scheduled 1-1s held |
| G6 | Credential becomes tradeable | **≥15** hiring partners by graduation |

**G3 is the uncomfortable one:** a pass rate above ~85% means the bar is decorative and the certificate is worthless. It is the one metric where a good-looking number is bad news.

## A5. Non-goals

| # | Not doing | Why |
|---|---|---|
| N1 | Embedding video | Zoom links + registration. Removes ~9 engineer-days, the Tailwind-preflight conflict and COOP/COEP entirely. Zoom's native app is also better on weak networks. Embedded classroom deferred to Cohort 2. |
| N2 | Building a scheduler from scratch | Cal.com embed. Schedulers are a month-long tarpit. |
| N3 | Rebuilding Google Classroom | Most of it is a weaker version of what we already ship. |
| N4 | Guaranteeing employment | We guarantee *interviews*. The refund liability on jobs is real. |
| N5 | More than 2 open tracks in Cohort 1 | Platform is generic across all 6, but **each cohort needs 1 FTE instructor**. |
| N6 | Native mobile app | Responsive web + Zoom's native client. |
| N7 | China market | Zoom restricted there. Separate project. |
| N8 | ISA / income share | Regulatory complexity out of proportion to a 2-cohort pilot. |
| N9 | In-class AI (live transcript features) | Requires embedded video. **Cohort 2.** Partly recovered by the in-app question rail (S5). |

## A6. Economics

Instructor load: **~39 h/week per 50-student cohort = 1 FTE.** Weekly 1-1s alone are 25 h.

| | 2 cohorts (launch) | 6 cohorts (full) |
|---|---|---|
| Students | 100 | 300 |
| Revenue (list) | $149,000 | $447,000 |
| Instructor @ $35/h | −$65,500 | −$196,600 |
| Zoom + Bunny + AI | −$400 | −$1,200 |
| **Gross margin** | **~56%** | **~56%** |

With regionally-hired instructors at ~$15/h, margin rises to **~75%**. **Instructor hourly rate is the most sensitive variable in the model.**

**Pricing** — a separate SKU. `lib/pricing.ts` `REGIONS` is never edited; founding self-paced rates are promised for life.

| | List | Founding | Pay in full (−10%) | 3-part |
|---|---|---|---|---|
| Global | $1,490 | $890 | **$799** | $150 + $370 + $370 |
| South Asia | $790 | $490 | **$441** | $75 + $208 + $207 |

**Do not apply the ⅓ PPP ratio from `lib/pricing.ts`.** That rule fits software with ~zero marginal cost. A bootcamp carries ~$655/student of instructor cost, so a ⅓ regional rate sells below cost. The regional price works **only** when paired with regionally-hired instructors.

---

# PART B — BUILD SECTIONS

Twelve self-contained sections. Each states what it delivers, which stories it satisfies, its schema and routes, acceptance criteria, dependencies and estimate.

**Repo conventions.** Migrations are applied **manually via the Supabase SQL editor** (no runner — see the header of `018_create_community_posts.sql`). Next free number is **021** (`019` is duplicated, `020` taken). Per `AGENTS.md`, **read `node_modules/next/dist/docs/` before writing route-handler or caching code** — this Next.js diverges from common knowledge.

**Budget.** P0-Launch = **65 engineer-days** against **67 available** (2 engineers × 6.7 weeks). Zero slack — any addition needs a removal.

| § | Section | Days | Phase |
|---|---|---|---|
| S1 | Data spine & integrity | 8 | P1 |
| S2 | Public product & application | 9 | P2 |
| S3 | Payments & enrolment | 6 | P2 |
| S4 | Cohort command centre | 6 | P2 |
| S5 | Live sessions | 6 | P3 |
| S6 | Weekly 1-1 booking | 6 | P3 |
| S7 | Gates: submission, review, feedback | 10 | P3 |
| S10 | Instructor desk (concierge-trimmed) | 5 | P3 |
| S12 | Test & launch readiness | 7 | P1/P4 |
| — | Naming cleanup (inside S2) | 2 | P1 |
| | **P0-Launch total** | **65** | |
| S8 | Recordings & study artifacts | 8 | P5, by week 2 |
| S9 | AI layer (USP) | 6 | P5 |
| S11 | Credential & hiring | — | P5, by week 20 |

---

## S1 — Data spine & integrity · 8 days · **blocks everything**

**Delivers:** the tables, RLS and pure functions every other section depends on.
**Stories:** AD-03, AD-23, AD-24, IN-24 · **Depends on:** nothing

**Schema — `migrations/021_create_bootcamp_spine.sql`**
`bootcamps` (one row per track) · `bootcamp_cohorts` · `bootcamp_applications` · `bootcamp_enrollments` · `bootcamp_squads` · `bootcamp_gates` · `bootcamp_gate_results` · `bootcamp_sessions` · `bootcamp_attendance` · `submission_comments` · `bootcamp_audit_log`

**`migrations/022_bootcamp_rls.sql`** — RLS policies + **DB-level revokes**.

**Code:** `lib/bootcamp/` — pure functions (gate evaluation, standing, seat counting, week scaling). No DB. Mirror `lib/srs.ts` house style: injectable `now` for deterministic tests.

**Acceptance**
- [ ] `bootcamp_gate_results`, `bootcamp_attendance`, `recording_views.watched_seconds` are **service-role-write only**
- [ ] `bootcamp_gates.requires` is **service-role-read only** — thresholds are effectively answer keys
- [ ] Every gate decision, waiver and override writes `bootcamp_audit_log` with actor + reason
- [ ] A bootcamp student is **also** a normal `student_enrollments` row — dashboard, streaks, Nova, portfolio keep working untouched
- [ ] `types/database.ts` regenerated

> **Highest-risk ticket in the programme.** A student who can write `gate_results.status='passed'` forges graduation — the same class of bug as the July integrity fixes.

---

## S2 — Public product & application · 9 days

**Delivers:** the standalone `/bootcamp` product surface and the application funnel.
**Stories:** ST-01…08, AD-02, AD-06…09 · **Depends on:** S1

**Routes:** `/bootcamp` (6-track index) · `/bootcamp/[slug]` (sales page) · `/bootcamp/[slug]/apply` · `/bootcamp/[slug]/schedule` · `/bootcamp/application/[id]`
**API:** `POST /api/bootcamp/apply`
**Nav:** new cluster in `components/sidebar-nav.tsx` gated on `BOOTCAMP_ENABLED`

**Naming cleanup — 2 of the 9 days**

| | Fix |
|---|---|
| N-01 | `components/LearningModes.tsx` calls the self-paced mode "Bootcamp" → rename to **"Paced Track"** (component, dashboard card, `/courses/[slug]/plan`) |
| N-02 | `app/page.tsx:199`, `app/about/page.tsx:347` — *"Bootcamps rush you through"* → you cannot attack the category while selling in it. New line: **a bootcamp that costs a tenth as much and proves what you learned** |
| N-03 | `components/landing/FAQSection.tsx:44` → rewrite as the product-fork question |
| N-04 | `ComparisonSection.tsx` "$15,000+ bootcamp tuition" → **keep**; $890 vs $15,000 is a strong line |

**Acceptance**
- [ ] Session times render from `bootcamp_cohorts.timezone` → visitor's timezone (`S1_REGION_COOKIE`, picker override)
- [ ] A checkbox states the **local weekday and hour in words** before payment can proceed
- [ ] Seats remaining = `cohort.seats` − accepted, **server-computed. No urgency offset exists in schema or UI.**
- [ ] Applicants outside the open band are offered a waitlist, not a seat
- [ ] Placement assessment reuses `/courses/[slug]/assess`; stores `assessment_pct`
- [ ] Rejected applicants get a route into self-paced

---

## S3 — Payments & enrolment · 6 days

**Delivers:** deposit → tuition → an active enrolment.
**Stories:** ST-05, ST-06, AD-10…13 · **Depends on:** S1, S2

**API:** `POST /api/bootcamp/checkout` · `POST /api/bootcamp/webhook/stripe`

**Acceptance**
- [ ] Pay-in-full (−10%) is the **default and promoted** option; 3-part is the alternative. **No 6-month monthly.**
- [ ] 3-part = **scheduled charges, not Stripe Subscriptions** — no dunning tail, no suspension state machine
- [ ] Deposit credited to tuition; **non-refundable after week 2**, stated at checkout
- [ ] `verifyRegionAtCheckout()` gates the regional rate against the **payment method's country**, never IP — a ~$350 gap makes VPN arbitrage worth someone's time
- [ ] Successful payment atomically creates `student_enrollments` (plan_months=6) **and** `bootcamp_enrollments`
- [ ] **Recording + viva consent captured here**, not later
- [ ] Failed payment → `status='suspended'`: loses live access and gate submission, keeps recordings

---

## S4 — Cohort command centre · 6 days

**Delivers:** the student's daily home. See [`mockups/bootcamp-ui.html`](mockups/bootcamp-ui.html) → "Student cockpit".
**Stories:** ST-11, ST-12, ST-14, ST-39, ST-40 · **Depends on:** S1

**Routes:** `/(app)/bootcamp` · `/(app)/bootcamp/contract` · `/(app)/bootcamp/standing`

**New UI patterns** (design first, `/design-review` before build): live bar · 24-week rail · gate rail · standing chip · squad card

**Acceptance**
- [ ] One screen answers *what do I do right now* — next session, what's due, gate status, squad, standing
- [ ] Deadlines reuse `lib/schedule.ts` arithmetic; no parallel implementation
- [ ] Standing is **plain language** ("9 days behind on Gate 2"), never a score or a rank
- [ ] Defer request flow with stated entitlement rules

---

## S5 — Live sessions · 6 days

**Delivers:** classes that run on Zoom with attendance that actually attributes.
**Stories:** ST-10, ST-15, ST-16, IN-04, IN-05, IN-11, AD-04, AD-18, AD-20 · **Depends on:** S1

**Code:** `lib/zoom/` · `POST /api/zoom/webhook` · `/(app)/bootcamp/sessions`

**Acceptance**
- [ ] Meetings created from `bootcamp_sessions` via **Server-to-Server OAuth**, **registration enabled**
- [ ] **Per-student registrant links.** Non-negotiable: one shared link makes attendance unattributable and the gate model collapses
- [ ] `zoom_start_url` is **service-role read only** — never in any client payload
- [ ] Webhook: raw-body HMAC verify → `endpoint.url_validation` challenge → **idempotency table** → 200 in <3s, heavy work async
- [ ] `meeting.ended` → presence % → present / late / absent
- [ ] **In-app question rail** — students type during class, AI clusters duplicates, instructor watches our screen. Recovers most in-class value with zero video engineering
- [ ] Cohort calendar with band timezone + holiday skip-weeks (Eid, Diwali, Poya, Thanksgiving)

---

## S6 — Weekly 1-1 booking · 6 days

**Delivers:** 1,200 sessions per cohort, booked without human admin.
**Stories:** ST-19…22, IN-03, IN-14…17 · **Depends on:** S1, S5

**Schema:** `mentors`, `mentor_availability`, `session_bookings`
**Routes:** `/(app)/bootcamp/book` · `/desk/bootcamp/availability`

**Acceptance**
- [ ] Instructor publishes availability once; students self-serve **in their own timezone**
- [ ] Booking auto-creates the Zoom meeting and the calendar entry
- [ ] **Embed Cal.com — do not build a scheduler.** Store the booking locally
- [ ] Reschedule without emailing anyone; no-shows tracked automatically
- [ ] 1-1 outcomes + action items logged against the student, visible next session
- [ ] Reminder emails via Resend (`lib/email/jobs.ts` pattern)

> 50 × 24 = **1,200 sessions**. Friction here compounds weekly and is the fastest way to burn out the instructor.

---

## S7 — Gates: submission, review, feedback · 10 days · **largest section**

**Delivers:** the thing students are actually buying.
**Stories:** ST-31…37, IN-18…22 · **Depends on:** S1

**Extends:** `app/api/projects/submit/route.ts`
**Routes:** `/(app)/bootcamp/gates/[gateId]` · `/desk/bootcamp/gates`

**Acceptance**
- [ ] Bootcamp bar is **75%** (vs 60/70 self-paced); submission binds to a gate
- [ ] Review queue shows AI rubric score, objective/CI result, repo, **diff against the starter**
- [ ] Human sign-off required; fail produces **written reasons the student sees** plus a remediation path
- [ ] Resubmission: **2 attempts, 7-day window**
- [ ] Passing **unlocks the next modules** — progression is genuinely gated
- [ ] **Threaded private feedback** on `project_submissions`: AI review is message #1, student can reply, instructor sign-off is a message in the same thread. Visible only to student, mentor, desk
- [ ] Squad gates show **PRs authored and reviews given per student, from the GitHub API** — never self-reported. Zero authored PRs cannot pass on the team's score
- [ ] Median submit→reviewed tracked against a **72h SLA**; reviewer hours/student/week must stay **<0.4**

---

## S8 — Recordings & study artifacts · 8 days · *due by week 2, post-launch acceptable*

**Stories:** ST-23…30, IN-09, IN-12, AD-19, AD-25 · **Depends on:** S5

```
Zoom cloud-records → recording.completed webhook → enqueue
  → download within the 24h download_token → Bunny Stream (HLS)
  → our player: resume, watch tracking, attendance credit
  → Zoom VTT transcript → search, chapters, cards, "you missed it"
```

**Acceptance**
- [ ] Ingest is **automatic** — the `download_token` expires ~24h and Zoom retention deletes cloud recordings; manual upload loses them
- [ ] Adaptive-bitrate HLS via Bunny, **not raw MP4** — a raw MP4 to a student in Dhaka is unwatchable
- [ ] Originals cold-archived to R2/S3 — viva recordings back a credential
- [ ] Resume position persists across devices
- [ ] Attendance credit requires **≥80% watched + a paired async artifact**; `watched_seconds` **clamped server-side** against wall-clock
- [ ] Default visibility `cohort`. **Never public by default.** Viva publication opt-in and revocable
- [ ] Generated cards carry a **timestamp citation** and need instructor approval before entering any shared deck (≤5 min review screen)
- [ ] Deletion request genuinely deletes from Bunny, not a flag

---

## S9 — The AI layer (USP) · 6 days · *partly post-launch*

**Stories:** AI-01…18 — see [`bootcamp-user-stories.md`](bootcamp-user-stories.md) §5 · **Depends on:** S1, S6, S7

**Tier 1 — makes 50 students possible. Build first.**

| Feature | Why load-bearing |
|---|---|
| **Churn-risk call list** (AI-03) | One instructor cannot notice 50 people slipping. The difference between 65% and 40% graduation |
| **1-1 prep sheet** (AI-02) | 50 × 30 min a week is only survivable if each starts warm |
| **Clustered question queue** (AI-04) | Makes a 50-person class answerable |

**Tier 2 — in-flight:** personalised recap · class-aware Nova · adaptive remediation · auto squad formation by timezone
**Deferred to Cohort 2** (needs embedded video): live "lost me" confusion heat, Ask-Nova-mid-class

**Acceptance**
- [ ] Churn model uses login gap + lesson velocity + attendance + exercise failure rate → **ranked call list with reasons**, not a roster
- [ ] Prep sheet grounded **only** in graded artifacts — same honesty contract as `lib/career/verified-profile.ts`
- [ ] Generated study artifacts pass a **curriculum cross-check**; contradictions flagged and withheld
- [ ] Glossary injection repairs ASR errors on technical terms — worse with non-native accents, i.e. most of the cohort

---

## S10 — Instructor desk · 5 days *(concierge-trimmed for Cohort 1)*

**Stories:** IN-01, IN-02, IN-21…23, AD-14…17, AD-21, AD-22 · **Depends on:** S1, S7

**Built:** roster + standing · at-risk list + intervention flag · cohort health dashboard · CSV export
*(gate review queue lives in S7)*

**Concierge for Cohort 1 — run by hand for 50 people, ~14 days saved**

| Deferred | Cohort 1 substitute |
|---|---|
| Gradebook grid | Roster + CSV export |
| Full admissions queue with bulk actions | One-at-a-time decisions (50 applicants) |
| Announcements composer | Resend directly |
| Session CRUD / ICS / reschedule automation | Seed via SQL, email changes |

**Acceptance**
- [ ] **Gate-1 first-attempt pass rate surfaced prominently** (AD-15) — above ~85% means the bar is fake
- [ ] Reviewer SLA against the 72h target (AD-16)
- [ ] Instructor hours/week (AD-17) — tells you when to stop selling seats

---

## S11 — Credential & hiring · *P0-Graduation, not P0-Launch*

Needed by ~week 20 (Feb 2027), built in-flight. **Not a launch blocker** — treating it as one would crowd out work that is genuinely date-bound.

**Stories:** ST-42…50, AI-15, AI-16, AD-27…29

Evidence-backed `/verify` (repos, tests passed, objective scores, rubric, **viva recording**) · public `/p/[handle]` portfolio · hiring sprint (CV, application tracker as a graduation requirement, mock loops) · employer talent directory + brief submission + intro pipeline · outcome surveys at 90/180/365 days · honest outcomes page that says *"no data yet"* when true

---

## S12 — Test & launch readiness · 7 days

**Superseded 2026-08-21.** The repo now runs **`node --test`** with real assertions — `npm run test:bootcamp`, 178+ passing across `lib/bootcamp/*`. **T0 and T2 are done.**

Do **not** add Vitest. It would fragment the suite for no gain, and the pure-lib layer is deliberately import-free per file so the built-in runner works without a bundler — a constraint worth preserving, not replacing.

| ID | Layer | Priority |
|---|---|---|
| T0 | ~~Vitest~~ → `node --test` + `test:bootcamp` script | ✅ **Done** |
| T1 | **Integrity/RLS** — assert every forgery **fails**: writing gate results, writing attendance, inflating watch seconds, reading `gates.requires`, reading `start_url`. Against a Supabase branch | **Highest value** |
| T2 | Unit — `lib/bootcamp/*` pure functions | ✅ **Done** (178 assertions) |
| T3 | API — application validation · webhook signature + `url_validation` + idempotency · checkout region gate | High |
| T4 | E2E (Playwright) — apply → accept → pay → command centre → submit gate → reviewed → unlocked | Medium |
| T5 | **Manual QA script** for the live class — Zoom cannot be meaningfully automated | High |
| **T6** | **Dress rehearsal** — full mock class, ~50 seeded students, real Zoom, real webhook, real ingest | **Hard gate** |
| T7 | Forgery pen-test checklist, signed off pre-launch | Hard gate |

**T6 is worth more than every unit test combined.** It is the only thing that exercises a corporate network blocking a join, a late webhook, or attendance matching the wrong student. **If it fails, the cohort slips a week** — survivable. Failing live in front of 50 paying customers is not.

---

# PART C — EXECUTION

## C1. Sequencing

| Phase | Window | Sections | Exit gate |
|---|---|---|---|
| **P0** | 19–22 Aug | Git hygiene · branch · Zoom Pro account · **instructor recruiting opens** | Clean tree, branch cut |
| **P1** | 25 Aug – 12 Sep | **S1** + design the 7 key screens + **T0/T1** | Schema applied · forgery tests pass · screens signed off |
| **P2** | 15 Sep – 26 Sep | **S2, S3, S4** | Test user applies → accepted → pays → lands on command centre. **Waitlist live; employer recruiting starts** |
| **P3** | 22 Sep – 2 Oct | **S5, S6, S7, S10** + T3/T4 | A gate can be submitted → AI-scored → human-reviewed → failed with reasons → resubmitted → passed → unlocks. A 1-1 can be booked and held |
| **P4** | 1–3 Oct | **T5, T6, T7** | **Dress rehearsal passes — hard gate** |
| **🚀** | **~5 Oct** | Cohort 1 starts | — |
| **P5** | Oct – Mar | **S8** (by week 2) · **S9** · **S11** (by week 20) | Per section acceptance |

Applications open ~15 Sep and close ~1 Oct, so **P2 must land on time.**

## C2. Success metrics

**Leading (days–weeks):** application→acceptance 40–60% · acceptance→paid ≥60% · week-4 retention ≥85% · live attendance ≥70% · recording watch among non-attendees ≥60% · **1-1 attendance ≥90%** · gate-1 first-attempt 50–70% · submit→reviewed <72h · reviewer hours/student/week <0.4

**Lagging (months):** graduation ≥65% · employed in field ≤180 days ≥50% · survey response ≥70% · hiring partners ≥15 · gross margin ≥56% · Cohort-2 applications from Cohort-1 referrals ≥20%

**Evaluation points:** week 4 (retention) · **week 6 (gate-1 pass rate — earliest signal the bar is calibrated)** · week 24 (graduation) · +180 days (outcomes)

## C3. Risks

| # | Risk | Mitigation |
|---|---|---|
| 1 | **2 FTE instructors not hired by October** | **Critical path — longer lead time than any ticket.** Recruiting opens in P0, ahead of code. Release valve: Nova-weekly / human-monthly (75% margin) — but that is a product change and must be **stated plainly**, never disguised |
| 2 | Can't fill 100 seats | Open the waitlist early Sep and read the signal. If Band A stalls at 20, **run one cohort of 30 — never discount to fill.** Cutting price teaches the market the wrong number permanently |
| 3 | Employer supply doesn't materialise | 3–6 month lead time. Start in P0. **Publish no interview guarantee until ≥15 partners** |
| 4 | Gate-1 pass >85% | The bar is fake and the credential is worthless. Week-6 go/no-go on gate calibration |
| 5 | Reviewer capacity collapses at 50 | AI-first-pass mandatory; monitor <0.4 h/student/week weekly |
| 6 | Timezone exclusion | Recording attendance credit (S8) and timezone-clustered squads are **P0, not nice-to-have** |
| 7 | Grade forging | S1 DB-level revokes + T1 + T7. Higher-value credentials raise the incentive |
| 8 | P4 is only 3 days | A rehearsal that finds a real problem leaves no repair time. **Honest mitigation: slip a week rather than launch broken** |

## C4. Open questions

**Blocking**

| Q | Owner |
|---|---|
| **Working tree: 145 modified files on `master`** — commit/stash, then branch | A1 |
| **Who are the 2 instructors, and at what hourly rate?** ($35 → 56% margin · $15 → 75%) | A1 |
| Zoom Pro licence count + cloud recording retention setting | A2 |
| Stripe coverage + local payment methods per target country | A2 |

**Non-blocking**

Recording retention period (recommend cohort end + 12 months; vivas longer) · do withdrawn students keep recording access · guarantee shape for Cohort 1 (recommend none published — sell on proof) · cohort flashcard deck opt-in vs auto-added (recommend opt-in)

## C5. What makes this defensible

| # | Claim | Why it can't be copied quickly |
|---|---|---|
| 1 | **Weekly 30-min 1-1** | Pure cost. Only works because the AI carries prep and triage |
| 2 | **Objective gates** — withheld keys + CI contract tests | Already shipped. Almost no bootcamp grades objectively |
| 3 | **Recorded viva on your own code** | The answer to *"did an AI write this?"* |
| 4 | **A tutor that has read every submission you've made** | Needs the graded-work corpus — a year to build |
| 5 | **Career agent that can only argue from proven work** | The constraint is the product |
| 6 | **The compounding class** | Each cohort's best teaching becomes permanent curriculum |

The moat is not the models — anyone can call an LLM. It is the **graded-work corpus** (736 lessons, objective gates, CI contract tests, withheld answer keys) that everything else reads from.

> **Square 1 grades your work objectively, remembers all of it, teaches from what you actually got wrong, and hands you a credential an employer can verify in twenty seconds — including a recording of you defending your own code.**
