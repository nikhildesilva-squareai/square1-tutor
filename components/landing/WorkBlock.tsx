"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, ArrowRight, Plus, RotateCcw } from "lucide-react";

const BLUE_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

// Nova's five prompt-grading dimensions (same as the in-app Prompt Lab).
const DIMS = ["Context", "Role & goal", "Constraints & format", "Specificity", "Would it work?"] as const;

// ── Click-to-build demo ────────────────────────────────────────────────────────
// The visitor starts on the tourist prompt (8/100) and adds the four missing
// ingredients themselves; each click inserts real words (color-coded) and moves
// the matching bars. Deltas are illustrative but sum to the exact briefed-prompt
// score (96/100) — no live AI call, works logged-out, zero cost.
type IngKey = "role" | "context" | "specificity" | "constraints";

const BASE_TEXT = "Write a launch email for our new product.";
const BASE_SCORES = [2, 2, 1, 2, 1] as const;

const INGREDIENTS: {
  key: IngKey;
  label: string;
  segment: string;
  deltas: [number, number, number, number, number];
  dot: string;
  bg: string;
  bgStrong: string;
}[] = [
  {
    key: "role",
    label: "Give it a role",
    segment: "You're a direct-response copywriter for Fern & Form, our small eco skincare brand.",
    deltas: [2, 15, 1, 2, 3],
    dot: "#0056CE",
    bg: "rgba(0,86,206,0.10)",
    bgStrong: "rgba(0,86,206,0.20)",
  },
  {
    key: "context",
    label: "Add the context",
    segment: "We're launching the Terra serum — $54, ships 1 August — to existing customers who care about sustainability.",
    deltas: [13, 1, 1, 5, 5],
    dot: "#0EA5E9",
    bg: "rgba(14,165,233,0.12)",
    bgStrong: "rgba(14,165,233,0.24)",
  },
  {
    key: "specificity",
    label: "Nail the goal & tone",
    segment: "Goal: pre-orders. Warm tone, a little dry, never wellness-cliché — match the voice of our two past emails.",
    deltas: [1, 1, 1, 8, 5],
    dot: "#059669",
    bg: "rgba(5,150,105,0.10)",
    bgStrong: "rgba(5,150,105,0.20)",
  },
  {
    key: "constraints",
    label: "Set constraints & format",
    segment: "One email under 150 words: subject line + body, one CTA button (“Pre-order the Terra”), no discounts.",
    deltas: [1, 1, 15, 3, 4],
    dot: "#B45309",
    bg: "rgba(180,83,9,0.10)",
    bgStrong: "rgba(180,83,9,0.20)",
  },
];

// Prompt reads naturally in this order regardless of click order.
const RENDER_ORDER: (IngKey | "base")[] = ["role", "base", "context", "specificity", "constraints"];

// Which ingredient primarily earns each dimension ("Would it work?" is the
// sum of everything, so it traces nothing).
const DIM_TO_ING: (IngKey | null)[] = ["context", "role", "constraints", "specificity", null];

const ROLE_TRACKS = [
  "Foundations", "Marketing", "Finance", "Creators",
  "Founders", "Teachers", "Project Managers", "Sales",
];

