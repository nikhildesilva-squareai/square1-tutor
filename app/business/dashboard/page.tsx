import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/ui/logo";
import { CopyInviteLink } from "@/components/business/CopyInviteLink";
import { BulkInvite } from "@/components/business/BulkInvite";
import { getOrgStats } from "@/lib/org-stats";

export const dynamic = "force-dynamic";

export default async function ManagerDashboard() {
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

  const {
    org, roster, pendingCount, pendingEmails, seatsUsed, seatsLeft,
    activeThisWeek, completedCount, avgCompletion, deployedCount, avgScore,
    teamReadiness, readinessDelta, membersAssessed, topWeak, topStrong,
  } = stats;

  // Courses for the "assign a track" invite dropdown.
  const { data: courseRows } = await admin.from("courses").select("slug, title").order("title");
  const courseList = (courseRows ?? []) as { slug: string; title: string }[];

  const usedPct = org.seats > 0 ? Math.min(100, Math.round((seatsUsed / org.seats) * 100)) : 0;
  const pendingPct = org.seats > 0 ? Math.min(100 - usedPct, Math.round((pendingCount / org.seats) * 100)) : 0;

  const isFree = org.plan === "free_beta" || !org.billing_interval;
  const billingLabel = isFree ? "Free · early access" : `${org.billing_interval === "annual" ? "Annual" : "Monthly"} plan`;
  const billingOk = isFree || org.status === "active";

  const h = await headers();
  const host = h.get("host") ?? "square1-tutor.vercel.app";
  const proto = host.includes("localhost") ? "http" : "https";
  const inviteUrl = `${proto}://${host}/business/join?code=${org.join_code}`;

  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : "—");

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 30%)" }}>
      <header className="flex items-center justify-between px-5 sm:px-10 py-5 border-b border-slate-200/70">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <span className="text-sm font-semibold text-slate-500">Manager portal</span>
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-6 py-8">
        {/* Org header */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{org.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {seatsUsed} of {org.seats} seats filled{pendingCount > 0 ? ` · ${pendingCount} invited` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/business/report"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              Export report
            </Link>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${billingOk ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${billingOk ? "bg-emerald-500" : "bg-amber-500"}`} />
              {billingLabel}{!isFree && org.status !== "active" ? ` · ${org.status}` : ""}
            </span>
          </div>
        </div>

        {/* Rollups */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {[
            { label: "Seats used", value: `${seatsUsed}/${org.seats}` },
            { label: "Active this week", value: activeThisWeek },
            { label: "Avg completion", value: `${avgCompletion}%` },
            { label: "Projects deployed", value: deployedCount },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-2xl font-black text-slate-900 tabular-nums">{s.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Team skills & readiness — real skill-gap analytics from assessments */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <p className="text-sm font-bold text-slate-900">Team skills &amp; readiness</p>
            {membersAssessed > 0 && <p className="text-[11px] text-slate-500">{membersAssessed} of {seatsUsed} assessed</p>}
          </div>

          {membersAssessed === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500 max-w-md mx-auto">No skill checks yet. Once your team takes the assessment, their biggest skill gaps and a team readiness score map here automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-5">
              {/* readiness + impact */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center flex flex-col justify-center">
                <p className="text-4xl font-black text-slate-900 tabular-nums leading-none">{teamReadiness ?? "—"}<span className="text-lg text-slate-500">%</span></p>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1.5">Avg readiness</p>
                {readinessDelta !== 0 && (
                  <p className="text-[11px] font-bold mt-1" style={{ color: readinessDelta > 0 ? "#059669" : "#DC2626" }}>
                    {readinessDelta > 0 ? "▲" : "▼"} {Math.abs(readinessDelta)} pts since first check
                  </p>
                )}
                <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-center">
                  <div><p className="text-base font-black text-slate-900 tabular-nums">{deployedCount}</p><p className="text-[9px] text-slate-500 uppercase tracking-wide">Deployed</p></div>
                  <div><p className="text-base font-black text-slate-900 tabular-nums">{avgScore != null ? `${avgScore}%` : "—"}</p><p className="text-[9px] text-slate-500 uppercase tracking-wide">Avg score</p></div>
                </div>
              </div>

              {/* skill gaps */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">Biggest skill gaps</p>
                <div className="space-y-2">
                  {topWeak.map((w) => (
                    <div key={w.topic} className="flex items-center gap-3">
                      <span className="text-xs text-slate-700 w-36 sm:w-44 truncate capitalize">{w.topic}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.round((w.count / membersAssessed) * 100)}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500 tabular-nums w-20 text-right">{w.count}/{membersAssessed} weak</span>
                    </div>
                  ))}
                </div>
                {topStrong.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Team strengths</p>
                    <div className="flex flex-wrap gap-1.5">
                      {topStrong.map((s) => (
                        <span key={s.topic} className="text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">{s.topic}</span>
                      ))}
                    </div>
                  </div>
                )}
                <Link href="/courses" className="inline-block mt-4 text-sm font-bold text-brand hover:underline">Browse tracks to recommend →</Link>
              </div>
            </div>
          )}
        </div>

        {/* Seat usage meter */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Seat usage</p>
            <p className="text-[11px] text-slate-500">{seatsUsed} active · {pendingCount} invited · {seatsLeft} free</p>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex">
            <div className="h-full bg-brand transition-all" style={{ width: `${usedPct}%` }} />
            <div className="h-full bg-brand/30 transition-all" style={{ width: `${pendingPct}%` }} />
          </div>
        </div>

        {/* Invite your team */}
        <div className="rounded-2xl border border-brand/20 bg-brand/[0.04] p-5 mb-6">
          <p className="text-sm font-bold text-slate-900 mb-1">Invite your team</p>
          <p className="text-xs text-slate-600 mb-3">
            Invite by email, or share the link — each person claims a seat and starts learning. ({seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} left)
          </p>
          <BulkInvite seatsLeft={seatsLeft} courses={courseList} />
          <div className="mt-4 pt-4 border-t border-brand/10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Or share a link</p>
            <CopyInviteLink url={inviteUrl} />
          </div>
          {pendingCount > 0 && (
            <p className="text-[11px] text-slate-500 mt-3">
              Pending: {pendingEmails.slice(0, 5).join(", ")}{pendingCount > 5 ? ` +${pendingCount - 5} more` : ""}
            </p>
          )}
        </div>

        {/* Completion nudge */}
        {completedCount > 0 && (
          <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#19A65F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" /><circle cx="12" cy="8" r="7" /></svg>
            <p className="text-sm text-emerald-800 font-semibold">
              {completedCount} of {seatsUsed} {completedCount === 1 ? "teammate has" : "teammates have"} completed their track — open a member to see their portfolio.
            </p>
          </div>
        )}

        {/* Roster */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-900">Team progress</p>
            <span className="text-xs text-slate-500">{roster.length} member{roster.length !== 1 ? "s" : ""}{completedCount > 0 ? ` · ${completedCount} completed` : ""}</span>
          </div>
          {roster.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">No one&apos;s joined yet. Invite your team above to get them started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-2.5 font-bold">Member</th>
                    <th className="px-3 py-2.5 font-bold">Track</th>
                    <th className="px-3 py-2.5 font-bold">Level</th>
                    <th className="px-3 py-2.5 font-bold text-center">Lessons</th>
                    <th className="px-3 py-2.5 font-bold text-center">Projects</th>
                    <th className="px-3 py-2.5 font-bold">Progress</th>
                    <th className="px-5 py-2.5 font-bold text-right">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((r) => (
                    <tr key={r.studentId} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3">
                        <Link href={`/portfolio/${r.studentId}`} className="font-semibold text-slate-900 hover:text-brand hover:underline">{r.name}</Link>
                        <p className="text-[11px] text-slate-500">{r.email}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{r.track}</td>
                      <td className="px-3 py-3 text-slate-600 capitalize">{r.level}</td>
                      <td className="px-3 py-3 text-center font-bold text-slate-900 tabular-nums">{r.lessons}</td>
                      <td className="px-3 py-3 text-center font-bold text-slate-900 tabular-nums">{r.projects}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${r.completionPct}%`, background: r.completed ? "#19A65F" : "#0056CE" }} />
                          </div>
                          {r.completed
                            ? <span className="text-[10px] font-bold text-emerald-600 whitespace-nowrap">✓ Done</span>
                            : <span className="text-[10px] text-slate-500 tabular-nums">{r.completionPct}%</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500 tabular-nums">{fmtDate(r.lastActive)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-500 mt-5 text-center">
          Workers use the normal Square 1 Ai student experience. You see their progress here, scoped to your team only.
        </p>
      </main>
    </div>
  );
}
