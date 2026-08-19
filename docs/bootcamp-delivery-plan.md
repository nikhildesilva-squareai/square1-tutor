# Bootcamp as a Standalone Product — Master Delivery Plan

**Date:** 2026-08-19 (decisions locked)
**Status:** Plan approved in principle — **no code until §0.2 hygiene is done**
**Consolidates:** roadmap · live architecture · classroom · class artifacts · user stories · PRD · P0-Launch breakdown

---

## 0. Decisions locked

| # | Decision | Chosen | Consequence |
|---|---|---|---|
| 1 | **Product name** | **"Bootcamp"** | Requires renaming the existing paced mode and rewriting landing/About copy — see §2.4. New work, ~2 days. |
| 2 | **Team** | **2 engineers + design** | Revised up from 1. Makes ~5 Oct reachable, but only with §5.2 concierge ops. |
| 3 | **Cohort 1 start** | **~5 Oct 2026** | 6.7 weeks from today. No slack — see §5.1. |
| 4 | **1-1 cadence** | **LOCKED — 30-min weekly consultation, human instructor** | 25 h/week per 50-student cohort. 1 FTE instructor per cohort. Adds L4 booking to P0. Margin holds at 56% — see §0.1. |

### 0.1 The 1-1 model — LOCKED: 30-minute weekly consultation, human instructor

**Instructor load, cohort of 50:**

| Component | Hours/week |
|---|---|
| Live class (code review) | 1.5 |
| Squad lab (2 sittings at 50) | 2.0 |
| Office hours | 1.0 |
| **Weekly 1-1s — 50 × 30 min** | **25.0** |
| Gate review + async (50 submissions) | ~9.5 |
| **Total** | **~39 h/week** |

**That is one full-time instructor per 50-student cohort.** 24 weeks = ~936 hours.

**The economics work.** Per student: 0.78 h/week × 24 weeks = ~18.7 h × $35 = **$655**, against $1,490 tuition.

| | 2 cohorts (launch) | 6 cohorts (full) |
|---|---|---|
| Students | 100 | 300 |
| Revenue | $149,000 | $447,000 |
| Instructor (44%) | $65,500 | $196,600 |
| Infra (video, recordings, AI) | ~$400 | ~$1,200 |
| **Gross margin** | **~$83,000 (56%)** | **~$249,000 (56%)** |

A stable 56% gross margin at both scales — 50-student cohorts amortise the group sessions well, and the 1-1 cost scales with tuition.

**Two hard consequences:**

1. **Hiring is 1 FTE per cohort, not a part-time role.** Launching 2 tracks means **2 full-time instructors** by 5 Oct. This is now the critical-path dependency — longer lead time than any ticket in the build.
2. **Scope: 50 students × 24 weeks = 1,200 sessions per cohort.** Cannot be run by email. **L4 booking is P0-Launch** (+~5 engineer-days) and must exist before week 1.

*Alternative previously proposed and not taken: Nova runs the weekly work-review 1-1, human runs monthly + every gate. Would cut instructor load ~19 h/week and lift margin to ~75%. Recorded here only so the option is visible if hiring 2 FTEs by October proves impossible.*

### 0.2 Blocking prerequisite — unchanged

The working tree had **124 modified/untracked files** at last check. Commit or stash, then branch, before any bootcamp code lands. At this build size the difference is "revert the bootcamp spine" vs "revert five features at once."

---

## 1. What exists, what's missing

| Artifact | Status | Where |
|---|---|---|
| User stories | ✅ Done — 95 stories, 8 personas, CSV for import | `bootcamp-user-stories.md` / `.csv` |
| PRD | ✅ Done — 34 requirements, metrics, open questions | `bootcamp-prd.md` |
| Task breakdown | ✅ Done — 45 tickets, dependency graph | `bootcamp-p0-launch-build.md` |
| Standalone product architecture | ✅ This doc §2 | — |
| UI/UX | ⏳ **Design phase starts now** — 19 screens, none designed | §3 |
| Test strategy | ⏳ **No runner exists in the repo** | §4 |

