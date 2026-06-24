// ─────────────────────────────────────────────────────────────────────────────
// Competency framework — rolls an assessment's granular topic_tags up into a
// small set of high-level DOMAINS so every subject's skill report shares one
// clean visual structure (radar + matrix), plus Novice→Expert level bands and
// a role-readiness signal. Pure functions — NO tokens, NO external data.
//
// Phase 1 ships `generative-ai`. Other courses return null configs and the
// report falls back to its existing per-topic view until their maps are added.
// ─────────────────────────────────────────────────────────────────────────────

export interface DomainDef { name: string; tags: string[] }
export interface RoleBand { min: number; label: string }
export interface CompetencyConfig { domains: DomainDef[]; roles: RoleBand[] }

export interface DomainScore {
  domain: string;
  correct: number;
  total: number;
  percentage: number;
  level: string;
}

// Shared Novice→Expert bands (checked high → low).
export const LEVELS = [
  { min: 90, label: "Expert" },
  { min: 75, label: "Advanced" },
  { min: 60, label: "Proficient" },
  { min: 40, label: "Developing" },
  { min: 0, label: "Novice" },
] as const;

export const LEVEL_LABELS = ["Novice", "Developing", "Proficient", "Advanced", "Expert"] as const;

export function levelFor(pct: number): string {
  for (const l of LEVELS) if (pct >= l.min) return l.label;
  return "Novice";
}

// Per-course tag → domain maps + role rubric.
export const COMPETENCY: Record<string, CompetencyConfig> = {
  "generative-ai": {
    domains: [
      { name: "LLM Fundamentals", tags: ["llm-basics", "model-types", "temperature"] },
      { name: "Architecture & Transformers", tags: ["llm-architecture", "transformers", "tokenisation"] },
      { name: "Prompt Engineering", tags: ["prompt-engineering", "few-shot", "zero-shot", "system-prompts", "conversation"] },
      { name: "RAG & Retrieval", tags: ["rag", "retrieval", "embeddings", "semantic-search", "vector-db"] },
      { name: "Agents & Tool Use", tags: ["agents", "agentic-loop", "tool-use"] },
      { name: "Safety & Alignment", tags: ["ai-safety", "llm-safety", "alignment", "rlhf", "hallucination", "security"] },
      { name: "Production & Deployment", tags: ["anthropic-api", "production", "streaming"] },
      { name: "Programming (Python/TS)", tags: ["python", "typescript"] },
    ],
    roles: [
      { min: 0, label: "Exploring Generative AI" },
      { min: 40, label: "Pre-Junior GenAI Engineer" },
      { min: 60, label: "Junior → Mid GenAI Engineer" },
      { min: 75, label: "Mid → Senior GenAI Engineer" },
      { min: 90, label: "Senior GenAI Engineer" },
    ],
  },
};

export function getCompetencyConfig(slug: string): CompetencyConfig | null {
  return COMPETENCY[slug] ?? null;
}

type Accum = { correct: number; total: number };

/** Roll per-tag accumulators up into domain scores. Returns null if the course
 *  has no config or none of its tags matched. */
export function rollUpDomains(
  slug: string,
  topicAccum: Record<string, Accum>,
): DomainScore[] | null {
  const cfg = getCompetencyConfig(slug);
  if (!cfg) return null;
  const out: DomainScore[] = [];
  for (const d of cfg.domains) {
    let correct = 0, total = 0;
    for (const tag of d.tags) {
      const a = topicAccum[tag];
      if (a) { correct += a.correct; total += a.total; }
    }
    if (total > 0) {
      const percentage = Math.round((correct / total) * 100);
      out.push({ domain: d.name, correct, total, percentage, level: levelFor(percentage) });
    }
  }
  return out.length ? out : null;
}

/** Role-readiness label from the overall score, or null if no config. */
export function roleReadiness(slug: string, overallPct: number): string | null {
  const cfg = getCompetencyConfig(slug);
  if (!cfg) return null;
  let label: string | null = null;
  for (const r of cfg.roles) if (overallPct >= r.min) label = r.label;
  return label;
}

/** Computational action plan (no tokens). Prefers domains; falls back to weak
 *  topic tags so every course still gets a sensible, token-free plan. */
export function buildActionPlan(
  domainScores: DomainScore[] | null,
  weakTopics: string[],
  subject: string,
): string {
  const lines: string[] = [];
  if (domainScores && domainScores.length) {
    const weak = [...domainScores].sort((a, b) => a.percentage - b.percentage).slice(0, 3);
    lines.push(`Your priority areas in ${subject}, weakest first. Each maps to the modules in your learning plan that build it.`);
    weak.forEach((d, i) => {
      lines.push(`${i + 1}. ${d.domain} — ${d.percentage}% (${d.level}). Make this your first focus; the plan sequences the lessons that close it.`);
    });
  } else if (weakTopics.length) {
    lines.push(`Focus your next sessions on your weakest areas in ${subject}:`);
    weakTopics.slice(0, 3).forEach((t, i) => lines.push(`${i + 1}. ${t} — targeted in your personalised plan.`));
  } else {
    lines.push(`Strong across the board in ${subject} — keep reinforcing with the projects in your plan.`);
  }
  return lines.join("\n");
}
