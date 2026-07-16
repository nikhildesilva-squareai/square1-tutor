"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
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
// Skill-scan results — the highest-traffic conversion surface in the product.
// Light, on-brand Square 1 design (Claude-Design handoff "Skill Snapshot"): white
// section cards on #F8FAFC, ONE data colour (#0056CE) for scores/charts, emerald
// only for pass/"free", soft red only for a missed topic. All values are driven by
// the real diagnostic answers — nothing here is hard-coded example data.
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
  success: "#19A65F",
  error: "#D93636",
};
const FIGTREE = "var(--font-figtree), system-ui, sans-serif";
const CTA_GRADIENT = "linear-gradient(#1871ED, #1156B6)";
const CTA_INSET = "inset 0 -1px 4px 0 #0056CE";
const SHADOW_XS = "0 1px 2px 0 rgba(21,47,84,0.04)";

const READINESS_BANDS = ["Novice", "Developing", "Competent", "Proficient", "Expert"];
function getBandIndex(score: number) {
  // 0-1 → Novice, 2 → Developing, 3 → Competent, 4 → Proficient, 5 → Expert
  return Math.max(0, Math.min(4, score <= 1 ? 0 : score - 1));
}

const ASPIRATIONAL: Record<string, string> = {
  "0": "You've identified all five focus areas. Now you know exactly where to start.",
  "1": "One down, four to go. You've got a foundation to build on.",
  "2": "Solid start. You've got the basics — the gaps are exactly what the learning path targets.",
  "3": "Strong showing. Three out of five means you're past the fundamentals.",
  "4": "Impressive. You're close to proficient — one area to sharpen.",
  "5": "Outstanding. You nailed every topic. The full assessment will challenge you deeper.",
};

const eyebrow: React.CSSProperties = {
  fontFamily: FIGTREE, fontWeight: 700, fontSize: 12, letterSpacing: "0.12em",
  textTransform: "uppercase", color: C.sec2,
};

/* ── Topic-coverage radar (light) ─────────────────────────────────────────────
   Pentagon: outer ring, two dashed inner rings, spokes; the data polygon reaches
   the outer ring on a passed topic and sits near the centre on a missed one, with
   a dot only on passed vertices. */
function LightRadar({ axes }: { axes: { label: string; pass: boolean }[] }) {
  const N = axes.length;
  const CX = 160, CY = 105, R = 62, MISS = 0.16 * R;
  const pt = (i: number, r: number): [number, number] => {
    const a = (2 * Math.PI * i) / N - Math.PI / 2;
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  };
  const poly = (r: number) => axes.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(",")).join(" ");
  const dataPts: [number, number][] = axes.map((ax, i) => pt(i, ax.pass ? R : MISS));

  return (
    <svg viewBox="0 0 320 210" width="100%" style={{ maxWidth: 360 }}>
      <polygon points={poly(0.4 * R)} fill="none" stroke="#E2E8F0" strokeWidth={1} strokeDasharray="3 3" />
      <polygon points={poly(0.7 * R)} fill="none" stroke="#E2E8F0" strokeWidth={1} strokeDasharray="3 3" />
      <polygon points={poly(R)} fill="none" stroke={C.borderStrong} strokeWidth={1.25} />
      <g stroke={C.border} strokeWidth={1}>
        {axes.map((_, i) => {
          const [x, y] = pt(i, R);
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} />;
        })}
      </g>
      <polygon points={dataPts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}
        fill="rgba(0,86,206,0.10)" stroke={C.blue} strokeWidth={2} strokeLinejoin="round" />
      <g fill={C.blue}>
        {dataPts.map(([x, y], i) => axes[i].pass ? <circle key={i} cx={x} cy={y} r={3.5} /> : null)}
      </g>
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

