"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/client";
import { detectInAppBrowser, type InAppBrowser } from "@/lib/in-app-browser";
import { fpTrack } from "@/lib/first-party";
import { ShareResultButton } from "@/components/ShareResultButton";
import { foundingPlansFor } from "@/lib/founding";
import type { RegionKey } from "@/lib/pricing";
import { freeWindowOpen } from "@/lib/free-access";
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
  // Soft Square 1 blue used ONLY for the outline of each report tile — the grey
  // border disappeared against the near-white page, so the sections read as one
  // block. Kept light so it separates without shouting.
  cardBorder: "#B5D4F4",
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
  background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, boxShadow: SHADOW_XS,
};

/* ── Express primary CTA — signup starts ON this page ──────────────────────
   Every hop costs people on mobile; /signup was one hop too many for someone
   already sold. Visually identical to the old primary Link, but one tap
   starts Google OAuth right here and the auth callback lands them in
   Lesson 1 of this track. In-app webviews (Google blocked there) and OAuth
   errors fall back to the signup page, which leads with email. */
function PrimaryStartCta({ afterAuth, signupHref }: { afterAuth: string; signupHref: string }) {
  const [loading, setLoading] = useState(false);
  const [inApp, setInApp] = useState<InAppBrowser | null>(null);
  const startedRef = useRef(false); // OAuth must never double-fire (PKCE)
  useEffect(() => { setInApp(detectInAppBrowser()); }, []);

  async function start() {
    if (startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    fpTrack("cta_click", "lesson1:primary");
    if (inApp?.googleBlocked) {
      window.location.href = signupHref;
      return;
    }
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(afterAuth)}`,
      },
    });
    if (error) window.location.href = signupHref;
  }

  return (
    <>
      <button
        onClick={start}
        disabled={loading}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 56,
          borderRadius: 12, background: CTA_GRADIENT, boxShadow: CTA_INSET, color: "#FFFFFF",
          fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em", maxWidth: 420,
          margin: "22px auto 0", width: "100%", border: "none",
          cursor: "pointer", opacity: loading ? 0.75 : 1,
        }}
      >
        {loading ? "Opening Google…" : "Start Lesson 1 — free →"}
      </button>
      <p style={{ textAlign: "center", margin: "8px 0 0", fontSize: 12, color: C.ter }}>
        One tap with Google ·{" "}
        <Link href={signupHref} style={{ color: C.sec2, fontWeight: 600, textDecoration: "underline" }}>
          use email instead
        </Link>
      </p>
    </>
  );
}

/* ── Report unlock — email capture at the moment of peak motivation ─────────
   The audit (2026-08-09) moved lead capture here from the pre-quiz gate: the
   summary score is fully visible, the deep tiles below are the visitor's REAL
   computed report shown blurred (never fake data), and the unlock asks for
   the email exactly when the product has just demonstrated value. The same
   /api/diagnostic/report-email endpoint sends the permalink AND records the
   lead with score, so one person stays one row. Fails OPEN: any error still
   unlocks — a lost address is cheaper than a lost report. */
function ReportUnlockGate({
  slug, answersParam, onUnlock, afterAuth, signupHref,
}: {
  slug: string; answersParam: string; onUnlock: () => void;
  afterAuth: string; signupHref: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [inApp, setInApp] = useState<InAppBrowser | null>(null);
  const oauthRef = useRef(false);
  useEffect(() => { setInApp(detectInAppBrowser()); }, []);
  useEffect(() => { fpTrack("gate_shown", "report-unlock"); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "sending") return;
    setStatus("sending");
    fpTrack("gate_submitted", "report-unlock");
    try {
      await fetch("/api/diagnostic/report-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), subject: slug, a: answersParam }),
      });
    } catch { /* fail open — the report belongs to them either way */ }
    onUnlock();
  }

  async function google() {
    if (oauthRef.current) return;
    oauthRef.current = true;
    fpTrack("cta_click", "lesson1:gate-google");
    if (inApp?.googleBlocked) { window.location.href = signupHref; return; }
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(afterAuth)}` },
    });
    if (error) window.location.href = signupHref;
  }

  return (
    <div
      className="lg:col-span-4"
      style={{
        position: "relative", zIndex: 2, textAlign: "center",
        background: "linear-gradient(180deg, #F3F8FF 0%, #FFFFFF 160px)",
        border: `2px solid ${C.blue}`, borderRadius: 18, padding: "28px 22px 26px",
        boxShadow: "0 22px 54px -26px rgba(0,86,206,0.45)",
      }}
    >
      <div style={{ ...eyebrow, color: C.blue, marginBottom: 8 }}>Your full report is ready</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 auto", maxWidth: 520, lineHeight: 1.15 }}>
        Unlock the full breakdown — free.
      </h2>
      <p style={{ fontSize: 14, color: C.sec2, margin: "10px auto 0", maxWidth: 460, lineHeight: 1.5 }}>
        Topic-by-topic results, your AI brain, the gap map and the exact roadmap
        that closes each gap. We&apos;ll email you the permalink so it&apos;s yours
        for good — that&apos;s it.
      </p>

      <form onSubmit={submit} style={{ margin: "20px auto 0", maxWidth: 420 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" aria-label="Email address to unlock your report"
            autoComplete="email" autoFocus
            className="text-base sm:text-sm"
            style={{ flex: 1, minWidth: 0, height: 48, padding: "0 14px", borderRadius: 11, border: `1px solid ${C.borderStrong}`, background: C.card, color: C.ink, outline: "none" }}
          />
          <button
            type="submit" disabled={status === "sending"}
            style={{ height: 48, padding: "0 18px", borderRadius: 11, border: "none", background: CTA_GRADIENT, boxShadow: CTA_INSET, color: "#FFFFFF", fontWeight: 800, fontSize: 14, cursor: "pointer", opacity: status === "sending" ? 0.6 : 1, whiteSpace: "nowrap" }}
          >
            {status === "sending" ? "Unlocking…" : "Unlock my report"}
          </button>
        </div>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: 12, maxWidth: 420, margin: "16px auto" }}>
        <span style={{ flex: 1, height: 1, background: C.border }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: C.ter }}>OR</span>
        <span style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      <button
        onClick={google}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          height: 46, padding: "0 20px", borderRadius: 11, background: C.card,
          border: `1px solid ${C.borderStrong}`, color: C.ink, fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
        Continue with Google — unlock + start Lesson 1
      </button>

      <p style={{ fontSize: 12, color: C.ter, margin: "14px 0 0" }}>
        Your result is free either way · the link brings this exact report back · no spam, unsubscribe anytime
      </p>
    </div>
  );
}

