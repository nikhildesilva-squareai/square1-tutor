# Live Bootcamp — Video Architecture & Integration

**Date:** 2026-08-16
**Companion to:** `docs/bootcamp-roadmap.md`
**Scope:** How live 1-1 and live 20-student classes work, which video platform, and exactly how it plugs into square1ai.com.

---

## 1. The recommendation, up front

**Use the Zoom Meeting SDK (Component View) for both formats in v1.** Not the Video SDK.

Five reasons, in order of weight:

1. **Breakout rooms.** Your 20-student class is built around squads of 4. Meeting SDK gives you breakout rooms — including programmatic control, so you can push your `bootcamp_squads` rows straight into Zoom rooms. **The Video SDK has no breakout rooms.** You would build session-splitting, re-joining, and instructor rotation yourself. That single feature decides it.
2. **There is a fallback when it breaks.** A live class with 20 people waiting cannot fail. With Meeting SDK you also hold a real `join_url` — if the embed dies on someone's corporate network or ad-blocked browser, they click through to the Zoom client and class continues. **Video SDK has no fallback**: your custom UI *is* the product, and if it breaks, the class doesn't happen.
3. **Zero instructor training.** Your instructors already know Zoom's controls — mute, spotlight, share, annotate, record, breakouts. With Video SDK you rebuild every one of those and then teach them.
4. **Attendance and recordings come free.** `meeting.participant_joined` / `participant_left` webhooks give objectively verifiable attendance. `recording.completed` gives you a recording tied to a meeting ID you already mapped to a session and a student. No media pipeline to own.
5. **You get chat, reactions, hand-raise, screen share, whiteboard, waiting room, spotlight** without writing any of it.

**Where Video SDK would win:** a fully white-labelled product where Zoom is invisible, or video embedded *inside* the lesson player as a component with your own layout. Neither is v1. Revisit it only for a specific later feature — instant drop-in "office hours" rooms where scheduling overhead is the problem (Video SDK sessions are ad-hoc: `topic` is any string you choose, no pre-created meeting needed).

**Do not run both SDKs.** Two auth models, two sets of failure modes, one small team.

### The one alternative worth a 2-day spike

| Platform | Take |
|---|---|
| **Zoom Meeting SDK** | ✅ Recommended. Brand trust, breakout rooms, familiar UI, real fallback, mature webhooks. Cost: it looks like Zoom inside your app. |
| **Daily.co** | The serious alternative. Best embedding DX (`@daily-co/daily-react`), prebuilt UI you can restyle heavily, recordings straight to your S3, breakouts in prebuilt. Choose it **only if** brand control matters more than familiarity. |
| **LiveKit** | Open source, self-hostable, excellent for custom/agent use. You build all UX incl. breakouts. Wrong shape for a 3-month deadline. |
| **Whereby Embedded** | One `<iframe>`, fastest to ship, least control, weakest data hooks. Fine for a throwaway pilot, wrong to build a product on. |
| **Zoom Video SDK** | Only if you later need invisible-Zoom white label. |

Decision rule: **if you cannot articulate why Zoom's UI inside your app is a problem, use Zoom.** Familiarity is a feature when 20 people join a class at 7pm.

---

## 2. Session architecture — "people want to learn from people"

The video tech is commodity. **The session design is the product.** The single biggest failure mode is using expensive live time to do what your async curriculum already does better.

**Rule: never lecture live.** You have 736 lessons with author takeaways and 43 graded gates. Recorded content is *better* than a live lecture — pausable, re-watchable, already written. Live time is for the things async cannot do.

### Session types

| Type | Duration | Size | Cadence | What it's actually for |
|---|---|---|---|---|
| **Live code review** | 90 min | 20 | Weekly | Instructor opens *real student submissions* and reviews them on screen. This is the flagship. Nothing else teaches taste. |
| **Squad lab** | 60 min | 4 (breakouts) | Weekly | Students build; instructor rotates between rooms. Silence with a mentor nearby beats a lecture. |
| **Office hours** | 60 min | drop-in | Weekly | Queue-based, unblock people. |
| **1-1 mentor session** | 30 min | 1 | Fortnightly | Career, standing, personal blockers. Highest value, highest cost. |
| **Gate viva** | 20 min | 1 | 6× per program | Recorded defence of own code. **This is credential infrastructure, not teaching.** |
| **Demo day** | 2 h | cohort + partners | End | Hiring surface. |

