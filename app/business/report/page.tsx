import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/ui/logo";
import { BackPill } from "@/components/ui/back-pill";
import { PrintButton } from "@/components/business/PrintButton";
import { getOrgStats } from "@/lib/org-stats";

export const dynamic = "force-dynamic";

// Manager-only, print-optimised Team Impact Report — the artifact a manager
// takes to leadership. Built from real getOrgStats() data; "Save as PDF" via print.
export default async function TeamImpactReport() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
  if (!student) redirect("/business");

  const admin = createAdminClient();
  const { data: mgr } = await admin
    .from("org_members").select("org_id").eq("student_id", student.id).eq("role", "manager").maybeSingle();
  if (!mgr) redirect("/business");

  const stats = await getOrgStats(mgr.org_id);
  if (!stats) redirect("/business");

  const { org, roster, seatsUsed, activeThisWeek, totalLessons, deployedCount, avgScore, teamReadiness, readinessDelta, membersAssessed, topWeak, topStrong } = stats;
  const today = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : "—");

  const SUMMARY = [
    { label: "Seats active", value: `${seatsUsed}/${org.seats}` },
    { label: "Active this week", value: `${activeThisWeek}` },
    { label: "Lessons completed", value: `${totalLessons}` },
    { label: "Projects deployed", value: `${deployedCount}` },
    { label: "Avg Nova score", value: avgScore != null ? `${avgScore}%` : "—" },
    { label: "Team readiness", value: teamReadiness != null ? `${teamReadiness}%` : "—" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Action bar — hidden in print */}
      <div className="print:hidden border-b border-slate-200 px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
        <BackPill href="/business/dashboard" label="Back to portal" />
        <PrintButton />
      </div>

      <main className="max-w-4xl mx-auto px-6 sm:px-10 py-10 print:py-2">
        {/* Report header */}
        <div className="flex items-start justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-2">Team Impact Report</p>
            <h1 className="text-3xl font-black text-slate-900">{org.name}</h1>
            <p className="text-sm text-slate-500 mt-1">Generated {today} · Square 1 Ai for Teams</p>
          </div>
          <Logo variant="dark" size="md" />
        </div>

        {/* Summary metrics */}
        <section className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">At a glance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SUMMARY.map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 p-4">
                <p className="text-2xl font-black text-slate-900 tabular-nums">{s.value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {teamReadiness != null && readinessDelta !== 0 && (
            <p className="text-sm font-semibold mt-3" style={{ color: readinessDelta > 0 ? "#059669" : "#DC2626" }}>
              {readinessDelta > 0 ? "▲" : "▼"} {Math.abs(readinessDelta)} pts team readiness since first assessment.
            </p>
          )}
        </section>

        {/* Skill gaps */}
        <section className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Skill gaps across the team</h2>
          {membersAssessed === 0 ? (
            <p className="text-sm text-slate-500">No assessments completed yet — gaps will populate once the team takes the skill check.</p>
          ) : (
            <>
              <div className="space-y-2">
                {topWeak.map((w) => (
                  <div key={w.topic} className="flex items-center gap-3">
                    <span className="text-sm text-slate-700 w-44 truncate capitalize">{w.topic}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.round((w.count / membersAssessed) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 tabular-nums w-20 text-right">{w.count}/{membersAssessed} weak</span>
                  </div>
                ))}
              </div>
              {topStrong.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Team strengths</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topStrong.map((s) => (
                      <span key={s.topic} className="text-xs px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 capitalize">{s.topic}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Roster */}
        <section className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Per-person progress</h2>
          {roster.length === 0 ? (
            <p className="text-sm text-slate-500">No team members have joined yet.</p>
          ) : (
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50">
                  <th className="px-4 py-2.5 font-bold">Member</th>
                  <th className="px-3 py-2.5 font-bold">Track</th>
                  <th className="px-3 py-2.5 font-bold">Level</th>
                  <th className="px-3 py-2.5 font-bold text-center">Lessons</th>
                  <th className="px-3 py-2.5 font-bold text-center">Projects</th>
                  <th className="px-4 py-2.5 font-bold text-right">Last active</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => (
                  <tr key={r.studentId} className="border-t border-slate-100">
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-slate-900">{r.name}</p>
                      <p className="text-[11px] text-slate-500">{r.email}</p>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">{r.track}</td>
                    <td className="px-3 py-2.5 text-slate-600 capitalize">{r.level}</td>
                    <td className="px-3 py-2.5 text-center font-bold tabular-nums">{r.lessons}</td>
                    <td className="px-3 py-2.5 text-center font-bold tabular-nums">{r.projects}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500 tabular-nums">{fmtDate(r.lastActive)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <p className="mt-8 pt-5 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
          Every figure here is drawn from your team&apos;s real activity on Square 1 Ai — projects deployed to live URLs,
          AI-reviewed code scores, and assessment-based skill data. Nothing is estimated or invented.
        </p>
      </main>
    </div>
  );
}