/* ── "Email me my report" — lead capture for visitors not ready to commit ──
   The report is URL-encoded, so the emailed link reproduces it exactly. This
   is the only re-entry point we have for completers who leave without an
   account — without it they are unreachable forever. */
function EmailReportCapture({ slug, answersParam }: { slug: string; answersParam: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/diagnostic/report-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), subject: slug, a: answersParam }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p style={{ marginTop: 18, fontSize: 14, fontWeight: 600, color: C.success, textAlign: "center" }}>
        ✓ Sent — your report link is in your inbox.
      </p>
    );
  }
  return (
    <form onSubmit={submit} style={{ marginTop: 18, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
      <p style={{ fontSize: 13, color: C.sec2, margin: "0 0 8px", textAlign: "center" }}>
        Not ready right now? <strong style={{ color: C.ink }}>Email yourself this report</strong> — the link brings it straight back.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com" aria-label="Email address for your report"
          className="text-base sm:text-sm"
          style={{ flex: 1, minWidth: 0, height: 44, padding: "0 14px", borderRadius: 10, border: `1px solid ${C.borderStrong}`, background: C.card, color: C.ink, outline: "none" }}
        />
        <button
          type="submit" disabled={status === "sending"}
          style={{ height: 44, padding: "0 16px", borderRadius: 10, border: "none", background: C.blue, color: "#FFFFFF", fontWeight: 700, fontSize: 13.5, cursor: "pointer", opacity: status === "sending" ? 0.6 : 1, whiteSpace: "nowrap" }}
        >
          {status === "sending" ? "Sending…" : "Email it"}
        </button>
      </div>
      {status === "error" && (
        <p style={{ fontSize: 12, color: C.error, margin: "6px 0 0", textAlign: "center" }}>
          Couldn&apos;t send — check the address and try again.
        </p>
      )}
    </form>
  );
}

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

// Re-declared locally rather than imported because page.tsx is a server
// component; keep it in step with the CoursePath there.
type CoursePath = { modules: { title: string; lessons: number }[]; guidedHours: number; totalLessons: number; totalProjects: number; firstLessonId: string | null };

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

export default function ResultsClient({ initialSeats = null, coursePath = null, region = "global" }: { initialSeats?: { left: number; cap: number } | null; coursePath?: CoursePath | null; region?: RegionKey }) {
  const params = useParams<{ subject: string }>();
  const searchParams = useSearchParams();
  const slug = params.subject;
  const subject = getSubject(slug);
  const seo = SUBJECT_SEO[slug];
  const answers = decodeAnswers(searchParams.get("a"));

  const [seats, setSeats] = useState<{ left: number; cap: number } | null>(initialSeats);
  // While early access is open the whole track is free, so the founding price
  // cards are hidden — "FREE NOW" next to $19.90/mo reads as a paywall and kills
  // the click. Seeded from the shared NEXT_PUBLIC free-access window so there's
  // no flash of prices, then corrected by the API (which also knows the cap).
  // When the window closes, the cards come back automatically.
  const [freeOpen, setFreeOpen] = useState<boolean>(freeWindowOpen());
  useEffect(() => {
    fetch("/api/free-access/status")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.open === "boolean") setFreeOpen(d.open);
        if (d?.open && typeof d.remaining === "number") setSeats({ left: d.remaining, cap: d.cap ?? 500 });
      })
      .catch(() => {});
  }, []);

  // Sticky mobile CTA. On a 390px screen this report runs past 5,000px and the
  // only way forward used to sit at ~4,800 — roughly six screens of scrolling
  // from the moment of highest intent. The bar appears once the result card is
  // behind them, so the exit is always one thumb-reach away.
  // Declared before the early return below so hook order stays stable.
  const [showStickyCta, setShowStickyCta] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowStickyCta(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Living report (audit R6b, 2026-08-10): this permalink is emailed to every
  // completer and re-opened later. For a signed-in student who enrolled in
  // this track, the snapshot visibly MOVES — a measured "since your check"
  // strip replaces the frozen-in-time feeling with progress they earned.
  type LiveProgress = {
    enrolled: boolean; courseTitle?: string; totalLessons?: number;
    lessonsCompleted?: number; currentLessonId?: string | null; courseCompleted?: boolean;
  };
  const [live, setLive] = useState<LiveProgress | null>(null);
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/diagnostic/progress?subject=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d: LiveProgress) => { if (d?.enrolled) setLive(d); })
      .catch(() => { /* the static report is always the fallback */ });
  }, [slug]);

  // Report unlock (audit R2, 2026-08-09): the deep tiles render blurred until
  // the visitor leaves an email (or signs in with Google) at the unlock card.
  // Once unlocked in a browser, always unlocked — the emailed permalink and a
  // revisit must never re-gate a report someone already owns. Signed-in
  // students skip the gate entirely. SSR renders locked; the effects below can
  // only flip toward unlocked, so hydration never re-blurs an open report.
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem("s1-report-unlocked") === "1") setUnlocked(true); } catch { /* ignore */ }
    createClient().auth.getUser()
      .then(({ data }) => { if (data.user) setUnlocked(true); })
      .catch(() => { /* signed-out is the normal case */ });
  }, []);
  function unlock() {
    setUnlocked(true);
    try { localStorage.setItem("s1-report-unlocked", "1"); } catch { /* ignore */ }
  }
  // Blur is applied per-tile so the bento grid keeps its column spans. The
  // blurred tiles are the visitor's REAL report — never placeholder data.
  const lockStyle: React.CSSProperties = unlocked
    ? { filter: "blur(0) saturate(1)", transition: "filter 500ms ease" }
    : { filter: "blur(9px) saturate(0.9)", pointerEvents: "none", userSelect: "none", transition: "filter 500ms ease" };

  if (!subject || !seo || !answers) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4" style={{ background: C.bg, color: C.ink }}>
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

  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.square1ai.com";
  const answersParam = encodeAnswers(answers);
  const shareUrl = `${origin}/diagnostic/${slug}/results?a=${answersParam}`;
  const readinessScore = ((result.score / result.total) * 10).toFixed(1);
  const pct = result.score / result.total;
  // The whole point of this screen is to turn a visitor into a STUDENT. The
  // old primary CTA sent them to /try/<slug> — a read-only preview with no
  // account, no progress and no student row, so a reader never became a
  // learner and never showed up in any number. Now the primary path runs
  // through auth and lands directly in Lesson 1; /welcome carries the
  // destination through the country step, and /learn needs no enrolment to
  // open (enrolment happens automatically on first completion).
  const firstLessonId = coursePath?.firstLessonId ?? null;
  const afterAuth = firstLessonId ? `/learn/${firstLessonId}` : `/courses/${slug}`;
  const signupHref = `/signup?subject=${slug}&next=${encodeURIComponent(afterAuth)}`;

  // Founding-plan pricing derived from the shared source: numeric per-month, the
  // 3-mo baseline (highest rate), % saved vs baseline, and the billed total.
  const regionPlans = foundingPlansFor(region);
  const foundingBase = Math.max(...regionPlans.map((p) => parseFloat(p.perMonth.replace(/[^0-9.]/g, ""))));
  const foundingPlans = regionPlans.map((p) => {
    const pm = parseFloat(p.perMonth.replace(/[^0-9.]/g, ""));
    return { ...p, pm, savings: Math.round(((foundingBase - pm) / foundingBase) * 100), total: (pm * p.months).toFixed(2) };
  });

  const RING_C = 2 * Math.PI * 58;
  const ringDash = `${(pct * RING_C).toFixed(1)} ${RING_C.toFixed(1)}`;

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, color: C.ink, fontFamily: "var(--font-inter-tight), 'Inter Tight', system-ui, sans-serif" }}>
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

        {/* ── Living report — "your report has moved" (R6b). Only for a
               signed-in student enrolled in THIS track; every number is
               measured (lesson_completions), never estimated. ─────────────── */}
        {live?.enrolled && (
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px 18px",
            marginBottom: 22, padding: "16px 20px", borderRadius: 14,
            background: "linear-gradient(180deg, rgba(25,166,95,0.07), rgba(25,166,95,0.03))",
            border: `1.5px solid rgba(25,166,95,0.35)`,
          }}>
            <span style={{
              flexShrink: 0, width: 34, height: 34, borderRadius: 999,
              background: "rgba(25,166,95,0.14)", display: "inline-flex",
              alignItems: "center", justifyContent: "center", color: C.success,
            }} aria-hidden>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.5V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
            </span>
            <div style={{ minWidth: 220, flex: "1 1 260px" }}>
              <div style={{ fontFamily: FIGTREE, fontSize: 10.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: C.success }}>
                Your report has moved
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginTop: 2 }}>
                {live.courseCompleted
                  ? `You finished the ${live.courseTitle} track since this check.`
                  : (live.lessonsCompleted ?? 0) > 0
                    ? `Since your check: ${live.lessonsCompleted} of ${live.totalLessons} lessons done in ${live.courseTitle}.`
                    : `You're enrolled in ${live.courseTitle} — Lesson 1 is waiting.`}
              </div>
              {!live.courseCompleted && (live.totalLessons ?? 0) > 0 && (
                <div style={{ marginTop: 8, height: 6, borderRadius: 999, background: "rgba(15,23,42,0.08)", overflow: "hidden", maxWidth: 340 }}>
                  <div style={{ height: "100%", borderRadius: 999, background: C.success, width: `${Math.max(2, Math.round(((live.lessonsCompleted ?? 0) / (live.totalLessons || 1)) * 100))}%` }} />
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <Link
                href={live.courseCompleted ? "/portfolio" : live.currentLessonId ? `/learn/${live.currentLessonId}` : "/dashboard"}
                onClick={() => fpTrack("cta_click", "live-report:continue")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7, height: 42,
                  padding: "0 18px", borderRadius: 11, background: CTA_GRADIENT, boxShadow: CTA_INSET,
                  color: "#FFFFFF", fontWeight: 800, fontSize: 13.5, textDecoration: "none",
                }}
              >
                {live.courseCompleted ? "See your portfolio →" : (live.lessonsCompleted ?? 0) > 0 ? "Continue learning →" : "Start Lesson 1 →"}
              </Link>
              <Link
                href="/progress"
                onClick={() => fpTrack("cta_click", "live-report:progress")}
                style={{ fontSize: 13, fontWeight: 600, color: C.sec, textDecoration: "underline", textUnderlineOffset: 3 }}
              >
                Live skill report
              </Link>
            </div>
          </div>
        )}

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

          {/* Inline CTA — mobile only.
              The report below is worth reading, but on a phone it runs past
              5,000px and the only way forward sat at the very bottom. This puts
              the exit directly under the score, at the moment intent peaks,
              without touching the desktop bento (where the grid is four columns
              and the page is a fraction of the height). */}
          <div className="lg:hidden" style={{ ...tileBase, padding: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>
              Ready to close the gaps?
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: C.sec2, margin: "6px 0 14px" }}>
              Lesson 1 of {subject.title} is free, and it starts where your snapshot says you should.
            </p>
            <Link
              href={signupHref}
              onClick={() => fpTrack("cta_click", "lesson1:inline-mobile")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                height: 52, borderRadius: 12, background: CTA_GRADIENT, boxShadow: CTA_INSET,
                color: "#FFFFFF", fontWeight: 800, fontSize: 16, letterSpacing: "-0.01em",
                textDecoration: "none",
              }}
            >
              Start Lesson 1 — free →
            </Link>
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 12.5, color: C.ter }}>
              Keep scrolling for the full breakdown
            </div>
          </div>

          {/* Skill map radar */}
          <div className="lg:col-span-2" style={{ ...tileBase, padding: 22, display: "flex", flexDirection: "column" }}>
            <div style={{ ...eyebrow, marginBottom: 8 }}>Your skill map</div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LightRadar axes={topicResults.map((t) => ({ label: t.topic, pass: t.correct }))} />
            </div>
          </div>

          {/* Unlock card — sits between the visible summary and the blurred
              deep report. Disappears once the report is unlocked. */}
          {!unlocked && (
            <ReportUnlockGate
              slug={slug}
              answersParam={answersParam}
              onUnlock={unlock}
              afterAuth={afterAuth}
              signupHref={signupHref}
            />
          )}

          {/* AI brain — full-width hero band (mirrors the in-app Skill brain) */}
          <div className="lg:col-span-4" aria-hidden={!unlocked} style={{ ...tileBase, padding: 24, ...lockStyle }}>
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
          <div className="lg:col-span-2" aria-hidden={!unlocked} style={lockStyle}>
            <TopicMasteryBars topics={topicResults} />
          </div>

          {/* Skill matrix — measured from the diagnostic (was a locked preview) */}
          <div className="lg:col-span-2" aria-hidden={!unlocked} style={lockStyle}>
            <SkillMatrixTile topics={topicResults} relevance={seo.topicRelevance} score={result.score} total={result.total} />
          </div>

          {/* Strengths vs gaps donut */}
          <div className="lg:col-span-2" aria-hidden={!unlocked} style={lockStyle}>
            <StrengthsDonut topics={topicResults} score={result.score} total={result.total} />
          </div>

          {/* Role readiness — core areas covered for the track's role */}
          <div className="lg:col-span-2" aria-hidden={!unlocked} style={lockStyle}>
            <RoleReadiness score={result.score} total={result.total} role={subject.role} coursePath={coursePath} />
          </div>

          {/* Your path to job-ready — real curriculum roadmap (hidden if no course) */}
          {coursePath && coursePath.modules.length > 0 && (
            <div className="lg:col-span-4" aria-hidden={!unlocked} style={lockStyle}>
              <Roadmap coursePath={coursePath} weakTopics={topicResults.filter((t) => !t.correct).map((t) => t.topic)} track={subject.title} />
            </div>
          )}

          {/* Share — full-width band */}
          <div className="lg:col-span-4" aria-hidden={!unlocked} style={{ ...tileBase, padding: 26, textAlign: "center", ...lockStyle }}>
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

          {/* Offer band — the conversion close: value stack + founding pricing + CTA */}
          <div className="lg:col-span-4" style={{ border: `2px solid ${C.blue}`, borderRadius: 18, boxShadow: "0 20px 50px -24px rgba(0,86,206,0.4)", padding: 0, overflow: "hidden", background: "linear-gradient(180deg, #F3F8FF 0%, #FFFFFF 220px)" }}>
            <div style={{ padding: "30px 28px 32px", textAlign: "center" }}>
              {/* Urgency */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 32, padding: "0 16px", borderRadius: 999, border: `1px solid ${C.borderStrong}`, fontSize: 13, fontWeight: 700, color: C.success, background: C.card, marginBottom: 16 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: C.success, boxShadow: `0 0 0 4px rgba(25,166,95,0.16)` }} />
                {seats ? `Free early access — only ${seats.left} of ${seats.cap} seats left` : "Free during early access"}
              </div>

              {/* Hook */}
              <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, margin: "0 auto", maxWidth: 640 }}>
                Turn this snapshot into a job‑ready plan.
              </h2>
              <p style={{ fontSize: 15.5, color: C.sec, margin: "10px auto 0", maxWidth: 560, lineHeight: 1.5 }}>
                Your free skill scan is just the start. Unlock the full report and the whole {subject.title} track — free while early access lasts.
              </p>

              {/* Value stack */}
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "10px 24px", maxWidth: 620, margin: "24px auto 0", textAlign: "left" }}>
                {[
                  ["Your full 20‑question assessment", "Real code, AI‑graded — your true proficiency, not a 5‑question taster."],
                  ["A personalized path to job‑ready", "Every gap mapped to the exact lessons and projects that close it."],
                  ["Nova, your 24/7 AI tutor", "Grades every answer and explains the why — the moment you're stuck."],
                  ["Real projects + a certificate", "Auto‑graded, portfolio‑ready work that proves you can actually build."],
                ].map(([title, body], i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 999, background: "rgba(25,166,95,0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                      <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke={C.success} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
                    </span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{title}</div>
                      <div style={{ fontSize: 12.5, color: C.sec2, lineHeight: 1.4, marginTop: 1 }}>{body}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing — hidden while early access is free (see freeOpen above) */}
              {!freeOpen && (
              <>
              <div style={{ ...eyebrow, color: C.sec2, marginTop: 28, marginBottom: 14 }}>Lock your founding rate for life</div>
              <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12, maxWidth: 560, margin: "0 auto", alignItems: "stretch" }}>
                {foundingPlans.map((p) => (
                  <div key={p.months} style={{
                    position: "relative", background: C.card, textAlign: "center",
                    border: p.popular ? `2px solid ${C.blue}` : `1px solid ${C.borderStrong}`,
                    borderRadius: 14, padding: p.popular ? "22px 8px 16px" : "16px 8px",
                    boxShadow: p.popular ? "0 12px 28px -14px rgba(0,86,206,0.45)" : "none",
                    transform: p.popular ? "scale(1.04)" : "none", zIndex: p.popular ? 1 : 0,
                  }}>
                    {p.popular && (
                      <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: CTA_GRADIENT, color: "#FFFFFF", fontFamily: FIGTREE, fontWeight: 700, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 12px", borderRadius: 999, whiteSpace: "nowrap", boxShadow: "0 4px 10px -3px rgba(0,86,206,0.5)" }}>Most popular</span>
                    )}
                    <div style={{ fontFamily: FIGTREE, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: C.ter }}>{p.months} months</div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 1, marginTop: 6 }}>
                      <span style={{ fontSize: p.popular ? 30 : 26, fontWeight: 800, letterSpacing: "-0.03em", color: p.popular ? C.blue : C.ink }}>{p.perMonth}</span>
                      <span style={{ fontSize: 12, color: C.ter, fontWeight: 600 }}>/mo</span>
                    </div>
                    {p.savings > 0
                      ? <div style={{ display: "inline-block", marginTop: 8, fontFamily: FIGTREE, fontSize: 10.5, fontWeight: 700, color: C.success, background: "rgba(25,166,95,0.1)", padding: "2px 8px", borderRadius: 999 }}>Save {p.savings}%</div>
                      : <div style={{ marginTop: 8, fontSize: 11, color: C.ter }}>Standard</div>}
                  </div>
                ))}
              </div>
              </>
              )}

              {/* Primary: account + straight into Lesson 1, starting Google
                  OAuth ON this page (no /signup hop; email + webview cases
                  fall back to the signup page). The reading-only preview stays
                  available as the secondary, low-commitment path. */}
              <PrimaryStartCta afterAuth={afterAuth} signupHref={signupHref} />
              <Link href={`/try/${slug}`} style={{ display: "block", textAlign: "center", marginTop: 14, fontSize: 14, fontWeight: 600, color: C.blue, textDecoration: "none" }}>
                or read the first lesson without an account
              </Link>
              <p style={{ fontSize: 12.5, color: C.ter, margin: "12px 0 0" }}>
                Free for now — no card required · Get your full report, all {subject.title} courses, projects and Nova · Founding rate locked for life
              </p>

              {/* Lead capture — catches completers who leave without an account. */}
              <EmailReportCapture slug={slug} answersParam={answersParam} />
            </div>
          </div>
        </div>

        {/* Clearance for the sticky bar, so it never sits over the final CTA
            or the email capture at the very bottom of the report. */}
        <div className="lg:hidden" aria-hidden style={{ height: 84 }} />

      </div>

      {/* Sticky mobile action bar. Slides in once the result card is behind
          them and stays until they act. Desktop never sees it — that layout is
          four columns and a fraction of this height, so it has no problem to
          solve there. The page gets bottom padding to match, so the bar never
          covers the final CTA or the email capture. */}
      <div
        className="lg:hidden"
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40,
          padding: "10px 16px calc(10px + env(safe-area-inset-bottom))",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderTop: `1px solid ${C.border}`,
          transform: showStickyCta ? "translateY(0)" : "translateY(110%)",
          transition: "transform 220ms ease",
          pointerEvents: showStickyCta ? "auto" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, maxWidth: 520, margin: "0 auto" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, lineHeight: 1.2 }}>
              {bandLabel} · {result.score}/{result.total}
            </div>
            <div style={{ fontSize: 11.5, color: C.ter, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Lesson 1 is free
            </div>
          </div>
          <Link
            href={signupHref}
            onClick={() => fpTrack("cta_click", "lesson1:sticky")}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              height: 46, padding: "0 18px", borderRadius: 11, background: CTA_GRADIENT,
              boxShadow: CTA_INSET, color: "#FFFFFF", fontWeight: 800, fontSize: 14.5,
              letterSpacing: "-0.01em", textDecoration: "none", flexShrink: 0,
            }}
          >
            Start free →
          </Link>
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