### Two things that make live irreplaceable

**Live debugging of a failure the instructor did not rehearse.** Screen-share a student's actually-broken repo and fix it live, narrating the wrong turns. Students have never seen an expert be confused — that is the thing they cannot get from a recording, and it is what makes them believe they can do it too.

**The viva.** 20 minutes, recorded, defending your own code. It is simultaneously the most human moment in the program and the hardest, most verifiable credential you can issue. Attach the recording to `/verify`.

### Instructor load — this sets your seat count

Per week, one cohort of 20:

| | Hours |
|---|---|
| Live code review | 1.5 |
| Squad lab | 1.0 |
| Office hours | 1.0 |
| 1-1s (20 × 30 min, fortnightly) | 5.0 |
| Gate reviews + async | 2.0 |
| **Total** | **~10.5 h/week** |

Over 24 weeks ≈ **250 instructor hours per cohort**. At $35/h ≈ $8.8k against ~$29.8k revenue (20 × $1,490). Viable — but note **1-1s are half the cost**. If the model gets tight, cut fortnightly 1-1s to gate-triggered 1-1s (6 × 30 min per student) and sell extra 1-1 time as an add-on.

### The 1-1 bootcamp is a different SKU

Weekly 60-min 1-1 × 24 weeks = **24 hours of instructor time per student**. At $50/h that is $1,200 of direct cost before anything else. It cannot be priced near the cohort product.

| SKU | Live format | Indicative price (global) |
|---|---|---|
| **Cohort Bootcamp** | 20-student class + squad labs + fortnightly 1-1 | $1,490 |
| **1-1 Intensive** | Weekly private 1-1 + all cohort sessions | $4,400 |

Apply the same PPP ratio you already use in `lib/pricing.ts` (~⅓ for South Asia) — but as a **new product**, never by editing `REGIONS`. Founding self-paced rates stay untouched for life.

---

## 3. System architecture

```
┌────────────────────────────────────────────────────────────────┐
│  square1ai.com  (Next.js 16 / Vercel)                          │
│                                                                 │
│  /(app)/bootcamp/sessions        calendar + join buttons        │
│  /(app)/bootcamp/live/[id]       ◄── the classroom page         │
│  /(app)/bootcamp/live/[id]/check pre-join device probe          │
│  /(app)/bootcamp/book            1-1 booking                    │
│  /desk/bootcamp/sessions         instructor console             │
│                                                                 │
│  API                                                            │
│  POST /api/zoom/signature   → SDK JWT (server-only secret)      │
│  POST /api/zoom/meetings    → create meeting (S2S OAuth)        │
│  POST /api/zoom/webhook     → attendance + recordings           │
└───────────┬─────────────────────────────────┬──────────────────┘
            │ signature + meetingNumber       │ events
            ▼                                 ▲
   ┌──────────────────┐              ┌────────────────┐
   │  @zoom/meetingsdk│              │   Zoom Cloud   │
   │  Component View  │─────────────►│  meetings +    │
   │  (in a <div>)    │   media      │  cloud recording│
   └──────────────────┘              └────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────────┐
   │ Supabase                                        │
   │  bootcamp_sessions   ← zoom_meeting_id          │
   │  bootcamp_attendance ← from webhooks (objective)│
   │  session_recordings  ← from recording.completed │
   │  session_bookings    ← 1-1s                     │
   │  zoom_webhook_events ← idempotency log          │
   └────────────────────────────────────────────────┘
```

**Auth model — three distinct Zoom credentials, do not mix them up:**

| Purpose | Credential | Where it lives |
|---|---|---|
| Create/update/delete meetings | **Server-to-Server OAuth** (`account_credentials`) | server only |
| Let a browser join an embedded meeting | **Meeting SDK Key + Secret** → signed JWT | secret server-only; signature returned to client |
| Verify incoming events | **Webhook Secret Token** | server only |

