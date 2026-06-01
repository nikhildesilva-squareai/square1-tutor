"use client";
import { useEffect, useRef, useState } from "react";

const SKILLS = [
  { label: "LLM Fundamentals",  value: 85 },
  { label: "Prompt Engineering", value: 70 },
  { label: "RAG Systems",        value: 45 },
  { label: "AI Agents",          value: 30 },
  { label: "API Integration",    value: 90 },
  { label: "Fine-tuning",        value: 20 },
  { label: "AI Safety",          value: 60 },
  { label: "Production AI",      value: 40 },
];

const N   = SKILLS.length;
const CX  = 200;
const CY  = 200;
const R   = 150;

/** Cartesian coords for angle i out of N on a circle of radius r */
function point(i: number, r: number): [number, number] {
  const angle = (2 * Math.PI * i) / N - Math.PI / 2;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

/** Build SVG polygon points string from array of [x,y] pairs */
function toPoints(pairs: [number, number][]): string {
  return pairs.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

function barColor(v: number) {
  if (v >= 70) return "bg-emerald-500";
  if (v >= 40) return "bg-amber-400";
  return "bg-red-400";
}

function barTextColor(v: number) {
  if (v >= 70) return "text-emerald-600";
  if (v >= 40) return "text-amber-600";
  return "text-red-500";
}

export function SkillRadarPreview() {
  const [progress, setProgress] = useState(0); // 0 → 1
  const [active, setActive]     = useState(false);
  const ref                      = useRef<HTMLDivElement>(null);
  const rafRef                   = useRef<number | null>(null);
  const startRef                 = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const duration = 1500;
    function step(now: number) {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active]);

  // Build the animated polygon points based on progress
  const dataPoints = SKILLS.map((s, i) => {
    const r = (s.value / 100) * R * progress;
    return point(i, r);
  });

  // Grid rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Label positions (slightly outside full radius)
  const labelRadius = R + 26;

  return (
    <section className="py-24 px-6 bg-surface-soft" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-ink">
            See exactly where you stand
          </h2>
          <p className="mt-3 text-ink-muted text-lg">
            After the 20-minute assessment, you get a granular skill map — not just a score.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Radar SVG */}
          <div className="flex justify-center">
            <svg
              viewBox="0 0 400 400"
              width="380"
              height="380"
              className="w-full max-w-[380px]"
            >
              {/* Grid rings */}
              {rings.map((ring) => {
                const pts = SKILLS.map((_, i) => point(i, ring * R));
                return (
                  <polygon
                    key={ring}
                    points={toPoints(pts)}
                    fill="none"
                    stroke="#CBD5E1"
                    strokeWidth="1"
                    strokeDasharray={ring < 1 ? "4 3" : "none"}
                  />
                );
              })}

              {/* Axis lines */}
              {SKILLS.map((_, i) => {
                const [x, y] = point(i, R);
                return (
                  <line
                    key={i}
                    x1={CX} y1={CY}
                    x2={x}  y2={y}
                    stroke="#CBD5E1"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Filled data polygon */}
              <polygon
                points={toPoints(dataPoints)}
                fill="#0056CE"
                fillOpacity={0.25}
                stroke="#0056CE"
                strokeWidth="2"
                strokeLinejoin="round"
                style={{ transition: "points 0.05s linear" }}
              />

              {/* Data points */}
              {dataPoints.map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x} cy={y}
                  r={progress > 0.05 ? 4 : 0}
                  fill="#0056CE"
                  stroke="white"
                  strokeWidth="1.5"
                />
              ))}

              {/* Axis labels */}
              {SKILLS.map((s, i) => {
                const [lx, ly] = point(i, labelRadius);
                const anchor =
                  lx < CX - 5 ? "end" : lx > CX + 5 ? "start" : "middle";
                return (
                  <text
                    key={i}
                    x={lx} y={ly}
                    textAnchor={anchor}
                    dominantBaseline="middle"
                    fontSize="11"
                    fontFamily="system-ui, sans-serif"
                    fill="#475569"
                    fontWeight="500"
                  >
                    {s.label}
                  </text>
                );
              })}

              {/* Centre dot */}
              <circle cx={CX} cy={CY} r={3} fill="#0056CE" />
            </svg>
          </div>

          {/* Skill bars */}
          <div className="space-y-4">
            {SKILLS.map((s) => {
              const displayVal = Math.round(s.value * progress);
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink">{s.label}</span>
                    <span className={`text-xs font-bold ${barTextColor(s.value)}`}>
                      {displayVal}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor(s.value)} transition-all duration-100`}
                      style={{ width: `${displayVal}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-ink-muted mt-8 max-w-lg mx-auto">
          Your actual report will show these for every topic in your chosen subject.
        </p>
      </div>
    </section>
  );
}
