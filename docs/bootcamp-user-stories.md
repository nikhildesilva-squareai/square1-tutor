# Bootcamp — User Stories (v2)

**Date:** 2026-08-19 · supersedes the v1 set written 2026-08-16
**Reflects locked decisions:** 6 tracks · cohorts of **50** · **weekly 30-min human 1-1** · Zoom via **per-student registration links, not embedded** · recordings auto-ingested to Bunny · pay-in-full (−10%) or 3-part · `BOOTCAMP_ENABLED` flag

**Priority for Cohort 1:** **M** = cannot run without it · **S** = Cohort 1 quality · **L** = Cohort 2+

### What changed from v1

| Change | Effect on stories |
|---|---|
| 20 → **50 students** | Clustered questions, confusion signal and churn ranking move from "nice" to **load-bearing**. An instructor cannot eyeball 50 people. |
| Embedded classroom → **Zoom links** | Join and fallback stories rewritten. **Per-student registration links are now mandatory** — one shared link makes attendance unattributable and the gate model collapses. |
| Fortnightly → **weekly 30-min 1-1** | 1,200 sessions per cohort. Booking is P0, not P1. New 1-1 epic. |
| 1 track → **6 tracks** | Track selection, per-track cohorts, cross-track community. |
| Pricing decided | Payment, deposit and refund stories are now concrete. |

---

## 1. Personas

| Code | Persona | Share / role | What makes them different |
|---|---|---|---|
| **S1** | Career switcher | ~70% of cohort | Working full time, wants a job at the end. Forgives a rough UI; never forgives a wasted six months. |
| **S2** | Constrained learner | ~20% | Parent, shift worker, or wrong timezone band. Misses ~40% of live sessions. The stress test for the global model. |
| **S3** | Employed upskiller | ~10% | Already technical, often a B2B seat. Wants depth and credential legitimacy, not the hiring sprint. |
| **T1** | Lead instructor | **1 FTE per cohort, ~39 h/week** | Teaches, runs 50 weekly 1-1s, reviews gates, owns standing. The binding constraint on the business. |
| **T2** | Mentor / TA | Part-time, often alumni | Office hours, overflow 1-1s, vivas. Needs full context in 60 seconds. |
| **A1** | Program owner | — | Economics, cohort health, employer supply, outcomes, public claims. |
| **A2** | Ops / admissions | — | Applications, roster, payments, scheduling, refunds. Lives in queues. |

---

## 2. Student stories

