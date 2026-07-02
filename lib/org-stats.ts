import { createAdminClient } from "@/lib/supabase/admin";
import { rollUpDomains, getCompetencyConfig, type DomainScore } from "@/lib/competency";

// Single source of truth for manager-portal + Team Impact Report numbers.
// All real data (no fabrication): roster, impact metrics, and skill-gap +
// readiness analytics (including pre→post movement) from skill_reports.

export interface OrgMemberRow {
  studentId: string;
  name: string;
  email: string;
  track: string;
  trackSlug: string | null;
  level: string;
  lessons: number;
  projects: number;
  completionPct: number;
  completed: boolean;
  completedAt: string | null;
  lastActive: string | null;
}

export interface TeamMatrix {
  courseSlug: string;
  courseTitle: string;
  domains: string[];                                  // column headers (domain names)
  rows: { name: string; cells: ({ pct: number; level: string } | null)[] }[]; // cells aligned to domains[]
  avg: (number | null)[];                             // team average % per domain
}

export interface OrgStats {
  org: { id: string; name: string; seats: number; join_code: string; plan: string | null; status: string | null; billing_interval: string | null };
  roster: OrgMemberRow[];
  pendingCount: number;
  pendingEmails: string[];
  seatsUsed: number;
  seatsLeft: number;
  activeThisWeek: number;
  totalLessons: number;
  completedCount: number;     // members who finished their track
  avgCompletion: number;      // avg % of track completed across members
  deployedCount: number;
  avgScore: number | null;        // avg Nova/project score %
  teamReadiness: number | null;   // avg latest assessment readiness %
  readinessDelta: number;         // latest avg − first avg (pre→post movement)
  membersAssessed: number;
  topWeak: { topic: string; count: number }[];
  topStrong: { topic: string; count: number }[];
  teamMatrices: TeamMatrix[];
}