**Testing finding, unchanged:** `package.json` has no test script; there is no `jest.config`, `vitest.config` or `playwright.config`. The files under `__tests__/` are `describe`/`test` blocks containing comments — documentation, not executable assertions. A runner must be wired from zero.

---

## 2. Bootcamp as a standalone product

### 2.1 The precedent is in your codebase

`lib/flags.ts` describes Startup School as *"a different product for a different buyer... built ahead of the programme's first batch and hidden until then."* Copy that exactly: build behind **`BOOTCAMP_ENABLED`**, flip when Cohort 1 opens.

### 2.2 One curriculum, four products

| Product | Buyer | Price | Status |
|---|---|---|---|
| **Self-paced (Tutor)** | Self-directed learner | $19.90/mo | Live |
| **Bootcamp** | Career switcher needing accountability + a job | $1,490 | **This build** |
| **Startup School** | Founder | — | Built, flagged off |
| **Teams / B2B** | Employer | Seats | Live |

**Acceptance test for "standalone":** someone lands on `square1ai.com/bootcamp`, understands it, applies, and pays — without ever touching the self-paced product.

### 2.3 What standalone requires

| Surface | Change |
|---|---|
| **URL space** | `/bootcamp` (public) + `/(app)/bootcamp` (enrolled) — its own tree, not under `/courses/[slug]` |
| **Homepage** | The fork above the fold: *learn at your pace* vs *learn with a cohort* |
| **Pricing page** | Two products side by side |
| **Nav** | New cluster in `components/sidebar-nav.tsx` gated on `BOOTCAMP_ENABLED` |
| **Course pages** | Eligible courses gain an "available as a bootcamp" entry point |
| **Catalogue** | Which tracks run, which cohorts are open |

### 2.4 "Bootcamp" is chosen — here is the work it creates

You picked Bootcamp over Cohort. That's a legitimate call — it's the word buyers search for, and it says plainly what the product is. It does mean resolving three existing conflicting uses, which becomes **P0 work rather than a naming footnote**:

| # | Conflict | Fix | Size |
|---|---|---|---|
| **N-01** | `components/LearningModes.tsx` calls the **self-paced committed mode** "Bootcamp" (*"Turn {courseTitle} into a bootcamp"*), shipped 14 Aug | Rename to **"Paced Track"** across the component, the dashboard card and `/courses/[slug]/plan` | S |
| **N-02** | `app/page.tsx:199` and `app/about/page.tsx:347` — *"Bootcamps rush you through and hand you a certificate"* | Rewrite. You cannot attack bootcamps while selling one. Sharpen to the real claim: *$15,000 bootcamps rush you through* — you compete on price and proof, not on category. | S |
| **N-03** | `components/landing/FAQSection.tsx:44` — *"Is this a bootcamp or a video course?"* | Rewrite as the product fork question now that both exist | S |
| **N-04** | `ComparisonSection.tsx:28` — "$15,000+ bootcamp tuition" as the anchor you undercut | Keep — it still works, and $1,490 vs $15,000 is a strong line | — |

**~2 engineer-days total.** N-02 is the one with judgement in it: the honest new positioning is *"a bootcamp that costs a tenth as much and proves what you learned"*, not *"we're not a bootcamp."*

---

## 3. UI/UX plan

### 3.1 Screen inventory — 19 screens for P0-Launch

**Public (5)** — `/bootcamp` index · `/bootcamp/[slug]` sales page · apply + local-time confirm · application status · schedule in visitor tz

**Student app (8)** — command centre · live classroom · sessions/recordings · gate detail · submission thread · learning contract · standing/defer · **1-1 booking** *(new, from decision 4)*

**Desk (6)** — applications queue · roster + standing · gate review queue · gradebook · sessions · announcements
*(several run concierge for Cohort 1 — see §5.2)*

### 3.2 New patterns to design

Tokens are solid (`app/globals.css` `@theme`). The primitive layer is thin — 17 components in `components/ui/`. These don't exist yet:

