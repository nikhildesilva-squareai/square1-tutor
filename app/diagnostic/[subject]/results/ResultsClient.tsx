"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ShareResultButton } from "@/components/ShareResultButton";
import { FOUNDING_PLANS } from "@/lib/founding";
import {
  getDiagnostic,
  getSubject,
  scoreDiagnostic,
  decodeAnswers,
  getTopicResults,
  encodeAnswers,
  SUBJECT_SEO,
} from "@/lib/diagnostic";

// ═══════════════════════════════════════════════════════════════════════════════
// Skill-scan results — the product's highest-traffic conversion surface.
// Presented as a BENTO DASHBOARD: the result itself doubles as a preview of the
// product a student is buying. Real (unlocked) tiles show their actual answers;
// locked tiles are clearly-marked previews of the full report (never fake data).
// Light, on-brand: white tiles on #F8FAFC, #0056CE the single data colour,
// emerald = pass/free, soft red = a missed topic. Desktop = bento; mobile = stack.
// ═══════════════════════════════════════════════════════════════════════════════

const C = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  tint: "#F8FAFC",
  border: "#E8EEF5",
  borderStrong: "#D8E2ED",
  ink: "#0F172A",
  sec: "#475569",
  sec2: "#64748B",
  ter: "#94A3B8",
  blue: "#0056CE",
  blueBright: "#3388FF",
  success: "#19A65F",
  error: "#D93636",
};
const FIGTREE = "var(--font-figtree), system-ui, sans-serif";
const CTA_GRADIENT = "linear-gradient(#1871ED, #1156B6)";
const CTA_INSET = "inset 0 -1px 4px 0 #0056CE";
const SHADOW_XS = "0 1px 2px 0 rgba(21,47,84,0.04)";

const READINESS_BANDS = ["Novice", "Developing", "Competent", "Proficient", "Expert"];
function getBandIndex(score: number) {
  return Math.max(0, Math.min(4, score <= 1 ? 0 : score - 1));
}
const ASPIRATIONAL: Record<string, string> = {
  "0": "You've found all five focus areas — now you know exactly where to start.",
  "1": "One down, four to go. You've got a foundation to build on.",
  "2": "Solid start. You've got the basics — the gaps are exactly what your plan targets.",
  "3": "Strong showing — three of five means you're past the fundamentals.",
  "4": "Impressive. You're close to proficient — one area to sharpen.",
  "5": "Outstanding — you nailed every topic. The full assessment will push you deeper.",
};

const eyebrow: React.CSSProperties = {
  fontFamily: FIGTREE, fontWeight: 700, fontSize: 12, letterSpacing: "0.12em",
  textTransform: "uppercase", color: C.sec2,
};
const tileBase: React.CSSProperties = {
  background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: SHADOW_XS,
};

/* ── Topic-coverage radar (light) ─────────────────────────────────────────── */
function LightRadar({ axes }: { axes: { label: string; pass: boolean }[] }) {
  const N = axes.length;
  const CX = 160, CY = 108, R = 66, MISS = 0.16 * R;
  const pt = (i: number, r: number): [number, number] => {
    const a = (2 * Math.PI * i) / N - Math.PI / 2;
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  };
  const poly = (r: number) => axes.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(",")).join(" ");
  const dataPts: [number, number][] = axes.map((ax, i) => pt(i, ax.pass ? R : MISS));
  return (
    <svg viewBox="0 0 320 216" width="100%" style={{ maxWidth: 340 }}>
      <polygon points={poly(0.4 * R)} fill="none" stroke="#E2E8F0" strokeWidth={1} strokeDasharray="3 3" />
      <polygon points={poly(0.7 * R)} fill="none" stroke="#E2E8F0" strokeWidth={1} strokeDasharray="3 3" />
      <polygon points={poly(R)} fill="none" stroke={C.borderStrong} strokeWidth={1.25} />
      <g stroke={C.border} strokeWidth={1}>
        {axes.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={CX} y1={CY} x2={x} y2={y} />; })}
      </g>
      <polygon points={dataPts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}
        fill="rgba(0,86,206,0.10)" stroke={C.blue} strokeWidth={2} strokeLinejoin="round" />
      <g fill={C.blue}>{dataPts.map(([x, y], i) => axes[i].pass ? <circle key={i} cx={x} cy={y} r={3.5} /> : null)}</g>
      <g fontFamily="var(--font-inter-tight), system-ui" fontSize={11} fill={C.sec2} fontWeight={500}>
        {axes.map((ax, i) => {
          const [lx, ly] = pt(i, R + 22);
          const anchor = lx < CX - 6 ? "end" : lx > CX + 6 ? "start" : "middle";
          return <text key={i} x={lx.toFixed(0)} y={ly.toFixed(0)} textAnchor={anchor} dominantBaseline="middle">{ax.label}</text>;
        })}
      </g>
    </svg>
  );
}

