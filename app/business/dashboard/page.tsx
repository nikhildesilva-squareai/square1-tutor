import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/ui/logo";
import { CopyInviteLink } from "@/components/business/CopyInviteLink";
import { BulkInvite } from "@/components/business/BulkInvite";

export const dynamic = "force-dynamic";

interface MemberRow {
  studentId: string;
  name: string;
  email: string;
  track: string;
  level: string;
  lessons: number;
  projects: number;
  lastActive: string | null;
}

export default async function ManagerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: student } = await supabase.from("students").select("id, name").eq("user_id", user.id).maybeSingle();
  if (!student) redirect("/business");

  const admin = createAdminClient();

  // Am I a manager of an org?
  const { data: mgr } = await admin
    .from("org_members").select("org_id").eq("student_id", student.id).eq("role", "manager").maybeSingle();
  if (!mgr) redirect("/business");

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, seats, join_code, plan, status, billing_interval, current_period_end")
    .eq("id", mgr.org_id).maybeSingle();
  if (!org) redirect("/business");

  // Members (workers) + pending invites (each reserves a seat)
  const [{ data: members }, { data: pendingInvites }] = await Promise.all([
    admin.from("org_members").select("student_id, created_at").eq("org_id", org.id).eq("role", "member"),
    admin.from("org_invites").select("email").eq("org_id", org.id).eq("status", "pending"),
  ]);
  const memberIds = (members ?? []).map((m) => m.student_id);
  const pendingCount = pendingInvites?.length ?? 0;

  let roster: MemberRow[] = [];
  // Impact + skill-gap aggregates (real data from project_submissions + skill_reports)
  let deployedCount = 0;            // projects with a live URL
  let avgScore: number | null = null;   // avg Nova/project score %
  let teamReadiness: number | null = null; // avg assessment readiness %
  let membersAssessed = 0;
  let topWeak: { topic: string; count: number }[] = [];
  let topStrong: { topic: string; count: number }[] = [];

  if (memberIds.length > 0) {
    const [{ data: studs }, { data: enrs }, { data: comps }, { data: subs }, { data: reports }] = await Promise.all([
      admin.from("students").select("id, name, email").in("id", memberIds),
      admin.from("student_enrollments").select("student_id, assessment_level, course:courses(title)").in("student_id", memberIds).eq("status", "active"),
      admin.from("lesson_completions").select("student_id, completed_at").in("student_id", memberIds),
      admin.from("project_submissions").select("student_id, score, max_score, live_url").in("student_id", memberIds),
      admin.from("skill_reports").select("student_id, weak_topics, strong_topics, estimated_score, max_score").in("student_id", memberIds),
    ]);

    const studMap = new Map((studs ?? []).map((s) => [s.id, s]));
    const enrMap = new Map<string, { level: string; track: string }>();
    for (const e of (enrs ?? []) as unknown as Array<{ student_id: string; assessment_level: string | null; course: { title: string } | null }>) {
      if (!enrMap.has(e.student_id)) enrMap.set(e.student_id, { level: e.assessment_level ?? "—", track: e.course?.title ?? "—" });
    }
    const lessonsByStud = new Map<string, number>();
    const lastByStud = new Map<string, string>();
    for (const c of comps ?? []) {
      lessonsByStud.set(c.student_id, (lessonsByStud.get(c.student_id) ?? 0) + 1);
      const cur = lastByStud.get(c.student_id);
      if (!cur || c.completed_at > cur) lastByStud.set(c.student_id, c.completed_at);
    }
    const projByStud = new Map<string, number>();
    const scored: number[] = [];
    for (const s of (subs ?? []) as Array<{ student_id: string; score: number | null; max_score: number | null; live_url: string | null }>) {
      projByStud.set(s.student_id, (projByStud.get(s.student_id) ?? 0) + 1);
      if (s.live_url) deployedCount++;
      if (s.score != null && s.max_score) scored.push((Number(s.score) / Number(s.max_score)) * 100);
    }
    if (scored.length) avgScore = Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);

    // Skill gaps — per-student union of weak/strong topics, then frequency across the team
    const weakByStud = new Map<string, Set<string>>();
    const strongByStud = new Map<string, Set<string>>();
    const readinessByStud = new Map<string, number>();
    for (const r of (reports ?? []) as Array<{ student_id: string; weak_topics: string[] | null; strong_topics: string[] | null; estimated_score: number | null; max_score: number | null }>) {
      if (Array.isArray(r.weak_topics) && r.weak_topics.length) {
        const set = weakByStud.get(r.student_id) ?? new Set<string>();
        r.weak_topics.forEach((t) => set.add(t));
        weakByStud.set(r.student_id, set);
      }
      if (Array.isArray(r.strong_topics) && r.strong_topics.length) {
        const set = strongByStud.get(r.student_id) ?? new Set<string>();
        r.strong_topics.forEach((t) => set.add(t));
        strongByStud.set(r.student_id, set);
      }
      if (r.estimated_score != null && r.max_score) {
        const pct = (Number(r.estimated_score) / Number(r.max_score)) * 100;
        readinessByStud.set(r.student_id, Math.max(readinessByStud.get(r.student_id) ?? 0, pct));
      }
    }
    membersAssessed = new Set([...weakByStud.keys(), ...readinessByStud.keys()]).size;
    if (readinessByStud.size) {
      teamReadiness = Math.round([...readinessByStud.values()].reduce((a, b) => a + b, 0) / readinessByStud.size);
    }
    const tally = (m: Map<string, Set<string>>) => {
      const freq = new Map<string, number>();
      for (const set of m.values()) set.forEach((t) => freq.set(t, (freq.get(t) ?? 0) + 1));
      return [...freq.entries()].map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count);
    };
    topWeak = tally(weakByStud).slice(0, 8);
    topStrong = tally(strongByStud).slice(0, 6);

    roster = memberIds.map((id) => {
      const s = studMap.get(id);
      const enr = enrMap.get(id);
      return {
        studentId: id,
        name: s?.name ?? (s?.email?.split("@")[0] ?? "Member"),
        email: s?.email ?? "",
        track: enr?.track ?? "—",
        level: enr?.level ?? "—",
        lessons: lessonsByStud.get(id) ?? 0,
        projects: projByStud.get(id) ?? 0,
        lastActive: lastByStud.get(id) ?? null,
      };
    });
  }

  // Rollups
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeThisWeek = roster.filter((r) => r.lastActive && new Date(r.lastActive).getTime() >= weekAgo).length;
  const totalLessons = roster.reduce((s, r) => s + r.lessons, 0);
  const seatsUsed = roster.length;
  const seatsLeft = Math.max(0, org.seats - seatsUsed - pendingCount);
  const usedPct = org.seats > 0 ? Math.min(100, Math.round((seatsUsed / org.seats) * 100)) : 0;
  const pendingPct = org.seats > 0 ? Math.min(100 - usedPct, Math.round((pendingCount / org.seats) * 100)) : 0;

  // Billing status
  const isFree = org.plan === "free_beta" || !org.billing_interval;
  const billingLabel = isFree ? "Free · early access" : `${org.billing_interval === "annual" ? "Annual" : "Monthly"} plan`;
  const billingOk = isFree || org.status === "active";

  // Invite link (absolute, from request host)
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
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${billingOk ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${billingOk ? "bg-emerald-500" : "bg-amber-500"}`} />
            {billingLabel}{!isFree && org.status !== "active" ? ` · ${org.status}` : ""}
          </span>
        </div>

        {/* Rollups */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {[
            { label: "Seats used", value: `${seatsUsed}/${org.seats}` },
            { label: "Active this week", value: activeThisWeek },
            { label: "Lessons completed", value: totalLessons },
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
            {membersAssessed > 0 && <p className="text-[11px] text-slate-400">{membersAssessed} of {seatsUsed} assessed</p>}
          </div>

          {membersAssessed === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500 max-w-md mx-auto">No skill checks yet. Once your team takes the assessment, their biggest skill gaps and a team readiness score map here automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-5">
              {/* readiness + impact */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center flex flex-col justify-center">
                <p className="text-4xl font-black text-slate-900 tabular-nums leading-none">{teamReadiness ?? "—"}<span className="text-lg text-slate-400">%</span></p>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1.5">Avg readiness</p>
                <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-center">
                  <div><p className="text-base font-black text-slate-900 tabular-nums">{deployedCount}</p><p className="text-[9px] text-slate-400 uppercase tracking-wide">Deployed</p></div>
                  <div><p className="text-base font-black text-slate-900 tabular-nums">{avgScore != null ? `${avgScore}%` : "—"}</p><p className="text-[9px] text-slate-400 uppercase tracking-wide">Avg score</p></div>
                </div>
              </div>

              {/* skill gaps */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">Biggest skill gaps</p>
                <div className="space-y-2">
                  {topWeak.map((w) => (
                    <div key={w.topic} className="flex items-center gap-3">
                      <span className="text-xs text-slate-700 w-36 sm:w-44 truncate capitalize">{w.topic}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.round((w.count / membersAssessed) * 100)}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 tabular-nums w-20 text-right">{w.count}/{membersAssessed} weak</span>
                    </div>
                  ))}
                </div>
                {topStrong.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Team strengths</p>
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
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Seat usage</p>
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
          <BulkInvite seatsLeft={seatsLeft} />
          <div className="mt-4 pt-4 border-t border-brand/10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Or share a link</p>
            <CopyInviteLink url={inviteUrl} />
          </div>
          {pendingCount > 0 && (
            <p className="text-[11px] text-slate-500 mt-3">
              Pending: {pendingInvites!.slice(0, 5).map((i) => i.email).join(", ")}{pendingCount > 5 ? ` +${pendingCount - 5} more` : ""}
            </p>
          )}
        </div>

        {/* Roster */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-900">Team progress</p>
            <span className="text-xs text-slate-400">{roster.length} member{roster.length !== 1 ? "s" : ""}</span>
          </div>
          {roster.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">No one&apos;s joined yet. Invite your team above to get them started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <th className="px-5 py-2.5 font-bold">Member</th>
                    <th className="px-3 py-2.5 font-bold">Track</th>
                    <th className="px-3 py-2.5 font-bold">Level</th>
                    <th className="px-3 py-2.5 font-bold text-center">Lessons</th>
                    <th className="px-3 py-2.5 font-bold text-center">Projects</th>
                    <th className="px-5 py-2.5 font-bold text-right">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((r) => (
                    <tr key={r.studentId} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900">{r.name}</p>
                        <p className="text-[11px] text-slate-400">{r.email}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{r.track}</td>
                      <td className="px-3 py-3 text-slate-600 capitalize">{r.level}</td>
                      <td className="px-3 py-3 text-center font-bold text-slate-900 tabular-nums">{r.lessons}</td>
                      <td className="px-3 py-3 text-center font-bold text-slate-900 tabular-nums">{r.projects}</td>
                      <td className="px-5 py-3 text-right text-slate-500 tabular-nums">{fmtDate(r.lastActive)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400 mt-5 text-center">
          Workers use the normal Square 1 Ai student experience. You see their progress here, scoped to your team only.
        </p>
      </main>
    </div>
  );
}