export async function getOrgStats(orgId: string): Promise<OrgStats | null> {
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, seats, join_code, plan, status, billing_interval")
    .eq("id", orgId).maybeSingle();
  if (!org) return null;

  const [{ data: members }, { data: pending }] = await Promise.all([
    admin.from("org_members").select("student_id").eq("org_id", orgId).eq("role", "member"),
    admin.from("org_invites").select("email").eq("org_id", orgId).eq("status", "pending"),
  ]);
  const memberIds = (members ?? []).map((m) => m.student_id);
  const pendingEmails = (pending ?? []).map((p) => p.email as string);

  let roster: OrgMemberRow[] = [];
  let deployedCount = 0;
  let avgScore: number | null = null;
  let teamReadiness: number | null = null;
  let readinessDelta = 0;
  let membersAssessed = 0;
  let topWeak: { topic: string; count: number }[] = [];
  let topStrong: { topic: string; count: number }[] = [];
  let teamMatrices: TeamMatrix[] = [];

  if (memberIds.length > 0) {
    const [{ data: studs }, { data: enrs }, { data: comps }, { data: subs }, { data: reports }] = await Promise.all([
      admin.from("students").select("id, name, email").in("id", memberIds),
      admin.from("student_enrollments").select("student_id, assessment_level, course:courses(title, slug, total_lessons)").in("student_id", memberIds).eq("status", "active"),
      admin.from("lesson_completions").select("student_id, completed_at").in("student_id", memberIds),
      admin.from("project_submissions").select("student_id, score, max_score, live_url").in("student_id", memberIds),
      admin.from("skill_reports").select("student_id, course_id, topic_mastery_json, weak_topics, strong_topics, estimated_score, max_score, created_at").in("student_id", memberIds),
    ]);

    const studMap = new Map((studs ?? []).map((s) => [s.id, s]));
    const enrMap = new Map<string, { level: string; track: string; slug: string | null; total: number }>();
    for (const e of (enrs ?? []) as unknown as Array<{ student_id: string; assessment_level: string | null; course: { title: string; slug: string; total_lessons: number } | null }>) {
      if (!enrMap.has(e.student_id)) enrMap.set(e.student_id, { level: e.assessment_level ?? "—", track: e.course?.title ?? "—", slug: e.course?.slug ?? null, total: e.course?.total_lessons ?? 0 });
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

    const weakByStud = new Map<string, Set<string>>();
    const strongByStud = new Map<string, Set<string>>();
    const reportsByStud = new Map<string, { pct: number; at: string }[]>();
    for (const r of (reports ?? []) as Array<{ student_id: string; weak_topics: string[] | null; strong_topics: string[] | null; estimated_score: number | null; max_score: number | null; created_at: string }>) {
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
        const arr = reportsByStud.get(r.student_id) ?? [];
        arr.push({ pct, at: r.created_at });
        reportsByStud.set(r.student_id, arr);
      }
    }
    membersAssessed = new Set([...weakByStud.keys(), ...reportsByStud.keys()]).size;

    // Readiness: latest avg + pre→post delta (per student first vs latest by date)
    const firsts: number[] = [];
    const lasts: number[] = [];
    for (const arr of reportsByStud.values()) {
      arr.sort((a, b) => a.at.localeCompare(b.at));
      firsts.push(arr[0].pct);
      lasts.push(arr[arr.length - 1].pct);
    }
    if (lasts.length) {
      teamReadiness = Math.round(lasts.reduce((a, b) => a + b, 0) / lasts.length);
      const firstAvg = firsts.reduce((a, b) => a + b, 0) / firsts.length;
      readinessDelta = Math.round(teamReadiness - firstAvg);
    }

    const tally = (m: Map<string, Set<string>>) => {
      const freq = new Map<string, number>();
      for (const set of m.values()) set.forEach((t) => freq.set(t, (freq.get(t) ?? 0) + 1));
      return [...freq.entries()].map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count);
    };
    topWeak = tally(weakByStud).slice(0, 8);
    topStrong = tally(strongByStud).slice(0, 6);

    // ── Team competency matrix (members × domains) — reuses the learner rollup ──
    type Rep = { student_id: string; course_id: string | null; topic_mastery_json: unknown; created_at: string };
    const repRows = (reports ?? []) as Rep[];
    const courseIds = [...new Set(repRows.map((r) => r.course_id).filter((c): c is string => !!c))];
    const { data: matrixCourses } = courseIds.length
      ? await admin.from("courses").select("id, slug, title").in("id", courseIds)
      : { data: [] as { id: string; slug: string; title: string }[] };
    const courseById = new Map((matrixCourses ?? []).map((c) => [c.id, c]));

    // Latest report per (student, course).
    const latestRep = new Map<string, Rep>();
    for (const r of repRows) {
      if (!r.course_id) continue;
      const key = `${r.student_id}|${r.course_id}`;
      const ex = latestRep.get(key);
      if (!ex || r.created_at > ex.created_at) latestRep.set(key, r);
    }

    // Group members' domain scores by course.
    const perCourse = new Map<string, { studentId: string; domains: DomainScore[] }[]>();
    for (const r of latestRep.values()) {
      const course = courseById.get(r.course_id!);
      if (!course) continue;
      const tm = Array.isArray(r.topic_mastery_json)
        ? (r.topic_mastery_json as Array<{ topic: string; correct: number; total: number }>)
        : [];
      const accum: Record<string, { correct: number; total: number }> = {};
      for (const t of tm) if (t && t.topic) accum[t.topic] = { correct: Number(t.correct) || 0, total: Number(t.total) || 0 };
      const domains = rollUpDomains(course.slug, accum);
      if (!domains || !domains.length) continue;
      const arr = perCourse.get(course.id) ?? [];
      arr.push({ studentId: r.student_id, domains });
      perCourse.set(course.id, arr);
    }

    for (const [courseId, entries] of perCourse) {
      const course = courseById.get(courseId)!;
      const cfg = getCompetencyConfig(course.slug);
      const domainNames = cfg
        ? cfg.domains.map((d) => d.name)
        : [...new Set(entries.flatMap((e) => e.domains.map((d) => d.domain)))];
      const rows = entries
        .map((e) => {
          const byName = new Map(e.domains.map((d) => [d.domain, d]));
          return {
            name: studMap.get(e.studentId)?.name ?? studMap.get(e.studentId)?.email?.split("@")[0] ?? "Member",
            cells: domainNames.map((dn) => {
              const d = byName.get(dn);
              return d ? { pct: d.percentage, level: d.level } : null;
            }),
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      const avg = domainNames.map((_, i) => {
        const vals = rows.map((r) => r.cells[i]?.pct).filter((v): v is number => v != null);
        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      });
      teamMatrices.push({ courseSlug: course.slug, courseTitle: course.title, domains: domainNames, rows, avg });
    }
    teamMatrices.sort((a, b) => b.rows.length - a.rows.length);

    roster = memberIds.map((id) => {
      const s = studMap.get(id);
      const enr = enrMap.get(id);
      const lessons = lessonsByStud.get(id) ?? 0;
      const total = enr?.total ?? 0;
      const completionPct = total > 0 ? Math.min(100, Math.round((lessons / total) * 100)) : 0;
      const isCompleted = total > 0 && lessons >= total;
      return {
        studentId: id,
        name: s?.name ?? (s?.email?.split("@")[0] ?? "Member"),
        email: s?.email ?? "",
        track: enr?.track ?? "—",
        trackSlug: enr?.slug ?? null,
        level: enr?.level ?? "—",
        lessons,
        projects: projByStud.get(id) ?? 0,
        completionPct,
        completed: isCompleted,
        completedAt: isCompleted ? (lastByStud.get(id) ?? null) : null,
        lastActive: lastByStud.get(id) ?? null,
      };
    });
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeThisWeek = roster.filter((r) => r.lastActive && new Date(r.lastActive).getTime() >= weekAgo).length;
  const totalLessons = roster.reduce((s, r) => s + r.lessons, 0);
  const completedCount = roster.filter((r) => r.completed).length;
  const avgCompletion = roster.length ? Math.round(roster.reduce((s, r) => s + r.completionPct, 0) / roster.length) : 0;
  const seatsUsed = roster.length;
  const seatsLeft = Math.max(0, org.seats - seatsUsed - pendingEmails.length);

  return {
    org: org as OrgStats["org"],
    roster,
    pendingCount: pendingEmails.length,
    pendingEmails,
    seatsUsed,
    seatsLeft,
    activeThisWeek,
    totalLessons,
    completedCount,
    avgCompletion,
    deployedCount,
    avgScore,
    teamReadiness,
    readinessDelta,
    membersAssessed,
    topWeak,
    topStrong,
    teamMatrices,
  };
}
