# PRD — "Programming from Zero" on-ramp + beginner routing

**Status:** Draft — one open decision (routing mechanism, see Implementation Decisions §3)
**Author:** Drafted 2026-07-27 from a design grilling session
**Related:** Module 0 rollout (all 10 technical courses); early-cohort activation review

> Note: this document is in a public repository. Cohort figures are deliberately
> omitted — see the team's private metrics for the numbers behind the activation
> findings referenced here.

---

## Problem Statement

I am a student who wants to become an AI engineer, a computer vision engineer, or a
security engineer. I have never written code, or I have written a little and stopped.
The site tells me it will take me "from scratch" to job-ready, so I take the free
3-minute skill check, pick Computer Vision, and enrol.

I land on Module 0, which is called "Foundations". The first three lessons make sense —
images are grids of numbers, vectors have direction, filters detect edges. I feel like
this is working.

Then lesson 4 opens with `import numpy as np`, tells me to slice an array with
`img[10:20, 30:40]`, and warns me about `uint8` overflow. Nobody has told me what a
variable is, what a library is, or how to run a Python file. Lesson 5 assumes I have a
terminal open and know what Git is. Module 1 assumes I am fluent.

I do not know whether I am stupid, whether I picked the wrong course, or whether I
missed a prerequisite page somewhere. There is no course in the catalogue that teaches
me the thing I am missing, and nothing in the product ever told me I would need it. So
I close the tab, and I do not come back.

## Solution

Two changes, which together make the from-zero path real instead of implied.

**1. A "Programming from Zero" course** — one shared 6-week, no-prior-knowledge track
that teaches the exact skills every technical Module 0 already assumes: Python
fundamentals, running code, the terminal, Git, and enough NumPy array thinking to
survive the CV and ML foundations. It is built once and every technical course points
at it, rather than each course re-teaching Python inside its own Module 0.

**2. Honest placement** — before a beginner enrols in a technical track, the product
asks whether they have written code before, and if they have not, it *recommends*
starting with the on-ramp — with a visible "skip ahead, I'll dive in" link. It is a
signpost, never a locked gate. Module 0 keeps doing what it is genuinely good at (a
~3-hour refresher for people who already code) and now says so honestly.

The learner outcome: a true beginner is told, before they invest, where to start; they
finish a course designed for their actual level; and they arrive at Module 0 able to
read it.

## User Stories

1. As a student who has never written code, I want to be asked about my coding
   experience before I enrol, so that I am placed somewhere I can actually succeed.
2. As a student who has never written code, I want a course that starts at "what is a
   variable", so that I am not expected to already know Python.
3. As a student who has never written code, I want the recommendation to be a
   suggestion rather than a lock, so that I can still choose to dive into the hard
   track if I want to.
4. As a student considering Computer Vision, I want to know before enrolling that
   Module 0 assumes prior coding, so that I can make an informed choice.
5. As a student in the on-ramp, I want each lesson to build on the last with no
   unexplained jumps, so that I never hit a wall I cannot diagnose.
6. As a student in the on-ramp, I want to write and run real code from lesson one, so
   that I am building the skill, not reading about it.
7. As a student in the on-ramp, I want to learn the terminal, so that Cybersecurity
   Module 0 lesson 1 is readable when I get there.
8. As a student in the on-ramp, I want to learn Git basics, so that the "…& Git" lesson
   that ends every technical Module 0 makes sense.
9. As a student in the on-ramp, I want an introduction to NumPy arrays, so that the CV
   and ML Module 0 lessons do not ambush me with array slicing.
10. As a student finishing the on-ramp, I want to be told explicitly which courses I am
    now ready for, so that I know what to do next.
11. As a student finishing the on-ramp, I want a direct link into my chosen technical
    track, so that I do not have to re-navigate the catalogue.
12. As a student who chose a technical track first, I want to be able to drop back to
    the on-ramp when I get stuck, so that stalling does not mean quitting.
13. As an experienced developer exploring a new field, I want to skip the on-ramp
    without friction, so that I am not condescended to.
14. As an experienced developer, I want the prerequisite question to be one tap, so
    that it does not slow my signup.
15. As a returning student, I want to see which on-ramp lessons I have completed, so
    that I can resume where I left off.
16. As a student mid-course, I want to reopen any completed lesson, so that I can
    revise a concept I have forgotten.
17. As a student, I want the on-ramp to appear in my dashboard roadmap like any other
    course, so that the experience is consistent.
18. As a student, I want the on-ramp to be free to start, so that the barrier to
    beginning is the same as every other track.
19. As a student on a phone, I want the on-ramp lessons to be readable and the
    exercises tappable, so that I can learn on the device I actually own.
20. As a student, I want the on-ramp exercises graded by Nova like every other course,
    so that I get feedback rather than just reading.
21. As a student who answers "a little" coding experience, I want a recommendation that
    reflects partial knowledge, so that I am not sent back to absolute basics
    unnecessarily.
22. As a student, I want the on-ramp's promised length stated up front, so that I can
    judge whether I have time for it.