---

## 4. Schema additions

Extends the tables in `docs/bootcamp-roadmap.md`.

```sql
-- extend the previously proposed bootcamp_sessions
alter table bootcamp_sessions add column zoom_meeting_id text;
alter table bootcamp_sessions add column zoom_join_url text;      -- the fallback
alter table bootcamp_sessions add column zoom_start_url text;     -- host only, NEVER expose
alter table bootcamp_sessions add column host_id uuid;            -- mentor/instructor
alter table bootcamp_sessions add column status text default 'scheduled';
                                        -- scheduled|live|ended|cancelled

create table mentors (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id),      -- alumni mentors
  name text not null,
  email text not null,
  zoom_user_id text,                            -- Zoom licensed host
  bio_md text,
  hourly_cost_usd numeric,
  active boolean default true
);

create table mentor_availability (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references mentors(id),
  weekday int not null,                          -- 0-6
  start_min int not null,                        -- minutes from midnight, mentor's tz
  end_min int not null,
  timezone text not null
);

create table session_bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references bootcamp_sessions(id),
  mentor_id uuid not null references mentors(id),
  bootcamp_enrollment_id uuid not null references bootcamp_enrollments(id),
  kind text not null,                            -- mentor_1_1|viva|office_hours|remediation
  starts_at timestamptz not null,
  duration_min int not null default 30,
  status text not null default 'booked',         -- booked|completed|no_show|cancelled
  cancelled_at timestamptz,
  notes_md text
);

create table session_recordings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references bootcamp_sessions(id),
  zoom_recording_id text unique,
  play_url text,
  download_url text,
  duration_min int,
  file_size_bytes bigint,
  -- viva recordings attach to a gate result → surfaced on /verify
  gate_result_id uuid references bootcamp_gate_results(id),
  visibility text not null default 'cohort',     -- cohort|student|public
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Idempotency: Zoom retries. Never double-count attendance.
create table zoom_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_ts bigint not null,
  event_type text not null,
  zoom_meeting_id text,
  payload jsonb not null,
  received_at timestamptz default now(),
  unique (event_type, event_ts, zoom_meeting_id)
);
```

**RLS (apply the lessons from the July integrity audit):**
- `bootcamp_sessions.zoom_start_url` must **never** reach a student. Select it only with the service-role client. A leaked start URL lets a student host — and claim-start the meeting.
- `bootcamp_attendance` writes: **service-role only**, written from the webhook. If a student can write attendance, they can forge the attendance component of a gate, exactly like the grade-forging class of bug you fixed on 2026-07-29.
- `session_recordings` with `visibility='student'` (vivas) readable only by that student, their mentor, and desk.

---

## 5. Implementation — the four pieces

### 5.1 Signature endpoint (`app/api/zoom/signature/route.ts`)

The SDK Secret must never reach the browser. Critically: **authorise the join here**, don't just sign whatever meeting number is asked for.

```ts
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { KJUR } from "jsrsasign";

const schema = z.object({ sessionId: z.string().uuid() });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = schema.parse(await request.json());

  // ── Authorisation: is this user actually in this cohort? ──────────────
  // Never sign a signature from a client-supplied meeting number.
  const admin = createAdminClient();
  const { data: session } = await admin
    .from("bootcamp_sessions")
    .select("zoom_meeting_id, cohort_id, host_id")
    .eq("id", sessionId).maybeSingle();
  if (!session?.zoom_meeting_id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: student } = await supabase
    .from("students").select("id").eq("user_id", user.id).maybeSingle();
  const { data: member } = await admin
    .from("bootcamp_enrollments")
    .select("id")
    .eq("cohort_id", session.cohort_id)
    .eq("student_id", student?.id ?? "")
    .in("status", ["active"])
    .maybeSingle();

  const isHost = session.host_id === student?.id;   // resolve mentors separately
  if (!member && !isHost) {
    return NextResponse.json({ error: "Not enrolled in this cohort" }, { status: 403 });
  }

  const role = isHost ? 1 : 0;
  const iat = Math.floor(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;

  const signature = KJUR.jws.JWS.sign(
    "HS256",
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
    JSON.stringify({
      sdkKey: process.env.ZOOM_MEETING_SDK_KEY,
      mn: String(session.zoom_meeting_id).replace(/\D/g, ""),
      role,
      iat, exp, tokenExp: exp,
    }),
    process.env.ZOOM_MEETING_SDK_SECRET!,
  );

  return NextResponse.json({
    signature,
    sdkKey: process.env.ZOOM_MEETING_SDK_KEY,
    meetingNumber: session.zoom_meeting_id,
    role,
  });
}
```

