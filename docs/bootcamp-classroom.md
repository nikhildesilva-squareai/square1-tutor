# Cohort Classroom — Recordings & the Student Workspace

**Date:** 2026-08-16
**Companion to:** `docs/bootcamp-roadmap.md`, `docs/bootcamp-live-architecture.md`
**Scope:** What happens after a live class ends — the recording library — and the "Google Classroom"-style cohort workspace around it.

---

## 1. Do not build Google Classroom

Google Classroom is a **file-and-announcement distribution tool** for schools that have no grading intelligence. Rebuilding it feature-for-feature would *downgrade* what you already ship. Be precise about what's genuinely missing.

### Already built — do not rebuild

| Classroom feature | You already have something stronger |
|---|---|
| Materials / resources | 736 lessons, 3,449 author takeaways, case studies, hosted starter kits |
| Assignments | `projects` with `schedule_week`, rolling per-learner deadlines |
| Rubrics | `projects.rubric` + weighted criteria |
| Grading | AI rubric review **plus** objective withheld-key gates and CI contract tests — Classroom has no equivalent at all |
| Student gradebook | Competency radar, skill report, role-readiness |
| Class feed / comments | `community_posts` + attachments + community chat + DMs |
| Due-date calendar | `lib/schedule.ts` |
| Email notifications | Resend + `lib/email/jobs.ts` |
| Live class link | Zoom Meeting SDK (see live architecture doc) |
| Teacher view | `/desk` |

### Genuinely missing — this is the build list

1. **Recording library** — the explicit ask. Nothing exists.
2. **Cohort-scoped stream** — your community feed is platform-wide (`community_posts` RLS gates on "is authenticated", deliberately). A cohort needs its own space with instructor authority and pinning.
3. **Threaded feedback on a submission** — today grading is one-shot AI output. There is no way for an instructor and a student to have a *conversation* about a submission. For a paid bootcamp this is the single most-felt gap.
4. **Instructor gradebook** — one grid: 20 students × 6 gates × attendance × standing.
5. **Roster / People** — who's in my cohort, who's my squad, who's my mentor.
6. **Session materials** — the slides, the repo, the links from *this* class.
7. **Live Q&A capture → answered after.**
8. **Cohort digest** — scoped weekly email.

Seven of those eight are small. The recording library is the real engineering.

---

## 2. Recording architecture

### 2.1 The pipeline

```
Zoom cloud recording finishes
   │
   ▼  recording.completed webhook  (payload.object.recording_files[], payload.download_token)
POST /api/zoom/webhook
   │  verify signature → dedupe via zoom_webhook_events → 200 fast
   ▼  enqueue ingest job (do NOT do this inline — the webhook must return in seconds)
/api/cron/ingest-recording
   │
   ├── download MP4 via download_url + download_token (24h validity)
   ├── download VTT transcript (file_type: TRANSCRIPT)
   ├── upload to Cloudflare Stream → transcode → HLS + thumbnail
   ├── AI pass (Groq/DeepInfra — cheap, already wired): chapters + summary
   └── write session_recordings / recording_chapters / recording_transcripts
   │
   ▼
/bootcamp/sessions/[id]  ← student watches, position saved, attendance credited
```

### 2.2 Ingest to your own storage — from day one, not later

Tempting shortcut: just embed Zoom's `play_url`. **Don't rely on it.**

- Zoom's cloud-recording storage allowance is **small**, and a 24-week cohort at ~4 sessions/week × 90 min is roughly **150 hours of video per cohort**. You will blow through the allowance in the first two months.
- Zoom retention policies **auto-delete** recordings. A student's week-3 recording disappearing in month 5 is a support disaster and, for viva recordings attached to a credential, an integrity problem.
- The `download_token` in the webhook is valid ~24h. Grab the asset while you have it.

**Store the recording yourself. The Zoom `play_url` is your fallback, not your library.**

### 2.3 Delivery — adaptive bitrate is non-negotiable for a global cohort

This connects directly to the timezone/global section of the live architecture doc. A raw MP4 served from object storage to a student in Nairobi or Dhaka on a weak connection is unwatchable. You need HLS with multiple renditions.

| Option | Verdict |
|---|---|
| **Cloudflare Stream** | ✅ Recommended. Transcode + HLS + player + storage in one product, priced per minute stored and delivered. Simplest correct answer. |
| **Bunny Stream** | Cheaper, very capable. Worth a look if Stream's per-minute pricing bites at scale. |
| **Mux** | Best analytics and DX, premium price. |
| **R2 / Supabase Storage + raw MP4** | ❌ No transcoding. Cheapest and worst — actively hostile to your low-bandwidth markets. |

