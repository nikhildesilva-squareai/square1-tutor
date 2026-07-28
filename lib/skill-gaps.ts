// ═══════════════════════════════════════════════════════════════════════════════
// Turning a stored skill report into something you can say to a human.
//
// skill_reports.weak_topics holds raw topic tags from the assessment bank, which
// arrive in three shapes across the table's history:
//   1. kebab-case   — "web-security", "prompt-engineering"
//   2. snake_case   — "a_b_testing", "function_calling_tool_use"
//   3. NUMERIC junk — ["0","1","2","14"] from an early grader bug
// (3) is the dangerous one: unguarded, an email would read "your weakest topic
// is 17". Numeric-looking tags are therefore dropped, not displayed.
// ═══════════════════════════════════════════════════════════════════════════════

/** Tags whose mechanical humanisation reads badly, spelled out properly. */
const OVERRIDES: Record<string, string> = {
  "a_b_testing": "A/B testing",
  "ab_testing": "A/B testing",
  "ci_cd": "CI/CD",
  "cloud_aws": "AWS",
  "sql_postgresql": "SQL and PostgreSQL",
  "rest_apis": "REST APIs",
  "nodejs": "Node.js",
  "owasp": "OWASP",
  "cnn": "CNNs",
  "rag": "RAG",
  "rag_for_agents": "RAG for agents",
  "rlhf": "RLHF",
  "llm-architecture": "LLM architecture",
  "llm-safety": "LLM safety",
  "anthropic-api": "the Anthropic API",
  "dos": "denial-of-service",
  "csp": "constraint satisfaction",
  "go_to_market": "go-to-market",
  "build_vs_buy": "build vs buy",
  "ethics_bias": "ethics and bias",
  "function_calling_tool_use": "function calling and tool use",
  "multi_agent": "multi-agent systems",
  "evals": "evals",
  "typescript": "TypeScript",
  "python": "Python",
  "sql": "SQL",
};

/** True when a tag carries no human meaning (the legacy numeric-index bug). */
function isJunkTag(tag: string): boolean {
  const t = tag.trim();
  if (t.length === 0) return true;
  // Pure digits, or anything with no letter at all.
  return /^\d+$/.test(t) || !/[a-z]/i.test(t);
}

/** "web-security" → "web security"; respects the overrides table. */
export function humaniseTopic(tag: string): string {
  const key = tag.trim().toLowerCase();
  if (OVERRIDES[key]) return OVERRIDES[key];
  return key.replace(/[-_]+/g, " ").trim();
}

/**
 * Picks the topics worth naming in a message. Returns [] when the report holds
 * nothing usable — callers MUST fall back to generic copy rather than emailing
 * an empty gap list.
 */
export function usableWeakTopics(weakTopics: unknown, limit = 3): string[] {
  if (!Array.isArray(weakTopics)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of weakTopics) {
    if (typeof raw !== "string" || isJunkTag(raw)) continue;
    const human = humaniseTopic(raw);
    if (!human || seen.has(human)) continue;
    seen.add(human);
    out.push(human);
    if (out.length >= limit) break;
  }
  return out;
}

/** "web security, OWASP and network security" — for prose. */
export function joinTopics(topics: string[]): string {
  if (topics.length === 0) return "";
  if (topics.length === 1) return topics[0];
  return `${topics.slice(0, -1).join(", ")} and ${topics[topics.length - 1]}`;
}
