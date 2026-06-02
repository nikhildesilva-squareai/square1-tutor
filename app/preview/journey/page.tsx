"use client";

import { useState } from "react";
import Link from "next/link";
import { VariantA } from "@/components/landing/journey-variants/VariantA";
import { VariantB } from "@/components/landing/journey-variants/VariantB";
import { VariantC } from "@/components/landing/journey-variants/VariantC";
import { VariantD } from "@/components/landing/journey-variants/VariantD";

type Variant = "A" | "B" | "C" | "D";

const VARIANTS: { id: Variant; label: string; tagline: string; recommended?: boolean }[] = [
  { id: "A", label: "Outcome First",      tagline: "Lead with the destination" },
  { id: "B", label: "Living Stack",       tagline: "Watch the portfolio grow" },
  { id: "C", label: "Numbers Over Icons", tagline: "Restraint, typography, real UI" },
  { id: "D", label: "Mix A + C",          tagline: "Outcome hero + numbered steps — the brainstormed version", recommended: true },
];

export default function JourneyPreviewPage() {
  const [variant, setVariant] = useState<Variant>("A");

  return (
    <main style={{ background: "#050B14" }}>
      {/* Sticky variant switcher */}
      <div
        className="sticky top-0 z-50 border-b border-white/8"
        style={{ background: "rgba(5,11,20,0.85)", backdropFilter: "blur(16px)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              ← Home
            </Link>
            <span className="text-slate-700">·</span>
            <span className="text-[10px] tracking-widest uppercase text-slate-500 font-bold">
              Journey Preview
            </span>
          </div>

          {/* Variant tabs */}
          <div className="flex items-center gap-1 p-1 rounded-full border border-white/10 bg-white/[0.02]">
            {VARIANTS.map((v) => {
              const active = variant === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setVariant(v.id)}
                  className={`relative px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    active
                      ? "bg-white text-slate-900 shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                  style={{ minHeight: "unset" }}
                >
                  <span className="font-mono">{v.id}</span>
                  <span className="hidden sm:inline ml-1.5">· {v.label}</span>
                  {v.recommended && (
                    <span className="absolute -top-1.5 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                      title="Recommended" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active variant tagline */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3">
          <p className="text-[10px] text-slate-500">
            Variant {variant}: <span className="text-slate-300">{VARIANTS.find((v) => v.id === variant)?.tagline}</span>
          </p>
        </div>
      </div>

      {/* Render selected variant */}
      <div key={variant}>
        {variant === "A" && <VariantA />}
        {variant === "B" && <VariantB />}
        {variant === "C" && <VariantC />}
        {variant === "D" && <VariantD />}
      </div>

      {/* Decision footer */}
      <div className="py-12 px-4 text-center">
        <p className="text-xs text-slate-600 mb-2">Which one feels right?</p>
        <p className="text-[10px] text-slate-700">
          Tell me &ldquo;Go with A/B/C/D&rdquo; and I&apos;ll wire it into the real homepage.
        </p>
      </div>
    </main>
  );
}
