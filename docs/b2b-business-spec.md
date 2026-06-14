# Square 1 AI — Business / Teams (B2B) Spec

**Status:** Build-ready, **gated on first paying pilot** (do not build speculatively).
**Owner:** Nikhil
**Last updated:** 2026-06-13

> Build order: (1) ship consumer beta → (2) land first corporate pilot, run it *manually* → (3) build Phase 1 of this spec once the pilot validates managers actually use the progress data.

---

## Problem Statement
Corporate L&D buyers want to upskill staff in AI / cloud / security / data and **prove it happened** — but generic course platforms give them no visibility (who did it, did it stick) and bootcamps are slow and expensive. Square 1 already produces the proof artifacts individuals value (AI-graded assessments, real projects, certificates); the missing piece for companies is the **management wrapper**: buy seats, assign them to staff, and watch/report on progress. Without it, we can't sell to companies at all — a manager won't pay for "50 logins" they can't see into.

## Goals
1. Let a company **buy N seats** and assign them to employees (sales-led first, self-serve later).
2. Give a manager an **org-scoped dashboard** showing each employee's progress + team rollups.
3. Produce an **exportable report** an L&D lead can take to their boss as proof of upskilling.
4. Reuse the **same course content + product** as consumer — no content fork.
5. Strictly **isolate org data** — a manager sees only their own org's employees, never the wider platform.

