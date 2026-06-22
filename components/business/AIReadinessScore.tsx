"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Team AI-Readiness Score — a 6-question self-assessment lead magnet for the B2B
// lane. Honest by design: it scores the visitor's OWN team (not a claim about
// Square 1 outcomes), then gives a tailored next step + captures the lead via the
// existing /api/business-lead endpoint. Built to be keyboard- and screen-reader
// accessible (it's also our a11y reference component).
// ─────────────────────────────────────────────────────────────────────────────

type Option = { label: string; value: number };
type Question = { id: string; dimension: string; prompt: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    id: "strategy", dimension: "Strategy",
    prompt: "Does your team have a clear plan for using AI?",
    options: [
      { label: "No plan yet", value: 0 },
      { label: "We're talking about it", value: 1 },
      { label: "Some teams have goals", value: 2 },
      { label: "Company-wide AI strategy", value: 3 },
    ],
  },
  {
    id: "skills", dimension: "Skills",
    prompt: "How would you rate your team's hands-on AI skills?",
    options: [
      { label: "Mostly beginners", value: 0 },
      { label: "A few power users", value: 1 },
      { label: "Most are comfortable", value: 2 },
      { label: "They build & ship with AI", value: 3 },
    ],
  },
  {
    id: "tooling", dimension: "Tooling",
    prompt: "Are AI tools available in daily work?",
    options: [
      { label: "None / blocked", value: 0 },
      { label: "Personal, ad-hoc", value: 1 },
      { label: "Some approved tools", value: 2 },
      { label: "Integrated into workflows", value: 3 },
    ],
  },
  {
    id: "adoption", dimension: "Adoption",
    prompt: "How is AI actually used today?",
    options: [
      { label: "Not really used", value: 0 },
      { label: "Occasional experiments", value: 1 },
      { label: "Regular for some tasks", value: 2 },
      { label: "Core to how we work", value: 3 },
    ],
  },
  {
    id: "output", dimension: "Output",
    prompt: "Has your team shipped anything built with AI?",
    options: [
      { label: "Not yet", value: 0 },
      { label: "Prototypes only", value: 1 },
      { label: "A few things in production", value: 2 },
      { label: "Regularly ships", value: 3 },
    ],
  },
  {
    id: "governance", dimension: "Governance",
    prompt: "Do you have AI guidelines (data, safety, responsible use)?",
    options: [
      { label: "None", value: 0 },
      { label: "Informal norms", value: 1 },
      { label: "Some written policies", value: 2 },
      { label: "Clear governance", value: 3 },
    ],
  },
];

const MAX = QUESTIONS.length * 3;

type Tier = { name: string; range: [number, number]; blurb: string; next: string };
const TIERS: Tier[] = [
  { name: "Exploring", range: [0, 25], blurb: "You're at the starting line — lots of upside.", next: "Begin with AI foundations the whole team can use day-to-day, then a structured path per person so it actually sticks. Square 1's assessment maps each person's starting point." },
  { name: "Emerging", range: [26, 50], blurb: "Pockets of usage, not yet a system.", next: "Turn ad-hoc experiments into consistent skills — a personalised path per employee and manager-visible progress so adoption compounds." },
  { name: "Scaling", range: [51, 75], blurb: "Real momentum across the team.", next: "Close the gap between 'uses AI' and 'builds with AI' — graded, deployed projects that prove capability, not just attendance." },
  { name: "Leading", range: [76, 100], blurb: "Ahead of the curve.", next: "Keep the edge: have the team ship real, verifiable AI projects and reskill into higher-leverage roles." },
];

function tierFor(score: number): Tier {
  return TIERS.find((t) => score >= t.range[0] && score <= t.range[1]) ?? TIERS[0];
}