| ID | Persona | As a… | I want… | So that… | Pri |
|---|---|---|---|---|---|
| ST-01 | S1 | prospective student | to compare all 6 tracks and see which fits my background | I pick the right bootcamp, not the loudest one | M |
| ST-02 | S1 S2 | prospective student | every session shown in **my** timezone before I pay | I never buy a programme I can't attend | M |
| ST-03 | S1 | prospective student | the full 24-week schedule, 6 gates and weekly hours up front | I can judge honestly whether I can commit | M |
| ST-04 | S1 | prospective student | a placement assessment that tells me if I'm not ready **before** I pay | I don't fail out in week 3 having spent real money | M |
| ST-05 | S1 | accepted applicant | to pay in full and save 10%, or split into 3 | price isn't the reason I can't start | M |
| ST-06 | S1 | accepted applicant | to see exactly what's refundable and when my deposit locks in | I know my exposure before committing | M |
| ST-07 | S2 | applicant outside the open band | to be waitlisted for my band, not sold a 4am seat | I'm not paying to fail | M |
| ST-08 | S1 | rejected applicant | a clear, non-humiliating route into the self-paced track | I still have a path forward | S |
| ST-09 | S1 S2 | new student | a device and network check ~24h before my first class | my first experience isn't "can you hear me?" | M |
| ST-10 | S1 | new student | **my own personal Zoom link**, not a shared one | my attendance actually counts toward my gates | M |
| ST-11 | S1 | new student | to meet my squad and know my rotating role | I know who to talk to on day one | M |
| ST-12 | S1 | new student | a one-page learning contract of what graduating requires | expectations are unambiguous | M |
| ST-13 | S2 | new student | to subscribe to my session calendar (ICS) in my timezone | sessions appear where I already look | S |
| ST-14 | S1 | student | one screen telling me what's due and what happens if I miss it | I never reconstruct my obligations | M |
| ST-15 | S1 | student | to join class in one click from the app | joining is never the hard part | M |
| ST-16 | S1 | student in a 50-person class | to ask a question **in the app** during class | my question isn't lost in 200 lines of Zoom chat | M |
| ST-17 | S1 | student who's lost | to flag it anonymously without stopping the class | I get help without looking stupid in front of 49 people | S |
| ST-18 | S1 | student | squad lab to put me in a breakout with my own squad | no manual coordination every week | S |
| ST-19 | S1 | student | to book my weekly 30-min 1-1 at a time that works for me | the most valuable half-hour of my week actually happens | M |
| ST-20 | S1 | student | to see the agenda before I walk into my 1-1 | I don't waste 10 of my 30 minutes on context | M |
| ST-21 | S1 | student | to reschedule my 1-1 without emailing anyone | life happening doesn't cost me the session | M |
| ST-22 | S1 | student | last week's 1-1 action items visible and tracked | the 1-1 compounds instead of resetting | S |
| ST-23 | S1 S2 | student | to watch the recording and resume where I left off | I can learn in 20-minute fragments | M |
| ST-24 | S2 | constrained learner | attendance credit for watching the recording | my timezone doesn't disqualify me from graduating | M |
| ST-25 | S1 | student | to search every class for a phrase and jump to that moment | the archive is usable, not just stored | S |
| ST-26 | S2 | constrained learner | a "you missed it" summary within a few hours | I stay in sync without watching 90 minutes | S |
| ST-27 | S1 | student | notes, flashcards, a mind map and Q&A from each class | the class converts into something I can revise | S |
| ST-28 | S1 | student | class flashcards in the review queue I already use | I don't manage a second app | S |
| ST-29 | S1 | student | clear labelling of instructor-approved vs auto-generated cards | I never drill a hallucinated fact for months | M* |
| ST-30 | S1 | student | to jump from a flashcard to the moment it came from | I can verify anything I doubt | S |
| ST-31 | S1 | student | my project graded fast with a rubric breakdown | I know where I actually stand | M |
| ST-32 | S1 | student | a **private conversation with my instructor** about my submission | feedback is a dialogue, not a one-shot AI verdict | M |
| ST-33 | S1 | student | to resubmit after fixing, within a stated window | failure is recoverable and bounded | M |
| ST-34 | S1 | student who failed a gate | to know precisely why and exactly what to do next | I can act instead of guess | M |
| ST-35 | S1 | student | to see and review my squadmates' pull requests | I learn to read code, not just write it | S |
| ST-36 | S1 | student | credit for reviewing well | the skill is treated as real work | S |
| ST-37 | S1 | student on a squad project | my individual contribution visible and auditable | I'm neither carried nor exploited | M |
| ST-38 | S2 | student stuck at 2am | a tutor that's awake and remembers my history | no timezone is unsupported | M |
| ST-39 | S1 | student | to know I'm slipping **before** it's terminal, with a way back | I recover instead of quietly dropping out | M |
| ST-40 | S1 | struggling student | to defer to the next cohort without losing money or dignity | a bad quarter doesn't end my programme | M |
| ST-41 | S1 | student | to privately say I'm struggling without telling the cohort | asking for help costs me nothing socially | S |
| ST-42 | S1 | graduating student | a CV built from graded work I can defend | I'm never caught out in an interview | M |
| ST-43 | S1 | graduating student | a public portfolio URL that beats my CV | my proof travels without me | M |
| ST-44 | S1 | job-seeking graduate | to track my applications in-app | the effort is visible and counts | M |
| ST-45 | S1 | graduating student | unlimited AI mock interviews plus one human panel | I practise until the real thing is boring | S |
| ST-46 | S1 | graduate | introductions to hiring partners based on proven competency | the value doesn't stop at the certificate | M |
| ST-47 | S1 | graduate | a Demo Day slot with a permanent link | I have one artifact to send any employer | S |
| ST-48 | S1 S3 | graduate | a credential an employer verifies in 20 seconds, with evidence | the certificate means something to someone else | M |
| ST-49 | S1 | graduate | control over whether my viva recording is public, revocable | my face isn't permanently online by default | M |
| ST-50 | S1 | alum | recordings, notes and portfolio accessible after graduating | what I paid for doesn't disappear | M |

\* M only if the generated-artifacts tier ships — but then non-negotiable.

---

## 3. Teacher stories

