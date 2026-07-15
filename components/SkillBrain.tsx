"use client";

import { useMemo, useState } from "react";

interface Comp {
  topic: string;
  pct: number;
  course?: string;
}

// Stable string hash → used only to jitter node positions deterministically so
// the map doesn't jump between renders.
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const GOLDEN = 2.399963229728653; // golden angle — even sunflower spread

function tierOf(pct: number): { color: string; label: string } {
  if (pct >= 75) return { color: "#22C55E", label: "Mastered" };
  if (pct >= 50) return { color: "#0056CE", label: "Strong" };
  if (pct >= 25) return { color: "#F59E0B", label: "Building" };
  return { color: "#94A3B8", label: "Emerging" };
}

const W = 460;
const H = 300;
const CX = W / 2;
const CY = H / 2;
const RX = 196;
const RY = 126;

export function SkillBrain({ competencies }: { competencies: Comp[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const { nodes, edges, avg } = useMemo(() => {
    // Dedupe by topic (keep the highest mastery seen for each).
    const map = new Map<string, Comp>();
    for (const c of competencies) {
      const ex = map.get(c.topic);
      if (!ex || c.pct > ex.pct) map.set(c.topic, c);
    }
    const list = [...map.values()].slice(0, 16);
    const n = list.length;

    const nodes = list.map((c, i) => {
      const h = hash(c.topic);
      const jitterA = ((h & 0xff) / 255 - 0.5) * 0.6;
      const jitterR = (((h >> 8) & 0xff) / 255 - 0.5) * 0.14;
      const t = n > 1 ? i / (n - 1) : 0;
      const rr = Math.min(0.97, Math.max(0.08, Math.sqrt(t) * 0.86 + 0.1 + jitterR));
      const ang = i * GOLDEN + jitterA + (h % 100) / 100;
      const x = CX + Math.cos(ang) * RX * rr;
      const y = CY + Math.sin(ang) * RY * rr;
      const r = 5 + (Math.max(0, Math.min(100, c.pct)) / 100) * 7;
      return { ...c, x, y, r, ...tierOf(c.pct) };
    });

    // Synapses — connect each node to its two nearest neighbours (deduped).
    const seen = new Set<string>();
    const edges: { x1: number; y1: number; x2: number; y2: number; a: number; b: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const dists = nodes
        .map((o, j) => ({ j, d: (o.x - nodes[i].x) ** 2 + (o.y - nodes[i].y) ** 2 }))
        .filter((o) => o.j !== i)
        .sort((p, q) => p.d - q.d)
        .slice(0, 2);
      for (const { j } of dists) {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({ x1: nodes[i].x, y1: nodes[i].y, x2: nodes[j].x, y2: nodes[j].y, a: i, b: j });
      }
    }

    const avg = nodes.length ? Math.round(nodes.reduce((s, nd) => s + nd.pct, 0) / nodes.length) : 0;
    return { nodes, edges, avg };
  }, [competencies]);

  const masteredCount = nodes.filter((n) => n.pct >= 75).length;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
      <style>{`
        @keyframes brainPulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
        .brain-node { animation: brainPulse 3.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .brain-node { animation: none; opacity: 1; } }
      `}</style>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Your skill brain</p>
          <p className="mt-1 text-sm text-ink-secondary">
            Each node is a competency from your assessments — the brighter it glows, the closer to mastery.
          </p>
        </div>
        {nodes.length > 0 && (
          <div className="shrink-0 text-right">
            <p className="text-2xl font-black leading-none text-ink">{avg}%</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">avg mastery</p>
          </div>
        )}
      </div>

      {nodes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface-soft px-6 py-14 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-alt">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 3 4 3 3 0 0 0 5 0 3 3 0 0 0 3-4 3 3 0 0 0-2-5 3 3 0 0 0-3-3Z" /><path d="M12 5v14" /></svg>
          </div>
          <p className="text-sm font-bold text-ink">Your brain map is waiting</p>
          <p className="max-w-xs text-xs text-ink-muted">Take a course assessment and the competencies you&apos;re tested on will light up here as you master them.</p>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-xl" style={{ background: "radial-gradient(60% 70% at 50% 45%, rgba(0,86,206,0.07), transparent 70%)" }}>
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Skill map: ${masteredCount} of ${nodes.length} competencies mastered, ${avg}% average.`}>
              <defs>
                <filter id="brain-glow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="4" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* Synapses */}
              {edges.map((e, i) => (
                <line
                  key={i}
                  x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                  stroke={hover === e.a || hover === e.b ? "rgba(0,86,206,0.45)" : "rgba(100,116,139,0.18)"}
                  strokeWidth={hover === e.a || hover === e.b ? 1.4 : 1}
                />
              ))}

              {/* Nodes */}
              {nodes.map((nd, i) => {
                const active = hover === i;
                const lit = nd.pct >= 50;
                return (
                  <g key={nd.topic} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "default" }}>
                    {lit && (
                      <circle cx={nd.x} cy={nd.y} r={nd.r + 5} fill={nd.color} opacity={0.18} filter="url(#brain-glow)" />
                    )}
                    <circle
                      cx={nd.x} cy={nd.y} r={active ? nd.r + 2 : nd.r}
                      fill={nd.color}
                      className={lit ? "brain-node" : undefined}
                      style={{ animationDelay: `${(i % 8) * 0.4}s`, opacity: active ? 1 : undefined, transition: "r .15s ease" }}
                    />
                    <title>{`${nd.topic} — ${nd.pct}%`}</title>
                  </g>
                );
              })}

              {/* Hover label */}
              {hover !== null && nodes[hover] && (
                <g pointerEvents="none">
                  <rect
                    x={Math.max(6, Math.min(W - 6 - Math.max(70, nodes[hover].topic.length * 6.6), nodes[hover].x - (Math.max(70, nodes[hover].topic.length * 6.6)) / 2))}
                    y={nodes[hover].y - nodes[hover].r - 26}
                    width={Math.max(70, nodes[hover].topic.length * 6.6)}
                    height={20}
                    rx={6}
                    fill="#0F172A"
                  />
                  <text
                    x={Math.max(6 + Math.max(70, nodes[hover].topic.length * 6.6) / 2, Math.min(W - 6 - Math.max(70, nodes[hover].topic.length * 6.6) / 2, nodes[hover].x))}
                    y={nodes[hover].y - nodes[hover].r - 12}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="#fff"
                  >
                    {nodes[hover].topic} · {nodes[hover].pct}%
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {[
                { c: "#22C55E", l: "Mastered" },
                { c: "#0056CE", l: "Strong" },
                { c: "#F59E0B", l: "Building" },
                { c: "#94A3B8", l: "Emerging" },
              ].map((t) => (
                <span key={t.l} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-muted">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.c }} />
                  {t.l}
                </span>
              ))}
            </div>
            <span className="text-[11px] font-semibold text-ink-secondary">
              {masteredCount} of {nodes.length} mastered
            </span>
          </div>
        </>
      )}
    </div>
  );
}