function useCountUp(target: number, run: boolean, duration = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setV(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return v;
}

export function AIReadinessScore() {
  const [step, setStep] = useState(0); // 0..QUESTIONS.length-1, then = length => results
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const done = step >= QUESTIONS.length;

  const raw = QUESTIONS.reduce((s, q) => s + (answers[q.id] ?? 0), 0);
  const score = Math.round((raw / MAX) * 100);
  const tier = tierFor(score);
  const animated = useCountUp(score, done);

  // Lead capture
  const [form, setForm] = useState({ name: "", company: "", email: "", teamSize: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function choose(q: Question, value: number) {
    setAnswers((a) => ({ ...a, [q.id]: value }));
    setStep((s) => s + 1);
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.company.trim() || !form.email.trim()) {
      setError("Please fill in your name, company, and email.");
      return;
    }
    setSending(true);
    setError(null);
    const breakdown = QUESTIONS.map((q) => `${q.dimension}: ${answers[q.id] ?? 0}/3`).join(", ");
    try {
      const res = await fetch("/api/business-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          company: form.company,
          email: form.email,
          teamSize: form.teamSize || undefined,
          message: `[AI Readiness Score] ${score}/100 — ${tier.name}. ${breakdown}.`,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Could not submit — please try again.");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  // ─── Questions ──────────────────────────────────────────────────────────────
  if (!done) {
    const q = QUESTIONS[step];
    const pct = Math.round((step / QUESTIONS.length) * 100);
    return (
      <div className="max-w-xl mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
            <span>Question {step + 1} of {QUESTIONS.length}</span>
            <span>{q.dimension}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar"
            aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Assessment progress">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#3388FF,#0056CE)" }} />
          </div>
        </div>

        <fieldset className="border-0 p-0 m-0">
          <legend className="text-xl sm:text-2xl font-black text-slate-900 mb-5 leading-tight">{q.prompt}</legend>
          <div className="grid gap-2.5">
            {q.options.map((opt) => {
              const selected = answers[q.id] === opt.value;
              return (
                <button key={opt.value} type="button" onClick={() => choose(q, opt.value)}
                  className={`text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                    selected ? "border-brand bg-brand/[0.06] text-brand" : "border-slate-200 bg-white text-slate-700 hover:border-brand/40 hover:bg-slate-50"
                  }`}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)}
            className="mt-5 text-sm font-semibold text-slate-500 hover:text-slate-900 focus:outline-none focus-visible:underline">
            ← Back
          </button>
        )}
      </div>
    );
  }

  // ─── Results ────────────────────────────────────────────────────────────────
  const R = 54, C = 2 * Math.PI * R;
  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 text-center" style={{ boxShadow: "0 24px 64px rgba(15,28,49,0.10)" }}>
        <p className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-brand font-bold mb-4">Your team's AI-readiness</p>

        {/* Score ring */}
        <div className="relative inline-flex items-center justify-center mb-4">
          <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={`Score ${score} out of 100 — ${tier.name}`}>
            <circle cx="70" cy="70" r={R} fill="none" stroke="#E2E8F0" strokeWidth="12" />
            <circle cx="70" cy="70" r={R} fill="none" stroke="url(#rg)" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C - (C * animated) / 100} transform="rotate(-90 70 70)"
              style={{ transition: "stroke-dashoffset 0.9s ease" }} />
            <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#3388FF" /><stop offset="100%" stopColor="#0056CE" /></linearGradient></defs>
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-black text-slate-900 tabular-nums">{animated}</span>
            <span className="text-[10px] text-slate-400 font-semibold">/ 100</span>
          </div>
        </div>

        <h2 className="text-2xl font-black text-slate-900">{tier.name}</h2>
        <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">{tier.blurb}</p>

        {/* Dimension breakdown */}
        <div className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-left max-w-lg mx-auto">
          {QUESTIONS.map((q) => {
            const v = answers[q.id] ?? 0;
            return (
              <div key={q.id} className="flex items-center gap-2.5">
                <span className="text-xs text-slate-600 w-20 shrink-0">{q.dimension}</span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(v / 3) * 100}%`, background: v >= 2 ? "#19A65F" : v === 1 ? "#D97706" : "#EF4444" }} />
                </div>
                <span className="text-[10px] text-slate-400 tabular-nums w-7 text-right">{v}/3</span>
              </div>
            );
          })}
        </div>

        {/* Tailored next step */}
        <div className="mt-6 rounded-2xl bg-blue-50/70 border border-blue-100 p-4 text-left max-w-lg mx-auto">
          <p className="text-xs font-bold text-brand uppercase tracking-wider mb-1">Your next step</p>
          <p className="text-sm text-slate-700 leading-relaxed">{tier.next}</p>
        </div>

        <button type="button" onClick={() => { setStep(0); setAnswers({}); setSent(false); }}
          className="mt-5 text-sm font-semibold text-slate-500 hover:text-slate-900 focus:outline-none focus-visible:underline">
          ↻ Retake
        </button>
      </div>

      {/* Lead capture */}
      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8" style={{ boxShadow: "0 4px 20px rgba(15,28,49,0.05)" }}>
        {sent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#19A65F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <p className="text-base font-bold text-slate-900">Thanks — we&apos;ve got your results.</p>
            <p className="text-sm text-slate-600 mt-1">We&apos;ll send a tailored rollout plan for a {tier.name.toLowerCase()} team. Want to start now? <a href="/business/start" className="text-brand font-semibold hover:underline">Set up your team →</a></p>
          </div>
        ) : (
          <form onSubmit={submitLead}>
            <h3 className="text-lg font-black text-slate-900 mb-1">Get your tailored rollout plan</h3>
            <p className="text-sm text-slate-600 mb-4">We&apos;ll map your score to a concrete plan for your team. No spam.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="rs-name" className="block text-[11px] font-semibold text-slate-500 mb-1">Name</label>
                <input id="rs-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
              <div>
                <label htmlFor="rs-company" className="block text-[11px] font-semibold text-slate-500 mb-1">Company</label>
                <input id="rs-company" type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
              <div>
                <label htmlFor="rs-email" className="block text-[11px] font-semibold text-slate-500 mb-1">Work email</label>
                <input id="rs-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
              <div>
                <label htmlFor="rs-size" className="block text-[11px] font-semibold text-slate-500 mb-1">Team size</label>
                <input id="rs-size" type="text" inputMode="numeric" value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: e.target.value })} placeholder="e.g. 25"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
            </div>
            {error && <p className="text-sm text-red-600 mt-3" role="alert">{error}</p>}
            <button type="submit" disabled={sending}
              className="mt-4 w-full h-12 rounded-xl text-white font-bold text-sm disabled:opacity-60 hover:-translate-y-0.5 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              style={{ background: "linear-gradient(135deg,#0056CE,#01224F)" }}>
              {sending ? "Sending…" : "Email me my plan"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
