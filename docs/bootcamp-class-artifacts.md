# From Class to Knowledge — Notes, Flashcards, Mind Maps, Q&A

**Date:** 2026-08-16
**Companion to:** `docs/bootcamp-classroom.md`
**Scope:** Turning every live class into durable study artifacts — and the thesis that makes it more than a feature.

---

## 1. The thesis: the class should compound

A traditional classroom is **lossy**. The teacher speaks for 90 minutes, twenty people absorb maybe a third of it, someone posts a recording nobody opens, and the value decays to near zero within a week. Every cohort starts from scratch. The best twelve minutes that instructor has ever taught are gone the moment the meeting ends.

Three inversions turn that around. Square 1 is already most of the way through the first two.

**1. The unit of progress is proof, not consumption.**
You already do this: gates, withheld answer keys, CI contract tests, evidence-backed credentials. Students advance by *proving*, not by sitting through weeks. Built.

**2. The teacher is amplified, not replaced.**
Nova doesn't substitute for the instructor. It extends the half-life of what the instructor said. The same 90 minutes reaches 20 students live, then becomes study artifacts for those 20, then becomes curriculum for everyone who follows. Partly built.

**3. The class doesn't end — it becomes substrate.**
This is the new one, and it's what this document builds. Every class becomes: a searchable transcript, chapters, ten short notes, a deck of flashcards in your spaced-repetition queue, a mind map, a Q&A set, Nova's memory of what your instructor actually taught you — and, for the best moments, a clip promoted permanently into the async course.

**Cohort 7 learns from Cohort 1's best twelve minutes.** That is the compounding loop, and it is the honest version of "redefining the classroom": not a better video call, but a classroom whose output is *knowledge infrastructure* rather than attendance.

**The honest caveat.** Architecture doesn't redefine anything on its own — outcomes do. The claim becomes true the day an employer accepts your evidence-backed credential in place of a degree. Everything in these four documents is in service of that one event. Until it happens, you have a markedly better classroom, not a redefined one. Build toward the proof, and let the outcomes page make the claim for you.

---

## 2. You have almost all the machinery already

| Need | Exists |
|---|---|
| Flashcard generation from text | `app/api/notes/generate-flashcards/route.ts` — `concept` + `code` modes, JSON parsing with fallbacks, budget + rate limiting |
| Spaced repetition | `lib/srs.ts` (SM-2-lite), `study_notes` carries `ease_factor` / `interval_days` / `review_count` / `next_review_at` |
| Review UI + due count | `/notes`, `/api/notes/review`, dashboard due-flashcard card |
| Short-notes surface | `/notes/cheatsheet` |
| Mind-map rendering | `components/ui/mermaid-diagram.tsx` (mermaid 11.15 supports `mindmap`) |
| Auto-seeding cards on completion | `app/api/learn/complete/route.ts` already seeds cards |
| Cheap inference with guardrails | `callAI` + `lib/ai/budget` (Groq/DeepInfra) |
| Transcript source | `recording_transcripts` (from `docs/bootcamp-classroom.md`) |

**So this is not a new subsystem.** It is: one new source (the class transcript), one verification gate, and a cohort-shared tier on top of the personal decks you already have.

---

## 3. The hard part is grounding, not generation

Generating flashcards from an authored lesson is safe — the source is canonical text you wrote. Generating from a **class transcript is not**, for three reasons:

1. **ASR errors on technical terms.** Zoom's transcription mangles jargon, and it mangles it *worse* with non-native accents — which is precisely your global cohort. "gradient descent" → "great in dissent". "ReLU" → "real you". "Bayes" → "base".
2. **Instructors misspeak, then self-correct.** A chunk-level extract keeps the error and drops the correction ten seconds later.
3. **A wrong card is worse than no card.** It enters spaced repetition and gets *drilled* on a schedule. You would be paying compute to install a misconception, then reinforcing it for months.

### Four mitigations — all cheap, all using assets you already own

**A. Glossary injection.** Pass that week's lesson key terms into the generation prompt so the model can repair ASR damage. You own the canonical curriculum; almost nobody generating from transcripts has ground truth sitting next to the audio.

**B. Curriculum cross-check.** Every generated card is checked against the authored lesson content for that week. A card that *contradicts* the curriculum is flagged and withheld, never published. This is the same discipline as your verify-and-gen gate — and it's a verification only you can perform.

**C. Mandatory citation.** Every artifact carries `recording_id` + `start_sec`. The student can jump to the exact moment and hear it said. **If a claim can't be cited to a timestamp, the card is dropped.** Same contract as `lib/career/verified-profile.ts`: nothing asserted that isn't backed by a real artifact.

**D. Two tiers, honestly labelled.**

| Tier | Who sees it | Review | Enters SRS |
|---|---|---|---|
| **Personal** | Just that student | None | Yes, private deck, badged *"auto-generated from class audio — may contain errors"* |
| **Cohort-official** | Whole cohort | Instructor approved | Yes, shared deck |

**Instructor approval must be one screen and five minutes**: twelve cards, each with its timestamp, approve / edit / reject. That single screen is the entire difference between a credible feature and a gimmick that quietly teaches people wrong things.

---

## 4. The four artifacts

Generated in the C2 transcript step of the classroom pipeline.

**1. Short notes — "this class in 10 bullets."**
One pass over the whole transcript. Each bullet cites a timestamp. Surfaces in the existing `/notes/cheatsheet` pattern, scoped to the session.

**2. Flashcards.**
Per chapter, not per class — chapter-level grounding keeps each card near its source and makes citation exact. Reuse the existing `concept` / `code` modes verbatim; the `code` mode's cloze and predict-output styles are ideal for live-coding segments.

