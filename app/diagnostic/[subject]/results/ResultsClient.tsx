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

/* ── AI brain — the "analysed by AI" visual (neural node cloud) ─────────────── */
function AIBrain() {
  const nodes: [number, number, number][] = [
    [40, 66, 3], [58, 44, 2.5], [84, 34, 3.5], [110, 40, 2.5], [98, 64, 3], [72, 76, 2.5],
    [50, 90, 2.5], [80, 100, 3], [104, 86, 2.5], [128, 56, 3], [152, 42, 2.5], [176, 50, 3.5],
    [190, 72, 2.5], [176, 92, 3], [150, 98, 2.5], [128, 84, 3], [122, 104, 2.5], [156, 114, 2.5],
    [96, 116, 2.5], [112, 66, 4.5],
  ];
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 9], [0, 5], [5, 4], [4, 3], [5, 6], [6, 7], [7, 8], [8, 4],
    [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 9], [15, 16], [16, 17],
    [16, 18], [18, 7], [19, 4], [19, 15], [19, 8], [3, 19], [9, 19], [19, 12],
  ];
  return (
    <svg viewBox="0 0 230 150" width="100%" style={{ maxWidth: 300 }} aria-hidden="true">
      <defs>
        <radialGradient id="brainGlow" cx="50%" cy="46%" r="55%">
          <stop offset="0%" stopColor={C.blueBright} stopOpacity="0.20" />
          <stop offset="100%" stopColor={C.blueBright} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="114" cy="74" rx="104" ry="64" fill="url(#brainGlow)" />
      <g stroke={C.blueBright} strokeWidth={1} opacity={0.32}>
        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />
        ))}
      </g>
      <g fill={C.blue}>
        {nodes.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r}
            className={i % 4 === 0 ? "brain-pulse" : undefined}
            style={i % 4 === 0 ? { animationDelay: `${(i % 8) * 0.28}s` } : undefined} />
        ))}
      </g>
    </svg>
  );
}

/* ── Locked preview tile — a marked preview of a full-report feature ───────── */
function LockedTile({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ ...tileBase, position: "relative", padding: 16, display: "block", overflow: "hidden" }} className="locked-tile">
      <div style={{ ...eyebrow, fontSize: 11, marginBottom: 10 }}>{title}</div>
      <div style={{ opacity: 0.32, pointerEvents: "none" }}>{children}</div>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: C.blue, background: "rgba(0,86,206,0.08)", border: `1px solid rgba(0,86,206,0.18)`, padding: "5px 12px", borderRadius: 999 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          Unlock
        </span>
      </div>
    </Link>
  );
}

function PreviewLine() {
  return (
    <svg viewBox="0 0 200 72" width="100%">
      <g stroke={C.border} strokeWidth={1}><line x1="12" y1="24" x2="188" y2="24" /><line x1="12" y1="44" x2="188" y2="44" /><line x1="12" y1="62" x2="188" y2="62" /></g>
      <path d="M16 60 L60 50 L104 36 L148 24 L184 12" fill="none" stroke={C.blue} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="184" cy="12" r="4" fill={C.blue} />
    </svg>
  );
}
function PreviewMatrix() {
  const rows: [number, number][] = [[82, 155], [64, 120], [47, 88], [71, 133]];
  return (
    <svg viewBox="0 0 200 72" width="100%">
      {rows.map(([pct, w], i) => (
        <g key={i}>
          <rect x={10} y={8 + i * 16} width={185} height={7} rx={3.5} fill={C.border} />
          <rect x={10} y={8 + i * 16} width={w} height={7} rx={3.5} fill={i % 2 ? "#1871ED" : C.blue} />
        </g>
      ))}
    </svg>
  );
}

export default function ResultsClient({ initialSeats = null }: { initialSeats?: { left: number; cap: number } | null }) {
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

          {/* AI brain */}
          <div className="lg:col-span-2" style={{ ...tileBase, padding: 22, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px", minWidth: 180 }}>
              <div style={{ ...eyebrow, marginBottom: 10 }}>Analysed by AI</div>
              <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.2 }}>Graded and guided by AI.</div>
              <p style={{ fontSize: 13.5, lineHeight: 1.5, color: C.sec2, margin: "8px 0 0" }}>
                Every answer scored and every gap explained by Nova — your 24/7 AI tutor inside Square 1.
              </p>
            </div>
            <div style={{ flex: "1 1 200px", minWidth: 160, display: "flex", justifyContent: "center" }}>
              <AIBrain />
            </div>
          </div>

          {/* Locked preview: progress over time */}
          <LockedTile title="Progress over time" href={signupHref}><PreviewLine /></LockedTile>

          {/* Locked preview: skill matrix */}
          <LockedTile title="Skill matrix" href={signupHref}><PreviewMatrix /></LockedTile>

          {/* Topic breakdown */}
          <div className="lg:col-span-2" style={{ ...tileBase, padding: 20 }}>
            <div style={{ ...eyebrow, marginBottom: 14 }}>Topic breakdown</div>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10 }}>
              {topicResults.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ width: 20, height: 20, borderRadius: 999, background: t.correct ? C.success : C.error, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d={t.correct ? "m5 12 5 5 9-10" : "M7 7l10 10 M17 7L7 17"} />
                    </svg>
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t.topic}</div>
                    <p style={{ fontSize: 12, lineHeight: 1.45, color: C.sec2, margin: "1px 0 0" }}>
                      {seo.topicRelevance[t.topic] ?? (t.correct ? "You've got this covered." : "Worth revisiting.")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Share */}
          <div className="lg:col-span-2" style={{ ...tileBase, padding: 20, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ ...eyebrow, marginBottom: 4 }}>Share your result</div>
            <p style={{ fontSize: 13, color: C.sec2, margin: "0 0 14px" }}>Show friends where you stand — or dare them to beat it.</p>
            <ShareResultButton
              percentage={Math.round(pct * 100)}
              level={result.level}
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
        @media (prefers-reduced-motion: reduce) { .brain-pulse { animation: none; } }
      `}</style>
    </div>
  );
}