/* ── AI brain — built from THIS student's answers ──────────────────────────────
   One "lobe" per question: a hub node + a small synapse constellation. A lobe
   lights up (bright, filled, pulsing) where they answered correctly and dims
   (slate, hollow, still) where they missed — so the picture is literally their
   result, not decoration. Correctness is encoded by BOTH brightness and fill-vs-
   hollow (never colour alone). Layout is deterministically seeded, so the same
   answers always draw the same brain and SSR/client never mismatch. */
function AIBrain({ topics, maxWidth = 600 }: { topics: { topic: string; correct: boolean }[]; maxWidth?: number }) {
  const LIT = C.blue, LIT2 = C.blueBright, DIM = "#9AAEC6";
  const CX = 170, CY = 92;

  // Tiny seeded PRNG (mulberry32) — deterministic, so no Math.random at render.
  const seeded = (seed: number) => {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Brain-silhouette hub anchors (two frontal-tops, two lowers, a crown). Use the
  // first N; if a bank ever has >8 questions, wrap the extras onto an ellipse.
  const ANCHORS: [number, number][] = [
    [82, 68], [134, 132], [170, 52], [206, 132], [258, 68],
    [108, 104], [232, 104], [170, 138],
  ];
  const n = topics.length;
  const hubs = topics.map((t, i) => {
    let x: number, y: number;
    if (i < ANCHORS.length) { [x, y] = ANCHORS[i]; }
    else {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      x = CX + Math.cos(a) * 112; y = CY + Math.sin(a) * 56;
    }
    const rnd = seeded(i * 1013 + 71);
    const k = 5 + Math.floor(rnd() * 3); // 5–7 synapses per lobe
    const sats = Array.from({ length: k }, (_, j) => {
      const ang = (j / k) * Math.PI * 2 + rnd() * 1.2;
      const rad = 15 + rnd() * 15;
      return { x: x + Math.cos(ang) * rad, y: y + Math.sin(ang) * rad * 0.82, r: 1.8 + rnd() * 1.5 };
    });
    return { x, y, correct: t.correct, sats };
  });
  const litCount = topics.filter((t) => t.correct).length;

  return (
    <div style={{ width: "100%", maxWidth, margin: "0 auto" }}>
      <svg viewBox="0 0 340 184" width="100%" role="img"
        aria-label={`Neural map of your answers — ${litCount} of ${n} topics lit up.`}>
        <defs>
          <radialGradient id="brainGlow" cx="50%" cy="48%" r="58%">
            <stop offset="0%" stopColor={LIT2} stopOpacity="0.22" />
            <stop offset="100%" stopColor={LIT2} stopOpacity="0" />
          </radialGradient>
          <filter id="brainBlur" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <ellipse cx={CX} cy={CY} rx="160" ry="82" fill="url(#brainGlow)" />

        {/* brain outline — hub-to-hub contour */}
        <g stroke={C.border} strokeWidth={1.2}>
          {hubs.map((h, i) => {
            const nh = hubs[(i + 1) % hubs.length];
            return <line key={`c${i}`} x1={h.x} y1={h.y} x2={nh.x} y2={nh.y} />;
          })}
        </g>

        {/* core → hub axons (correct ones carry a flowing signal) */}
        <g fill="none" strokeWidth={1.4}>
          {hubs.map((h, i) => (
            <line key={`a${i}`} x1={CX} y1={CY} x2={h.x} y2={h.y}
              stroke={h.correct ? LIT2 : DIM} opacity={h.correct ? 0.42 : 0.2}
              strokeDasharray={h.correct ? "2.5 5" : undefined}
              className={h.correct ? "axon-flow" : undefined} />
          ))}
        </g>

        {/* per-lobe synapses + nodes */}
        {hubs.map((h, i) => (
          <g key={`h${i}`}>
            {h.correct && <circle cx={h.x} cy={h.y} r={13} fill={LIT} opacity={0.16} filter="url(#brainBlur)" />}
            <g stroke={h.correct ? LIT2 : DIM} strokeWidth={1} opacity={h.correct ? 0.48 : 0.26}>
              {h.sats.map((s, j) => <line key={j} x1={h.x} y1={h.y} x2={s.x} y2={s.y} />)}
            </g>
            {h.sats.map((s, j) =>
              h.correct
                ? <circle key={j} cx={s.x} cy={s.y} r={s.r} fill={LIT} opacity={0.9} />
                : <circle key={j} cx={s.x} cy={s.y} r={s.r} fill="none" stroke={DIM} strokeWidth={1.1} opacity={0.7} />
            )}
            {h.correct
              ? <circle cx={h.x} cy={h.y} r={6.5} fill={LIT} className="brain-pulse" style={{ animationDelay: `${(i % 5) * 0.3}s` }} />
              : <circle cx={h.x} cy={h.y} r={5.2} fill={C.card} stroke={DIM} strokeWidth={2} />}
          </g>
        ))}

        {/* AI core */}
        <circle cx={CX} cy={CY} r={13} fill={LIT} opacity={0.16} filter="url(#brainBlur)" />
        <circle cx={CX} cy={CY} r={9.5} fill={C.card} stroke={LIT} strokeWidth={2} />
        <circle cx={CX} cy={CY} r={4.5} fill={LIT} className="brain-pulse" />
      </svg>
    </div>
  );
}

/* ── Topic mastery — a real bar chart of the student's per-topic result ──────
   The diagnostic asks one question per topic, so a topic is either answered
   correctly or not. Encoded as a full (correct) vs stub (missed) bar, sorted
   correct-first so it reads as a ranked chart. No invented percentages — the
   sub-note states the one-question-per-topic basis honestly. */
function TopicMasteryBars({ topics, className }: { topics: { topic: string; correct: boolean }[]; className?: string }) {
  const rows = [...topics].sort((a, b) => Number(b.correct) - Number(a.correct));
  return (
    <div className={className} style={{ ...tileBase, padding: 20 }}>
      <div style={{ ...eyebrow, marginBottom: 4 }}>Topic mastery</div>
      <p style={{ fontSize: 12, color: C.sec2, margin: "0 0 16px" }}>One question per topic — a full bar means you nailed it.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {rows.map((t, i) => {
          const col = t.correct ? C.success : C.error;
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{t.topic}</span>
                <span style={{ fontFamily: FIGTREE, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: col }}>{t.correct ? "Correct" : "Review"}</span>
              </div>
              <div style={{ height: 9, borderRadius: 999, background: "#EEF3F9", overflow: "hidden" }}>
                <div style={{ width: t.correct ? "100%" : "15%", height: "100%", borderRadius: 999, background: col }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Skill matrix — the diagnostic's per-topic result as a competency grid ────
   Each tested topic is a row tinted by result, with a Demonstrated / Not yet
   status chip and the "why it matters" note. Binary status only (one question
   per topic) — no fabricated proficiency levels. */
function SkillMatrixTile({ topics, relevance, score, total, className }: { topics: { topic: string; correct: boolean }[]; relevance: Record<string, string>; score: number; total: number; className?: string }) {
  return (
    <div className={className} style={{ ...tileBase, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ ...eyebrow }}>Skill matrix</div>
        <span style={{ fontFamily: FIGTREE, fontSize: 11, fontWeight: 700, color: C.sec }}>{score}/{total} demonstrated</span>
      </div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        {topics.map((t, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            padding: "10px 12px",
            borderTop: i === 0 ? "none" : `1px solid ${C.border}`,
            background: t.correct ? "rgba(25,166,95,0.05)" : "rgba(217,54,54,0.04)",
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{t.topic}</div>
              <div title={relevance[t.topic] ?? ""} style={{ fontSize: 11, color: C.ter, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>{relevance[t.topic] ?? ""}</div>
            </div>
            <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FIGTREE, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: t.correct ? C.success : C.error, background: t.correct ? "rgba(25,166,95,0.1)" : "rgba(217,54,54,0.09)", padding: "3px 9px", borderRadius: 999 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: t.correct ? C.success : C.error }} />
              {t.correct ? "Demonstrated" : "Not yet"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type CoursePath = { modules: { title: string; lessons: number }[]; guidedHours: number; totalLessons: number; totalProjects: number };

/* ── Strengths & gaps — a donut of correct vs to-improve + edge/focus lines ─── */
function StrengthsDonut({ topics, score, total, className }: { topics: { topic: string; correct: boolean }[]; score: number; total: number; className?: string }) {
  const strong = topics.filter((t) => t.correct).map((t) => t.topic);
  const weak = topics.filter((t) => !t.correct).map((t) => t.topic);
  const R = 42, CIRC = 2 * Math.PI * R, frac = total ? score / total : 0;
  return (
    <div className={className} style={{ ...tileBase, padding: 20 }}>
      <div style={{ ...eyebrow, marginBottom: 14 }}>Strengths &amp; gaps</div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <svg width={110} height={110} viewBox="0 0 110 110" style={{ flexShrink: 0 }} role="img" aria-label={`${score} of ${total} topics correct`}>
          <circle cx={55} cy={55} r={R} fill="none" stroke={C.error} strokeOpacity={0.16} strokeWidth={12} />
          <circle cx={55} cy={55} r={R} fill="none" stroke={C.success} strokeWidth={12} strokeLinecap="round"
            strokeDasharray={`${(frac * CIRC).toFixed(1)} ${CIRC.toFixed(1)}`} transform="rotate(-90 55 55)" />
          <text x={55} y={53} textAnchor="middle" fontSize={24} fontWeight={800} fill={C.ink}>{score}</text>
          <text x={55} y={69} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={C.ter} letterSpacing="0.08em">OF {total}</text>
        </svg>
        <div style={{ minWidth: 0, flex: "1 1 130px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={{ fontFamily: FIGTREE, fontSize: 10.5, fontWeight: 700, color: C.success, letterSpacing: "0.06em", textTransform: "uppercase" }}>Your edge</div>
            <div style={{ fontSize: 12.5, color: C.sec, marginTop: 2 }}>{strong.length ? strong.join(" · ") : "Building the fundamentals"}</div>
          </div>
          <div>
            <div style={{ fontFamily: FIGTREE, fontSize: 10.5, fontWeight: 700, color: C.error, letterSpacing: "0.06em", textTransform: "uppercase" }}>Your focus</div>
            <div style={{ fontSize: 12.5, color: C.sec, marginTop: 2 }}>{weak.length ? weak.join(" · ") : "You're across all five — go deeper"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Role readiness — how many core areas for the track's role are covered ──── */
function RoleReadiness({ score, total, role, coursePath, className }: { score: number; total: number; role: string; coursePath: CoursePath | null; className?: string }) {
  const frac = total ? score / total : 0;
  return (
    <div className={className} style={{ ...tileBase, padding: 20, display: "flex", flexDirection: "column" }}>
      <div style={{ ...eyebrow, marginBottom: 6 }}>Role readiness</div>
      <p style={{ fontSize: 13, color: C.sec2, margin: "0 0 14px" }}>Core areas a {role} is screened on.</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 9 }}>
        <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: C.ink }}>{score}</span>
        <span style={{ fontSize: 14, color: C.ter, fontWeight: 600 }}>of {total} covered</span>
      </div>
      <div style={{ height: 9, borderRadius: 999, background: "#EEF3F9", overflow: "hidden" }}>
        <div style={{ width: `${frac * 100}%`, height: "100%", borderRadius: 999, background: CTA_GRADIENT }} />
      </div>
      {coursePath && (
        <p style={{ fontSize: 12, color: C.ter, margin: "auto 0 0", paddingTop: 14 }}>
          The full track goes far deeper — {coursePath.totalLessons} lessons across {coursePath.modules.length} modules.
        </p>
      )}
    </div>
  );
}

/* ── Roadmap — the real course path, flagging modules that hit a weak topic ───
   Modules come straight from the DB (order + lesson counts). A module is flagged
   "targets your gap" only on a confident keyword overlap (≥4-char shared word)
   with a missed topic — conservative so we never claim a mapping that isn't real. */
function Roadmap({ coursePath, weakTopics, track, className }: { coursePath: CoursePath; weakTopics: string[]; track: string; className?: string }) {
  const { modules, guidedHours, totalProjects } = coursePath;
  const weeks = Math.max(1, Math.round(guidedHours / 7)); // ~1h/day
  const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length >= 4);
  const weakWords = new Set(weakTopics.flatMap(words));
  return (
    <div className={className} style={{ ...tileBase, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ ...eyebrow, marginBottom: 8 }}>Your path to job-ready</div>
          <p style={{ fontSize: 14, color: C.sec2, margin: 0, maxWidth: 520 }}>
            The real {track} track, in order.{weakTopics.length ? " Modules that target your gaps are flagged." : " Start at module one and build up."}
          </p>
        </div>
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: C.ink }}>~{guidedHours}h</div>
          <div style={{ fontFamily: FIGTREE, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.ter, marginTop: 4 }}>
            {totalProjects > 0 ? `+ ${totalProjects} projects · ` : ""}~{weeks} wks at 1h/day
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginTop: 18 }}>
        {modules.map((m, i) => {
          const hit = words(m.title).some((w) => weakWords.has(w));
          return (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 12px", borderRadius: 10, border: `1px solid ${hit ? C.borderStrong : C.border}`, background: hit ? "rgba(0,86,206,0.03)" : C.card }}>
              <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 999, background: hit ? C.blue : C.tint, color: hit ? "#FFFFFF" : C.sec2, border: hit ? "none" : `1px solid ${C.border}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, fontFamily: FIGTREE }}>{i + 1}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{m.title}</div>
                <div style={{ fontSize: 11.5, color: hit ? C.blue : C.ter, marginTop: 1 }}>{m.lessons} lessons{hit ? " · targets your gap" : ""}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ResultsClient({ initialSeats = null, coursePath = null }: { initialSeats?: { left: number; cap: number } | null; coursePath?: CoursePath | null }) {
  const params = useParams<{ subject: string }>();
  const searchParams = useSearchParams();
  const slug = params.subject;
  const subject = getSubject(slug);
  const seo = SUBJECT_SEO[slug];
  const answers = decodeAnswers(searchParams.get("a"));

  const [seats, setSeats] = useState<{ left: number; cap: number } | null>(initialSeats);
  useEffect(() => {
    fetch("/api/free-access/status")
      .then((r) => r.json())
      .then((d) => { if (d?.open && typeof d.remaining === "number") setSeats({ left: d.remaining, cap: d.cap ?? 500 }); })
      .catch(() => {});
  }, []);

  if (!subject || !seo || !answers) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: C.bg, color: C.ink }}>
        <p className="text-lg mb-4" style={{ color: C.sec2 }}>Invalid or missing results.</p>
        <Link href={`/diagnostic/${slug || ""}`} className="text-sm font-semibold hover:underline" style={{ color: C.blue }}>
          Take the skill check
        </Link>
      </div>
    );
  }

  const questions = getDiagnostic(slug);
  const result = scoreDiagnostic(questions, answers);
  const topicResults = getTopicResults(questions, answers);
  const bandIdx = getBandIndex(result.score);
  const bandLabel = READINESS_BANDS[bandIdx];

  const origin = typeof window !== "undefined" ? window.location.origin : "https://square1-tutor.vercel.app";
  const answersParam = encodeAnswers(answers);
  const shareUrl = `${origin}/diagnostic/${slug}/results?a=${answersParam}`;
  const readinessScore = ((result.score / result.total) * 10).toFixed(1);
  const pct = result.score / result.total;
  const signupHref = `/signup?subject=${slug}`;

  const RING_C = 2 * Math.PI * 58;
  const ringDash = `${(pct * RING_C).toFixed(1)} ${RING_C.toFixed(1)}`;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: "var(--font-inter-tight), 'Inter Tight', system-ui, sans-serif" }}>
      {/* App bar */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center" }} aria-label="Square 1 AI home">
          <Logo variant="dark" size="md" />
        </Link>
        <Link href="/login" style={{ fontSize: 15, fontWeight: 500, color: C.sec }}>Sign in</Link>
      </header>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "36px 20px 64px" }}>

        {/* Heading */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ ...eyebrow, color: C.ter, marginBottom: 6 }}>Your Square 1 AI skill scan · {subject.title}</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.1 }}>
            You're <span style={{ color: C.blue }}>{bandLabel}</span> in {subject.title}.
          </h1>
        </div>

        {/* ── BENTO ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">

          {/* Result hero */}
          <div className="lg:col-span-2" style={{ ...tileBase, padding: 22 }}>
            <div style={{ ...eyebrow, marginBottom: 16 }}>Your result</div>
            <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
              <div style={{ position: "relative", width: 128, height: 128, flexShrink: 0 }}>
                <svg viewBox="0 0 140 140" width={128} height={128}>
                  <circle cx={70} cy={70} r={58} fill="none" stroke={C.border} strokeWidth={10} />
                  <circle cx={70} cy={70} r={58} fill="none" stroke={C.blue} strokeWidth={10} strokeLinecap="round" strokeDasharray={ringDash} transform="rotate(-90 70 70)" />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 30, letterSpacing: "-0.02em" }}>{readinessScore}<span style={{ fontSize: 16, color: C.ter }}>/10</span></div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: C.blue }}>readiness</div>
                </div>
              </div>
              <div style={{ minWidth: 140 }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>{bandLabel}</div>
                <div style={{ fontSize: 14, color: C.sec2, marginTop: 4 }}>{result.score} of {result.total} correct on the snapshot</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.5, color: C.sec2, margin: "12px 0 0", maxWidth: 300 }}>
                  {ASPIRATIONAL[String(result.score)] ?? result.blurb}
                </p>
              </div>
            </div>
            {/* Level band */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {READINESS_BANDS.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 7, borderRadius: 999, background: i <= bandIdx ? C.blue : C.border }} />
                ))}
              </div>
              <div style={{ display: "flex" }}>
                {READINESS_BANDS.map((name, i) => (
                  <div key={name} style={{ flex: 1, textAlign: "center", fontSize: 11.5, fontWeight: i === bandIdx ? 700 : 500, color: i === bandIdx ? C.blue : C.ter }}>{name}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Skill map radar */}
          <div className="lg:col-span-2" style={{ ...tileBase, padding: 22, display: "flex", flexDirection: "column" }}>
            <div style={{ ...eyebrow, marginBottom: 8 }}>Your skill map</div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LightRadar axes={topicResults.map((t) => ({ label: t.topic, pass: t.correct }))} />
            </div>
          </div>

          {/* AI brain — full-width hero band (mirrors the in-app Skill brain) */}
          <div className="lg:col-span-4" style={{ ...tileBase, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ maxWidth: 560 }}>
                <div style={{ ...eyebrow, marginBottom: 8 }}>Your AI Brain</div>
                <p style={{ fontSize: 14.5, lineHeight: 1.5, color: C.sec2, margin: 0 }}>
                  Each lobe is one of your {result.total} answers — the brighter it glows, the sharper the skill. Nova scores every one and explains the gaps.
                </p>
              </div>
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em", color: C.ink }}>
                  {result.score}<span style={{ color: C.ter, fontWeight: 700 }}> / {result.total}</span>
                </div>
                <div style={{ fontFamily: FIGTREE, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.ter, marginTop: 5 }}>Topics lit</div>
              </div>
            </div>

            <div style={{ margin: "6px auto 0", maxWidth: 620, borderRadius: 14, background: "radial-gradient(58% 70% at 50% 46%, rgba(0,86,206,0.06), transparent 72%)" }}>
              <AIBrain topics={topicResults} maxWidth={600} />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: C.sec2 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: C.blue }} /> Nailed it
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, border: "1.6px solid #9AAEC6", background: C.card }} /> To strengthen
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.sec }}>{result.score} of {result.total} correct</span>
            </div>
          </div>

          {/* Topic mastery — measured bar chart, straight after the brain */}
          <TopicMasteryBars topics={topicResults} className="lg:col-span-2" />

          {/* Skill matrix — measured from the diagnostic (was a locked preview) */}
          <SkillMatrixTile topics={topicResults} relevance={seo.topicRelevance} score={result.score} total={result.total} className="lg:col-span-2" />

          {/* Strengths vs gaps donut */}
          <StrengthsDonut topics={topicResults} score={result.score} total={result.total} className="lg:col-span-2" />

          {/* Role readiness — core areas covered for the track's role */}
          <RoleReadiness score={result.score} total={result.total} role={subject.role} coursePath={coursePath} className="lg:col-span-2" />

          {/* Your path to job-ready — real curriculum roadmap (hidden if no course) */}
          {coursePath && coursePath.modules.length > 0 && (
            <Roadmap coursePath={coursePath} weakTopics={topicResults.filter((t) => !t.correct).map((t) => t.topic)} track={subject.title} className="lg:col-span-4" />
          )}

          {/* Share — full-width band */}
          <div className="lg:col-span-4" style={{ ...tileBase, padding: 26, textAlign: "center" }}>
            <div style={{ ...eyebrow, marginBottom: 6 }}>Share your result</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 4px" }}>Show them where you stand.</h3>
            <p style={{ fontSize: 13.5, color: C.sec2, margin: "0 auto 20px", maxWidth: 440 }}>
              Post your {bandLabel} skill scan — or dare a friend to beat it.
            </p>
            <ShareResultButton
              percentage={Math.round(pct * 100)}
              level={bandLabel}
              courseTitle={subject.title}
              shareUrl={shareUrl}
              subject={slug}
              answersParam={answersParam}
            />
          </div>

          {/* Offer band */}
          <div className="lg:col-span-4" style={{ background: C.card, border: `2px solid ${C.blue}`, borderRadius: 14, boxShadow: "0 8px 24px -12px rgba(21,47,84,0.2)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <div style={{ minWidth: 260 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 30, padding: "0 14px", borderRadius: 999, border: `1px solid ${C.borderStrong}`, fontSize: 13, fontWeight: 700, color: C.success, background: C.tint, marginBottom: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: C.success }} />
                  {seats ? `Free early access — ${seats.left} of ${seats.cap} seats left` : "Free during early access"}
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>Unlock your full report — free</h2>
                <p style={{ fontSize: 14, color: C.sec2, margin: "6px 0 0", maxWidth: 460 }}>
                  20 questions incl. real code, AI-graded — plus the tracking, matrix, and projects above. Founding rate locked for life.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 260 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {FOUNDING_PLANS.map((p) => (
                    <div key={p.months} style={{ position: "relative", flex: 1, background: C.card, border: p.popular ? `1.5px solid ${C.blue}` : `1px solid ${C.borderStrong}`, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
                      {p.popular && (
                        <span style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", background: C.blue, color: "#FFFFFF", fontFamily: FIGTREE, fontWeight: 700, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>Popular</span>
                      )}
                      <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>{p.perMonth}</div>
                      <div style={{ fontSize: 11, color: C.ter }}>{p.months}-mo</div>
                    </div>
                  ))}
                </div>
                <Link href={signupHref} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 10, background: CTA_GRADIENT, boxShadow: CTA_INSET, color: "#FFFFFF", fontWeight: 700, fontSize: 16 }}>
                  Get my full report — free →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12, fontSize: 15, fontWeight: 500, marginTop: 28 }}>
          <Link href={`/diagnostic/${slug}`} style={{ color: C.blue }}>Take the {subject.title} skill check yourself →</Link>
          <Link href="/diagnostic" style={{ color: C.sec2 }}>← Try a different track</Link>
        </div>
      </div>

      <style>{`
        .locked-tile { transition: border-color 160ms ease, box-shadow 160ms ease; }
        .locked-tile:hover { border-color: ${C.blue} !important; box-shadow: 0 8px 20px -12px rgba(21,47,84,0.22); }
        @keyframes brainPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.28; } }
        .brain-pulse { animation: brainPulse 2.6s ease-in-out infinite; }
        @keyframes axonFlow { to { stroke-dashoffset: -18; } }
        .axon-flow { animation: axonFlow 1.4s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .brain-pulse, .axon-flow { animation: none; } }
      `}</style>
    </div>
  );
}