23. As a course author, I want the on-ramp's exit bar to be explicitly the entry bar of
    Module 0, so that the boundary between the two courses is unambiguous.
24. As a course author, I want one on-ramp shared by all technical tracks, so that I
    maintain Python teaching in one place rather than eight.
25. As the founder, I want to know how many signups report zero coding experience, so
    that I can size the beginner market I am actually attracting.
26. As the founder, I want to see completion rates for the on-ramp separately from the
    technical tracks, so that I can tell whether the on-ramp fixes activation.
27. As the founder, I want to know how many students who finish the on-ramp go on to
    start a technical course, so that I can measure whether the bridge works.
28. As the founder, I want Module 0's prerequisite stated on the course page, so that
    the product stops promising something it does not deliver.
29. As a support person, I want a clear answer to "I can't follow Module 0", so that I
    can point a struggling student somewhere useful.
30. As a student, I want the on-ramp to use the same lesson format as the rest of the
    platform, so that nothing about it feels second-class.

## Implementation Decisions

### 1. Module 0 stays a refresher; the on-ramp is a separate course

**Decided.** Module 0 is not rewritten. Across the 10 technical courses it is
consistently 5 lessons of roughly 35 minutes (~3 hours). Eight of the ten average
3,200–4,200 characters of theory per lesson; `agentic-ai` (~7,577) and `data-science`
(~7,084) were built to a deeper bar and are not part of this problem. Module 0's actual
job is a fast refresher for someone with prior coding exposure, and it does that job
well — the Cybersecurity Linux CLI lesson in particular teaches cleanly from a low base.

Rewriting Module 0 to teach Python from zero would duplicate the same Python material
across eight courses and triple Module 0's length. Rejected in favour of a single
shared on-ramp.

### 2. On-ramp scope: exit bar = Module 0 entry bar

**Decided.** 6 week-modules × 3 lessons = 18 lessons, matching the format used for the
three courses shipped this week (AI for Operations, AI for Project Managers, AI for
Students). Content scope is derived backwards from what technical Module 0 lessons
actually assume:

- Python fundamentals — variables, types, control flow, functions, lists and dicts
- Running code — scripts, imports, installing packages, virtual environments
- The terminal — navigation, files, pipes (the base Cybersecurity Module 0 assumes)
- Git — clone, commit, push (every technical Module 0 ends with a Git lesson)
- NumPy array thinking — shape, indexing, slicing, vectorised operations (the exact
  cliff in CV Module 0 lesson 4 and ML Module 0)

Explicitly *not* included: OOP, data structures, algorithmic complexity. Big-O is
already taught in the Artificial Intelligence Module 0, and including it here would
create overlap and push the course past the point beginners finish.

### 3. Routing mechanism — OPEN

**Not yet decided.** This is the one open decision in this PRD and should be resolved
before build.

The current router cannot detect the problem. `scoreDiagnostic` in the diagnostic module
grades five *subject-knowledge* questions into a Novice→Expert band; nothing anywhere
asks whether the student can code. A total beginner and a working developer who simply
does not know computer vision are routed identically, both tagged
`assessment_level: "beginner"`.

Recommended option: add a single self-report question ("Have you written code before?"
— Never / A little / Yes, comfortably) to the diagnostic flow. "Never" and "A little"
produce a *recommendation* to start with the on-ramp, always accompanied by a visible
skip link. The answer is also stored as a cohort signal that is not currently captured.

Rejected alternative: inferring from the Novice band, because it conflates not knowing
the subject with not being able to program, and would misroute experienced developers
exploring a new field.

Design constraint that applies whichever option wins: **this must be a recommendation,
never a gate.** Activation is already the platform's weakest metric; a door that tells
a new signup they are not ready would make it worse.

### 4. Course delivery uses the established content pipeline

The on-ramp is authored with the same pipeline proven on three courses this week: a
SPEC contract defining the per-lesson deliverable, one authoring agent per week
producing a week JSON, a gate script validating every lesson before generation, CTE SQL
per lesson, and a sequential insert with post-insert database verification. Per-lesson
shape matches the platform house formula: 12 exercises (5 MCQ at 2 marks, 5 short
answer at 3 marks, 2 Nova-graded Prompt Labs at 5 marks), 4 learning objectives, and a
real dated case study.

Two deviations from the no-code course spec, specific to this course being about code:

- Exercises must include runnable code reading and writing, not only prose. The
  `exercises` table already carries `starter_code`, `solution_code` and `language`.
  **Note:** the grading path reads `correct_answer`, not `solution_code` — any code
  answer must be carried in `correct_answer` or it will be invisible to grading. This
  is a known platform trap that previously caused a Computer Vision grading bug.
- The Prompt Lab slot is retained but reframed: the learner writes the prompt they
  would send an assistant to help them debug or explain code, which is a genuine
  beginner skill and consistent with the platform's AI-native positioning.

### 5. Course placement in the catalogue

The on-ramp is a technical-lane course, not a work-lane course — it must not be added
to the work-lane slug set, or it will render in the "AI for your work — no code" lane,
which would be actively misleading given it is entirely about writing code.