**Verify current pricing directly before committing** — video costs scale with cohorts and are the one line item that can surprise you.

### 2.4 The transcript is the most valuable artifact

Zoom's cloud recording produces a VTT transcript (requires "audio transcript" enabled on the account). It is worth more than the video:

- **Search across every class.** "Where did she explain class imbalance?" → week 9, 34:12.
- **Auto-chapters and a summary** — one cheap inference call per recording on your existing OSS stack.
- **Accessibility** for non-native English speakers across your bands.
- **Nova becomes class-aware.** This is the feature no competitor has: your AI tutor can cite what the human instructor actually said in your cohort's class, at a timestamp. It closes the loop between the live product and the async product.

Start with Postgres full-text search over transcript text. Add pgvector embeddings later only if FTS proves insufficient — don't start there.

### 2.5 Two compounding features worth building early

**"You missed it" digest.** For anyone who didn't attend live, an automated email within ~2 hours: AI summary of the class, the three questions that were asked, chapter links with timestamps, and what's due. Cheap on your existing inference, and it is *the* retention mechanic for a cohort spread across timezones.

**Clip → lesson.** The instructor marks a 2-minute stretch of a class ("this is the best explanation of overfitting I've ever given") and it attaches permanently to that lesson in the async curriculum. **Every cohort then makes the self-paced course better.** Live teaching stops being a cost centre and becomes a content engine — the same 250 instructor hours produce a durable asset instead of evaporating.

### 2.6 Watch tracking earns attendance credit

`recording_views` gives you three things at once: resume-where-you-left-off, an instructor signal ("6 of 20 have watched week 9"), and the evidence for the **0.5 weighted attendance credit** defined in the live architecture doc. Credit requires ≥80% watched **and** the paired async artifact — otherwise it's a checkbox, not attendance.

### 2.7 Privacy

- Viva recordings default to `visibility='student'` — the student, their mentor, and desk. Surfacing on `/verify` is **opt-in and revocable**.
- Class recordings default to `visibility='cohort'` and expire per `expires_at`.
- Consent captured at enrolment; deletion on request must actually delete from Cloudflare Stream, not just flip a flag.

---

## 3. The cohort workspace

`/(app)/bootcamp` — a student belongs to one active cohort, so resolve it from their `bootcamp_enrollments` rather than putting a cohort ID in the URL.

| Tab | Contents |
|---|---|
| **Overview** | This week, next deadline, next live session, gate rail, squad, standing (the command centre from the main roadmap) |
| **Stream** | Instructor announcements (pinned) + cohort discussion |
| **Classwork** | Week-by-week: lessons, the project, due date, gate status, materials |
| **Sessions** | Upcoming (join button) + **past (recordings, chapters, transcript search)** |
| **Squad** | Your 4, their open PRs, reviews you owe |
| **Grades** | Your gate results, rubric breakdowns, attendance, standing |
| **People** | Roster, instructors, mentors |

**Desk** — `/desk/bootcamp/[cohortId]`: Gradebook grid · Roster & standing · Sessions & recordings · Announcements · Review queue · At-risk list.

### The one Classroom feature you must copy properly

**Private comments on a submission.** In Classroom this is the quiet workhorse — a threaded, private conversation between teacher and student attached to the work itself. Your grading is currently one-shot AI output with no reply path. For a paid bootcamp with a human instructor, that conversation *is* the product. Build it as a first-class thread on `project_submissions`, with the AI review as the opening message and the human instructor's sign-off as part of the same thread.

---

## 4. Schema

