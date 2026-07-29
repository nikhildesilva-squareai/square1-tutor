# Security Audit — Square 1 AI
**Date:** 2026-07-29 · **Scope:** blue team (defensive posture) + red team (adversarial)
**Target:** square1-tutor (Next.js on Vercel, Supabase) · **Authorisation:** platform owner

Method: static analysis of 87 API routes, live production configuration, and direct
inspection of deployed Supabase RLS policies and column grants. Findings marked
VERIFIED were confirmed independently at the configuration or code level. Nothing was
exploited — no false data was written to production.

---

## Executive summary

The perimeter is in good shape: no secrets leak, security headers are strong, admin
routes are properly gated, there is no IDOR across 87 routes, and no unauthenticated AI
call exists. The July `?user_email=` bypass is genuinely fixed.

**The weakness is integrity, not confidentiality.** Nothing here lets an attacker steal
your data — but a student can currently fabricate every credential the platform sells:
grades, skill reports, completions, and certificates. For a product whose pitch is
"proof, not promises", that is the most commercially damaging class of bug available.

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Students can write their own grades via RLS | CRITICAL | VERIFIED |
| 2 | Stored XSS in community chat | CRITICAL | VERIFIED |
| 3 | Project grading: prompt injection + unclamped score | CRITICAL | VERIFIED |
| 4 | Certificates issued for enrolling, not finishing | HIGH | VERIFIED |
| 5 | `next@16.2.6` — proxy/middleware bypass advisory | HIGH | VERIFIED |
| 6 | AI cost abuse (check-before/log-after + weak limiter) | HIGH | VERIFIED |
| 7 | Nova chat: client-writable system prompt, no enrolment check | HIGH | VERIFIED |
| 8 | CSP allows `'unsafe-inline'` (enables #2) | HIGH | VERIFIED |
| 9 | Inverted authz predicate in 4 community routes | HIGH (latent) | VERIFIED latent |
| 10 | AI wallet may be unenforceable (RLS-blocked read → spend 0) | HIGH | UNVERIFIED |
| 11 | `/verify` IDs are a 32-bit hash, unthrottled | MEDIUM | VERIFIED |
| 12 | `/api/client-error` unrated-limited + log injection | MEDIUM | VERIFIED |
| 13 | DB error text returned to client (`assess/response`) | MEDIUM | VERIFIED |
| 14 | `verifyRegionAtCheckout` never called + false UI claim | MEDIUM | VERIFIED |

---

## 1. CRITICAL — Students can write their own grades (RLS)

Both layers permit it: the RLS policy allows own-row writes, and `authenticated` holds
the column grants.

| Table | Policy | Grant | Consequence |
|---|---|---|---|
| `assessment_attempts` | UPDATE own | UPDATE, 12 cols | set own `score`, `percentage`, `level_determined` |
| `skill_reports` | INSERT own | INSERT, 14 cols | forge a report at any score/level |
| `lesson_completions` | INSERT own | INSERT, 7 cols | mark every lesson complete |
| `project_submissions` | UPDATE own | UPDATE, 25 cols | set `score`, `objective_score`, `status`, `in_portfolio`, `ai_feedback_md` |

**Attack.** Any logged-in student holds their own JWT (DevTools → localStorage) and the
anon key (public by design). They call PostgREST directly:

```
PATCH /rest/v1/assessment_attempts?id=eq.<their-own-row>
{"percentage":100,"level_determined":"advanced"}
```

The server-side anti-spoof gate in `/api/learn/complete` is not bypassed — it is simply
routed around. The API is not the only door to the database.

**Fix.** These tables are *system-of-record for grades*; students should never write
them directly. Revoke INSERT/UPDATE from `anon`/`authenticated` and drop the
write policies, leaving writes to the service-role paths that already exist:

```sql
REVOKE INSERT, UPDATE ON assessment_attempts, skill_reports,
                          lesson_completions, project_submissions
  FROM anon, authenticated;
DROP POLICY attempts_update       ON assessment_attempts;
DROP POLICY attempts_insert       ON assessment_attempts;
DROP POLICY skill_reports_insert  ON skill_reports;
DROP POLICY completions_insert    ON lesson_completions;
DROP POLICY proj_submissions_insert ON project_submissions;
DROP POLICY proj_submissions_update ON project_submissions;
```
SELECT policies stay — students must still read their own records.
**Before running:** confirm each writing route uses `createAdminClient`, or it will 500.

**Verified secure by contrast** (proof the model is right elsewhere):
- `ai_wallets` — SELECT-only policy, so RLS denies UPDATE. A student cannot top up
  their own AI spend, despite holding the grant.
- `free_trial_claims` — SELECT-only; claiming goes through the atomic RPC.

---

## 2. CRITICAL — Stored XSS in community chat

`components/community/CommunityMessage.tsx` → `renderContent()`:

```ts
let parsed = text
  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")   // no escaping first
  .replace(/_(.*?)_/g,       "<em>$1</em>")
  .replace(/`(.*?)`/g,       "<code>$1</code>");
return <p dangerouslySetInnerHTML={{ __html: parsed }} />;
```

Raw member text reaches `dangerouslySetInnerHTML` unescaped. Stored, so it fires for
every member who opens the channel — including an admin, whose session token would hand
over the admin routes.

**This is an oversight, not a policy.** Every sibling renderer escapes first:
`components/ui/rich-content.tsx:47`, `components/ui/note-content.tsx:104`. Community
chat is the only one that does not. Community *posts* are safe (JSX text nodes).

`autoModerateMessage` runs async *after* insert, so it is not a gate.

**Fix.** Escape before the markdown regexes, matching the existing helper:
```ts
const esc = text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
```

---

## 3. CRITICAL — Project grading: injection channel with a trusted score

`lib/grading/project-review.ts` inlines the student's repo (README always fetched)
verbatim — no delimiters, no sanitisation, no `detectManipulation()` — while still
sending `GRADING_SYSTEM_PROMPT`, which *tells the model* submissions are wrapped in
unforgeable markers. On this route that is false, which makes the model easier to fool.

Then `review = JSON.parse(result.text || "{}")` — no clamping — and
`app/api/projects/submit/route.ts` writes `score: review.score` straight to the DB,
where `rubricPct` drives `complete` → `in_portfolio`.

**Attack.** A README that closes the code fence and emits
`{"score":100,"max_score":100,...}` buys a graded, portfolio-listed project.
Contained only on projects that have an objective answer-key metric.

**Fix.** The correct implementation already exists in this repo:
`lib/grading/assessment.ts` (per-batch unguessable token, marker-stripping, hard
clamping, model-independent guard). Port it to the project path.

---

## 4. HIGH — Certificates are issued for enrolling, not finishing

`app/(app)/certificate/[courseSlug]/page.tsx` — the only gate is
`if (!enrollment) redirect(...)` on an active enrolment. Completion percentage is
computed and never checked; `completed_at` is never consulted. `/verify` returns
`valid: true` on the same basis.

Sign up → free-enrol → **certificate at zero lessons**, with a working verification ID.
Chained with #1 and #3, the entire credential chain is forgeable.

**Fix.** Gate on `enrollment.completed_at` (the field already exists and
`checkAndMarkEnrollmentComplete` already sets it).

---

## 5–8. HIGH — Infrastructure and cost

- **`next@16.2.6`** carries a *Middleware/Proxy bypass in App Router* advisory. This
  app's entire unauthenticated-route gate **is** `proxy.ts`. Also `postcss`
  (arbitrary file read) and `sharp` (4 libvips CVEs). `npm audit`: 3 high, 2 moderate,
  all production-tree. **Upgrade to `next@16.2.12`** — non-semver-major, clears all three.
- **AI cost abuse.** Budget is read before the call and logged fire-and-forget after,
  with a per-serverless-instance rate limiter → parallel requests all see the same
  balance. Signup alone (no enrolment) yields ~$2.40 of inference per throwaway email;
  ~85 accounts hit the $200 platform ceiling, which then **denies AI to every real
  student** for the month. `getPlatformSpend()` fails open.
  `@upstash/ratelimit` is already a dependency but never imported.
- **Nova chat** (`app/api/tutor/chat/route.ts`) — `courseTitle`,
  `lessonContentSummary` etc. have no `.max()` and are concatenated into the system
  message, with no enrolment check. A free general-purpose LLM on your bill, speaking
  as "Nova".
- **CSP allows `'unsafe-inline'`** in `script-src` (`next.config.ts`). The code comment
  only justifies `'unsafe-eval'` (Monaco). This is what makes #2 exploitable.
  `connect-src` also still allows `api.anthropic.com` — stale, production AI is DeepInfra.

## 9. HIGH (latent) — Inverted authorisation predicate

Four community routes (`search`, `media`, `analytics/threads`, `analytics/reactions`):
```ts
if (community.visibility === "private" && user) { /* membership check */ }
```
The `&& user` means an **anonymous** caller skips the private gate entirely; only
authenticated non-members are blocked. Backwards.

**Not exploitable today** — VERIFIED: `communities` has `is_private`, not `visibility`,
so the query errors and the routes 404 for everyone. Fail-closed by accident. Repairing
the column name without fixing the predicate makes the bypass live. Fix the logic first.

## 10. HIGH — UNVERIFIED: the AI wallet may be decorative

`lib/ai/budget.ts` reads `ai_wallets`/`api_usage` with the **RLS-limited user client**
and treats a blocked read as `spent = 0`. Migration 017 had to add a `SECURITY DEFINER`
function to read `api_usage`, which suggests the table is locked. If so, every student
without a wallet row has no enforceable budget. Settle with two queries before assuming
the cap works.

## 11–14. MEDIUM

- `/verify` IDs are a 32-bit djb2 hash, public and unthrottled — enumeration discloses
  student name/course/level; collisions plausible; each lookup scans all active enrolments.
- `/api/client-error` — no rate limit (despite `lib/rate-limit.ts` being used by 9 other
  routes) and newlines not stripped before log interpolation → log forgery + flooding.
- `app/api/assess/response/route.ts:71` returns Supabase `error.message` to the client,
  leaking schema/constraint detail. Server-side `console.error` already captures it.
- `verifyRegionAtCheckout` has **zero call sites**. Impact today is display-only (no
  price is persisted; Stripe isn't live) — but `RegionSelector.tsx:60` currently tells
  users "Verified against your payment country at checkout", which is **not true**.
  Correct the copy now; wire the function when Stripe lands.

---

## Verified secure

- **Secrets clean.** No `.env` committed; service-role key grepped against built
  `.next/static/` — no match. All 6 `NEXT_PUBLIC_` vars non-sensitive.
- **Headers strong** — CSP (`object-src 'none'`, `base-uri 'self'`, `form-action 'self'`),
  HSTS 2-year + preload, `nosniff`, `SAMEORIGIN`, Referrer-Policy, Permissions-Policy.
- **The July `?user_email=` admin bypass is fixed** — all 17 admin routes resolve identity
  via `auth.getUser()` + `isAdminEmail()` (fails closed) *before* constructing the
  service-role client. One stale doc-comment still describes the old param — delete it.
- **No IDOR across 87 routes.** Every student query is scoped to a session-derived
  `student.id`. 30 of 33 service-role sites authenticate first; the other 3 are
  validated, rate-limited, write-only public sinks.
- **RLS enabled on all 84 tables**, ownership scoping consistently correct
  (`user_id = auth.uid()`), no `USING (true)` on anything sensitive.
- **No unprotected mass-email trigger** — both cron routes and both ad-hoc email routes
  enforce `CRON_SECRET` and fail closed.
- **Assessment grading is defended in depth** — unguessable per-batch token,
  marker-stripping, hard clamping, a model-independent guard that overrides the model,
  `GradeBatchError` refusing to persist failed batches, server-side MCQ grading,
  answer-leak stripping. This is the template for fixing #3.
- **No unauthenticated AI call anywhere.**
- 18 of 19 `dangerouslySetInnerHTML` sites safe.

---

## Recommended order

1. **#2 XSS** — smallest fix (one line), actively exploitable, protects admin sessions.
2. **#5 `next@16.2.12`** — one command; the advisory targets your auth gate.
3. **#1 RLS grade writes** — SQL migration; verify writing routes use service-role first.
4. **#4 certificates** — one condition on `completed_at`.
5. **#3 project grading** — port `assessment.ts` defences.
6. **#6/#7 cost controls** — Upstash limiter (already a dependency), bound Nova inputs,
   add an enrolment check.
7. **#14 RegionSelector copy** — remove the claim the system doesn't yet honour.
8. **#10** — run the two wallet queries before trusting the cap.
9. **#9** — fix the predicate before anyone repairs the column name.
10. Housekeeping: #11–13, delete the stale admin doc-comment, encrypt or remove
    `.env.decrypted` / `.env.vercel-production` from the working tree.

---

## Appendix — API attack surface (final audit)

**No CRITICAL or HIGH.** No exploitable mass assignment (both `...spread` sites build
server-side objects), no privilege-escalation path in `org/**` or community member
management, no string-built SQL, `research-content.ts` uses `path.basename`,
`fetch-repo` interpolates only into a hardcoded `api.github.com` origin, assessment
answer keys stripped before response, IDOR checks consistently re-derive ownership from
the session. Live probes: `/api/admin/messages` → 403, `/api/cron/daily` → 401,
`/api/analytics/metrics` → 401.

### MEDIUM (new)
- **A1. PostgREST `or()` filter injection** — `app/api/communities/route.ts:73`
  interpolates `search` raw into an `or=` expression. **Live-confirmed on production:**
  `?search=zzzznomatch` → 0 rows; `?search=zzzznomatch%25,slug.not.is.null,name.ilike.%25`
  → rows returned. The attacker controls filter grammar. Bounded by the AND-ed
  `is_private=false` / `deleted_at is null`, so private communities stay out of reach.
  `notes/route.ts:61` already has the correct escape — copy it.
- **A2. Unconsented mass-enrolment** — `POST /api/communities` (any free account, no
  rate limit) calls `seedCommunity`, which uses the **service-role client** to force-join
  20–50 real users (`lib/community/seeding.ts:158,168-190`), deliberately bypassing the
  RLS policy that limits self-joins to `role='member'`.
- **A3. `POST /api/track`** — unauthenticated service-role bulk insert (40 rows/req), no
  rate limit. The other two anon service-role writers (`diagnostic/event`,
  `business-lead`) *are* limited. Copy that.
- **A4. `in_portfolio` is set by the grader, never by the student** — no opt-in. See
  resolution below.

### LOW
`USING (true)` SELECT policies on `message_threads` / `message_reaction_counts`
(metadata only — message bodies stay RLS-protected); `upload` trusts client MIME and
never validates the extension; `assess/response` doesn't bind `questionId` to the
attempt's paper.

### Two UNVERIFIED items — RESOLVED against live RLS

- **Direct messages: NOT vulnerable.** `direct_conversations.dc_select` and the three
  `direct_messages` policies all scope to
  `current_student_id() = student_a OR = student_b`, role `authenticated`. The DM routes
  carry no application-level participant check and rely entirely on RLS — that is a
  defence-in-depth gap worth closing, but it is **not** an IDOR.
- **`/portfolio` and `/verify` are broken, not leaking.** Both use `createClient()` (the
  RLS-limited user client) while `students_select` is `auth.uid() = user_id`. For an
  anonymous visitor `auth.uid()` is null, so **they return nothing**. The public share
  feature does not work for the public — the safe failure mode, but a real functional
  bug. It also means A4's privacy exposure is not currently realised; do not "fix" these
  pages with a service-role client without first adding a student opt-in for
  `in_portfolio`.