### 5.2 The classroom component

Component View (embeds in a `<div>`) requires **npm `@zoom/meetingsdk`, not the CDN build**. The CDN exports `ZoomMtg` (Client View, full-page, callback API); npm gives you `ZoomMtgEmbedded` (Component View, promise API). You want the latter.

```tsx
"use client";
import { useEffect, useRef, useState } from "react";

export function Classroom({ sessionId, userName, email }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let client: any;
    (async () => {
      // Dynamic import: the SDK touches `window`, so it must never be
      // evaluated during SSR or the build. Next 16 will otherwise fail the
      // route at prerender time.
      const ZoomMtgEmbedded = (await import("@zoom/meetingsdk/embedded")).default;
      client = ZoomMtgEmbedded.createClient();

      await client.init({
        zoomAppRoot: ref.current!,
        language: "en-US",
        patchJsMedia: true,
        // Falls back to a slower non-SharedArrayBuffer path when the page
        // is not cross-origin isolated. See §6.1.
        disableCORP: !window.crossOriginIsolated,
        customize: {
          video: { isResizable: true, viewSizes: { default: { width: 960, height: 540 } } },
        },
      });

      const res = await fetch("/api/zoom/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) { setError("You are not enrolled in this session."); return; }
      const { signature, sdkKey, meetingNumber } = await res.json();

      await client.join({ sdkKey, signature, meetingNumber, password: "", userName, userEmail: email });
    })().catch((e) => setError(e?.message ?? "Could not join"));

    return () => { try { client?.leaveMeeting(); } catch {} };
  }, [sessionId, userName, email]);

  return (
    <>
      {/* isolate: Tailwind preflight breaks Zoom's UI — see §6.2 */}
      <div ref={ref} className="s1-zoom-root" />
      {error && <JoinFallback sessionId={sessionId} message={error} />}
    </>
  );
}
```

`<JoinFallback>` fetches the `join_url` from a server action and renders "Open in Zoom instead" — **build this on day one**, not after the first class fails.

### 5.3 Webhook (`app/api/zoom/webhook/route.ts`) — attendance + recordings

Two things people get wrong here, both fatal:

```ts
import crypto from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  // ① RAW body. Re-serialising the parsed JSON changes key order/whitespace
  //    and the HMAC will never match. Read text() FIRST, parse after.
  const raw = await request.text();
  const signature = request.headers.get("x-zm-signature");
  const timestamp = request.headers.get("x-zm-request-timestamp");
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN!;

  const hash = crypto.createHmac("sha256", secret)
    .update(`v0:${timestamp}:${raw}`).digest("hex");
  if (signature !== `v0=${hash}`) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(raw);

  // ② Zoom validates your endpoint by challenge before it will send events.
  if (body.event === "endpoint.url_validation") {
    const encryptedToken = crypto.createHmac("sha256", secret)
      .update(body.payload.plainToken).digest("hex");
    return NextResponse.json({ plainToken: body.payload.plainToken, encryptedToken });
  }

  const admin = createAdminClient();
  const meetingId = String(body.payload?.object?.id ?? "");

  // Idempotency — Zoom retries on any non-2xx, and duplicates would
  // double-count attendance minutes.
  const { error: dupe } = await admin.from("zoom_webhook_events").insert({
    event_ts: body.event_ts, event_type: body.event,
    zoom_meeting_id: meetingId, payload: body,
  });
  if (dupe?.code === "23505") return NextResponse.json({ ok: true }); // already handled

  switch (body.event) {
    case "meeting.participant_joined":
    case "meeting.participant_left":
      await recordAttendance(admin, meetingId, body);
      break;
    case "meeting.ended":
      await finaliseAttendance(admin, meetingId);   // presence % → present|late|absent
      break;
    case "recording.completed":
      await storeRecording(admin, meetingId, body.payload.object.recording_files);
      break;
  }

  // Always 200 fast. Zoom's delivery timeout is short; do heavy work async.
  return NextResponse.json({ ok: true });
}
```

