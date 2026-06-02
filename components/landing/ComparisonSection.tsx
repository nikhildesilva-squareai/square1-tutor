"use client";

import { useEffect, useRef, useState } from "react";

// ─── The 4 money-shot comparisons ─────────────────────────────────────────────
type Comparison = {
  category: string;
  oldValue: string;         // text representation (e.g. "$15,000+")
  oldNumber?: number;       // numeric portion for count-up (e.g. 15000)
  oldPrefix?: string;       // "$"
  oldSuffix?: string;       // "+"
  oldLabel: string;
  newValue: string;
  newNumber?: number;
  newPrefix?: string;
  newSuffix?: string;
  newLabel: string;
};

const COMPARISONS: Comparison[] = [
  {
    category:  "Cost",
    oldValue:  "$15,000+",
    oldNumber: 15000,
    oldPrefix: "$",
    oldSuffix: "+",
    oldLabel:  "bootcamp tuition",
    newValue:  "$0",
    newNumber: 0,
    newPrefix: "$",
    newLabel:  "free assessment",
  },
  {
    category:  "Time to first offer",
    oldValue:  "3 years",
    oldNumber: 3,
    oldSuffix: " years",
    oldLabel:  "self-taught average",
    newValue:  "6 months",
    newNumber: 6,
    newSuffix: " months",
    newLabel:  "Square 1 average",
  },
  {
    category:  "Real projects deployed",
    oldValue:  "2",
    oldNumber: 2,
    oldLabel:  "toy apps · maybe",
    newValue:  "12",
    newNumber: 12,
    newLabel:  "live on GitHub",
  },
  {
    category:  "Code feedback received",
    oldValue:  "0",
    oldNumber: 0,
    oldLabel:  "zero · you guess",
    newValue:  "Every line",
    newLabel:  "AI-graded by Claude",
  },
];

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number | undefined, isVisible: boolean, duration = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!isVisible || target === undefined) return;
    const start = performance.now();
    let raf = 0;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(Math.round(target! * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, isVisible, duration]);
  return v;
}

// ─── Number formatter (1500 → "1,500") ────────────────────────────────────────
function formatN(n: number) {
  return n.toLocaleString();
}