## Non-Goals (v1)
- **Self-serve bulk checkout with a card** — early B2B is quote → invoice → manual provision. (P2)
- **SSO / SCIM / directory sync** — enterprise-tier; not for the first pilots. (P2)
- **Custom/bespoke курricula per org** — orgs pick from the existing 12 tracks. (P2)
- **Different course content for corporate** — explicitly the same product. (Won't do)
- **Reusing the existing internal admin dashboard for managers** — that one sees *all* users; corporate managers must get a *separate, org-scoped* surface. (Hard rule — privacy)

---

## Personas
- **Org Admin / L&D Manager** (the buyer) — assigns seats, watches progress, exports reports.
- **Employee / Learner** — uses the normal Square 1 product; may or may not know they're on a corporate seat.
- **Square 1 (internal)** — provisions orgs + seats (manually in Phase 1).

## User Stories (priority order)
1. As an **L&D manager**, I want to invite my employees to assigned seats so they can start learning on our plan.
2. As an **L&D manager**, I want a dashboard of my team's progress (completion, level, scores, certificates, last active) so I can see who's engaged and who's stalled.
3. As an **L&D manager**, I want to drill into one employee's detail so I can support or follow up with them.
4. As an **L&D manager**, I want to export a progress report (CSV/PDF) so I can prove ROI to leadership.
5. As an **L&D manager**, I want to see seats used vs purchased so I can manage/expand our plan.
6. As an **employee**, I want to be redirected straight into my assigned track so I don't have to figure out what to study.
7. As an **L&D manager**, I want to reassign a seat when someone leaves so we don't waste it.

---

## Data Model (new tables, layered on existing schema)

Existing tables we build on (unchanged): `students`, `student_enrollments`, `lesson_completions`, `project_submissions`, `ai_wallets`, `api_usage`, `certificates`, `courses`.

```
organizations
  id              uuid pk
  name            text
  domain          text            -- optional, for email-domain auto-join later
  seats_purchased int  default 0
  plan            text            -- 'pilot' | 'standard' | 'enterprise'
  ai_budget_per_seat numeric default 1.20  -- funds each member's monthly ai_wallet
  status          text default 'active'    -- active | paused | churned
  created_at      timestamptz

org_members
  id            uuid pk
  org_id        uuid → organizations(id)
  student_id    uuid → students(id)   nullable until they accept the invite
  invited_email text
  role          text  -- 'org_admin' | 'manager' | 'learner'
  seat_status   text  -- 'invited' | 'active' | 'revoked'
  assigned_course_id uuid → courses(id)  nullable  -- the track this seat is for
  invited_at    timestamptz
  joined_at     timestamptz
  unique (org_id, invited_email)

org_invites            -- (optional; can fold into org_members.seat_status='invited')
  token         text pk
  org_id        uuid → organizations(id)
  email         text
  role          text
  expires_at    timestamptz
```

**Seat accounting:** active `org_members` (seat_status='active') must be ≤ `organizations.seats_purchased`.

**AI cost:** on member activation, allocate their monthly `ai_wallet` funded by the org (`ai_budget_per_seat`) — reuses the existing `allocateWallet()` with `funded_by = 'org:<id>'`. The org's seats are the cost cap.

**Progress is *derived*, not duplicated:** the manager dashboard reads existing `student_enrollments` + `lesson_completions` + `project_submissions` + `certificates` for the org's member `student_id`s. No new progress tables.

---

## Security / RLS (the critical part)
- A `manager`/`org_admin` may **SELECT** progress data **only** for `students` who are `org_members` of the **same `org_id`**.
- Implement via a Postgres `security definer` helper (e.g. `is_org_manager_of(student_id)`) used in RLS policies on the read paths, OR route all manager-dashboard reads through a **service-role server action that first verifies the caller manages that org** and scopes every query by `org_id`. (Service-role + server-side scoping is simpler and less error-prone for v1.)
- A `learner` can never see org-admin data or other members.
- **Never** expose the existing internal admin client/dashboard to org users.
- Acceptance: a manager of Org A issuing any dashboard request **cannot** retrieve a single row belonging to Org B or to non-org users (verify with a cross-org test).

---

## Requirements

### P0 — Must-have (Phase 1, first paying pilot)
- **Org + seats provisioning** (Square 1 internal, can be SQL/manual at first): create org, set seats_purchased, fund per-seat AI budget.
- **Invite employees**: manager (or Square 1) invites by email → invite → on accept (Google/email login) a `student` + `org_member(active)` + free enrollment in the assigned track is created.
  - *Given* a seat is available, *when* an invited employee accepts, *then* they land directly in their assigned course.
- **Manager dashboard — team roster**: table of members with name, email, track, assessment level, lessons done / total, avg score, projects shipped, certificates, last active, seat status.
- **Per-employee drill-down**: one member's full progress.
- **Team rollups**: seats used/purchased, overall completion %, # active this week, # stalled (no activity 7d+), certificates earned.
- **CSV export** of the roster + progress.
- **Org-scoped security** (above) — hard P0.

### P1 — Should-have (fast follow)
- **PDF report** (branded, leadership-ready).
- **Self-serve invite management** in the dashboard (manager invites/revokes/reassigns without Square 1).
- **Weekly manager email digest** (reuse the existing cron + Resend infra): "your team this week."
- **Stalled-learner nudges** (auto-email the employee, optionally cc manager).
- **Seats-remaining + "request more seats"** CTA.

### P2 — Future (enterprise)
- **Self-serve bulk seat purchase** (Stripe) + annual billing / invoices / POs.
- **SSO (SAML/OIDC) + SCIM** provisioning.
- **Custom learning paths / required tracks** per org.
- **Domain auto-join** (anyone with @company.com joins the org).
- **API + LMS/HRIS integrations**, SOC2/DPA for security reviews.

---

## Surfaces (pages)
- `/business` (public) — corporate value prop + "request team pricing / book a call" lead capture. *(Lean version can ship pre-pilot as demand capture — see consumer-landing "For Teams" lane.)*
- `/business/dashboard` — manager home: rollups + roster (P0).
- `/business/dashboard/[memberId]` — employee drill-down (P0).
- `/business/dashboard/seats` — invite / manage seats (P0 manual invite, P1 self-serve).
- `/business/settings` — org name, billing, (SSO later).

---

## Success Metrics
**Leading:** pilot activation (% invited employees who complete ≥1 lesson in week 1; target ≥60%); manager dashboard WAU (does the manager actually log in weekly; target: yes); export usage (≥1 report pulled per pilot).
**Lagging:** pilot → paid conversion; seat expansion (do they buy more seats); logo retention; corporate becomes ≥X% of revenue.

---

## Open Questions
- **Pricing model & price** — per-seat/year vs platform fee + seats; the number. *(Stakeholder — informed by the friend's-company discovery call.)*
- **AI budget per corporate seat** — keep $1.20/mo, or higher for heavier corporate use? *(Data/finance.)*
- **Do employees see they're on a corporate seat?** affects messaging + privacy expectations. *(Product.)*
- **One manager per org or many?** affects roles model. *(Product — default: allow multiple managers.)*
- **Minimum seats / contract length** for a pilot. *(Stakeholder.)*
- **Manager visibility scope** — full per-employee detail, or aggregate-only for privacy? Some orgs/regions restrict individual monitoring. *(Legal/product.)*

## Timeline / Phasing
- **Phase 0 — Pilot (manual, no build):** Square 1 provisions seats via SQL, sends the manager a weekly progress sheet by hand. Validate that managers value it.
- **Phase 1 — v1 dashboard (this spec's P0):** org/seat model + RLS + manager roster/drill-down/export + manual invite. Ship for the first *paying* pilot.
- **Phase 2 — P1 fast-follows:** self-serve invites, PDF, weekly digest, nudges.
- **Phase 3 — P2 enterprise:** self-serve seat purchase, SSO/SCIM, custom paths, compliance.