| ID | Persona | As a… | I want… | So that… | Pri |
|---|---|---|---|---|---|
| IN-01 | T1 | lead instructor | to see who's behind and at risk **before** I teach | I aim the session at real problems | M |
| IN-02 | T1 | lead instructor | last week's top confusions from failed exercises and questions | I teach what people actually didn't get | S |
| IN-03 | T2 | mentor | a student's standing, last submission and gaps in 60 seconds | I'm useful without reading a thread | M |
| IN-04 | T1 | lead instructor | to start class as host in one click, `start_url` never exposed | students can't hijack or pre-start the meeting | M |
| IN-05 | T1 | instructor of 50 | **clustered questions**, not 200 lines of chat | I can actually answer the room | M |
| IN-06 | T1 | instructor of 50 | a live confusion signal showing when I lost people | I can re-explain in the moment, not next week | S |
| IN-07 | T1 | lead instructor | breakout rooms auto-populated from the squad roster | I'm not dragging 50 names every week | S |
| IN-08 | T1 | lead instructor | recording to start automatically | I never lose a class to forgetting | M |
| IN-09 | T1 | lead instructor | to approve, edit or reject generated study cards in **under 5 min** | artifacts are trustworthy without eating my week | M* |
| IN-10 | T1 | lead instructor | to answer captured questions after class | running out of time doesn't fail the student | S |
| IN-11 | T1 | lead instructor | to post an announcement that reaches all 50 | important things don't get lost in chat | M |
| IN-12 | T1 | lead instructor | to see who has and hasn't watched the recording | I chase the right people | S |
| IN-13 | T1 | lead instructor | to mark a great 2-minute explanation as a clip on the lesson | my best teaching outlives the cohort | L |
| IN-14 | T1 T2 | instructor | to publish availability and have 1-1s auto-create their meetings | booking 50 sessions a week costs me no admin | M |
| IN-15 | T1 | lead instructor | my week of 1-1s laid out with prep sheets ready | 25 hours of 1-1s is survivable | M |
| IN-16 | T1 | lead instructor | to log 1-1 outcomes and action items against the student | next week's session builds on this one | M |
| IN-17 | T1 | lead instructor | no-shows tracked automatically | I reclaim the slot and it counts toward standing | S |
| IN-18 | T1 | lead instructor | a review queue where AI already scored objective + rubric | I sign off rather than grade 50 from scratch | M |
| IN-19 | T1 | lead instructor | to pass or fail with written reasons the student sees | decisions are explainable and defensible | M |
| IN-20 | T1 | lead instructor | a threaded private conversation about a submission | I can teach through feedback | M |
| IN-21 | T1 | lead instructor | one gradebook grid — 50 × 6 gates × attendance × standing | I see the whole cohort at a glance | M |
| IN-22 | T1 | lead instructor | to flag a student at risk and trigger intervention | concern turns into action | M |
| IN-23 | T1 | lead instructor | to see my committed hours for the coming week | I flag overload before it happens | S |
| IN-24 | T1 T2 | instructor | it to be **impossible** to leak a `start_url`, answer key or gate threshold | I can't compromise integrity by accident | M |
| IN-25 | T1 | lead instructor | to hand a session or review queue to another instructor | being sick doesn't stall 50 students | L |

---

## 4. Square 1 admin stories

