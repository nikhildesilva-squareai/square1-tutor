import type { NewsTopic } from "@/lib/newsroom-meta";

// ═══════════════════════════════════════════════════════════════════════════════
// Generated editorial artwork.
//
// Why generated and not photography: we cannot republish the source outlets'
// images (they're licensed to them — reusing them is exactly the copyright
// exposure the newsroom was built to avoid), and generic stock photos of people
// at laptops say nothing about the story. So every article gets deterministic
// geometric cover art derived from its slug: unique per story, stable across
// renders, always on-brand, zero cost, zero licensing risk.
//
// Each topic has its own motif and hue within the Square 1 blue family, so the
// section is readable at a glance from the shape alone — not colour only.
// ═══════════════════════════════════════════════════════════════════════════════

/** Stable 32-bit hash → the same article always draws the same artwork. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Deterministic PRNG (mulberry32) seeded from the slug. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Topic palettes — all inside the Square 1 blue family (brand #0056CE,
// light #3388FF, dark #01224F, sky #0EA5E9), varied by depth not by hue drift.
const TOPIC_ART: Record<NewsTopic, { from: string; to: string; ink: string; motif: Motif }> = {
  "ai":            { from: "#3388FF", to: "#0056CE", ink: "#FFFFFF", motif: "nodes" },
  "cybersecurity": { from: "#01224F", to: "#0056CE", ink: "#FFFFFF", motif: "shield" },
  "cloud":         { from: "#0EA5E9", to: "#0056CE", ink: "#FFFFFF", motif: "layers" },
  "quantum":       { from: "#0056CE", to: "#01224F", ink: "#FFFFFF", motif: "orbit" },
  "ml":            { from: "#3388FF", to: "#0EA5E9", ink: "#FFFFFF", motif: "curve" },
  "data-science":  { from: "#0056CE", to: "#3388FF", ink: "#FFFFFF", motif: "bars" },
  "data-centres":  { from: "#01224F", to: "#0EA5E9", ink: "#FFFFFF", motif: "racks" },
  "industry":      { from: "#0056CE", to: "#00183A", ink: "#FFFFFF", motif: "grid" },
};

type Motif = "nodes" | "shield" | "layers" | "orbit" | "curve" | "bars" | "racks" | "grid";

// Four compositions, applied around the 400×225 centre. Subtle on purpose —
// enough that adjacent cards read as different pictures, never so much that the
// motif leaves the frame.
const COMPOSITIONS = [
  "translate(0 0)",
  "translate(-38 6) scale(1.1)",
  "translate(34 -4) scale(0.92)",
  "rotate(-6 200 112) scale(1.05)",
];

/** The motif geometry. Everything is seeded, so each article's art differs
 * within its topic's visual language. Viewbox is 400×225 (16:9). */
