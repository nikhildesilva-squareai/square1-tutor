import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════════
// The 2026 Reality — the wedge.
// Sets the stakes BEFORE the outcome hook: a degree alone no longer gets you hired,
// the market now hires on proof, and proof is exactly what this product produces.
//
// NOTE: The figures below are from 2026 labour-market reporting (secondary sources).
// Verify + cite before relying on them publicly — they're isolated in STATS so
// they're trivial to edit or swap for your own sourced numbers.
// ═══════════════════════════════════════════════════════════════════════════════

const STATS = [
  { value: "−65%", label: "drop in entry-level dev job postings, 2022–2025", accent: "#F87171" },
  { value: "+40%", label: "more CS grads competing for them", accent: "#FBBF24" },
  { value: "2–3×", label: "higher offer rate with real, deployed project experience", accent: "#34D399" },
  { value: "1", label: "thing that now closes the gap: proof you can ship", accent: "#3388FF" },
];

export function RealityBand() {
  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8"
      style={{ background: "#050B14" }}
    >
      {/* Accent glow */}
      <div
        className="pointer-events-none absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.10]"
        style={{ background: "radial-gradient(circle, #F87171 0%, transparent 70%)", filter: "blur(110px)" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.10]"
        style={{ background: "radial-gradient(circle, #3388FF 0%, transparent 70%)", filter: "blur(110px)" }}
      />

      <div className="relative max-w-5xl mx-auto">
        {/* Eyebrow */}
        <div className="text-center">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            The 2026 reality
          </span>
        </div>

        {/* Headline */}
        <h2
          className="mt-5 text-center font-black tracking-tight text-white leading-[0.98] max-w-3xl mx-auto"
          style={{ fontSize: "clamp(30px, 5vw, 60px)", letterSpacing: "-0.03em" }}
        >
          A degree used to be enough.{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #F87171 0%, #FBBF24 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Not anymore.
          </span>
        </h2>

        <p className="mt-5 text-center text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Hundreds of applications, no callbacks — it&apos;s not a you problem, it&apos;s a{" "}
          <span className="text-white font-semibold">proof problem</span>. Employers stopped
          hiring on credentials and started hiring on what you can show.
        </p>

        {/* Stat tiles */}
        <div className="mt-12 sm:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border p-5 sm:p-6 text-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="font-black tabular-nums leading-none"
                style={{ fontSize: "clamp(30px, 4vw, 46px)", letterSpacing: "-0.04em", color: s.accent }}
              >
                {s.value}
              </p>
              <p className="mt-3 text-[11px] sm:text-xs text-slate-400 leading-relaxed">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Resolution */}
        <div className="mt-12 sm:mt-14 text-center">
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Square 1 gets you the proof:{" "}
            <span className="font-bold text-white">
              10–12 deployed, code-reviewed projects employers can actually click on.
            </span>
          </p>
          <Link
            href="/diagnostic"
            className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-bold text-sm transition-all hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #0056CE 0%, #4F46E5 100%)",
              boxShadow: "0 12px 32px rgba(0,86,206,0.30)",
            }}
          >
            Get your free skill report →
          </Link>
          <p className="mt-3 text-[11px] text-slate-500 tracking-wide">
            Free · 30 minutes · No credit card
          </p>
        </div>
      </div>
    </section>
  );
}