| ID | Persona | As a… | I want… | So that… | Pri |
|---|---|---|---|---|---|
| AD-01 | A2 | ops admin | to create a cohort (track, dates, band, seats, price) without an engineer | launching an intake isn't a deploy | S |
| AD-02 | A1 | program owner | all 6 tracks configured but cohorts opened selectively | I sell demand before hiring against it | M |
| AD-03 | A1 | program owner | gates defined once per bootcamp, reused by every cohort | standards don't drift between intakes | M |
| AD-04 | A2 | ops admin | holiday skip-weeks per band (Eid, Diwali, Poya, Thanksgiving) | we don't schedule class on a holiday | M |
| AD-05 | A2 | ops admin | to clone last cohort's configuration | setup is minutes, not days | S |
| AD-06 | A2 | ops admin | one admissions queue with score, hours committed and timezone | decisions are made on evidence, fast | M |
| AD-07 | A2 | ops admin | to accept / waitlist / reject / defer with templated emails | admissions doesn't consume a week | M |
| AD-08 | A1 | program owner | the seat counter to reflect **real** accepted applications | we never publish a fake scarcity number | M |
| AD-09 | A2 | ops admin | squads auto-suggested by timezone cluster, manually overridable | squads can actually find a time to meet | S |
| AD-10 | A2 | ops admin | pay-in-full and 3-part plans reconciled in one view | I know who has actually paid | M |
| AD-11 | A2 | ops admin | deposits credited to tuition and locked non-refundable after week 2 | the refund promise is enforced, not remembered | M |
| AD-12 | A1 | program owner | the regional rate verified against the **payment method's** country | a $350 price gap doesn't invite VPN arbitrage | M |
| AD-13 | A2 | ops admin | a failed payment to suspend access, not silently continue | we don't deliver 6 months unpaid | M |
| AD-14 | A1 | program owner | a cohort health dashboard — retention, pass rates, attendance, at-risk | I see trouble in week 4, not week 20 | M |
| AD-15 | A1 | program owner | gate-1 first-attempt pass rate surfaced prominently | above ~85% tells me my bar is decorative | M |
| AD-16 | A1 | program owner | reviewer SLA against the 72h submit-to-reviewed target | slow feedback is caught before students churn | M |
| AD-17 | A1 | program owner | instructor hours per week per cohort | I know when to stop selling seats | M |
| AD-18 | A2 | ops admin | to cancel or reschedule a session with automatic notification | changes don't require 50 manual messages | S |
| AD-19 | A2 | ops admin | recording ingest health with retry on failed jobs | a lost recording is caught in hours, not weeks | M |
| AD-20 | A2 | ops admin | Zoom licence utilisation and double-booking warnings | two sessions never collide on one host | S |
| AD-21 | A1 | program owner | cost per student — instructor hours + AI + video | unit economics are observed, not assumed | S |
| AD-22 | A2 | ops admin | roster and gradebook CSV export | data isn't trapped in the app | S |
| AD-23 | A1 | program owner | students **unable** to write their own gate result, attendance or credential | the credential can't be forged | M |
| AD-24 | A1 | program owner | every gate decision, waiver and override audited | outcomes are defensible under scrutiny | M |
| AD-25 | A2 | ops admin | to genuinely delete a student's recordings and data on request | we can honour deletion, not just hide a flag | M |
| AD-26 | A1 | program owner | recording consent at enrolment, viva publication opt-in | we're lawful in every market we sell into | M |
| AD-27 | A1 | program owner | outcome surveys at 90 / 180 / 365 days with response rate | outcome claims rest on data | M |
| AD-28 | A1 | program owner | an outcomes page that says "no data yet" honestly | trust is built before the numbers are good | M |
| AD-29 | A1 | program owner | an employer pipeline — briefs, intros, hires confirmed | employer supply is managed, not hoped for | M |
| AD-30 | A1 | program owner | to open a new track or timezone band by configuration, not code | growth doesn't need a rebuild | S |
| AD-31 | A1 | program owner | alumni to become paid mentors | instructor supply grows with the programme | L |

---

## 5. AI stories — the USP

**The honest test for each: could a competent competitor ship this in a quarter?** Where the answer is yes, it's table stakes and shouldn't appear in marketing as a differentiator. Where it's no, it's usually because the moat isn't the model — it's **the graded-work corpus underneath it**, which took you a year to build.

| ID | As a… | I want… | So that… | Defensibility | Pri |
|---|---|---|---|---|---|
| **AI-01** | student | a tutor that has read **every submission, exercise and commit I've made** | advice is about my actual work, not generic | **UNIQUE** — needs the graded corpus. Competitors have no equivalent to `verified-profile.ts` | M |
| **AI-02** | instructor | a **prep sheet before every 1-1** — what they shipped, where they're stuck, what to ask | 30 minutes with 50 students is warm, not cold | **UNIQUE** — a human with 50 students cannot remember; the AI has read everything | M |
| **AI-03** | program owner | a **churn-risk call list** — the 5 students to contact this week, with reasons | nobody slips through a 50-person cohort unnoticed | **STRONG** — signal quality depends on lesson/exercise/attendance telemetry others don't collect | M |
| **AI-04** | instructor | **clustered live questions** — "8× how does batch norm interact with dropout" | a 50-person class is teachable at all | **STRONG** — the idea is copyable, the execution inside a gated cohort isn't | M |
| **AI-05** | student | to flag "**lost me**" anonymously, aggregated into a live confusion line | the instructor fixes it in the moment | **STRONG** — trivially copyable, genuinely rare | S |
| **AI-06** | student | Nova to cite **what my instructor actually said**, at a timestamp | the live and async product are one thing, not two | **UNIQUE** — requires transcripts joined to your curriculum and my competency profile | S |
| **AI-07** | student | a recap **weighted to my own gaps**, not the same recap as everyone else | I revise what I personally missed | **STRONG** — needs per-student mastery state | S |
| **AI-08** | student | flashcards, notes, mind maps and Q&A generated from each class | the class converts into durable knowledge | **TABLE STAKES** — everyone has transcription→cards now | S |
| **AI-09** | student | every generated card **cited to a timestamp** and instructor-approved before it enters my deck | I never spaced-repeat a hallucination | **STRONG** — the discipline is the differentiator, not the generation | M* |
| **AI-10** | student who failed a gate | a **generated targeted remediation path**, not "try again" | failure is a route forward, not a wall | **STRONG** — needs curriculum graph + failure diagnosis | S |
| **AI-11** | student | grading against a **withheld answer key and CI contract tests** | my pass is a fact, not a rubric opinion | **UNIQUE** — you already ship this; almost no bootcamp grades objectively | M |
| **AI-12** | student | **AI review on my PR** before a human sees it | I fix the obvious things myself and learn faster | **TABLE STAKES** — Copilot/CodeRabbit do this | S |
| **AI-13** | ops admin | **squads auto-formed** by timezone cluster then complementary skill | four people can actually find a time to meet | **STRONG** — obvious in hindsight, rarely done | S |
| **AI-14** | graduate | **mock interviews grounded in my real gaps**, not a question bank | practice targets what I'd actually fail on | **STRONG** — needs the graded corpus | S |
| **AI-15** | graduate | a career agent that can **only** argue from work I actually proved | my CV never collapses under a technical screen | **UNIQUE** — the constraint is the product; competitors' AI CV tools invent | M |
| **AI-16** | graduate | a credential carrying **evidence + a recorded viva** | an employer can check it in 20 seconds | **UNIQUE** — the answer to "did an AI write this?", which is eroding every bootcamp credential right now | M |
| **AI-17** | program owner | each cohort's best teaching **promoted permanently into the curriculum** | cohort 7 learns from cohort 1's best 12 minutes | **UNIQUE** — compounding asset; the live programme improves the async product | L |
| **AI-18** | program owner | **cross-cohort confusion analysis** telling me which lessons to rewrite | the curriculum improves from where people actually fail | **STRONG** — needs multi-cohort telemetry | L |

