"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import {
  getDiagnostic,
  encodeAnswers,
  getSubject,
  DIAG_SUBJECTS,
  type DiagQuestion,
  type DiagSubject,
} from "@/lib/diagnostic";
import { fpIds, fpTrack } from "@/lib/first-party";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES } from "@/lib/countries";

// ═══════════════════════════════════════════════════════════════════════════════
// The gated skill check. One email screen, then seven beats in one frame:
//
//   0. Gate     — email before question 1 (2026-08-11, owner call). THIS ROUTE
//                 ONLY: /skill-check is the paid-traffic entrance and is
//                 noindex. The organic /diagnostic routes stay ungated, so
//                 their "no account, no email" copy remains true. Every surface
//                 whose CTA points here had its "no account" line rewritten in
//                 the same change — if you re-gate another entrance, do that
//                 sweep too or the page starts lying again (see the 2026-08-09
//                 note in app/diagnostic/[subject]/DiagnosticExperience.tsx).
//   1. Warm-up  — "spot the better prompt" (universal, no wrong-answer shame,
//                 demos the product: Nova scores prompts)
//   2. Track    — "what are you aiming for?" as chips INSIDE the quiz, not a
//                 landing page. Two lanes: career tracks / AI-at-work.
//   3–7.        — the chosen track's five questions (same bank the /diagnostic
//                 routes use, same seeded option order, same results URL).
//
// Deep links: ?w=done skips the warm-up (the hero's Prompt Lab already asked
// it); ?subject=<slug> skips the track step (course cards already know it).
// Neither skips the gate.
//
// The gate (reworked 2026-08-23, owner call, pre-publish): two ways through.
//   • Email + country — a lead, not an account: no password, no auth session.
//     Country returned as an explicit required field (it was dropped 2026-08-06
//     for the geo header; the owner wants it asked directly — and the header
//     doesn't exist off-Vercel, so this also fixes local/self-hosted data).
//   • Continue with Google — a REAL Supabase session via /api/auth/callback
//     (which also creates the students row and geo-fills country), returning
//     here with deep-link params intact. An already-signed-in visitor passes
//     the gate without seeing it.
// ═══════════════════════════════════════════════════════════════════════════════

const BRAND = "#0056CE";
const TOTAL_STEPS = 7;

/** Remembers the address so a returning visitor is never gated twice. */
const LEAD_KEY = "sq1-skillcheck-lead";
/** Mirrors PENDING_SUBJECT in app/api/diagnostic/lead/route.ts. Declared here
 *  rather than imported so the route's server-only deps stay out of this bundle. */
const PENDING_SUBJECT = "skill-check";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same content as the hero Prompt Lab — the one universal question that works
// for a future ML engineer AND a marketer.
const WARMUP = {
  scenario: "You need AI to draft a product launch email.",
  ask: "Which prompt gets a usable result?",
  options: [
    { key: "A", text: "write a launch email for our new product", score: 8, better: false },
    {
      key: "B",
      text:
        "You're our copywriter. Write a 120-word launch email for the Terra serum ($54, ships Aug 1). Audience: existing customers, warm tone, no wellness clichés. One CTA: “Pre-order”. No discounts.",
      score: 96,
      better: true,
    },
  ],
};

// The career lane keeps DIAG_SUBJECTS order; the work lane is the role tracks
// ("ai-for-*" plus Everyday AI Skills). NOT a bare "ai-" prefix test — that
// would drag ai-product-management (a career track) into the no-code lane.
const WORK_SLUGS = new Set(
  DIAG_SUBJECTS.filter((s) => s.slug.startsWith("ai-for-") || s.slug === "ai-foundations").map((s) => s.slug),
);
const CAREER_LANE = DIAG_SUBJECTS.filter((s) => !WORK_SLUGS.has(s.slug));
const WORK_LANE = DIAG_SUBJECTS.filter((s) => WORK_SLUGS.has(s.slug));

type Phase = "gate" | "warmup" | "track" | "quiz";