**Matching a Zoom participant to a student** is the subtle part. Email is unreliable (people join from personal Zoom accounts). Pass a per-student token in the join payload — the SDK's `customer_key` / tracking field — and map on that, falling back to email. Get this right or your attendance gate is noise.

### 5.4 Meeting creation (Server-to-Server OAuth)

A cron or desk action creates the week's meetings from `bootcamp_sessions`. Use recurring meetings for the weekly class so the meeting ID is stable across the cohort, and one-off meetings for 1-1s and vivas. Store `join_url` (fallback) and `start_url` (**service-role read only, never sent to a browser**).

---

## 6. The gotchas that will actually bite you

### 6.1 Cross-origin isolation (SharedArrayBuffer)
The Zoom Web SDK runs materially better when the page is cross-origin isolated (COOP `same-origin` + COEP `require-corp`). But COEP breaks every third-party image, font and embed on the page — and you serve avatars, OG images and starter-repo content.

**Do this:** scope the headers to the classroom route only, in `next.config.ts`:

```ts
async headers() {
  return [{
    source: "/bootcamp/live/:path*",
    headers: [
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
    ],
  }];
}
```
Keep `disableCORP: !window.crossOriginIsolated` in `init()` so the SDK degrades gracefully rather than failing when isolation isn't achieved. Test on Safari specifically — its COEP support is the weakest.

### 6.2 Tailwind v4 preflight will break Zoom's UI
The Meeting SDK skill warns explicitly against global `* { margin: 0 }` resets. **Tailwind preflight is exactly that**, and you're on Tailwind v4. Zoom's UI will render subtly wrong — cropped toolbars, collapsed controls.

Contain it: give the mount point its own stacking/layout context and reset the reset inside it (`.s1-zoom-root, .s1-zoom-root * { all: revert-layer }` or an equivalent scoped escape). Budget half a day for this; it always takes longer than expected and it looks like an SDK bug when it isn't.

### 6.3 The Next 16 prerender trap you already documented
Your own note: a cookie-reading Supabase client forces dynamic rendering and silently breaks static generation. The classroom route is authenticated and dynamic anyway — fine. But the SDK **must** be dynamically imported inside `useEffect` (it references `window` at module scope). Verify on the Vercel build route table, not local dev, per your existing gotcha.

### 6.4 Ad blockers
uBlock and friends block `source.zoom.us`. Component View via npm mostly avoids this, but assets can still be fetched. Your device-check page (§7) must detect a failed asset load and say *"disable your ad blocker for this page"* rather than spinning forever.

### 6.5 Licensing and limits
Meeting SDK is free to use, but **the host account needs a paid Zoom licence**. Basic accounts cap group meetings at 40 minutes — that silently kills a 90-minute class with 20 students. Budget one Pro-or-above licence per concurrent host, plus cloud-recording storage (base allowance is small; a 24-week cohort recording everything will exceed it). **Verify current Zoom pricing and storage allowances directly before committing — do not budget off these numbers.**

### 6.6 Recording consent and retention
You will be recording identifiable people, including students who may be minors, across multiple jurisdictions. Before Cohort 1: explicit consent at enrolment, a stated retention period on `session_recordings.expires_at`, deletion on request, and a rule that viva recordings shown via `/verify` are **opt-in** and student-revocable. Your privacy policy needs updating before the first recorded session, not after.

### 6.7 Timezone
Fix and publish the cohort timezone (`bootcamp_cohorts.timezone`) at sale time. Record everything. Let `watched_recording` count toward the attendance gate at a reduced weight. A live cohort that ignores timezone silently excludes half your addressable market.

---

## 7. Build phases