**3. Mind map.**
One per class: central topic → 4–6 branches → leaves, emitted as mermaid `mindmap` source and stored as text. Rendered by the component you already have. **Sanitise before rendering** — mermaid's mindmap parser breaks on parentheses, quotes and colons in node labels, and a malformed diagram throws rather than degrading.

**4. Q&A — and keep the two kinds separate.**

| Kind | Source | Value |
|---|---|---|
| **Asked in class** | `session_questions` (real students, real confusions, timestamped) | Highest. This is ground truth about what people actually didn't understand. |
| **Generated comprehension** | Model, from the transcript | Practice. Clearly labelled as generated. |

Never merge them into one list. The questions twenty people actually asked are a signal about your curriculum — feed them to `/desk` so an instructor can see "eleven people were confused about the same thing in week 9" and fix the *lesson*, not just answer the question.

**Plus: Nova gets class-aware.** Fold the class summary into `students.memory` so the tutor can reference what the instructor taught this cohort, with a timestamp. Best-effort, consistent with how Nova memory is already written.

---

## 5. Implementation

### 5.1 Extend, don't duplicate

`app/api/notes/generate-flashcards/route.ts` already accepts `text` or `sourceNoteId`. **Add a third source** rather than writing a parallel route:

```ts
const schema = z.object({
  sourceNoteId: z.string().uuid().optional(),
  sourceRecordingId: z.string().uuid().optional(),   // NEW
  chapterId: z.string().uuid().optional(),           // NEW — ground per chapter
  text: z.string().min(1).max(8000).optional(),
  count: z.number().int().min(1).max(10).optional(),
  mode: z.enum(["concept", "code"]).optional(),
});
```

When `sourceRecordingId` is present: verify cohort membership, load the chapter's transcript span, inject the week's glossary, and stamp `source_recording_id` / `source_ts_sec` onto every inserted row.

### 5.2 Schema

```sql
-- Trace every artifact back to a moment in a class
alter table study_notes add column source_recording_id uuid references session_recordings(id);
alter table study_notes add column source_ts_sec int;
alter table study_notes add column cohort_id uuid references bootcamp_cohorts(id);
alter table study_notes add column review_status text default 'personal';
                                        -- personal|pending|approved|rejected

create index on study_notes (source_recording_id) where source_recording_id is not null;

-- Cohort-shared decks: one authored card, many students' SRS state
create table cohort_deck_cards (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references bootcamp_cohorts(id) on delete cascade,
  session_id uuid references bootcamp_sessions(id),
  recording_id uuid references session_recordings(id),
  source_ts_sec int,
  kind text not null,                             -- flashcard|note|qa
  question text not null,
  answer text,
  approved_by uuid,
  approved_at timestamptz,
  curriculum_conflict boolean default false,      -- cross-check flag (§3B)
  created_at timestamptz default now()
);

create table session_mindmaps (
  session_id uuid primary key references bootcamp_sessions(id) on delete cascade,
  mermaid_src text not null,
  generated_at timestamptz default now(),
  edited_by uuid
);
```

**Copy-on-adopt for shared decks:** when a student adds a cohort card to their deck, insert a `study_notes` row referencing it. SRS state is per student and already lives on `study_notes` — don't try to make one row serve twenty learners' schedules.

**RLS:** `cohort_deck_cards` readable by active members of that cohort; `approved_by` / `approved_at` writable by instructors and desk only. Unapproved cards visible only to their generator and desk.

### 5.3 Cost

A 90-minute transcript is roughly 12–15k input tokens. One summary+notes+mindmap pass plus per-chapter card passes is a few cents per class on your OSS stack. At ~96 sessions per cohort this is a rounding error against instructor hours — **generate generously, gate strictly.** The scarce resource here is instructor review attention, not tokens, so design the approval screen for speed.

### 5.4 Implementation note

Per this repo's `AGENTS.md`: **read the relevant guide in `node_modules/next/dist/docs/` before writing route-handler or caching code.** The Next version here diverges from common knowledge, and the code sketches in these design docs are illustrative of *shape*, not verified against the local API surface.

---

## 6. Build order

| # | Deliverable | Size |
|---|---|---|
| **A1** | Transcript → chapters + summary + 10 short notes, all timestamp-cited | 3 days |
| **A2** | Extend `generate-flashcards` with `sourceRecordingId` + glossary injection + citation stamping | 3 days |
| **A3** | Curriculum cross-check + instructor approval screen (the credibility gate) | 4 days |
| **A4** | Cohort shared deck + copy-on-adopt into personal SRS | 3 days |
| **A5** | Mind map generation + sanitiser + render | 2 days |
| **A6** | Q&A: `session_questions` surfacing + generated set, kept separate + desk "top confusions" | 3 days |
| **A7** | Nova class-memory injection | 2 days |

**A3 is not optional and must not ship after A4.** Shared decks without the review gate means one hallucinated card gets drilled into twenty students on a spaced schedule. Personal-tier generation can ship before A3; the cohort tier cannot.

---

## 7. Decisions

1. **Is the cohort deck opt-in per student, or auto-added to everyone's queue?** (Recommend opt-in — an SRS queue someone didn't choose gets abandoned, and abandonment kills the whole SRS habit.)
2. **Can students promote their own cards to the cohort deck, subject to instructor approval?** (Recommend yes — the student who makes the best card is often not the instructor, and it's free content.)
3. **Do class-derived artifacts survive the cohort?** i.e. do approved cards from Cohort 1 seed Cohort 2's deck, and do they eventually merge into the async course? (Recommend yes — this *is* the compounding loop from §1. But it needs a curation step, or by Cohort 5 you have 500 near-duplicate cards.)
