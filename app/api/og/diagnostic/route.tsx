import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

const SUBJECT_ICONS: Record<string, string> = {
  "generative-ai": "\u{1F916}",
  "machine-learning": "\u{1F9E0}",
  "fullstack-development": "\u{1F680}",
  "cybersecurity": "\u{1F510}",
  "data-science": "\u{1F4CA}",
  "artificial-intelligence": "⚡",
  "computer-vision": "\u{1F441}️",
  "llm-agent-architect": "\u{1F6E0}️",
  "ai-product-management": "\u{1F4CB}",
};

const SUBJECT_TITLES: Record<string, string> = {
  "generative-ai": "Generative AI",
  "machine-learning": "Machine Learning",
  "fullstack-development": "Full Stack Dev",
  "cybersecurity": "Cybersecurity",
  "data-science": "Data Science",
  "artificial-intelligence": "Artificial Intelligence",
  "computer-vision": "Computer Vision",
  "llm-agent-architect": "LLM Agent Architect",
  "ai-product-management": "AI Product Management",
};

const TOPICS: Record<string, string[]> = {
  "generative-ai": ["LLM fundamentals", "RAG", "Inference controls", "AI safety", "Embeddings"],
  "machine-learning": ["Generalisation", "Evaluation", "Metrics", "Optimisation", "Regularisation"],
  "fullstack-development": ["HTTP & APIs", "Database security", "Auth", "Databases", "React"],
  "cybersecurity": ["Credential storage", "Access control", "Web vulnerabilities", "Cryptography", "Defensive security"],
  "data-science": ["Statistics", "SQL", "Inference", "Experimentation", "Hypothesis testing"],
  "artificial-intelligence": ["LLM fundamentals", "RAG", "Inference controls", "AI safety", "Embeddings"],
  "computer-vision": ["Generalisation", "Evaluation", "Metrics", "Optimisation", "Regularisation"],
  "llm-agent-architect": ["LLM fundamentals", "RAG", "Inference controls", "AI safety", "Embeddings"],
  "ai-product-management": ["Fundamentals", "Algorithms", "Tooling", "Code quality", "Testing"],
};

const CORRECT_ANSWERS: Record<string, number[]> = {
  "generative-ai": [1, 1, 1, 1, 1],
  "machine-learning": [1, 1, 2, 1, 1],
  "fullstack-development": [1, 1, 1, 1, 1],
  "cybersecurity": [1, 1, 1, 1, 1],
  "data-science": [1, 0, 1, 1, 1],
  "artificial-intelligence": [1, 1, 1, 1, 1],
  "computer-vision": [1, 1, 2, 1, 1],
  "llm-agent-architect": [1, 1, 1, 1, 1],
  "ai-product-management": [1, 1, 0, 1, 1],
};

const BANDS = [
  { label: "Novice", min: 0, max: 1, color: "#EF4444" },
  { label: "Developing", min: 2, max: 2, color: "#F59E0B" },
  { label: "Competent", min: 3, max: 3, color: "#0056CE" },
  { label: "Proficient", min: 4, max: 4, color: "#10B981" },
  { label: "Expert", min: 5, max: 5, color: "#8B5CF6" },
];

function getBand(score: number) {
  return BANDS.find((b) => score >= b.min && score <= b.max) ?? BANDS[0];
}

function decodeAnswers(param: string | null): number[] | null {
  if (!param) return null;
  const parts = param.split(",");
  if (parts.length === 0) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => isNaN(n) || n < 0 || n > 3)) return null;
  return nums;
}

function computeScore(subject: string, answers: number[]): { score: number; total: number; topicResults: { topic: string; correct: boolean }[] } {
  const correct = CORRECT_ANSWERS[subject] ?? [1, 1, 1, 1, 1];
  const topics = TOPICS[subject] ?? ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"];
  let score = 0;
  const topicResults = topics.map((topic, i) => {
    const isCorrect = answers[i] === correct[i];
    if (isCorrect) score++;
    return { topic, correct: isCorrect };
  });
  return { score, total: topics.length, topicResults };
}

// Radar chart points for OG image (static SVG path)
function radarPoints(results: { correct: boolean }[], cx: number, cy: number, r: number): string {
  const n = results.length;
  return results
    .map((t, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const pr = t.correct ? r : r * 0.15;
      const x = cx + pr * Math.cos(angle);
      const y = cy + pr * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function radarGrid(cx: number, cy: number, r: number, n: number): { rings: string[]; spokes: { x1: number; y1: number; x2: number; y2: number }[] } {
  const rings = [0.25, 0.5, 0.75, 1.0].map((f) => {
    const pts = Array.from({ length: n }, (_, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      return `${(cx + f * r * Math.cos(angle)).toFixed(1)},${(cy + f * r * Math.sin(angle)).toFixed(1)}`;
    });
    return pts.join(" ");
  });
  const spokes = Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x1: cx, y1: cy, x2: cx + r * Math.cos(angle), y2: cy + r * Math.sin(angle) };
  });
  return { rings, spokes };
}

