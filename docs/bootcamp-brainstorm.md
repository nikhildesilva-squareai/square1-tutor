# Bootcamp — UI & AI Brainstorm

**Date:** 2026-08-19
**Scope:** 6 tracks · cohorts of 50 · weekly 1-1s · live classroom · ship ASAP

---

## 1. The number that shapes everything

50 students changes the design more than 6 tracks does. Per cohort, per week:

| Activity | Hours |
|---|---|
| Weekly 1-1 (50 × 30 min) | **25.0** |
| Live class | 1.5 |
| Labs (50 needs 2 sittings) | 2.0 |
| Office hours | 1.0 |
| Gate review (50 subs × ~10 min human sign-off, gate weeks) | ~8.0 |
| Async / announcements | 2.0 |
| **Total** | **~39 h/week** |

**That is one full-time instructor per cohort.** Six tracks = six full-time senior specialists in AI, cyber, FDE, CV, ML and SE.

The economics are fine — 300 students × $1,490 = **$447k per cycle** against ~$150k of instructor cost, ~66% margin. **The bottleneck is not software and not money. It is hiring six senior instructors, which is a 3–6 month recruiting project, not an ASAP one.**

Two moves resolve it, and both are things we are uniquely able to do:

**Move 1 — sequence the tracks.** Build the platform once, generic across tracks. Launch **AI + Cybersecurity** first (highest demand, and our two strongest curricula). Add FDE, CV, ML, SE as instructors land. The software ships for all six on day one; only cohorts open sequentially.

**Move 2 — split the 1-1 by what each party is actually good at.**

| | Good at | Cadence |
|---|---|---|
| **Nova 1-1** | Reviewing your *actual work* — every commit, submission, failed exercise. It has read all of it. | **Weekly**, 15 min, unlimited |
| **Human 1-1** | Motivation, career judgement, unsticking, reading the person | **Monthly + every gate**, 30 min |

This is not a downgrade dressed up. A human instructor with 50 students **cannot** remember what you submitted three weeks ago. Nova can. The AI 1-1 is genuinely *better* at the work review; the human is genuinely better at everything else. Splitting on that line takes human 1-1 load from 25 h/week to **~6 h/week** and total load to **~20 h/week** — a serious part-time role, hireable now.

---

## 2. The UI — three surfaces

Built from the existing dashboard language: `#0056CE` brand, `radius-lg` cards, `shadow-card`, uppercase `tracking-widest` micro-labels, lucide icons, full dark-mode token set. Nothing new invented.

### 2.1 The Cockpit — `/(app)/bootcamp`

Replaces the dashboard while you are in a cohort. One screen that answers *what do I do right now.*

- **Live bar** — pinned top. Dormant → `Next class Tue 19:00 · in 2d`. Within 30 min → brand-filled with countdown and **Join**. Live → pulsing, `LIVE NOW`.
- **Week rail** — 24 slim columns, today marked, gates as taller notches. The entire program legible in one glance.
- **Gate rail** — 6 chips: `passed` / `open` / `locked` / `failed`. The spine of the product, always visible.
- **This week** — lessons remaining, the project, deadline countdown reusing `lib/schedule.ts` arithmetic.
- **Your 1-1** — next slot, plus the AI-written prep sheet.
- **Squad** — 4 members, PRs awaiting your review.
- **Last class** — thumbnail with a resume progress bar.
- **Standing chip** — plain language. `On track` / `9 days behind on Gate 2`. Never a score, never a rank.

### 2.2 The Classroom — `/(app)/bootcamp/live/[id]`

**At 50 people a Zoom grid is useless.** So the media is Zoom's; the *chrome is ours*.

- **Stage** (70%) — instructor spotlight or screen share. Students audio-off by default.
- **Right rail** (30%), tabbed:
  - **Questions** — students type; AI clusters duplicates and ranks by count. Instructor sees `8× "how does batch norm interact with dropout"` instead of 200 lines of chat.
  - **Roster** — 50 avatars with live presence.
  - **Notes** — your private notes, auto-timestamped to the recording.
- **"Lost me" button** — anonymous. Aggregates into a live confusion line on the instructor's screen. **This is the single feature that makes a 50-person class teachable.**
- **Ask Nova** — mid-class, without interrupting: *"explain the last 2 minutes at my level."* Nova has the live transcript and your competency profile.
- **Fallback** — "Open in Zoom app" always visible, never buried.

### 2.3 The Desk — `/desk/bootcamp`

At 50 students the instructor cannot eyeball anything. The desk must *rank*, not list.

- **Call list** — the 5 students to contact this week, risk-ranked with the reason. Not a roster.
- **Aim sheet** — before class: the cohort's top confusions from failed exercises and last week's questions.
- **Review queue** — AI-scored, sorted by "needs a human decision" first.
- **Gradebook** — 50 × 6 grid, frozen headers, CSV.

---

## 3. AI features, ranked by leverage

**Tier 1 — these are what make 50 students possible.** Build first.

| # | Feature | Why it is load-bearing |
|---|---|---|
| **1** | **Churn-risk ranking** | Login gap + lesson velocity + attendance + exercise failure rate → a ranked *call list*. One instructor cannot notice 50 people slipping. This is the difference between 65% and 40% graduation. |
| **2** | **Clustered question queue + "lost me" signal** | Makes a 50-person live class teachable. Chat at 50 is noise; clustered questions are a curriculum. |
| **3** | **Nova weekly 1-1** | Removes ~19 h/week of human load and is genuinely better at work review. The feature that makes the economics close. |
| **4** | **1-1 prep sheet** | Before every human 1-1, a one-pager: what they shipped, where they are stuck, what to ask. Turns a cold 30 min into a warm 30 min. |

**Tier 2 — strong differentiators, ship in-flight.**

| # | Feature |
|---|---|
| 5 | **Class-aware Nova** — transcripts indexed, so Nova cites what *your instructor* said, at a timestamp |
| 6 | **Personalised recap** — not one recap for the cohort; each student's is weighted to their own gaps |
| 7 | **Notes / flashcards / mind map / Q&A** from each class, behind the instructor approval gate |
| 8 | **Adaptive remediation** — fail a gate, get a generated targeted mini-path, not "try again" |
| 9 | **AI PR review** — first pass on squad pull requests before peer review |
| 10 | **Auto squad formation** — cluster by timezone first, then complementary skill |

**Tier 3 — later.**

Clip→lesson promotion · employer brief matching · instructor coaching from their own transcripts · cohort-over-cohort curriculum tuning from where people actually fail.

---

## 4. Video: still Zoom Meeting SDK

50 fits Zoom Pro's 100-participant ceiling. Breakout rooms remain the deciding feature — at 50, labs are impossible without them. The native mobile app remains our fallback. **Nothing changes from the earlier decision except that the surrounding chrome matters more**, because at 50 the default Zoom UI is genuinely unusable and ours has to carry the room.

---

## 5. What I would do, as founder, this week

1. **Platform generic across all 6 tracks from day one** — `bootcamps.course_id` already makes a track just a row. Zero extra cost.
2. **Open 2 cohorts, not 6** — AI and Cybersecurity. Sell the other four as "next intake" waitlists to prove demand before hiring against it.
3. **Weekly Nova 1-1, monthly human 1-1, human 1-1 at every gate.** Say this plainly in the marketing — it is a stronger claim than "weekly 1-1", not a weaker one, because it is honest about which is which.
4. **Build Tier-1 AI first.** They are not garnish; they are what makes 50 work.