function ProgressHeader({ step, accent }: { step: number; accent: string }) {
  return (
    <div className="mb-7">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wide" style={{ color: accent }}>
          Free skill check
        </span>
        <span className="tabular-nums text-xs text-slate-500">
          Question {step} / {TOTAL_STEPS}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${((step - 1) / TOTAL_STEPS) * 100}%`, background: accent }}
        />
      </div>
    </div>
  );
}

export function SkillCheckClient() {
  const router = useRouter();
  const params = useSearchParams();

  const presetSlug = params.get("subject");
  const preset = presetSlug ? getSubject(presetSlug) : undefined;
  const skipWarmup = params.get("w") === "done";

  // Where the check resumes once the gate is satisfied.
  const firstPhase: Phase = skipWarmup ? (preset ? "quiz" : "track") : "warmup";

  // Always render the gate first so the static HTML and the first client paint
  // agree; the effect below lifts it for anyone who already gave us an address.
  const [phase, setPhase] = useState<Phase>("gate");
  const [subject, setSubject] = useState<DiagSubject | null>(preset ?? null);
  const [warmupPick, setWarmupPick] = useState<number | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);

  // ── Gate state ──────────────────────────────────────────────────────────────
  const [lead, setLead] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const oauthStartedRef = useRef(false);

  const gateChecked = useRef(false);
  useEffect(() => {
    if (gateChecked.current) return;
    gateChecked.current = true;
    let saved: string | null = null;
    try { saved = localStorage.getItem(LEAD_KEY); } catch { /* private mode */ }
    if (saved && EMAIL_RE.test(saved)) {
      setLead(saved);
      setPhase(firstPhase);
      return;
    }
    // No stored lead — a live session also satisfies the gate. This is both
    // the return leg of "Continue with Google" and any already-signed-in
    // student who clicked the CTA: neither should ever see an email form.
    let cancelled = false;
    void createClient().auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      const address = session?.user?.email;
      if (address && EMAIL_RE.test(address)) {
        try { localStorage.setItem(LEAD_KEY, address); } catch { /* private mode */ }
        setLead(address);
        // Keep the funnel's one-row-per-person bookkeeping for OAuth entries
        // too. Country is omitted: the auth callback already geo-filled the
        // students row, and the lead route derives it from the same header.
        try {
          void fetch("/api/diagnostic/lead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: address, subject: preset?.slug ?? PENDING_SUBJECT }),
            keepalive: true,
          });
        } catch { /* lead bookkeeping must never block the flow */ }
        fpTrack("gate_submitted", "skill-check-google");
        setPhase(firstPhase);
        return;
      }
      fpTrack("gate_shown", "skill-check-precheck");
    }).catch(() => { if (!cancelled) fpTrack("gate_shown", "skill-check-precheck"); });
    return () => { cancelled = true; };
  }, [firstPhase, preset?.slug]);

  async function submitGate(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const address = email.trim();
    if (!EMAIL_RE.test(address)) {
      setGateError("That doesn't look like an email address.");
      return;
    }
    if (!country) {
      setGateError("Pick your country to continue.");
      return;
    }
    setGateError(null);
    setSaving(true);
    try {
      await fetch("/api/diagnostic/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Track unknown at this point unless a course card deep-linked one.
        body: JSON.stringify({ email: address, country, subject: preset?.slug ?? PENDING_SUBJECT }),
      });
    } catch {
      // Never trap someone behind our own outage. We lose the lead, not the
      // visitor — the results page still offers to email the report.
    }
    try { localStorage.setItem(LEAD_KEY, address); } catch { /* private mode */ }
    setLead(address);
    fpTrack("gate_submitted", "skill-check-precheck");
    setSaving(false);
    setPhase(firstPhase);
    window.scrollTo({ top: 0 });
  }

  // "Continue with Google" → real Supabase OAuth. The callback returns to this
  // exact URL (deep-link params intact), where the session check above lifts
  // the gate. Same double-start guard as the login page.
  async function handleGoogle() {
    if (oauthStartedRef.current) return;
    oauthStartedRef.current = true;
    setGateError(null);
    setSaving(true);
    fpTrack("cta_click", "skill-check-gate:google");
    const next = `${window.location.pathname}${window.location.search}`;
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}` },
    });
    // On success the browser redirects away; only reset on a real failure.
    if (error) {
      setGateError("Google sign-in didn't start — try again, or use your email below.");
      oauthStartedRef.current = false;
      setSaving(false);
    }
  }

  const questions = useMemo<DiagQuestion[]>(
    () => (subject ? getDiagnostic(subject.slug) : []),
    [subject],
  );

  const accent = subject?.color ?? BRAND;
  // Display step: warm-up = 1, track = 2, quiz i = 3..7.
  const step = phase === "warmup" ? 1 : phase === "track" ? 2 : 3 + qIdx;

  const trackedStart = useRef(false);
  useEffect(() => {
    if (trackedStart.current) return;
    trackedStart.current = true;
    fpTrack("quiz_step", skipWarmup ? "entered:w-done" : "entered");
  }, [skipWarmup]);

  // Warm-up: reveal Nova's verdict briefly, then advance on its own.
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  function answerWarmup(i: number) {
    if (warmupPick !== null) return;
    setWarmupPick(i);
    fpTrack("quiz_step", "warmup_answered");
    advanceTimer.current = setTimeout(() => {
      setPhase(subject ? "quiz" : "track");
      window.scrollTo({ top: 0 });
    }, 1500);
  }

  function pickTrack(s: DiagSubject) {
    setSubject(s);
    setPhase("quiz");
    fpTrack("quiz_step", `track:${s.slug}`);
    // Retarget the placeholder row the gate wrote onto the real track, so this
    // person stays ONE row in diagnostic_leads. A no-op when there is nothing
    // pending (returning visitor, or a ?subject= deep link that already knew).
    if (lead) {
      try {
        void fetch("/api/diagnostic/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: lead, subject: s.slug, promoteFrom: PENDING_SUBJECT }),
          keepalive: true,
        });
      } catch { /* lead bookkeeping must never block the flow */ }
    }
    // The TRUE top of the per-subject quiz funnel — same event the /diagnostic
    // route fires, so started-vs-finished counts stay comparable across both
    // entrances.
    try {
      const { session_id } = fpIds();
      void fetch("/api/diagnostic/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "quiz_started", subject: s.slug, session_id }),
        keepalive: true,
      });
    } catch { /* analytics must never block the flow */ }
    window.scrollTo({ top: 0 });
  }

  function answerQuiz(optIdx: number) {
    if (picked !== null || !subject) return;
    setPicked(optIdx);
    fpTrack("quiz_step", `q${qIdx + 1}_answered`);
    setTimeout(() => {
      const next = [...answers, optIdx];
      setAnswers(next);
      setPicked(null);
      if (qIdx + 1 < questions.length) {
        setQIdx(qIdx + 1);
      } else {
        router.push(`/diagnostic/${subject.slug}/results?a=${encodeAnswers(next)}`);
      }
    }, 220);
  }

  const warmupDone = warmupPick !== null;
  const gotItRight = warmupPick === 1;

  return (
    <main
      className="flex min-h-dvh flex-col"
      style={{ background: "linear-gradient(180deg,#F8FAFC,#fff)" }}
    >
      {/* Minimal app bar — logo home, quiet sign-in. Nothing else competes. */}
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" aria-label="Square 1 AI home" className="inline-flex items-center">
          <Logo variant="dark" size="sm" />
        </Link>
        <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-slate-800">
          Sign in
        </Link>
      </header>

      <div className="flex-1 px-4 pb-14 pt-4 sm:px-6">
        {/* ── 0 · Gate — email before question 1 ──────────────────────────── */}
        {phase === "gate" && (
          <div key="gate" className="mx-auto max-w-md animate-fade-in-up pt-6">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ background: "#ECF8FE", color: BRAND }}
            >
              <Sparkles className="h-3 w-3" aria-hidden /> Free · 3 minutes · 7 questions
            </span>

            <h1 className="mt-3 text-2xl font-bold leading-tight text-slate-900 sm:text-[27px]">
              Where should we send your skill report?
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Sign in with Google, or start with just your email and country. Your report
              appears on screen the moment you finish — we email you a copy so you still
              have it tomorrow.
            </p>

            {/* Google first: one tap, and the callback geo-fills country. */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={saving}
              className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-xl border-2 bg-white text-[15px] font-bold text-slate-800 transition-all disabled:opacity-70 motion-safe:hover:-translate-y-0.5 hover:border-[#0056CE]/40"
              style={{ borderColor: "rgba(15,28,49,0.12)", boxShadow: "0 1px 2px rgba(15,28,49,0.05)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.11A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.27a12 12 0 0 0 0 10.78l4.01-3.11z" />
                <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77z" />
              </svg>
              Continue with Google
            </button>

            <div className="mt-5 flex items-center gap-3" aria-hidden>
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">or with email</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={submitGate} className="mt-5" noValidate>
              <label htmlFor="gate-email" className="sr-only">Email address</label>
              <input
                id="gate-email"
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                placeholder="you@email.com"
                value={email}
                onChange={(ev) => { setEmail(ev.target.value); if (gateError) setGateError(null); }}
                aria-invalid={gateError ? true : undefined}
                aria-describedby={gateError ? "gate-error" : undefined}
                className="h-14 w-full rounded-xl border-2 bg-white px-4 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0056CE]"
                style={{ borderColor: gateError && !EMAIL_RE.test(email.trim()) ? "#D93636" : "rgba(15,28,49,0.12)" }}
              />

              {/* Country — required (owner call 2026-08-23). Same canonical
                  list the students table stores, so the columns stay joinable. */}
              <label htmlFor="gate-country" className="sr-only">Country</label>
              <select
                id="gate-country"
                name="country"
                autoComplete="country-name"
                value={country}
                onChange={(ev) => { setCountry(ev.target.value); if (gateError) setGateError(null); }}
                aria-invalid={gateError && !country ? true : undefined}
                aria-describedby={gateError ? "gate-error" : undefined}
                className="mt-3 h-14 w-full appearance-none rounded-xl border-2 bg-white px-4 pr-10 text-base outline-none transition-colors focus:border-[#0056CE]"
                style={{
                  borderColor: gateError && !country ? "#D93636" : "rgba(15,28,49,0.12)",
                  color: country ? "#0F172A" : "#94A3B8",
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                }}
              >
                <option value="" disabled>Your country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {gateError && (
                <p id="gate-error" role="alert" className="mt-2 text-[13px] font-medium" style={{ color: "#D93636" }}>
                  {gateError}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white transition-transform duration-150 disabled:opacity-70 motion-safe:hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)",
                  boxShadow: "0 14px 30px -12px rgba(0,86,206,0.55)",
                }}
              >
                {saving ? "Starting…" : "Start the skill check"}
                {!saving && <ArrowRight className="h-4 w-4" aria-hidden />}
              </button>
            </form>

            <ul className="mt-6 space-y-2">
              {[
                "An honest read on where you're starting from — strengths and gaps.",
                "The exact track and first lesson to start with.",
                "No password, no credit card. Unsubscribe in one click.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-slate-600">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: BRAND }}
                    aria-hidden
                  />
                  {t}
                </li>
              ))}
            </ul>

            <p className="mt-5 text-[11px] leading-relaxed text-slate-400">
              We&apos;ll email your report and occasional learning tips. We never sell your
              address. See our{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-600">
                privacy policy
              </Link>.
            </p>
          </div>
        )}

        {/* ── 1 · Warm-up ─────────────────────────────────────────────────── */}
        {phase === "warmup" && (
          <div key="warmup" className="mx-auto max-w-xl animate-fade-in-up">
            <ProgressHeader step={1} accent={accent} />

            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ background: "#ECF8FE", color: BRAND }}
            >
              <Sparkles className="h-3 w-3" aria-hidden /> Warm-up · no wrong answers
            </span>

            <h1 className="mt-3 text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
              {WARMUP.scenario}{" "}
              <span className="text-slate-500">{WARMUP.ask}</span>
            </h1>

            <div className="mt-6 space-y-3">
              {WARMUP.options.map((opt, i) => {
                const isPick = warmupPick === i;
                const revealWin = warmupDone && opt.better;
                const revealWeak = warmupDone && !opt.better;
                return (
                  <button
                    key={opt.key}
                    onClick={() => answerWarmup(i)}
                    disabled={warmupDone}
                    className="w-full rounded-xl border-2 p-4 text-left transition-all hover:-translate-y-px disabled:cursor-default"
                    style={{
                      borderColor: revealWin ? "#10B981" : revealWeak ? "#E2E8F0" : isPick ? BRAND : "rgba(15,28,49,0.10)",
                      background: revealWin ? "rgba(16,185,129,0.05)" : revealWeak ? "#F8FAFC" : "#fff",
                      opacity: revealWeak ? 0.7 : 1,
                    }}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span
                        className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide"
                        style={{ color: revealWin ? "#059669" : "#64748B" }}
                      >
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-black"
                          style={{
                            borderColor: revealWin ? "#10B981" : isPick ? BRAND : "rgba(15,28,49,0.15)",
                            color: revealWin ? "#10B981" : isPick ? BRAND : "#64748B",
                          }}
                        >
                          {revealWin ? "✓" : opt.key}
                        </span>
                        Prompt {opt.key}
                      </span>
                      {warmupDone && (
                        <span
                          className="text-[13px] font-black tabular-nums motion-safe:animate-fade-in-up"
                          style={{ color: opt.better ? BRAND : "#94A3B8" }}
                        >
                          {opt.score}
                          <span className="text-[10px] text-slate-400">/100</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] leading-relaxed text-slate-600 sm:text-sm">{opt.text}</p>
                  </button>
                );
              })}
            </div>

            {warmupDone ? (
              <p className="mt-5 text-center text-sm font-semibold text-slate-800 motion-safe:animate-fade-in-up">
                {gotItRight ? "Nailed it — Nova scores that 96/100." : "Prompt B wins — 96 vs 8."}{" "}
                <span className="font-medium text-slate-500">Context, constraints, a clear goal. Next: your track…</span>
              </p>
            ) : (
              <p className="mt-5 text-center text-[11px] text-slate-500">
                Tap the one you&apos;d trust — this one&apos;s just a warm-up.
              </p>
            )}
          </div>
        )}

        {/* ── 2 · Track pick — a question, not a landing page ─────────────── */}
        {phase === "track" && (
          <div key="track" className="mx-auto max-w-xl animate-fade-in-up">
            <ProgressHeader step={2} accent={accent} />

            <h1 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
              What are you aiming for?
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Your next five questions come from this track — and so does your skill report.
            </p>

            <div className="mt-6">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Build a career in AI
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CAREER_LANE.map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => pickTrack(s)}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-[rgba(15,28,49,0.10)] bg-white px-3 py-2.5 text-left transition-all hover:-translate-y-px hover:border-[#0056CE]/50"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: s.color }}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-slate-900">{s.title}</span>
                      <span className="block truncate text-[11px] text-slate-500">{s.role}</span>
                    </span>
                  </button>
                ))}
              </div>

              <p className="mb-2 mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                AI for your work — no code
              </p>
              <div className="grid grid-cols-2 gap-2">
                {WORK_LANE.map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => pickTrack(s)}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-[rgba(15,28,49,0.10)] bg-white px-3 py-2.5 text-left transition-all hover:-translate-y-px hover:border-[#0056CE]/50"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: s.color }}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-slate-900">{s.title}</span>
                      <span className="block truncate text-[11px] text-slate-500">{s.role}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-5 text-center text-[11px] text-slate-500">
              Not sure? Pick the closest — you can take any other track&apos;s check later, free.
            </p>
          </div>
        )}

        {/* ── 3–7 · The track's five questions ────────────────────────────── */}
        {phase === "quiz" && subject && questions.length > 0 && (
          <div key={`q${qIdx}`} className="mx-auto max-w-xl animate-fade-in-up">
            <ProgressHeader step={3 + qIdx} accent={accent} />

            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-bold tracking-wide" style={{ color: accent }}>
                {subject.title}
              </span>
              {qIdx === 0 && (
                <button
                  onClick={() => { setPhase("track"); setQIdx(0); setAnswers([]); }}
                  className="text-[11px] font-semibold text-slate-400 underline underline-offset-2 hover:text-slate-600"
                >
                  change track
                </button>
              )}
            </div>

            <h2 className="mb-6 text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
              {questions[qIdx]?.stem}
            </h2>

            <div className="space-y-3">
              {questions[qIdx]?.options.map((opt, i) => {
                const isPicked = picked === i;
                return (
                  <button
                    key={i}
                    onClick={() => answerQuiz(i)}
                    disabled={picked !== null}
                    className="flex w-full items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all hover:-translate-y-px disabled:cursor-default"
                    style={{
                      borderColor: isPicked ? accent : "rgba(15,28,49,0.10)",
                      background: isPicked ? `${accent}10` : "#fff",
                    }}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
                      style={{
                        borderColor: isPicked ? accent : "rgba(15,28,49,0.15)",
                        color: isPicked ? accent : "#64748B",
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm font-medium text-slate-800 sm:text-base">{opt}</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-6 text-center text-[11px] text-slate-500">
              No wrong-answer shame — this is just to find your starting point.
            </p>

            {qIdx === questions.length - 1 && (
              <p className="mt-2 text-center text-[11px] font-semibold" style={{ color: accent }}>
                Last one — your report is next <ArrowRight className="inline h-3 w-3" aria-hidden />
              </p>
            )}
          </div>
        )}
      </div>

      <p className="pb-6 text-center text-[11px] text-slate-400">
        Free · no password, no card · your report appears the moment you finish
      </p>

      {/* Decorative brand wash, consistent with the hero */}
      <div
        aria-hidden
        className="pointer-events-none fixed -bottom-40 left-1/2 -z-10 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(ellipse, #0056CE 0%, transparent 70%)", filter: "blur(90px)" }}
      />
    </main>
  );
}