// Score ring as SVG
function ScoreRing({ score, total, size, bandColor }: { score: number; total: number; size: number; bandColor: string }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = (score / total) * circ;
  return (
    <div style={{ width: size, height: size, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth={size * 0.07} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bandColor} strokeWidth={size * 0.07} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} />
      </svg>
      <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
        <span style={{ fontSize: size * 0.32, fontWeight: 900, color: "white", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: size * 0.14, fontWeight: 700, color: "#64748B" }}>/{total}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Default OG card (1200×630) — also used when format=og or no format
// ═══════════════════════════════════════════════════════════════════════════════
function OGCard({ subject, title, icon, score, total, band, topicResults }: {
  subject: string; title: string; icon: string; score: number; total: number;
  band: { label: string; color: string }; topicResults: { topic: string; correct: boolean }[];
}) {
  return (
    <div style={{
      width: 1200, height: 630, display: "flex", flexDirection: "column",
      background: "linear-gradient(160deg, #0B1120 0%, #111827 50%, #0F172A 100%)",
      fontFamily: "system-ui, sans-serif", padding: 0,
    }}>
      {/* Top accent bar */}
      <div style={{ width: "100%", height: 5, background: "linear-gradient(90deg, #0056CE 0%, #06B6D4 100%)", display: "flex" }} />

      <div style={{ flex: 1, display: "flex", padding: "40px 56px 36px" }}>
        {/* Left: Score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 340 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <span style={{ fontSize: 36 }}>{icon}</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#F1F5F9" }}>{title}</span>
          </div>
          <ScoreRing score={score} total={total} size={180} bandColor={band.color} />
          <div style={{
            display: "flex", alignItems: "center", padding: "8px 24px", borderRadius: 999,
            background: band.color, color: "white", fontSize: 18, fontWeight: 700, marginTop: 20,
          }}>
            {band.label}
          </div>
        </div>

        {/* Right: Topics */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 48 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.2em", color: "#64748B", fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 16 }}>
            Topic breakdown
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {topicResults.map((t) => (
              <div key={t.topic} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                borderRadius: 10, background: t.correct ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${t.correct ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: t.correct ? "#10B981" : "#EF4444", color: "white", fontSize: 12, fontWeight: 700,
                }}>
                  {t.correct ? "✓" : "✗"}
                </div>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#E2E8F0" }}>{t.topic}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 56px", borderTop: "1px solid rgba(30,41,59,0.8)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: "#0056CE", borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 14, fontWeight: 900,
          }}>S1</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#94A3B8" }}>Square 1 AI</span>
        </div>
        <span style={{ fontSize: 14, color: "#475569", fontWeight: 600 }}>
          Take yours free at square1ai.com/diagnostic/{subject}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Story format (1080×1920) — tall, stacked for Instagram/TikTok stories
// ═══════════════════════════════════════════════════════════════════════════════
function StoryCard({ title, icon, score, total, band, topicResults, readiness, subject }: {
  title: string; icon: string; score: number; total: number;
  band: { label: string; color: string }; topicResults: { topic: string; correct: boolean }[];
  readiness: string; subject: string;
}) {
  return (
    <div style={{
      width: 1080, height: 1920, display: "flex", flexDirection: "column",
      background: "linear-gradient(180deg, #0B1120 0%, #111827 40%, #0F172A 100%)",
      fontFamily: "system-ui, sans-serif",
    }}>
      {/* Accent bar */}
      <div style={{ width: "100%", height: 6, background: "linear-gradient(90deg, #0056CE 0%, #06B6D4 100%)", display: "flex" }} />

      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 80 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, background: "#0056CE", borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 20, fontWeight: 900,
          }}>S1</div>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#94A3B8" }}>Square 1 AI</span>
        </div>
        <span style={{ fontSize: 13, letterSpacing: "0.35em", color: "#475569", fontWeight: 700, textTransform: "uppercase" as const, marginTop: 16 }}>
          Your Skill Scan
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
          <span style={{ fontSize: 48 }}>{icon}</span>
          <span style={{ fontSize: 40, fontWeight: 800, color: "#F1F5F9" }}>{title}</span>
        </div>
      </div>

      {/* Score */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 64 }}>
        <ScoreRing score={score} total={total} size={260} bandColor={band.color} />
        <div style={{
          display: "flex", alignItems: "center", padding: "12px 36px", borderRadius: 999,
          background: band.color, color: "white", fontSize: 24, fontWeight: 700, marginTop: 28,
        }}>
          {band.label}
        </div>
        <span style={{ fontSize: 18, color: "#64748B", fontWeight: 600, marginTop: 12 }}>
          Readiness: {readiness}/10
        </span>
      </div>

      {/* Topics */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "56px 64px 0" }}>
        <span style={{ fontSize: 13, letterSpacing: "0.25em", color: "#475569", fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 4 }}>
          Topic Breakdown
        </span>
        {topicResults.map((t) => (
          <div key={t.topic} style={{
            display: "flex", alignItems: "center", gap: 16, padding: "16px 24px",
            borderRadius: 14, background: t.correct ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${t.correct ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: t.correct ? "#10B981" : "#EF4444", color: "white", fontSize: 16, fontWeight: 700,
            }}>
              {t.correct ? "✓" : "✗"}
            </div>
            <span style={{ fontSize: 22, fontWeight: 600, color: "#E2E8F0" }}>{t.topic}</span>
          </div>
        ))}
      </div>

      {/* Readiness band */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 48, padding: "0 64px" }}>
        {BANDS.map((b) => {
          const active = b.label === band.label;
          return (
            <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{
                width: "100%", height: 8, borderRadius: 4,
                background: active ? b.color : "rgba(148,163,184,0.12)",
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: active ? b.color : "#334155", marginTop: 6 }}>
                {b.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 80 }}>
        <span style={{ fontSize: 18, color: "#475569", fontWeight: 600 }}>
          Take yours free
        </span>
        <span style={{ fontSize: 16, color: "#334155", fontWeight: 600, marginTop: 4 }}>
          square1ai.com/diagnostic/{subject}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Post format (1080×1080) — square for Instagram/Facebook feed
// ═══════════════════════════════════════════════════════════════════════════════
function PostCard({ title, icon, score, total, band, topicResults, readiness, subject }: {
  title: string; icon: string; score: number; total: number;
  band: { label: string; color: string }; topicResults: { topic: string; correct: boolean }[];
  readiness: string; subject: string;
}) {
  return (
    <div style={{
      width: 1080, height: 1080, display: "flex", flexDirection: "column",
      background: "linear-gradient(160deg, #0B1120 0%, #111827 50%, #0F172A 100%)",
      fontFamily: "system-ui, sans-serif",
    }}>
      {/* Accent bar */}
      <div style={{ width: "100%", height: 5, background: "linear-gradient(90deg, #0056CE 0%, #06B6D4 100%)", display: "flex" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "32px 48px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, background: "#0056CE", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 16, fontWeight: 900,
          }}>S1</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#94A3B8" }}>Square 1 AI</span>
        </div>
        <span style={{ fontSize: 11, letterSpacing: "0.3em", color: "#475569", fontWeight: 700, textTransform: "uppercase" as const }}>
          Skill Scan
        </span>
      </div>

      {/* Subject + Score row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40, padding: "36px 48px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 36 }}>{icon}</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#F1F5F9" }}>{title}</span>
          </div>
          <ScoreRing score={score} total={total} size={200} bandColor={band.color} />
          <div style={{
            display: "flex", alignItems: "center", padding: "10px 28px", borderRadius: 999,
            background: band.color, color: "white", fontSize: 20, fontWeight: 700, marginTop: 20,
          }}>
            {band.label} &middot; {readiness}/10
          </div>
        </div>
      </div>

      {/* Topics grid — 2+3 layout */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "0 48px", justifyContent: "center" }}>
        {topicResults.map((t) => (
          <div key={t.topic} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 20px",
            borderRadius: 12, background: t.correct ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${t.correct ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
            width: "46%",
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: t.correct ? "#10B981" : "#EF4444", color: "white", fontSize: 13, fontWeight: 700,
            }}>
              {t.correct ? "✓" : "✗"}
            </div>
            <span style={{ fontSize: 18, fontWeight: 600, color: "#E2E8F0" }}>{t.topic}</span>
          </div>
        ))}
      </div>

      {/* Band strip */}
      <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 32, padding: "0 80px" }}>
        {BANDS.map((b) => {
          const active = b.label === band.label;
          return (
            <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{
                width: "100%", height: 6, borderRadius: 3,
                background: active ? b.color : "rgba(148,163,184,0.12)",
              }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: active ? b.color : "#334155", marginTop: 5 }}>
                {b.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 36, gap: 8 }}>
        <span style={{ fontSize: 16, color: "#475569", fontWeight: 600 }}>
          Take yours free at square1ai.com/diagnostic/{subject}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LinkedIn format (1200×627) — landscape, professional
// ═══════════════════════════════════════════════════════════════════════════════
function LinkedInCard({ title, icon, score, total, band, topicResults, readiness, subject }: {
  title: string; icon: string; score: number; total: number;
  band: { label: string; color: string }; topicResults: { topic: string; correct: boolean }[];
  readiness: string; subject: string;
}) {
  return (
    <div style={{
      width: 1200, height: 627, display: "flex", flexDirection: "column",
      background: "linear-gradient(160deg, #0B1120 0%, #111827 50%, #0F172A 100%)",
      fontFamily: "system-ui, sans-serif",
    }}>
      {/* Top accent bar */}
      <div style={{ width: "100%", height: 5, background: "linear-gradient(90deg, #0056CE 0%, #06B6D4 100%)", display: "flex" }} />

      <div style={{ flex: 1, display: "flex", padding: "32px 48px 24px" }}>
        {/* Left column: Brand + Score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 380 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 32, height: 32, background: "#0056CE", borderRadius: 7,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 14, fontWeight: 900,
            }}>S1</div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#94A3B8" }}>Square 1 AI</span>
          </div>
          <span style={{ fontSize: 11, letterSpacing: "0.3em", color: "#475569", fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 16 }}>
            Skill Scan
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 32 }}>{icon}</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#F1F5F9" }}>{title}</span>
          </div>
          <ScoreRing score={score} total={total} size={160} bandColor={band.color} />
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginTop: 16,
          }}>
            <span style={{
              padding: "6px 20px", borderRadius: 999,
              background: band.color, color: "white", fontSize: 16, fontWeight: 700,
            }}>
              {band.label}
            </span>
            <span style={{ fontSize: 14, color: "#64748B", fontWeight: 600 }}>
              {readiness}/10
            </span>
          </div>
        </div>

        {/* Right column: Topics + Band */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 40 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.2em", color: "#475569", fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 14 }}>
            Topic Breakdown
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {topicResults.map((t) => (
              <div key={t.topic} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                borderRadius: 10, background: t.correct ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${t.correct ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: t.correct ? "#10B981" : "#EF4444", color: "white", fontSize: 12, fontWeight: 700,
                }}>
                  {t.correct ? "✓" : "✗"}
                </div>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#E2E8F0" }}>{t.topic}</span>
              </div>
            ))}
          </div>

          {/* Band strip */}
          <div style={{ display: "flex", gap: 4, marginTop: 20 }}>
            {BANDS.map((b) => {
              const active = b.label === band.label;
              return (
                <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div style={{
                    width: "100%", height: 5, borderRadius: 3,
                    background: active ? b.color : "rgba(148,163,184,0.12)",
                  }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: active ? b.color : "#334155", marginTop: 4 }}>
                    {b.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 48px", borderTop: "1px solid rgba(30,41,59,0.8)",
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>
          I just took the {title} skill scan on Square 1 AI
        </span>
        <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
          square1ai.com/diagnostic/{subject}
        </span>
      </div>
    </div>
  );
}


export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const subject = searchParams.get("subject");
  const format = searchParams.get("format") ?? "og";
  const answersRaw = searchParams.get("a");

  if (!subject || !SUBJECT_TITLES[subject]) {
    return new Response("Missing or invalid subject", { status: 400 });
  }

  const title = SUBJECT_TITLES[subject];
  const icon = SUBJECT_ICONS[subject] ?? "";

  // Compute from answers if provided, else fall back to query params
  const answers = decodeAnswers(answersRaw);
  let score: number, total: number, topicResults: { topic: string; correct: boolean }[];

  if (answers) {
    const computed = computeScore(subject, answers);
    score = computed.score;
    total = computed.total;
    topicResults = computed.topicResults;
  } else {
    score = Number(searchParams.get("score") ?? "0");
    total = Number(searchParams.get("total") ?? "5");
    const topics = TOPICS[subject] ?? [];
    topicResults = topics.map((t) => ({ topic: t, correct: false }));
  }

  const band = getBand(score);
  const readiness = ((score / total) * 10).toFixed(1);

  const props = { title, icon, score, total, band, topicResults, readiness, subject };

  switch (format) {
    case "story":
      return new ImageResponse(<StoryCard {...props} />, { width: 1080, height: 1920 });
    case "post":
      return new ImageResponse(<PostCard {...props} />, { width: 1080, height: 1080 });
    case "linkedin":
      return new ImageResponse(<LinkedInCard {...props} />, { width: 1200, height: 627 });
    default:
      return new ImageResponse(
        <OGCard subject={subject} title={title} icon={icon} score={score} total={total} band={band} topicResults={topicResults} />,
        { width: 1200, height: 630 }
      );
  }
}
