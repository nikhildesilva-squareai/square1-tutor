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

  "machine-learning": {
    domains: [
      { name: "ML Foundations", tags: ["fundamentals", "algorithms", "statistics"] },
      { name: "Supervised Learning", tags: ["supervised-learning", "classification", "regression", "linear-models", "decision-trees"] },
      { name: "Unsupervised Learning", tags: ["unsupervised", "clustering"] },
      { name: "Feature Engineering & Data", tags: ["feature-engineering", "data-preprocessing", "visualisation"] },
      { name: "Model Evaluation", tags: ["model-evaluation", "cross-validation", "metrics", "bias-variance"] },
      { name: "Optimisation & Regularisation", tags: ["optimisation", "gradient-descent", "regularisation", "ensemble-methods"] },
    ],
    roles: [
      { min: 0, label: "Exploring Machine Learning" },
      { min: 40, label: "Junior ML Engineer" },
      { min: 60, label: "ML Engineer" },
      { min: 75, label: "Senior ML Engineer" },
      { min: 90, label: "ML Specialist" },
    ],
  },

  "data-science": {
    domains: [
      { name: "Statistics & Probability", tags: ["statistics", "probability"] },
      { name: "Hypothesis Testing & Experiments", tags: ["hypothesis_testing", "a_b_testing"] },
      { name: "Data Wrangling", tags: ["pandas", "sql"] },
      { name: "Modelling", tags: ["regression"] },
      { name: "Visualisation & Comms", tags: ["data_viz"] },
    ],
    roles: [
      { min: 0, label: "Exploring Data Science" },
      { min: 40, label: "Junior Data Analyst" },
      { min: 60, label: "Data Analyst" },
      { min: 75, label: "Data Scientist" },
      { min: 90, label: "Senior Data Scientist" },
    ],
  },

  "artificial-intelligence": {
    domains: [
      { name: "Search Algorithms", tags: ["A*", "BFS", "DFS", "graph traversal", "shortest path", "heuristics", "search algorithms", "backtracking"] },
      { name: "Adversarial Search & Games", tags: ["adversarial search", "alpha-beta pruning", "minimax", "game tree"] },
      { name: "Constraint Satisfaction", tags: ["CSP", "constraint satisfaction", "variable elimination"] },
      { name: "Knowledge & Reasoning", tags: ["first-order logic", "knowledge representation", "STRIPS", "planning", "modelling"] },
      { name: "Probabilistic Reasoning", tags: ["Bayesian networks", "probabilistic reasoning"] },
      { name: "Reinforcement Learning", tags: ["Q-learning", "reinforcement learning", "exploration", "grid world"] },
    ],
    roles: [
      { min: 0, label: "Exploring AI" },
      { min: 40, label: "AI Foundations" },
      { min: 60, label: "AI Practitioner" },
      { min: 75, label: "Advanced AI Engineer" },
      { min: 90, label: "AI Specialist" },
    ],
  },

  "computer-vision": {
    domains: [
      { name: "Image Processing", tags: ["image-processing", "filters", "preprocessing", "color-spaces", "color-analysis", "histograms"] },
      { name: "Feature Detection", tags: ["edge-detection", "canny", "contours", "feature-detection", "descriptors"] },
      { name: "CNN Architectures", tags: ["cnn", "convolution", "pooling", "architecture", "architectures"] },
      { name: "Detection & Segmentation", tags: ["object-detection", "object-counting", "segmentation", "semantic", "yolo"] },
      { name: "Training & Transfer Learning", tags: ["training", "data-augmentation", "transfer-learning", "classification", "metrics", "inference"] },
      { name: "Motion & Video", tags: ["optical-flow", "video-analysis"] },
    ],
    roles: [
      { min: 0, label: "Exploring Computer Vision" },
      { min: 40, label: "Junior CV Engineer" },
      { min: 60, label: "Computer Vision Engineer" },
      { min: 75, label: "Senior CV Engineer" },
      { min: 90, label: "CV Research Engineer" },
    ],
  },

  "cybersecurity": {
    domains: [
      { name: "Security Fundamentals", tags: ["fundamentals", "cia-triad", "principles", "best-practices", "process"] },
      { name: "Cryptography", tags: ["cryptography", "encryption", "classical-ciphers"] },
      { name: "Access & Authentication", tags: ["access-control", "authentication"] },
      { name: "Network Security", tags: ["network-security", "firewalls", "protocols", "dos"] },
      { name: "Threats & Vulnerabilities", tags: ["threats", "vulnerabilities", "owasp", "web-security", "social-engineering"] },
      { name: "Offensive & Response", tags: ["penetration-testing", "incident-response", "log-analysis"] },
    ],
    roles: [
      { min: 0, label: "Exploring Cybersecurity" },
      { min: 40, label: "Junior Security Analyst" },
      { min: 60, label: "Security Analyst" },
      { min: 75, label: "Senior Security Engineer" },
      { min: 90, label: "Security Specialist" },
    ],
  },

  "devops-engineering": {
    domains: [
      { name: "Fundamentals & Linux", tags: ["linux", "git"] },
      { name: "Containers & Orchestration", tags: ["docker", "kubernetes"] },
      { name: "CI/CD", tags: ["ci_cd"] },
      { name: "Cloud & IaC", tags: ["cloud_aws", "terraform"] },
      { name: "Observability", tags: ["monitoring"] },
    ],
    roles: [
      { min: 0, label: "Exploring DevOps" },
      { min: 40, label: "Junior DevOps Engineer" },
      { min: 60, label: "DevOps Engineer" },
      { min: 75, label: "Senior DevOps / SRE" },
      { min: 90, label: "Platform Lead" },
    ],
  },

  "fullstack-development": {
    domains: [
      { name: "Frontend (React/Next)", tags: ["react_nextjs"] },
      { name: "Backend (Node/APIs)", tags: ["nodejs", "rest_apis"] },
      { name: "Realtime", tags: ["websockets"] },
      { name: "Data & Auth", tags: ["sql_postgresql", "jwt_oauth_auth"] },
      { name: "Deployment", tags: ["deployment"] },
    ],
    roles: [
      { min: 0, label: "Exploring Web Dev" },
      { min: 40, label: "Junior Full-Stack Developer" },
      { min: 60, label: "Full-Stack Developer" },
      { min: 75, label: "Senior Full-Stack Engineer" },
      { min: 90, label: "Lead Engineer" },
    ],
  },

  "game-development": {
    domains: [
      { name: "Game Loop & Input", tags: ["game_loop", "input"] },
      { name: "Rendering & Sprites", tags: ["2d_rendering", "sprites"] },
      { name: "Physics & Collision", tags: ["physics_collision"] },
      { name: "Pathfinding AI", tags: ["game_ai_astar"] },
      { name: "Behaviour AI", tags: ["game_ai_state_machines"] },
    ],
    roles: [
      { min: 0, label: "Exploring Game Dev" },
      { min: 40, label: "Junior Game Developer" },
      { min: 60, label: "Game Developer" },
      { min: 75, label: "Senior Game Engineer" },
      { min: 90, label: "Gameplay Lead" },
    ],
  },

  "drone-technology": {
    domains: [
      { name: "Flight Control", tags: ["flight_control", "pid_controllers"] },
      { name: "Sensing & Navigation", tags: ["gps_imu", "sensor_fusion"] },
      { name: "Autonomy & Avoidance", tags: ["obstacle_avoidance"] },
      { name: "Swarm Systems", tags: ["swarm"] },
      { name: "Regulations & Safety", tags: ["regulations"] },
    ],
    roles: [
      { min: 0, label: "Exploring Drone Tech" },
      { min: 40, label: "Junior Drone Engineer" },
      { min: 60, label: "Drone Systems Engineer" },
      { min: 75, label: "Senior UAV Engineer" },
      { min: 90, label: "Autonomy Specialist" },
    ],
  },

  "ai-product-management": {
    domains: [
      { name: "Strategy & Vision", tags: ["ai_strategy", "build_vs_buy"] },
      { name: "User & Market", tags: ["user_research", "go_to_market"] },
      { name: "Roadmapping & Delivery", tags: ["roadmapping"] },
      { name: "Metrics & Analytics", tags: ["metrics"] },
      { name: "Responsible AI", tags: ["ethics_bias"] },
    ],
    roles: [
      { min: 0, label: "Exploring AI PM" },
      { min: 40, label: "Associate AI PM" },
      { min: 60, label: "AI Product Manager" },
      { min: 75, label: "Senior AI PM" },
      { min: 90, label: "Director of AI Product" },
    ],
  },

  "agentic-ai": {
    domains: [
      { name: "Agent Fundamentals", tags: ["agent-fundamentals", "agent-loop", "autonomy-levels"] },
      { name: "Tool Use & Integration", tags: ["tool-use", "function-calling", "mcp"] },
      { name: "Memory & Context", tags: ["agent-memory", "context-management", "state-persistence"] },
      { name: "Orchestration & Multi-Agent", tags: ["orchestration", "multi-agent-patterns", "workflow-design"] },
      { name: "Safety & Guardrails", tags: ["agent-guardrails", "human-in-the-loop", "sandboxing"] },
      { name: "Production Operations", tags: ["agent-observability", "agent-evals", "cost-management"] },
    ],
    roles: [
      { min: 0, label: "Exploring Agentic AI" },
      { min: 40, label: "Junior Agentic AI Engineer" },
      { min: 60, label: "Agentic AI Engineer" },
      { min: 75, label: "Senior Agentic AI Engineer" },
      { min: 90, label: "Agentic Systems Lead" },
    ],
  },

  "llm-agent-architect": {
    domains: [
      { name: "Agent Loops", tags: ["agent_loops"] },
      { name: "Tool Use & Function Calling", tags: ["function_calling_tool_use"] },
      { name: "Memory Systems", tags: ["memory_systems"] },
      { name: "RAG for Agents", tags: ["rag_for_agents"] },
      { name: "Multi-Agent Systems", tags: ["multi_agent"] },
      { name: "Evaluation & Reliability", tags: ["evals"] },
    ],
    roles: [
      { min: 0, label: "Exploring AI Agents" },
      { min: 40, label: "Junior Agent Engineer" },
      { min: 60, label: "Agent Engineer" },
      { min: 75, label: "Senior Agent Architect" },
      { min: 90, label: "Agent Systems Lead" },
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
