"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";

const BLUE_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

// Nova's five prompt-grading dimensions (same as the in-app Prompt Lab).
const DIMS = ["Context", "Role & goal", "Constraints & format", "Specificity", "Would it work?"] as const;

// Two illustrative submissions for one scenario, scored 0–20 per dimension.
// Hard-coded demo — mirrors how Nova scores prompts in the app, no live call.
const SAMPLES = {
  tourist: {
    label: "Tourist prompt",
    text: "write a launch email for our new product",
    scores: [2, 2, 1, 2, 1],
  },
  briefed: {
    label: "Briefed prompt",
    text:
      "You're a direct-response copywriter for Fern & Form, a small eco skincare brand. Match the voice of the two past emails below — warm, a little dry, never wellness-cliché. Audience: existing customers, women 28–45 who care about sustainability. We're launching the Terra serum, $54, ships 1 August. Goal: pre-orders. One email under 150 words: subject line + body, one CTA button (\"Pre-order the Terra\"), no discounts. [pasted: 2 past emails]",
    scores: [19, 20, 19, 20, 18],
  },
} as const;

const ROLE_TRACKS = [
  "Foundations", "Marketing", "Finance", "Creators",
  "Founders", "Teachers", "Project Managers", "Sales",
];

function total(scores: readonly number[]): number {
  return scores.reduce((s, x) => s + x, 0);
}

export function WorkBlock() {
  const [pick, setPick] = useState<"tourist" | "briefed">("briefed");
  const sample = SAMPLES[pick];
  const score = total(sample.scores);

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

        {/* ── The Prompt Lab demo ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#D8E7FC] bg-white shadow-[0_1px_2px_rgba(15,28,49,0.05),0_18px_44px_-24px_rgba(0,86,206,0.28)] overflow-hidden">
          {/* Scenario + toggle */}
          <div className="p-5 sm:p-6 border-b border-slate-100" style={{ background: "linear-gradient(180deg,#F2F7FF,#fff 70%)" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">The scenario</p>
            <p className="mt-1.5 text-sm sm:text-[15px] font-semibold text-slate-800">
              A marketer needs a launch email for a new product. Same tool, same five seconds — the prompt is the difference.
            </p>
            <div className="mt-4 inline-flex rounded-xl bg-slate-100 p-1">
              {(["tourist", "briefed"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setPick(k)}
                  className={[
                    "px-3.5 sm:px-4 py-2 rounded-lg text-[13px] font-bold transition-all",
                    pick === k ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-slate-700",
                  ].join(" ")}
                >
                  {SAMPLES[k].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* The prompt */}
            <div className="p-5 sm:p-6 lg:border-r border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-2">The prompt they sent</p>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 min-h-[132px]">
                <p className="text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap">{sample.text}</p>
              </div>
            </div>

            {/* Nova's score */}
            <div className="p-5 sm:p-6 bg-[#FBFDFF]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Nova&apos;s score</p>
                <span
                  className="text-lg font-black tabular-nums"
                  style={{ color: score >= 60 ? "#0056CE" : "#B42318" }}
                >
                  {score}<span className="text-xs font-bold text-slate-400">/100</span>
                </span>
              </div>
              <div className="space-y-2.5">
                {DIMS.map((d, i) => {
                  const s = sample.scores[i];
                  const pct = (s / 20) * 100;
                  const good = s >= 15;
                  return (
                    <div key={d}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-semibold text-slate-600">{d}</span>
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
            </div>
          </div>

          <p className="px-5 sm:px-6 py-3 text-[11px] text-slate-400 border-t border-slate-100 bg-white">
            Illustrative — this is how Nova scores prompts inside the app, on real work you paste in.
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