// ─── Single comparison row ────────────────────────────────────────────────────
function ComparisonRow({
  comp,
  isVisible,
  index,
  isLast,
}: {
  comp: Comparison;
  isVisible: boolean;
  index: number;
  isLast: boolean;
}) {
  const oldCount = useCountUp(comp.oldNumber, isVisible, 1400);
  const newCount = useCountUp(comp.newNumber, isVisible, 1400);

  const renderValue = (
    n: number | undefined,
    fallback: string,
    prefix?: string,
    suffix?: string,
    count?: number,
  ) => {
    if (n === undefined) return fallback;
    if (count === undefined) return fallback;
    return `${prefix ?? ""}${formatN(count)}${suffix ?? ""}`;
  };

  return (
    <div
      className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-8 items-center py-8 sm:py-10 will-change-transform"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(30px)",
        transition: `opacity 0.7s ease-out ${index * 0.15}s, transform 0.7s ease-out ${index * 0.15}s`,
      }}
    >
      {/* LEFT — Old Way */}
      <div className="text-center md:text-right">
        <p className="text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-slate-600 font-bold mb-2">
          The Old Way
        </p>
        <div
          className="relative inline-block font-black tabular-nums leading-none select-none"
          style={{
            fontSize: "clamp(48px, 7vw, 88px)",
            color: "#475569",
            letterSpacing: "-0.04em",
            transition: "color 0.6s ease",
          }}
        >
          <span>
            {renderValue(comp.oldNumber, comp.oldValue, comp.oldPrefix, comp.oldSuffix, oldCount)}
          </span>
          {/* Strikethrough line that draws as you scroll */}
          <span
            className="absolute top-1/2 left-0 h-1 sm:h-1.5 rounded-full origin-left"
            style={{
              background: "linear-gradient(90deg, #EF4444, #F87171)",
              width: "100%",
              transform: `scaleX(${isVisible ? 1 : 0})`,
              transition: `transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.15 + 0.6}s`,
            }}
          />
        </div>
        <p className="mt-2 text-xs sm:text-sm text-slate-500">{comp.oldLabel}</p>
      </div>

      {/* CENTER — Arrow / "vs" / Category */}
      <div className="flex flex-col items-center justify-center gap-3 py-2">
        <span className="text-[10px] tracking-[0.25em] uppercase text-slate-600 font-bold whitespace-nowrap">
          {comp.category}
        </span>
        {/* Animated arrow */}
        <svg
          width="60"
          height="20"
          viewBox="0 0 60 20"
          fill="none"
          className="shrink-0 -rotate-90 md:rotate-0"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`arrow-grad-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#475569" />
              <stop offset="50%"  stopColor="#3388FF" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          <path
            d="M 4 10 L 48 10"
            stroke={`url(#arrow-grad-${index})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="44"
            strokeDashoffset={isVisible ? 0 : 44}
            style={{ transition: `stroke-dashoffset 0.8s ease-out ${index * 0.15 + 0.3}s` }}
          />
          <path
            d="M 42 4 L 50 10 L 42 16"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{
              opacity: isVisible ? 1 : 0,
              transition: `opacity 0.4s ease-out ${index * 0.15 + 0.9}s`,
            }}
          />
        </svg>
      </div>

      {/* RIGHT — Square 1 */}
      <div className="text-center md:text-left">
        <p className="text-[10px] sm:text-[11px] tracking-[0.25em] uppercase font-bold mb-2"
          style={{ color: "#3388FF" }}>
          Square 1 AI
        </p>
        <div
          className="relative inline-block font-black tabular-nums leading-none select-none"
          style={{
            fontSize: "clamp(48px, 7vw, 88px)",
            letterSpacing: "-0.04em",
            background: "linear-gradient(135deg, #FFFFFF 0%, #3388FF 60%, #10B981 110%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: isVisible ? "drop-shadow(0 0 24px rgba(51,136,255,0.4))" : "none",
            transition: `filter 0.6s ease ${index * 0.15 + 0.6}s`,
          }}
        >
          {renderValue(comp.newNumber, comp.newValue, comp.newPrefix, comp.newSuffix, newCount)}
        </div>
        <p className="mt-2 text-xs sm:text-sm font-semibold"
          style={{ color: "#94A3B8" }}>
          {comp.newLabel}
        </p>
      </div>

      {/* Subtle separator line between rows (not after last) */}
      {!isLast && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(148,168,200,0.15), transparent)",
          }}
        />
      )}
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export function ComparisonSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visibleRows, setVisibleRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!sectionRef.current) return;
    const rowEls = sectionRef.current.querySelectorAll("[data-row-idx]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.rowIdx);
            setVisibleRows((prev) => new Set(prev).add(idx));
          }
        });
      },
      { threshold: 0.3 }
    );
    rowEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-32 sm:py-40 lg:py-48 px-4 sm:px-6 lg:px-8"
      style={{
        background: `
          linear-gradient(180deg,
            #F4F8FF 0%,
            #94A8C8 5%,
            #3E5070 10%,
            #15243C 15%,
            #050B14 22%,
            #0B1626 50%,
            #050B14 78%,
            #15243C 85%,
            #3E5070 90%,
            #94A8C8 95%,
            #F8FAFC 100%
          )
        `,
      }}
    >
      {/* Drifting background blobs */}
      <div className="pointer-events-none absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full opacity-40 animate-blob-1"
        style={{ background: "radial-gradient(circle, rgba(0,86,206,0.15) 0%, transparent 70%)", filter: "blur(90px)" }} />
      <div className="pointer-events-none absolute bottom-1/3 right-1/4 w-[600px] h-[500px] rounded-full opacity-30 animate-blob-2"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)", filter: "blur(90px)" }} />

      <div className="relative max-w-5xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Why Square 1
          </span>
          <h2
            className="mt-4 font-black tracking-tight text-white leading-[0.95]"
            style={{ fontSize: "clamp(36px, 6vw, 84px)" }}
          >
            The math is{" "}
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              simple.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
            Same outcome. Completely different numbers.
          </p>
        </div>

        {/* Rows */}
        <div>
          {COMPARISONS.map((comp, i) => (
            <div key={comp.category} data-row-idx={i}>
              <ComparisonRow
                comp={comp}
                isVisible={visibleRows.has(i)}
                index={i}
                isLast={i === COMPARISONS.length - 1}
              />
            </div>
          ))}
        </div>

        {/* Bottom takeaway */}
        <div className="text-center mt-14 sm:mt-20">
          <p className="text-base sm:text-lg text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
            You can keep grinding the old way for years.{" "}
            <span className="text-white font-bold">Or you can take 30 minutes.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
