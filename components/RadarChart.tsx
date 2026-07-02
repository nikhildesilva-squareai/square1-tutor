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

const CX = 200;
const CY = 200;
const R = 130;

function point(i: number, n: number, r: number): [number, number] {
  const angle = (2 * Math.PI * i) / n - Math.PI / 2;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

function toPoints(pairs: [number, number][]): string {
  return pairs.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

export function RadarChart({ axes, animate = true }: RadarChartProps) {
  const N = axes.length;
  const [progress, setProgress] = useState(animate ? 0 : 1);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!animate) return;
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
  const labelRadius = R + 30;
  const dataPoints: [number, number][] = axes.map((a, i) => {
    const pct = a.max > 0 ? a.value / a.max : 0;
    return point(i, N, pct * R * progress);
  });

  return (
    <svg viewBox="0 0 400 400" width="100%" height="auto" className="w-full max-w-sm mx-auto">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={toPoints(axes.map((_, i) => point(i, N, ring * R)))}
          fill="none"
          stroke="#E8EEF5"
          strokeWidth="1"
          strokeDasharray={ring < 1 ? "4 3" : "none"}
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, N, R);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#E8EEF5" strokeWidth="1" />;
      })}
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0056CE" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0056CE" stopOpacity="0.08" />
        </radialGradient>
      </defs>
      <polygon
        points={toPoints(dataPoints)}
        fill="url(#radarFill)"
        stroke="#0056CE"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {dataPoints.map(([x, y], i) => {
        const isHover = hoverIdx === i;
        return (
          <circle
            key={i}
            cx={x} cy={y}
            r={progress > 0.05 ? (isHover ? 7 : 4.5) : 0}
            fill={isHover ? "#0056CE" : "white"}
            stroke="#0056CE"
            strokeWidth={isHover ? 3 : 1.5}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ transition: "r 0.2s ease", cursor: "pointer" }}
          />
        );
      })}
      {axes.map((a, i) => {
        const [lx, ly] = point(i, N, labelRadius);
        const anchor = lx < CX - 5 ? "end" : lx > CX + 5 ? "start" : "middle";
        const isHover = hoverIdx === i;
        return (
          <text
            key={i}
            x={lx} y={ly}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="10"
            fontFamily="system-ui, sans-serif"
            fill={isHover ? "#0056CE" : "#475569"}
            fontWeight={isHover ? 700 : 500}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ transition: "fill 0.2s", cursor: "pointer" }}
          >
            {a.label}
          </text>
        );
      })}
      <circle cx={CX} cy={CY} r={3} fill="#0056CE" />
    </svg>
  );
}