Slots into the P2 "Ritual & squads" phase of the main roadmap.

**L0 — Spike (3 days).** Zoom dev account, Meeting SDK app, Component View joining a hardcoded meeting inside your real app shell. **Prove §6.1 and §6.2 before anything else** — cross-origin isolation and the Tailwind conflict are where this either works or turns into a two-week fight. Exit: two browsers in one embedded meeting inside your layout, on Vercel preview, on Safari.

**L1 — Sessions & join (1 week).** Schema; S2S OAuth meeting creation; signature endpoint with real authorisation; `/bootcamp/live/[id]`; `JoinFallback`; `/bootcamp/sessions` calendar; desk session creation.

**L2 — Attendance & recordings (1 week).** Webhook with signature verification, URL-validation challenge, idempotency; participant→student matching; `finaliseAttendance` presence rules; `recording.completed` → `session_recordings`; recordings visible in the cohort dashboard.

**L3 — Pre-join device check (2 days).** `/bootcamp/live/[id]/check` — camera, mic, speaker, bandwidth, browser, ad-blocker detection, run 24h before the first class for everyone. Zoom ships a probe SDK for exactly this. This one page removes most of the first-class chaos and is the highest ROI-per-hour item in the whole live stack.

**L4 — 1-1 booking (1 week).** `mentors`, `mentor_availability`, `session_bookings`; booking UI; auto-create Zoom meeting on booking; reminders via Resend (already in your stack); no-show tracking. **Do not build a calendar scheduler from scratch** — embed Cal.com and store the booking. Schedulers are a tarpit that will eat a month.

**L5 — Breakout automation (3 days).** Push `bootcamp_squads` into Zoom breakout rooms via the API so squads land in the right rooms without manual drag-and-drop every week.

**L6 — Viva pipeline (3 days).** Book → record → attach recording to `bootcamp_gate_results` → optional surfacing on `/verify`. This closes the loop between live teaching and the credential, and it's the piece no competitor has.

---

## 8. Serving a globally distributed cohort

The platform question and the global question are separate. **Zoom is still the answer — and more so for a worldwide audience.** What must be designed is the *cohort model*, not the video tool.

### 8.1 Why Zoom gets stronger, not weaker, when students are global

| Requirement | Why Zoom |
|---|---|
| Poor / unstable bandwidth | Zoom's low-bandwidth performance is the reason it won 2020. It degrades gracefully to audio-only far better than Meet or Teams. This matters enormously in South Asia and Africa — your PPP markets. |
| Phone-primary students | Large parts of your addressable market are mobile-first. Embedded web video on a mid-range Android browser is poor **on every platform**. Your `join_url` fallback opens Zoom's native mobile app — a world-class client you didn't build and don't maintain. This is the strongest argument yet for Meeting SDK over Video SDK. |
| Global network reach | Zoom's data-centre footprint and edge routing are more mature than any of the embeddable alternatives. |
| Non-native English speakers | Built-in live captions and transcription — a genuine accessibility win across your markets, free. |
| Trust | In markets where students are (rightly) cautious about paying a foreign platform, "classes are on Zoom" is a de-risking signal. |

**The one real gap: China.** Zoom's availability there is restricted and complicated. If China becomes a market, treat it as a separate project — don't let it distort the v1 decision.

### 8.2 The actual problem: you cannot run one live class for the world

The failure mode is predictable and fatal: sell globally, schedule one class, and ~40% of the cohort can never attend live. They disengage by week 5, they don't graduate, and your first outcomes report — the one you were going to publish honestly — is bad.

**Run timezone-banded cohorts.**

| Band | Anchor (UTC) | Local time | Serves | Instructor must be in |
|---|---|---|---|---|
| **A — Asia / Gulf / East Africa** | 13:30 | 19:00 Colombo & Delhi, 18:30 Karachi, 17:30 Dubai, 16:30 Nairobi | South Asia, Gulf, East Africa, EU afternoon | UTC+1 to UTC+8 |
| **B — Europe / West Africa** | 18:00 | 19:00 London, 20:00 Berlin, 19:00 Lagos | Europe, UK, West & Central Africa | UTC-1 to UTC+4 |
| **C — Americas** | 00:00 | 19:00 New York, 16:00 Los Angeles, 21:00 São Paulo | North & South America | UTC-8 to UTC-3 |