/* ── Full-report teaser vizzes (light, blue-only) ────────────────────────────── */
function VizRadar() {
  return (
    <svg viewBox="0 0 200 100" width="200" height="100">
      <polygon points="100,8 143,39 127,90 73,90 57,39" fill="none" stroke={C.borderStrong} strokeWidth={1.5} />
      <polygon points="100,35 121,50 113,75 87,75 79,50" fill="none" stroke="#E2E8F0" strokeWidth={1} strokeDasharray="3 3" />
      <polygon points="100,20 133,42 120,82 80,82 67,42" fill="rgba(0,86,206,0.10)" stroke={C.blue} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}
function VizBars() {
  const rows: [number, number][] = [[82, 120], [64, 94], [47, 69], [71, 104]];
  return (
    <svg viewBox="0 0 200 100" width="200" height="100">
      {rows.map(([pct, w], i) => (
        <g key={i}>
          <rect x={10} y={12 + i * 22} width={140} height={8} rx={4} fill={C.border} />
          <rect x={10} y={12 + i * 22} width={w} height={8} rx={4} fill={i % 2 ? "#1871ED" : C.blue} />
          <text x={190} y={21 + i * 22} textAnchor="end" fontSize={10} fontWeight={700} fill={C.sec2} fontFamily="var(--font-inter-tight), system-ui">{pct}%</text>
        </g>
      ))}
    </svg>
  );
}
function VizLine() {
  return (
    <svg viewBox="0 0 200 100" width="200" height="100">
      <g stroke={C.border} strokeWidth={1}>
        <line x1={15} y1={30} x2={185} y2={30} /><line x1={15} y1={55} x2={185} y2={55} /><line x1={15} y1={80} x2={185} y2={80} />
      </g>
      <path d="M20 82 L60 68 L100 52 L140 34 L175 20" fill="none" stroke={C.blue} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={175} cy={20} r={4} fill={C.blue} />
    </svg>
  );
}
function VizCols() {
  const cols: [number, string][] = [[36, "#A9C9F5"], [50, "#7FADEC"], [44, "#4E88DE"], [62, "#1871ED"], [74, "#0056CE"]];
  return (
    <svg viewBox="0 0 200 100" width="200" height="100">
      {cols.map(([hgt, col], i) => (
        <rect key={i} x={45 + i * 24} y={90 - hgt} width={14} height={hgt} rx={4} fill={col} />
      ))}
    </svg>
  );
}
const SHOWCASE = [
  { title: "Competency radar", body: "Mastery across every domain of your track.", Viz: VizRadar },
  { title: "Novice → Expert matrix", body: "A level for every skill, not one blunt grade.", Viz: VizBars },
  { title: "Progress over time", body: "Watch readiness climb as you learn.", Viz: VizLine },
  { title: "AI-scored projects", body: "Every line of code reviewed and scored.", Viz: VizCols },
];

export default function ResultsClient({ initialSeats = null }: { initialSeats?: { left: number; cap: number } | null }) {
  const params = useParams<{ subject: string }>();
  const searchParams = useSearchParams();
  const slug = params.subject;
  const subject = getSubject(slug);
  const seo = SUBJECT_SEO[slug];
  const answers = decodeAnswers(searchParams.get("a"));

  // Seeded from the server (no fallback flash); the client re-fetch keeps it live.
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
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const RING_C = 2 * Math.PI * 58;
  const ringDash = `${(pct * RING_C).toFixed(1)} ${RING_C.toFixed(1)}`;

  const cardStyle: React.CSSProperties = {
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: SHADOW_XS, overflow: "hidden",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: "var(--font-inter-tight), 'Inter Tight', system-ui, sans-serif" }}>
      {/* App bar */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 32, height: 32, borderRadius: 6, background: C.blue, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 32 32" width={18} height={18} aria-hidden="true"><path d="M31.271 0 V9.349 H28.144 V3.085 H3.127 V27.766 H18.004 V30.851 H0 V0 H31.271 Z" fill="#FFFFFF" /></svg>
          </span>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em", color: C.ink }}>Square 1 AI</span>
        </Link>
        <Link href="/login" style={{ fontSize: 15, fontWeight: 500, color: C.sec }}>Sign in</Link>
      </header>

      <div style={{ maxWidth: "min(1240px, 92vw)", margin: "0 auto", padding: "40px 20px 64px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* ── Skill scan card ─────────────────────────────────────────────── */}
        <div style={cardStyle}>
          <div style={{ background: C.blue, padding: "18px 32px", fontFamily: FIGTREE, fontWeight: 700, fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase", color: "#FFFFFF" }}>
            Your Square 1 AI skill scan
          </div>

          {/* Date / Track */}
          <div className="grid grid-cols-2" style={{ borderBottom: `1px solid ${C.border}` }}>
            {[{ label: "Date", value: today }, { label: "Track", value: subject.title }].map((m, i) => (
              <div key={m.label} style={{ padding: "20px 32px", borderRight: i === 0 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ ...eyebrow, color: C.ter, letterSpacing: "0.1em", marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontWeight: 700, fontSize: 20 }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Score / Readiness rings */}
          <div className="grid grid-cols-2" style={{ borderBottom: `1px solid ${C.border}` }}>
            {[
              { label: "Score", big: `${result.score}`, small: `/${result.total}`, sub: "" },
              { label: "Readiness", big: readinessScore, small: "/10", sub: bandLabel },
            ].map((r, i) => (
              <div key={r.label} style={{ padding: "26px 16px", textAlign: "center", borderRight: i === 0 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ ...eyebrow, marginBottom: 18 }}>{r.label}</div>
                <div style={{ position: "relative", width: 164, height: 164, margin: "0 auto" }}>
                  <svg viewBox="0 0 140 140" width={164} height={164}>
                    <circle cx={70} cy={70} r={58} fill="none" stroke={C.border} strokeWidth={10} />
                    <circle cx={70} cy={70} r={58} fill="none" stroke={C.blue} strokeWidth={10} strokeLinecap="round" strokeDasharray={ringDash} transform="rotate(-90 70 70)" />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontWeight: 700, fontSize: 30, letterSpacing: "-0.02em" }}>
                      {r.big}<span style={{ fontSize: 17, color: C.ter }}>{r.small}</span>
                    </div>
                    {r.sub && <div style={{ fontSize: 13, fontWeight: 500, color: C.blue }}>{r.sub}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Level scale */}
          <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {READINESS_BANDS.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 8, borderRadius: 999, background: i <= bandIdx ? C.blue : C.border }} />
              ))}
            </div>
            <div style={{ display: "flex" }}>
              {READINESS_BANDS.map((name, i) => (
                <div key={name} style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: i === bandIdx ? 700 : 500, color: i === bandIdx ? C.blue : C.ter }}>{name}</div>
              ))}
            </div>
          </div>

          {/* Radar + assessment */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="sm:border-r" style={{ padding: "28px 24px", textAlign: "center", borderColor: C.border }}>
              <div style={{ ...eyebrow, marginBottom: 12 }}>Topic coverage</div>
              <LightRadar axes={topicResults.map((t) => ({ label: t.topic, pass: t.correct }))} />
            </div>
            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ ...eyebrow, marginBottom: 16 }}>Assessment</div>
              <p style={{ fontSize: 19, lineHeight: 1.55, margin: "0 0 24px" }}>{ASPIRATIONAL[String(result.score)] ?? result.blurb}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", height: 32, padding: "0 16px", borderRadius: 999, background: C.blue, color: "#FFFFFF", fontWeight: 700, fontSize: 14 }}>{bandLabel}</span>
                <span style={{ fontSize: 15, color: C.sec2 }}>{subject.role} track</span>
              </div>
            </div>
          </div>

          {/* Topic breakdown */}
          <div style={{ padding: "28px 32px 32px" }}>
            <div style={{ ...eyebrow, marginBottom: 16 }}>Topic breakdown</div>
            <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: 16 }}>
              {topicResults.map((t, i) => (
                <div key={i} style={{ background: C.tint, border: `1px solid ${C.border}`, borderRadius: 6, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 999, background: t.correct ? C.success : C.error, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d={t.correct ? "m5 12 5 5 9-10" : "M7 7l10 10 M17 7L7 17"} />
                      </svg>
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{t.topic}</span>
                  </div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.5, color: C.sec2, margin: 0 }}>
                    {seo.topicRelevance[t.topic] ?? (t.correct ? "You've got this covered." : "Worth revisiting.")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Share ───────────────────────────────────────────────────────── */}
        <div style={{ ...cardStyle, padding: 32, textAlign: "center" }}>
          <div style={{ ...eyebrow, marginBottom: 20 }}>Share your results</div>
          <ShareResultButton
            percentage={Math.round(pct * 100)}
            level={result.level}
            courseTitle={subject.title}
            shareUrl={shareUrl}
            subject={slug}
            answersParam={answersParam}
          />
        </div>

        {/* ── Full report upsell ──────────────────────────────────────────── */}
        <div style={{ ...cardStyle, padding: "48px 32px", textAlign: "center" }}>
          <div style={{ ...eyebrow, letterSpacing: "0.14em", marginBottom: 14 }}>This was the 60-second snapshot</div>
          <h2 style={{ fontWeight: 700, fontSize: 34, letterSpacing: "-0.02em", margin: "0 0 12px", textWrap: "balance" }}>
            The full report tracks <span style={{ color: C.blue }}>everything.</span>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.5, color: C.sec2, maxWidth: 520, margin: "0 auto 36px" }}>
            20 questions including real code, AI-graded — then every skill mapped, levelled, and tracked as you learn.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 20, textAlign: "left" }}>
            {SHOWCASE.map((s) => (
              <div key={s.title} className="feature-card" style={{ background: C.tint, border: `1px solid ${C.border}`, borderRadius: 6, padding: 24 }}>
                <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><s.Viz /></div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{s.title}</div>
                <p style={{ fontSize: 14, lineHeight: 1.5, color: C.sec2, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Pricing ─────────────────────────────────────────────────────── */}
        <div style={{ ...cardStyle, padding: "48px 32px 40px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 34, padding: "0 16px", borderRadius: 999, border: `1px solid ${C.borderStrong}`, fontSize: 13.5, fontWeight: 700, color: C.success, background: C.tint, whiteSpace: "nowrap", marginBottom: 24 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: C.success }} />
            {seats ? `Free early access — ${seats.left} of ${seats.cap} seats left` : "Free during early access"}
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 30, letterSpacing: "-0.02em", margin: "0 0 12px", textWrap: "balance" }}>Start free. Lock your founding rate for life.</h2>
          <p style={{ fontSize: 16, lineHeight: 1.5, color: C.sec, maxWidth: 540, margin: "0 auto 36px" }}>
            Everything below is free today — these rates only apply when billing launches, and founding members keep them forever.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 20, marginBottom: 28 }}>
            {FOUNDING_PLANS.map((p) => (
              <div key={p.months} style={{ position: "relative", background: C.card, border: p.popular ? `1.5px solid ${C.blue}` : `1px solid ${C.borderStrong}`, borderRadius: 6, boxShadow: p.popular ? "0 8px 24px -10px rgba(21,47,84,0.2)" : SHADOW_XS, padding: "30px 20px 26px" }}>
                {p.popular && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: C.blue, color: "#FFFFFF", fontFamily: FIGTREE, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 999, whiteSpace: "nowrap" }}>Most popular</div>
                )}
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{p.months}-month track</div>
                <div style={{ fontWeight: 700, fontSize: 32, letterSpacing: "-0.02em" }}>
                  {p.perMonth}<span style={{ fontSize: 16, fontWeight: 500, color: C.sec2 }}>/mo</span>
                </div>
                <div style={{ fontSize: 13, color: C.ter, marginTop: 6 }}>locked for life</div>
              </div>
            ))}
          </div>
          <Link href={`/signup?subject=${slug}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, height: 52, borderRadius: 8, background: CTA_GRADIENT, boxShadow: CTA_INSET, color: "#FFFFFF", fontWeight: 700, fontSize: 17 }}>
            Get your full skill report — free →
          </Link>
          <div style={{ fontSize: 13.5, color: C.sec2, marginTop: 16 }}>Full assessment · personalised plan · all courses · no credit card</div>
        </div>

        {/* ── Footer links ────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12, fontSize: 15, fontWeight: 500 }}>
          <Link href={`/diagnostic/${slug}`} style={{ color: C.blue }}>Take the {subject.title} skill check yourself →</Link>
          <Link href="/diagnostic" style={{ color: C.sec2 }}>← Try a different track</Link>
        </div>
      </div>

      <style>{`.feature-card{transition:border-color 180ms ease,box-shadow 180ms ease}.feature-card:hover{border-color:${C.blue}!important;box-shadow:0 8px 20px -10px rgba(21,47,84,0.18)}`}</style>
    </div>
  );
}
