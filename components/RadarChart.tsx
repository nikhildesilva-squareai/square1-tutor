"use client";

import { useState, useEffect } from "react";

export interface RadarAxis {
  label: string;
  value: number;
  max: number;
}

interface RadarChartProps {
  axes: RadarAxis[];
  animate?: boolean;
  size?: number;
}

// Wide viewBox leaves room for two-line axis labels on the left/right edges.
const VB_W = 480;
const VB_H = 420;
const CX = VB_W / 2;
const CY = VB_H / 2;
const R = 130;

function point(i: number, n: number, r: number): [number, number] {
  const angle = (2 * Math.PI * i) / n - Math.PI / 2;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

function toPoints(pairs: [number, number][]): string {
  return pairs.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

/** Split a long axis label into at most two lines on the nearest word break. */
function splitLabel(label: string): string[] {
  if (label.length <= 14) return [label];
  const words = label.split(" ");
  if (words.length === 1) return [label];
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length;
    const b = words.slice(i).join(" ").length;
    const diff = Math.abs(a - b);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

export function RadarChart({ axes, animate = true }: RadarChartProps) {
  const N = axes.length;
  const [progress, setProgress] = useState(animate ? 0 : 1);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!animate) { setProgress(1); return; }
    const start = Date.now();
    const duration = 1500;
    const step = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [animate]);

  const rings = [0.25, 0.5, 0.75, 1.0];
  const labelRadius = R + 26;
  const dataPoints: [number, number][] = axes.map((a, i) => {
    const pct = a.max > 0 ? a.value / a.max : 0;
    return point(i, N, pct * R * progress);
  });

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" className="w-full max-w-md mx-auto select-none">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={toPoints(axes.map((_, i) => point(i, N, ring * R)))}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
          strokeDasharray={ring < 1 ? "4 3" : "none"}
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, N, R);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--color-border)" strokeWidth="1" />;
      })}
      {/* Ring scale labels */}
      {[50, 100].map((v) => (
        <text key={v} x={CX + 4} y={CY - (v / 100) * R - 3} fontSize="8.5" fontFamily="inherit" fill="var(--color-ink-muted)">
          {v}
        </text>
      ))}
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0.08" />
        </radialGradient>
      </defs>
      <polygon
        points={toPoints(dataPoints)}
        fill="url(#radarFill)"
        stroke="var(--color-brand)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {dataPoints.map(([x, y], i) => {
        const isHover = hoverIdx === i;
        return (
          <g key={i}>
            <circle
              cx={x} cy={y}
              r={progress > 0.05 ? (isHover ? 7 : 4.5) : 0}
              fill={isHover ? "var(--color-brand)" : "var(--color-surface)"}
              stroke="var(--color-brand)"
              strokeWidth={isHover ? 3 : 1.5}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ transition: "r 0.2s ease", cursor: "pointer" }}
            />
            {/* Value bubble on hover */}
            {isHover && (
              <g pointerEvents="none">
                <rect x={x - 20} y={y - 34} width="40" height="22" rx="6" fill="var(--color-ink)" opacity="0.92" />
                <text x={x} y={y - 19} textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="inherit" fill="var(--color-surface)">
                  {axes[i].value}%
                </text>
              </g>
            )}
          </g>
        );
      })}
      {axes.map((a, i) => {
        const [lx, ly] = point(i, N, labelRadius);
        const anchor = lx < CX - 5 ? "end" : lx > CX + 5 ? "start" : "middle";
        const isHover = hoverIdx === i;
        const lines = splitLabel(a.label);
        const startDy = lines.length > 1 ? -5 : 0;
        return (
          <text
            key={i}
            x={lx} y={ly + startDy}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="11"
            fontFamily="inherit"
            fill={isHover ? "var(--color-brand)" : "var(--color-ink-secondary)"}
            fontWeight={isHover ? 700 : 500}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ transition: "fill 0.2s", cursor: "pointer" }}
          >
            {lines.map((line, li) => (
              <tspan key={li} x={lx} dy={li === 0 ? 0 : 12}>{line}</tspan>
            ))}
          </text>
        );
      })}
      <circle cx={CX} cy={CY} r={3} fill="var(--color-brand)" />
    </svg>
  );
}