**Gate rail** (locked/open/passed/failed progression) · **week timeline** (24 weeks, today marker, deadline states) · **standing chip** (plain language, not a score) · **video container** (must survive Tailwind preflight — see §4) · **queue/worklist** (dense rows, bulk actions) · **gradebook grid** (frozen headers) · **thread** (check `components/community` for reuse first) · **booking slot picker** (new, for weekly 1-1s)

### 3.3 Mock in HTML, not Figma

Your design system lives in code as Tailwind `@theme` tokens. Figma creates a translation gap and a second source of truth. Use `/design-html` for real-token mockups reviewable in the Browser pane, then promote to components.

### 3.4 Design these seven first

| # | Screen | Why high-stakes |
|---|---|---|
| 1 | `/bootcamp/[slug]` sales page | Every acquisition dollar lands here |
| 2 | Apply + local-time confirmation | **ST-01** — stops you selling a seat someone can't attend |
| 3 | Command centre | Daily home. Drives retention → G1, G5 |
| 4 | Live classroom + fallback | Twenty people, one hour, no second chance |
| 5 | Gate detail + submission thread | **ST-25** — the core of paying for a human |
| 6 | Desk gate review queue | **IN-12** — throughput *is* the business model |
| 7 | **1-1 booking** | **480 sessions per cohort.** Friction here compounds weekly |

Run `/design-review` before any of these is built.

---

## 4. Test strategy

| ID | Layer | What | Priority |
|---|---|---|---|
| **T0** | Runner | Install **Vitest** + `test` script. Leave existing `__tests__/*` docs alone — they're specs, not tests | First |
| **T1** | **Integrity / RLS** | Assert every forgery **fails**: student writing `gate_results.status='passed'`, writing attendance, inflating `watched_seconds`, reading `gates.requires`, reading `zoom_start_url`. Run against a Supabase branch | **Highest value** |
| **T2** | Unit | `lib/bootcamp/*` pure functions. Copy `lib/srs.ts` house style (injectable `now`) | High |
| **T3** | API routes | Application validation · **signature endpoint authorisation** · webhook signature + `url_validation` + idempotency | High |
| **T4** | E2E | One Playwright happy path: apply → accept → pay → command centre → submit gate → reviewed → unlocked | Medium |
| **T5** | Manual QA script | The live class — join, fallback, host start, breakout, recording. Zoom can't be meaningfully automated | High |
| **T6** | **Dress rehearsal** | Full mock class, ~20 seeded students, real Zoom, real webhook, real ingest | **Hard gate** |
| **T7** | Forgery pen-test | Manual attempt at each bypass, signed off pre-launch | Hard gate |

**T6 is worth more than every unit test combined.** It's the only thing that exercises a corporate network blocking the embed, Safari's COEP behaviour, a late webhook, or attendance matching the wrong student. If it fails you delay — survivable. Failing live in front of twenty paying customers is not.

---

## 5. Schedule

### 5.1 The arithmetic, stated plainly

| | Days |
|---|---|
| P0-Launch build (45 tickets) | 62–75 |
| Test setup T0–T4 | +8–10 |
| Naming fixes N-01…N-03 | +2 |
| **L4 1-1 booking** (from decision 4) | +5 |
| **Total** | **77–92 engineer-days** |
| Available: 2 engineers × 6.7 weeks × 5 days | **67 days** |
| **Gap** | **−10 to −25 days** |

Full scope does not fit, even with two engineers. The gap closes in exactly one place.

### 5.2 Close the gap with concierge ops

**Cohort 1 is twenty people.** Build everything students and the instructor touch; run internal ops by hand. The cut lands on tooling for *you*, never on the product students paid for.

| Deferred | Cohort 1 substitute | Saves |
|---|---|---|
| B-111 gradebook grid | Roster view + CSV export | 4 d |
| B-014 full admissions queue w/ bulk actions | Simple list, decisions one at a time (20 applicants) | 3 d |
| B-112 announcements composer | Resend directly | 2 d |
| B-120/121/122 session CRUD, ICS, reschedule | Seed sessions via SQL; email changes | 5 d |
| B-050…053 recordings | Already scheduled post-launch (week 2) — not in this window | — |