function Motif({ motif, seed, ink }: { motif: Motif; seed: number; ink: string }) {
  const r = rng(seed);
  const o = (v: number) => ({ stroke: ink, strokeWidth: 1.5, fill: "none", opacity: v });

  switch (motif) {
    case "nodes": {
      // Connected graph — agents/AI
      const pts = Array.from({ length: 7 }, () => ({ x: 40 + r() * 320, y: 30 + r() * 165 }));
      return (
        <g>
          {pts.map((p, i) =>
            pts.slice(i + 1).filter(() => r() > 0.55).map((q, j) => (
              <line key={`${i}-${j}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} {...o(0.28)} />
            )),
          )}
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={4 + r() * 5} fill={ink} opacity={0.55 + r() * 0.35} />
          ))}
        </g>
      );
    }
    case "shield": {
      // Concentric shields — defence in depth
      return (
        <g>
          {[0, 1, 2].map((i) => {
            const s = 1 - i * 0.22;
            return (
              <path key={i}
                d={`M200 ${44 + i * 14} L${200 + 62 * s} ${74 + i * 10} v${40 * s} q0 ${34 * s} -${62 * s} ${58 * s} q-${62 * s} -${24 * s} -${62 * s} -${58 * s} v-${40 * s} Z`}
                {...o(0.9 - i * 0.25)} />
            );
          })}
          {Array.from({ length: 5 }, (_, i) => (
            <circle key={i} cx={40 + r() * 320} cy={30 + r() * 165} r={2} fill={ink} opacity={0.3} />
          ))}
        </g>
      );
    }
    case "layers": {
      // Stacked planes — cloud/platform layers
      return (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <path key={i}
              d={`M${90 + i * 6} ${70 + i * 34} l110 -${26 - i * 2} l110 ${26 - i * 2} l-110 26 Z`}
              {...o(0.85 - i * 0.17)} />
          ))}
        </g>
      );
    }
    case "orbit": {
      // Nucleus + elliptical orbits — quantum
      return (
        <g>
          {[0, 60, 120].map((deg, i) => (
            <ellipse key={i} cx={200} cy={112} rx={130 - i * 10} ry={46}
              transform={`rotate(${deg + r() * 20} 200 112)`} {...o(0.7 - i * 0.14)} />
          ))}
          <circle cx={200} cy={112} r={11} fill={ink} opacity={0.9} />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={200 + Math.cos(r() * 6.28) * 110} cy={112 + Math.sin(r() * 6.28) * 40}
              r={5} fill={ink} opacity={0.8} />
          ))}
        </g>
      );
    }
    case "curve": {
      // Loss curve descending to a plateau — model training
      const pts = Array.from({ length: 9 }, (_, i) => {
        const x = 50 + i * 38;
        const y = 60 + (1 - Math.exp(-i / 2.2)) * 0 + (150 - 150 * Math.exp(-i / 2.4)) * 0.62 + (r() - 0.5) * 12;
        return `${x},${Math.min(190, y + 10)}`;
      });
      return (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={40} y1={50 + i * 40} x2={360} y2={50 + i * 40} {...o(0.16)} />
          ))}
          <polyline points={pts.join(" ")} {...o(0.95)} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => {
            const [x, y] = p.split(",").map(Number);
            return <circle key={i} cx={x} cy={y} r={3} fill={ink} opacity={0.8} />;
          })}
        </g>
      );
    }
    case "bars": {
      // Distribution — data science
      return (
        <g>
          {Array.from({ length: 11 }, (_, i) => {
            const h = 22 + Math.exp(-Math.pow(i - 5, 2) / 7) * 120 + r() * 16;
            return <rect key={i} x={54 + i * 29} y={190 - h} width={19} height={h} rx={3}
              fill={ink} opacity={0.35 + (h / 190) * 0.5} />;
          })}
          <line x1={40} y1={190} x2={360} y2={190} {...o(0.5)} />
        </g>
      );
    }
    case "racks": {
      // Server racks — data centres
      return (
        <g>
          {Array.from({ length: 5 }, (_, c) => (
            <g key={c}>
              <rect x={48 + c * 62} y={48} width={44} height={140} rx={4} {...o(0.7)} />
              {Array.from({ length: 6 }, (_, u) => (
                <rect key={u} x={54 + c * 62} y={56 + u * 22} width={32} height={13} rx={2}
                  fill={ink} opacity={r() > 0.4 ? 0.55 : 0.18} />
              ))}
            </g>
          ))}
        </g>
      );
    }
    case "grid":
    default: {
      // Market grid with an emphasis block — industry
      return (
        <g>
          {Array.from({ length: 6 }, (_, i) => (
            <line key={`h${i}`} x1={30} y1={35 + i * 32} x2={370} y2={35 + i * 32} {...o(0.2)} />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`v${i}`} x1={40 + i * 40} y1={28} x2={40 + i * 40} y2={196} {...o(0.2)} />
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <rect key={i} x={60 + Math.floor(r() * 7) * 40} y={40 + Math.floor(r() * 4) * 32}
              width={38} height={30} rx={3} fill={ink} opacity={0.28 + r() * 0.4} />
          ))}
        </g>
      );
    }
  }
}

/**
 * Article cover art. `variant` controls aspect + label:
 *  - "card"  16:9 thumbnail for index/grid cards
 *  - "hero"  wider band for the top of an article
 */
export function ArticleArt({
  slug, topic, label, variant = "card", className = "",
}: {
  slug: string;
  topic: NewsTopic;
  label?: string;
  variant?: "card" | "hero";
  className?: string;
}) {
  const art = TOPIC_ART[topic] ?? TOPIC_ART.industry;
  const seed = hash(slug);
  const gid = `na-${seed.toString(36)}`;

  return (
    <svg
      viewBox="0 0 400 225"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={label ? `Illustration for ${label}` : "Article illustration"}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={art.from} />
          <stop offset="100%" stopColor={art.to} />
        </linearGradient>
        <radialGradient id={`${gid}-v`} cx={seed % 2 === 0 ? "0.15" : "0.85"} cy="0.85" r="0.9">
          <stop offset="0%" stopColor={art.to} stopOpacity="0.55" />
          <stop offset="100%" stopColor={art.to} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="225" fill={`url(#${gid})`} />
      {/* Composition varies per article as well as the motif's own seeding —
          otherwise a section page of 12 stories draws the same picture 12
          times. Four layouts: centred, offset left, offset right, tilted. */}
      <g transform={COMPOSITIONS[seed % COMPOSITIONS.length]}>
        <Motif motif={art.motif} seed={seed} ink={art.ink} />
      </g>
      {/* A soft vignette in the corner opposite the motif's weight, so the
          card's text side stays calm. */}
      <rect width="400" height="225" fill={`url(#${gid}-v)`} opacity={0.35} />
    </svg>
  );
}