```sql
-- ── Recordings ───────────────────────────────────────────────────────────────
alter table session_recordings add column ingest_status text default 'pending';
                                        -- pending|downloading|transcoding|ready|failed
alter table session_recordings add column stream_uid text;      -- Cloudflare Stream UID
alter table session_recordings add column hls_url text;
alter table session_recordings add column thumbnail_url text;
alter table session_recordings add column summary_md text;
alter table session_recordings add column zoom_play_url text;   -- fallback only

create table recording_chapters (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references session_recordings(id) on delete cascade,
  start_sec int not null,
  title text not null,
  source text not null default 'ai',            -- ai|instructor
  order_index int not null
);

create table recording_transcripts (
  recording_id uuid primary key references session_recordings(id) on delete cascade,
  vtt_url text,
  text text not null,
  search_tsv tsvector generated always as (to_tsvector('english', text)) stored,
  created_at timestamptz default now()
);
create index on recording_transcripts using gin (search_tsv);

create table recording_views (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references session_recordings(id) on delete cascade,
  bootcamp_enrollment_id uuid not null references bootcamp_enrollments(id),
  watched_seconds int not null default 0,
  last_position_sec int not null default 0,
  completed_at timestamptz,                     -- set at >=80% watched
  updated_at timestamptz default now(),
  unique (recording_id, bootcamp_enrollment_id)
);

-- Instructor-marked clip promoted into the async curriculum
create table recording_clips (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references session_recordings(id) on delete cascade,
  lesson_id uuid references lessons(id),        -- where it surfaces
  start_sec int not null,
  end_sec int not null,
  title text not null,
  published boolean default false
);

-- ── Cohort workspace ─────────────────────────────────────────────────────────
create table cohort_announcements (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references bootcamp_cohorts(id) on delete cascade,
  author_id uuid not null,                      -- instructor/mentor
  title text,
  body_md text not null,
  pinned boolean default false,
  notify boolean default true,                  -- triggers the digest/email
  published_at timestamptz default now(),
  deleted_at timestamptz
);

create table session_materials (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references bootcamp_sessions(id) on delete cascade,
  kind text not null,                           -- slides|repo|link|file|dataset
  title text not null,
  url text not null,
  order_index int not null default 0
);

create table session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references bootcamp_sessions(id) on delete cascade,
  asked_by uuid references bootcamp_enrollments(id),
  question text not null,
  asked_at_sec int,                             -- timestamp in the recording
  answer_md text,
  answered_by uuid,
  answered_at timestamptz
);

-- ── The missing feedback conversation ────────────────────────────────────────
create table submission_comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references project_submissions(id) on delete cascade,
  author_kind text not null,                    -- ai|instructor|student
  author_id uuid,
  body_md text not null,
  created_at timestamptz default now(),
  deleted_at timestamptz
);
create index on submission_comments (submission_id, created_at);
```

**RLS:**
- `recording_views` — student writes own row only. It feeds an attendance gate, so a student who can write another's row (or an arbitrary `watched_seconds`) can inflate attendance. Clamp `watched_seconds` server-side against wall-clock; never trust a client-reported total.
- `session_recordings` — reads gated on active membership of that cohort. Viva recordings (`visibility='student'`) restricted to owner + mentor + desk.
- `cohort_announcements` / `session_materials` / `session_questions.answer_md` — writes restricted to instructors and desk.
- `submission_comments` — visible only to the submission's owner, their mentor, and desk. This is private feedback, not a public thread.

---

## 5. Build order

Slots after L2 (attendance & recordings) in the live architecture plan.

| # | Deliverable | Size |
|---|---|---|
| **C1** | Ingest job: webhook → queue → download → Cloudflare Stream → `session_recordings.ready`. Player page with resume. | 1 week |
| **C2** | Transcript ingest + FTS search across the cohort's recordings + AI chapters & summary. | 4 days |
| **C3** | `recording_views` tracking + the 0.5 attendance credit + instructor "who's watched" view. | 3 days |
| **C4** | Cohort **Stream** (announcements, pinning, notify) + **People** roster. | 4 days |
| **C5** | **`submission_comments`** — threaded private feedback, AI review as the opening message, instructor sign-off in-thread. | 4 days |
| **C6** | Desk **Gradebook** grid (20 × gates × attendance × standing) + CSV export. | 4 days |
| **C7** | "You missed it" digest email + weekly cohort digest. | 3 days |
| **C8** | Session materials + live Q&A capture → answered-after. | 3 days |
| **C9** | **Clip → lesson** promotion pipeline. | 4 days |

C1–C3 are the recording ask and must land before Cohort 1's second week. C5 is the highest-value non-recording item — do not let it slip behind C6.

---

## 6. Decisions

1. **Cloudflare Stream, Bunny, or Mux?** (Recommend Cloudflare Stream — one product, adaptive bitrate, simplest.)
2. **Recording retention** — how long after a cohort ends do class recordings stay? (Recommend cohort end + 12 months; vivas longer, since they back a credential.)
3. **Does the cohort Stream reuse `community_posts` scoped by cohort, or a new table?** (Recommend a new `cohort_announcements` for instructor authority + pinning, and let general chatter live in the existing community — don't fork the feed.)
4. **Do recordings stay available to a student who withdraws or defers?** Affects refund conversations and RLS.