**Band C requires a US-based instructor.** 00:00 UTC is 05:30 the next morning in Colombo. State that plainly in planning — it is a hiring requirement, not a scheduling preference.

**Launch Band A only for Cohort 1.** It's your home timezone, it's where your PPP pricing already points, and one band means one instructor and one set of mistakes. Add Band B at Cohort 2, Band C only once you've hired for it.

Anyone who applies from outside the open band gets an honest choice at application time: take the band-A slot knowing the local hour, or waitlist for their band. **Never sell a seat to someone who cannot attend the live sessions** — put the local time in their timezone directly on the application form, using the geo you already resolve in `proxy.ts` / `S1_REGION_COOKIE`.

### 8.3 Design so only half the live hours are mandatory

The more synchronous your program, the smaller your addressable world. Split it deliberately:

| Component | Sync requirement |
|---|---|
| Live code review (90 min) | **Mandatory-live**, band-anchored, recorded |
| Squad lab (60 min) | **Squad self-schedules** — see below |
| Office hours | Two slots at different hours, drop-in, neither mandatory |
| 1-1 / viva | Booked against mentor availability, any hour |
| PR review, community, Nova | Fully async |

**Form squads by timezone, not randomly.** This is the single highest-leverage structural decision in the whole global model. Four people within ±2 hours of each other can always find a time to pair; four people spread across 15 hours can never. Add a `timezone` column to `bootcamp_enrollments` at acceptance and cluster on it when assigning `squad_id`.

**Attendance policy that survives a global cohort:** live attendance counts 1.0; `watched_recording` counts 0.5 **but only when paired with a posted async artifact** (a question or answer in that week's thread) so watching is verifiable rather than a checkbox. The gate requires ≥70% weighted — attainable if you're never live, but not comfortably.

### 8.4 Nova is your night shift

This is your genuine structural advantage over every human-only bootcamp: **you already have a 24/7 AI tutor with cross-session memory.** No matter the band, a student stuck at 2am has Nova, the graded exercise bank, and the community. Human live time is the scarce premium layer on top of round-the-clock coverage — most bootcamps have nothing underneath.

Support ops that follow from this: async-first with a **published response SLA** (e.g. "under 24h on weekdays"), community as the always-on layer, and human live time reserved for the band's anchored hours. Don't promise real-time human support across 24 timezones; promise fast async and be honest about it.

### 8.5 Second-order things a global cohort forces

- **Payments** — Stripe country coverage and local payment methods vary; some markets effectively need alternatives. Check before opening applications from a region. Remember `verifyRegionAtCheckout()` still has to gate PPP pricing against the payment method's country.
- **Recording storage** — multiplies per band. Set `expires_at` from day one.
- **Consent law** — recording consent rules differ by jurisdiction; a global cohort means the strictest applicable rule wins.
- **Holidays** — Band A hits Eid, Diwali, Poya days; Band C hits Thanksgiving. Publish the cohort calendar with skip-weeks up front.
- **Instructor supply per band** — this, not software, caps how many bands you can run.

---

## 9. Decisions needed

1. **Zoom Meeting SDK confirmed, or spike Daily first?** (Recommend Zoom; spike Daily only if Zoom-branded UI inside your app is unacceptable to you.)
2. **Who hosts?** Every concurrent live session needs a licensed Zoom host. How many instructors at cohort 1?
3. **1-1 cadence: fortnightly for all, or gate-triggered only?** This is the single biggest cost lever (5 of ~10.5 instructor hours per week).
4. **Are you launching the 1-1 Intensive SKU in cohort 1, or cohort-only first?** (Recommend cohort-only — one live format to get right, not two.)
5. **Recording retention period and viva-on-`/verify` opt-in policy** — needed before the first recorded session.
6. **Which timezone band opens first, and do you sell to other bands at all in Cohort 1?** (Recommend Band A only, with everyone else waitlisted by band.)