**~14 days recovered → 63–78 against 67 available.** Achievable, with no slack. Any scope addition after this needs a scope removal.

### 5.3 Phases

| Phase | Window | Work | Exit gate |
|---|---|---|---|
| **P0 — Hygiene & decisions** | 19–22 Aug | Commit/stash 124 files · branch · Zoom dev account · remaining open questions (§6) | Clean tree, branch cut |
| **P1 — Design ‖ spine** | 25 Aug – 12 Sep | **Design:** flows + 7 screens + `/design-review`. **Eng A:** B-001 schema, B-002 RLS, B-003/4 lib, T0 runner, T1 RLS tests. **Eng B:** **B-030 Zoom spike**, N-01…N-03 naming | Schema applied · spike proven on Vercel preview **and Safari** → Zoom/Daily go-no-go · 7 screens signed off |
| **P2 — Public product + admissions** | 15 Sep – 26 Sep | `/bootcamp` tree, sales page, apply + local-time confirm, checkout, consent, concierge desk · T2/T3 | Test user applies → accepted → pays → lands on command centre. **Waitlist live. Employer recruitment starts.** |
| **P3 — Live + gates + 1-1s** | 22 Sep – 2 Oct | Classroom + fallback, attendance webhook, gate submit/review/sign-off, submission thread, **L4 booking** · T4 | A gate can be submitted → AI-scored → human-reviewed → failed with reasons → resubmitted → passed → unlocks. A 1-1 can be booked and joined. |
| **P4 — Rehearsal** | 1–3 Oct | **T6 dress rehearsal** · T5 script · T7 pen-test | **Hard gate — failure delays the cohort** |
| **🚀 Launch** | **~5 Oct** | Cohort 1 starts | — |
| **P5 — In-flight** | Oct – Mar | Recordings (by week 2), squads (by week 11), artifacts, hiring stack (by week 20) | Per PRD |

**Applications open ~15 Sep, close ~1 Oct.** The Zoom-vs-Daily decision must land before that — it changes what you promise buyers.

### 5.4 Where this plan breaks

1. **The Zoom spike fails.** Pivoting to Daily costs ~a week the schedule doesn't have. **Run it in week 1** — it's why Eng B starts there.
2. **P4 is only 3 days.** A dress rehearsal that surfaces a real problem leaves no repair time. The honest mitigation is that 5 Oct slips by a week rather than launching broken.
3. **Weekly 1-1s at 60 minutes.** 25.5 h/week is near-full-time for one instructor and drops margin to 28%. Settle on 30 minutes (§0.1).

---

## 6. Still open

| # | Question | Blocks | Recommendation |
|---|---|---|---|
| 1 | **1-1 length: 30 or 60 min?** | Economics, instructor hire | **30 min** — 56% margin vs 28% |
| 2 | **Pilot track** | Public pages (P2) | Data Science or Software Engineering with AI |
| 3 | **Who is the instructor?** | Everything — 15.5 h/week is most of a part-time role | Band A (13:30 UTC) |
| 4 | **Price confirmation** | Checkout (P2) | $1,490 global / $490 South Asia. **New SKU** — never edit `REGIONS` |
| 5 | Zoom licence tier + recording storage | B-030 spike | Verify before 25 Aug — Basic caps group calls at 40 min |
| 6 | Stripe coverage per target country | Applications opening | — |

Items 2–4 block P2, not P1 — so design and the spine start regardless.

---

## 7. Immediate next actions

1. **Commit or stash the working tree, cut a branch** — prerequisite to everything
2. **Confirm 1-1 length (30 vs 60 min)** — it moves margin by 28 points
3. **Zoom dev account + licence tier** — needed before the spike
4. **Start in parallel:** design the 7 screens ‖ Eng A writes migration `021_create_bootcamp_spine.sql` ‖ Eng B runs the Zoom spike

Nothing gets built until 1 is done.