### The four-line pitch

Everything above collapses to one claim competitors structurally cannot make:

> **Square 1 grades your work objectively, remembers all of it, teaches from what you actually got wrong, and hands you a credential an employer can verify in twenty seconds — including a recording of you defending your own code.**

The moat is **AI-01, AI-11, AI-15 and AI-16**. Not the models — anyone can call an LLM. It's the **graded-work corpus** (736 lessons, objective gates, CI contract tests, withheld answer keys) that everything else reads from. That took a year to build and cannot be shortcut.

**Marketing discipline:** lead with AI-02, AI-11 and AI-16 — they're concrete, verifiable and rare. Never lead with AI-08 or AI-12; a buyer who has used ChatGPT will discount your whole claim if the headline feature is one they already have for free.

---

## 6. Anti-stories — deliberately not building

| Requested by | The "story" | Why not |
|---|---|---|
| Students | Skip ahead past a gate I haven't passed | Strict progression *is* the product. Deferral is the humane alternative, not a bypass. |
| Students | Mark my own attendance or lesson completion | Self-reported anything is forgeable, and this credential goes to employers. |
| Students | A leaderboard of everyone's grades | Public ranking drives out exactly the students who most need to stay. |
| Instructors | Quietly mark a gate as passed | Overrides are allowed; silent ones are not. Every override is audited (AD-24). |
| Marketing | An urgency counter when it isn't true | Contradicts the honest-numbers principle already shipped platform-wide. |
| Marketing | Promise a job | You can guarantee interviews. Employment you cannot — the refund liability is real. |
| Anyone | Auto-approve AI flashcards to save instructor time | A wrong card enters spaced repetition and gets drilled. The review gate **is** the feature. |
| Anyone | Let Nova replace the weekly 1-1 without saying so | If the weekly 1-1 is ever AI-led, say so plainly. Selling AI time as human time is the one lie that would end the brand. |

---

## 7. Cohort 1 minimum set

Every **M** story collapses to nine capabilities:

| # | Capability | Stories |
|---|---|---|
| 1 | Choose a track → apply → be assessed → be accepted → **pay** | ST-01…08, AD-06…13 |
| 2 | Join a live class via a **personal registration link** that attributes attendance | ST-10, ST-15, IN-04 |
| 3 | Ask questions in-app in a 50-person room | ST-16, IN-05 |
| 4 | **Book, prep for, and attend a weekly 30-min 1-1** | ST-19…22, IN-14…17, AI-02 |
| 5 | Watch the recording afterwards and get credit | ST-23, ST-24, AD-19 |
| 6 | Submit work, be graded, and **talk to a human about it** | ST-31…34, IN-18…20 |
| 7 | Pass or fail gates, with unlockable progression and an audit trail | ST-34, AD-23, AD-24 |
| 8 | Know your standing before it's terminal; defer without penalty | ST-39, ST-40, AI-03 |
| 9 | Graduate with a verifiable, evidence-backed credential | ST-48, ST-49, AI-16 |

Everything else makes Cohort 1 **better**. Only these nine make it **possible**.