Module 0 of each technical course gains an explicit prerequisite statement, and the
course pages surface a link to the on-ramp for students who need it.

### 6. Progression rules should be unified while this work is done

The rule set governing what a student may open (Module 0 always available, any module
at or before the one reached stays open, only what is ahead is locked) is currently
implemented twice — once in the course detail page and once in the dashboard roadmap
component. They agree today because the second was written to match the first, but
nothing enforces that. Lifting the rule into a single shared pure module removes the
drift risk and gives the tests one target instead of two.

## Testing Decisions

### What makes a good test here

Tests should assert externally observable behaviour — "a student who has never coded is
recommended the on-ramp", "a completed lesson can still be opened" — not internal
structure. No test should assert on component markup, class names, or the shape of an
intermediate object.

### Seams

**Preferred seam (one, pure, existing-module):** the routing and progression rules
should be exposed as pure functions in the existing `lib/` layer — input is the
student's self-reported experience, their chosen course, and their completion state;
output is the recommendation and the set of reachable lessons. This is the highest seam
available: no database, no browser, no React. Both the diagnostic flow and the dashboard
consume the same functions, so one set of tests covers both surfaces.

This *reduces* the number of seams rather than adding one, because it collapses the
currently-duplicated progression rule (course page + dashboard roadmap) into a single
target.

**Content seam (already exists, reuse):** the gate script pattern used for the three
courses shipped this week validates every lesson's shape — exercise counts and types,
marks, MCQ correct-option position, option balance, theory length bounds, learning
objective count, case-study presence and brand uniqueness — before any SQL is
generated. The on-ramp uses the same gate, extended with the code-specific rule that a
code exercise must carry its answer in the grading-visible field.

**Database seam (already exists, reuse):** post-insert verification queries asserting
lesson count, exercise mix, per-lesson exercise count, theory length bounds and no null
case studies. This pattern caught nothing but proved everything on the last three
course inserts, including one partially-failed insert that was detected and repaired.

### Prior art

- The content gate script and post-insert verification queries used for AI for
  Operations, AI for Project Managers, and AI for Students.
- The progression-rule checks written against the dashboard roadmap, which cover
  Module 0 availability, unlocking the next module, and reviewability of completed
  content.

### Blocker to resolve before writing tests

**This repository has no test runner installed.** There is no `jest`, `vitest`, or test
script in `package.json`, and no runner config. The existing dashboard test file imports
`@jest/globals`, which is not a dependency — meaning it has never executed. Test files
in this repo are currently documentation, not verification.

A decision is required: either add a runner (Vitest is the lighter fit for this Next.js
setup) and make the existing inert test files real, or continue the current practice of
verifying pure rules by executing them directly and be explicit that the `__tests__`
files are specifications rather than tests. Recommended: add Vitest, because this
feature's whole value depends on routing rules being correct, and those rules are pure
functions — the cheapest possible thing to test properly.

## Out of Scope

- Rewriting Module 0 for any course. Module 0 keeps its current content and length; only
  its stated prerequisite changes.
- Deepening the two Module 0s that are already at the higher bar (`agentic-ai`,
  `data-science`).
- Any change to the paid/free access model. The on-ramp follows whatever the platform
  default is for a beginner course.
- OOP, data structures, and algorithmic complexity teaching — deliberately excluded from
  the on-ramp scope (see Implementation Decisions §2).
- A separate no-code beginner path. The work lane already serves non-programmers who do
  not want to code at all; this on-ramp is for people who *do* want to code.
- Certificates or portfolio artefacts for the on-ramp. It is a bridge, not a
  credential-bearing track.
- Retrofitting existing enrolled students into the on-ramp automatically. Any outreach
  to already-stalled students is a separate decision.

## Further Notes

### This is a hypothesis, not a validated diagnosis

The Module 0 gap is established from the content itself and is not in doubt: the
Computer Vision Python lesson genuinely opens at `import numpy as np` with no
programming grounding anywhere before it, and no programming-fundamentals course exists
in the catalogue. What is *not* established is that this is the cause of the activation
problem.

Before committing to an 18-lesson build, the cheap validating check is the existing
completion data: of the students who stalled, where in the lesson sequence did they
stop? If they never opened lesson 1, this is a motivation or onboarding problem and the
on-ramp will not fix it. If they cleared the conceptual Module 0 lessons and died on the
Python or Git one, the hypothesis is confirmed and the build is well-targeted. This
query should be run first.

### Sequencing note

The routing question (§3) is worth resolving before the content build starts, because
the on-ramp's opening lesson should speak directly to how the student arrived — a
student who was recommended in after answering "never coded" needs a different first
paragraph from one who found it in the catalogue.

### Known platform traps that apply to this build

- Exercise answers must live in the grading-visible field; content placed only in
  `solution_code` is invisible to the grader.
- Parallel authoring agents converge on the same case studies and must be deduplicated
  after the fact, including against case studies already used by other courses.
- Adding a course to the work-lane slug set puts it in the no-code lane; this course
  must not be added there.
