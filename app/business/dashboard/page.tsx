import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/ui/logo";
import { CopyInviteLink } from "@/components/business/CopyInviteLink";

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
    .from("organizations").select("id, name, seats, join_code").eq("id", mgr.org_id).maybeSingle();
  if (!org) redirect("/business");

  // Members (workers)
  const { data: members } = await admin
    .from("org_members").select("student_id, created_at").eq("org_id", org.id).eq("role", "member");
  const memberIds = (members ?? []).map((m) => m.student_id);

  let roster: MemberRow[] = [];
  if (memberIds.length > 0) {
    const [{ data: studs }, { data: enrs }, { data: comps }, { data: subs }] = await Promise.all([
      admin.from("students").select("id, name, email").in("id", memberIds),
      admin.from("student_enrollments").select("student_id, assessment_level, course:courses(title)").in("student_id", memberIds).eq("status", "active"),
      admin.from("lesson_completions").select("student_id, completed_at").in("student_id", memberIds),
      admin.from("project_submissions").select("student_id, score").in("student_id", memberIds).not("score", "is", null),
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
    for (const s of subs ?? []) projByStud.set(s.student_id, (projByStud.get(s.student_id) ?? 0) + 1);

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
            <p className="text-sm text-slate-500 mt-0.5">{seatsUsed} of {org.seats} seats filled · free during early access</p>
          </div>
        </div>

        {/* Rollups */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Seats used", value: `${seatsUsed}/${org.seats}` },
            { label: "Active this week", value: activeThisWeek },
            { label: "Lessons completed", value: totalLessons },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-2xl font-black text-slate-900 tabular-nums">{s.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Invite link */}
        <div className="rounded-2xl border border-brand/20 bg-brand/[0.04] p-5 mb-6">
          <p className="text-sm font-bold text-slate-900 mb-1">Invite your team</p>
          <p className="text-xs text-slate-600 mb-3">Share this link — anyone who opens it claims a seat and starts learning. ({Math.max(0, org.seats - seatsUsed)} seats left)</p>
          <CopyInviteLink url={inviteUrl} />
        </div>

        {/* Roster */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-900">Team progress</p>
            <span className="text-xs text-slate-400">{roster.length} member{roster.length !== 1 ? "s" : ""}</span>
          </div>
          {roster.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">No one&apos;s joined yet. Share the invite link above to get your team started.</p>
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
          Workers use the normal Square 1 student experience. You see their progress here, scoped to your team only.
        </p>
      </main>
    </div>
  );
}