export function WorkBlock() {
  const [added, setAdded] = useState<IngKey[]>([]);
  const [trace, setTrace] = useState<IngKey | null>(null);

  const scores = DIMS.map((_, di) =>
    added.reduce((s, k) => s + (INGREDIENTS.find((g) => g.key === k)?.deltas[di] ?? 0), BASE_SCORES[di]),
  );
  const score = scores.reduce((a, b) => a + b, 0);
  const complete = added.length === INGREDIENTS.length;

  const toggle = (k: IngKey) =>
    setAdded((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));

  return (
    <section
      className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8"
      style={{
        background:
          "radial-gradient(ellipse 800px 480px at 15% 12%, rgba(51,136,255,0.08), transparent 60%)," +
          "radial-gradient(ellipse 720px 480px at 85% 88%, rgba(0,86,206,0.06), transparent 60%)," +
          "linear-gradient(180deg, #FFFFFF 0%, #F4F8FF 100%)",
      }}
    >
      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
            <Sparkles className="h-3.5 w-3.5" /> AI for your work — no code
          </span>
          <h2
            className="mt-3 font-black tracking-tight text-slate-900 leading-[1.05]"
            style={{ fontSize: "clamp(28px, 4.4vw, 46px)" }}
          >
            We grade your code.{" "}
            <span
              style={{ background: BLUE_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
            >
              Now we grade your prompt.
            </span>
          </h2>
          <p className="mt-3.5 max-w-xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
            Already use ChatGPT, Claude, Copilot or Gemini? Learn to get real value from them in your actual
            job — practise on real work scenarios and Nova scores your prompt, live. No programming.
          </p>
        </div>

        {/* ── The Prompt Lab — build the brief yourself ───────────────────── */}
        <div className="rounded-2xl border border-[#D8E7FC] bg-white shadow-[0_1px_2px_rgba(15,28,49,0.05),0_18px_44px_-24px_rgba(0,86,206,0.28)] overflow-hidden">
          {/* Scenario */}
          <div className="p-5 sm:p-6 border-b border-slate-100" style={{ background: "linear-gradient(180deg,#F2F7FF,#fff 70%)" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">The scenario</p>
            <p className="mt-1.5 text-sm sm:text-[15px] font-semibold text-slate-800">
              A marketer needs a launch email. This prompt scores{" "}
              <span className="font-black" style={{ color: "#B42318" }}>8/100</span>.{" "}
              <span className="text-slate-500 font-medium">Fix it yourself — add what&apos;s missing and watch Nova&apos;s score move.</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* The prompt being built */}
            <div className="p-5 sm:p-6 lg:border-r border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">The prompt</p>
                {added.length > 0 && (
                  <button
                    onClick={() => { setAdded([]); setTrace(null); }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden /> Start over
                  </button>
                )}
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 min-h-[132px]">
                <p className="text-[13px] leading-relaxed text-slate-700">
                  {RENDER_ORDER.map((part) => {
                    if (part === "base") return <span key="base">{BASE_TEXT} </span>;
                    const g = INGREDIENTS.find((x) => x.key === part)!;
                    if (!added.includes(g.key)) return null;
                    return (
                      <span
                        key={g.key}
                        onMouseEnter={() => setTrace(g.key)}
                        onMouseLeave={() => setTrace(null)}
                        className="rounded-[4px] px-0.5 -mx-0.5 motion-safe:animate-fade-in-up cursor-default transition-shadow"
                        style={{
                          background: trace === g.key ? g.bgStrong : g.bg,
                          boxShadow: trace === g.key ? `inset 0 0 0 1.5px ${g.dot}` : undefined,
                        }}
                      >
                        {g.segment}{" "}
                      </span>
                    );
                  })}
                </p>
              </div>

              {/* Ingredient chips */}
              <p className="mt-4 mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Add what&apos;s missing
              </p>
              <div className="flex flex-wrap gap-2">
                {INGREDIENTS.map((g) => {
                  const on = added.includes(g.key);
                  const traced = trace === g.key;
                  return (
                    <button
                      key={g.key}
                      onClick={() => toggle(g.key)}
                      onMouseEnter={() => setTrace(g.key)}
                      onMouseLeave={() => setTrace(null)}
                      aria-pressed={on}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition-all active:scale-[0.96]"
                      style={{
                        background: on ? g.bg : "#fff",
                        border: `1.5px ${on ? "solid" : "dashed"} ${on || traced ? g.dot : "#CBD5E1"}`,
                        color: on ? g.dot : "#475569",
                        boxShadow: traced ? `0 6px 16px -8px ${g.dot}` : undefined,
                      }}
                    >
                      {on
                        ? <Check className="h-3.5 w-3.5" aria-hidden />
                        : <Plus className="h-3.5 w-3.5" aria-hidden />}
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nova's score */}
            <div className="p-5 sm:p-6 bg-[#FBFDFF]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Nova&apos;s score</p>
                <span
                  key={score}
                  className="text-lg font-black tabular-nums motion-safe:animate-fade-in-up"
                  style={{ color: score >= 60 ? "#0056CE" : "#B42318" }}
                >
                  {score}<span className="text-xs font-bold text-slate-400">/100</span>
                </span>
              </div>
              <div className="space-y-1.5">
                {DIMS.map((d, i) => {
                  const s = scores[i];
                  const pct = (s / 20) * 100;
                  const good = s >= 15;
                  const ing = DIM_TO_ING[i];
                  const traced = ing !== null && trace === ing;
                  const dot = ing ? INGREDIENTS.find((g) => g.key === ing)!.dot : null;
                  return (
                    <div
                      key={d}
                      onMouseEnter={() => setTrace(ing)}
                      onMouseLeave={() => setTrace(null)}
                      className="rounded-lg px-2 py-1 -mx-2 transition-colors cursor-default"
                      style={{ background: traced ? "rgba(0,86,206,0.05)" : "transparent" }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
                          style={{ color: traced ? "#0056CE" : "#475569" }}>
                          {dot && (
                            <span aria-hidden className="w-1.5 h-1.5 rounded-full transition-opacity"
                              style={{ background: dot, opacity: traced ? 1 : 0.45 }} />
                          )}
                          {d}
                        </span>
                        <span className="text-[11px] font-bold tabular-nums" style={{ color: good ? "#059669" : s >= 9 ? "#B45309" : "#B42318" }}>{s}/20</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                        <div
                          className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-700"
                          style={{ width: `${pct}%`, background: good ? "linear-gradient(90deg,#3388FF,#0056CE)" : "#F0997B" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {complete && (
                <p className="mt-4 rounded-xl border px-3.5 py-2.5 text-[12.5px] font-semibold text-slate-700 motion-safe:animate-fade-in-up"
                  style={{ borderColor: "#BFDBCE", background: "rgba(5,150,105,0.06)" }}>
                  <span className="font-black" style={{ color: "#059669" }}>96/100.</span>{" "}
                  You just briefed the AI like a pro — that&apos;s the exact skill every role track drills.
                </p>
              )}
            </div>
          </div>

          <p className="px-5 sm:px-6 py-3 text-[11px] text-slate-400 border-t border-slate-100 bg-white">
            Illustrative — the scoring follows Nova&apos;s real rubric; inside the app it grades your actual prompts, live.
          </p>
        </div>

        {/* ── Role tracks + CTA ───────────────────────────────────────────── */}
        <div className="mt-9 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-3">
            One track for your role — practise on real scenarios, graded by Nova
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-7">
            {ROLE_TRACKS.map((r) => (
              <span key={r} className="inline-flex items-center gap-1.5 rounded-full border border-[#D8E7FC] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-700">
                <Check className="h-3.5 w-3.5 text-brand" /> {r}
              </span>
            ))}
          </div>
          <Link
            href="/diagnostic?goal=work"
            className="inline-flex items-center justify-center gap-2 h-13 px-7 py-3.5 rounded-xl text-white text-[15px] font-bold transition-transform duration-150 motion-safe:hover:-translate-y-0.5"
            style={{ background: BLUE_GRADIENT, boxShadow: "0 14px 30px -12px rgba(0,86,206,0.6)" }}
          >
            Check your AI-at-work skills — free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs text-slate-500">3-minute skill check · no code · no signup</p>
        </div>
      </div>
    </section>
  );
}
