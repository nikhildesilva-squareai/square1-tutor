import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/supabase/admin";
import { loadDeskCohorts, type DeskCohort } from "../data";

// GET /desk/bootcamp/export?type=roster|gates[&cohort=<uuid>]
//
// This is the deliberate substitute for a gradebook grid. A grid is weeks of
// work to build something worse than a spreadsheet: instructors already know how
// to sort, filter and pivot in one, and every grid we have ever shipped ends up
// being copied into one anyway. Two exports cover the whole S10 grid scope.
//
// Auth is the same session check as every other desk surface. Nothing about the
// caller comes from the query string — `cohort` narrows the rows, it does not
// grant access to them.
//
// Cells that start with = + - @ are prefixed with an apostrophe: a name or a
// decision note is untrusted text, and Excel will happily execute it as a
// formula otherwise.

export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  // BOM so Excel opens UTF-8 names correctly rather than mangling them.
  return (
    "﻿" +
    [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") +
    "\r\n"
  );
}

function rosterCsv(cohorts: DeskCohort[]): string {
  const headers = [
    "cohort", "student", "email", "enrolment_status",
    "standing_computed", "standing_stored", "standing_summary", "standing_reasons",
    "risk_score", "days_behind",
    "attendance_pct", "sessions_held",
    "current_gate", "current_gate_status", "current_gate_due",
    "last_activity_at", "days_since_activity", "missed_one_to_ones",
    "flagged_by", "flagged_at", "flag_note",
  ];
  const rows: unknown[][] = [];
  for (const c of cohorts) {
    for (const r of c.rows) {
      rows.push([
        `${c.cohort.bootcamp?.title ?? "Bootcamp"} — ${c.cohort.name}`,
        r.name,
        r.email,
        r.status,
        r.standing.standing,
        r.storedStanding,
        r.standing.label,
        r.standing.reasons.join("; "),
        r.standing.riskScore,
        r.standing.daysBehind,
        // Empty, not 0 — the cohort has held no sessions, which is not the same
        // as nobody turning up. The same distinction the dashboard makes.
        r.attendancePct === null ? "" : Math.round(r.attendancePct),
        r.sessionsAttendable,
        r.currentGateTitle ?? "",
        r.currentGateStatus,
        r.currentGateDueAt ? r.currentGateDueAt.toISOString().slice(0, 10) : "",
        r.lastActivityAt ?? "",
        r.daysSinceLastActivity,
        r.missedOneToOnes,
        r.flag?.by ?? "",
        r.flag?.at ?? "",
        r.flag?.reason ?? "",
      ]);
    }
  }
  return toCsv(headers, rows);
}

function gatesCsv(cohorts: DeskCohort[]): string {
  const headers = [
    "cohort", "student", "email",
    "gate_order", "gate_title", "gate_week",
    "status", "attempts", "rubric_pct", "auto_score",
    "objective_passed", "ci_passed",
    "submitted_at", "decided_at", "turnaround_hours",
  ];
  const rows: unknown[][] = [];
  for (const c of cohorts) {
    const byEnrolment = new Map(c.rows.map((r) => [r.enrollmentId, r]));
    for (const g of c.gateResults) {
      const student = byEnrolment.get(g.enrollmentId);
      rows.push([
        `${c.cohort.bootcamp?.title ?? "Bootcamp"} — ${c.cohort.name}`,
        student?.name ?? "",
        student?.email ?? "",
        g.gateOrder,
        g.gateTitle,
        g.gateWeek,
        g.status,
        g.attempts,
        g.rubricPct ?? "",
        g.autoScore ?? "",
        g.objectivePassed === null ? "" : String(g.objectivePassed),
        g.ciPassed === null ? "" : String(g.ciPassed),
        g.submittedAt ?? "",
        g.decidedAt ?? "",
        g.turnaroundHours === null ? "" : g.turnaroundHours.toFixed(1),
      ]);
    }
  }
  return toCsv(headers, rows);
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") === "gates" ? "gates" : "roster";
    const cohortId = url.searchParams.get("cohort");

    let cohorts = await loadDeskCohorts();
    if (cohortId) cohorts = cohorts.filter((c) => c.cohort.id === cohortId);

    const body = type === "gates" ? gatesCsv(cohorts) : rosterCsv(cohorts);
    const stamp = new Date().toISOString().slice(0, 10);

    return new Response(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bootcamp-${type}-${stamp}.csv"`,
        // Rosters carry names, emails and standing. Nothing caches this.
        "Cache-Control": "no-store, private",
      },
    });
  } catch (err) {
    console.error("[desk/bootcamp/export]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
