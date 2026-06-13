"use client";

import { useState } from "react";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════════
// Before/After transformation slider — drag to reveal a student's first draft
// becoming Nova's reviewed version. Proves the core "AI reviews YOUR code" value
// in two seconds, no copy required. (Before/after pattern: ~45% conversion lift.)
// ═══════════════════════════════════════════════════════════════════════════════

const BEFORE = `def get_user(id):
    data = requests.get(
        "http://api/users/" + id
    ).json()
    return data['name']`;

const AFTER = `import requests

def get_user(user_id: str) -> str | None:
    # ✓ f-string, timeout, error handling
    r = requests.get(
        f"{API}/users/{user_id}", timeout=5
    )
    r.raise_for_status()
    return r.json().get("name")`;

function CodeBlock({ code, tone }: { code: string; tone: "before" | "after" }) {
  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 shrink-0" style={{ background: "#161B22" }}>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-[10px] font-bold tracking-widest uppercase"
          style={{ color: tone === "after" ? "#34D399" : "#94A3B8" }}>
          {tone === "after" ? "✓ Nova's review" : "your first draft"}
        </span>
      </div>
      <pre className="flex-1 p-4 sm:p-5 overflow-hidden text-[12px] sm:text-[13px] leading-[1.7] font-mono whitespace-pre"
        style={{ background: "#0D1117", color: tone === "after" ? "#E6EDF3" : "#cbd5e1" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function CodeReviewSlider() {
  const [pos, setPos] = useState(50);

  return (
    <section className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg,#050B14 0%,#0B1626 50%,#050B14 100%)" }}>
      <div className="pointer-events-none absolute top-1/4 right-1/4 w-[500px] h-[400px] rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)", filter: "blur(90px)" }} />

      <div className="relative max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            What feedback actually looks like
          </span>
          <h2 className="mt-4 font-black tracking-tight text-white leading-[0.95]"
            style={{ fontSize: "clamp(30px,5vw,60px)" }}>
            Drag to see Nova{" "}
            <span style={{ background: "linear-gradient(135deg,#3388FF,#10B981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              fix your code.
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-md mx-auto">
            Every line you write gets read and graded — not a video, not a generic tip. This is the difference.
          </p>
        </div>

        {/* Slider */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 select-none"
          style={{ height: 280, boxShadow: "0 24px 64px rgba(5,11,20,0.5)" }}>
          {/* Before (full, underneath) */}
          <CodeBlock code={BEFORE} tone="before" />
          {/* After (clipped to the right of the handle) */}
          <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
            <CodeBlock code={AFTER} tone="after" />
          </div>

          {/* Divider + handle */}
          <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
            <div className="w-0.5 h-full bg-white/70" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" /><polyline points="9 18 15 12 9 6" transform="translate(6 0)" />
              </svg>
            </div>
          </div>

          {/* Range input drives it — bulletproof touch/mouse/keyboard */}
          <input
            type="range" min={0} max={100} value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            aria-label="Drag to compare before and after code"
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
          />
        </div>

        {/* Caption + CTA */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            ← your draft &nbsp;·&nbsp; Nova&apos;s reviewed version →
          </p>
          <Link href="/diagnostic"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm hover:-translate-y-0.5 transition-transform"
            style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)", boxShadow: "0 12px 32px rgba(0,86,206,0.3)" }}>
            Get your code reviewed — free →
          </Link>
        </div>
      </div>
    </section>
  );
}
